import { qs, on } from '/app/assets/js/ui-helpers.js';
import { t, getLang, setLang, apply as applyI18n, mountSwitcher } from '/app/assets/js/i18n.js';
import { validate, required, isDate, parseMoney } from '/app/assets/js/validation-utils.js';
import { parseCSV } from '/app/assets/js/csv-utils.js';
import { renderTable } from '/app/assets/js/table-utils.js';
import { callAI, createDoc, analyzePolicyText } from '/app/assets/js/api-client.js';

const SLUG = (window.slug)|| (location.pathname.split('/').pop().replace('.html',''));
const HOST = document;

function mountI18n(){
  const headerNav = document.querySelector('header .nav-links') || document.querySelector('header nav') || document.querySelector('header');
  if(headerNav) mountSwitcher(headerNav);
  applyI18n(document);
}

function toast(msg, ok=false){
  let el=qs('#rc-toast'); if(!el){ el=document.createElement('div'); el.id='rc-toast'; el.style.position='fixed'; el.style.bottom='14px'; el.style.right='14px'; el.style.padding='10px 14px'; el.style.borderRadius='10px'; el.style.background= ok?'#065f46':'#991b1b'; el.style.color='#fff'; el.style.zIndex='9999'; document.body.appendChild(el); setTimeout(()=>el.remove(),3000); }
  el.textContent = msg;
}

function addStateSelector(){
  // Only on letters where statutes help: appeal-letter, demand-letter, coverage-clarification, delay-complaint
  if(!['appeal-letter','demand-letter','coverage-clarification','delay-complaint'].includes(SLUG)) return;
  const panel=document.createElement('div');
  panel.style.display='flex'; panel.style.gap='8px'; panel.style.alignItems='center'; panel.style.margin='8px 0';
  panel.innerHTML = `
    <label style="font-weight:700">${t('state')}:
      <select id="rc-state" style="margin-left:6px;padding:.4rem;border:1px solid #e5e7eb;border-radius:8px">
        <option value="">—</option>
        ${['AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'].map(s=>`<option>${s}</option>`).join('')}
      </select>
    </label>
    <button class="btn" id="rc-suggest-law" data-i18n="suggestLaw">${t('suggestLaw')}</button>
  `;
  const container = document.querySelector('main .card .card') || document.querySelector('main .card');
  container?.insertBefore(panel, container.firstChild);
  on(qs('#rc-suggest-law'),'click', async ()=>{
    const state = qs('#rc-state')?.value||'';
    const details = qs('#details')?.value||'';
    try{
      const res = await analyzePolicyText(`State: ${state}\n\nContext:\n${details}`, 'coverage_review');
      const html = res.analysis || res.response || JSON.stringify(res);
      const out = qs('#out'); if(out){ out.innerHTML = html + '<hr><em>(Added via Jurisdiction Helper)</em>'; toast('Citations suggested', true);}
    }catch(e){ toast('Unable to suggest statutes: '+e.message); }
  });
}

function upgradeCSVEditors(){
  // damage-inventory -> items; expenses-log -> entries; claim-timeline -> events, deadlines
  const map = {
    'damage-inventory': [{id:'items', cols:['qty','name','desc','preValue','postValue'], moneyCols:['preValue','postValue']}],
    'expenses-log': [{id:'entries', cols:['date','vendor','desc','amount'], moneyCols:['amount'], totals:true}],
    'claim-timeline': [{id:'events', cols:['date','actor','event','notes']},{id:'deadlines', cols:['date','label']}],
  };
  const cfg = map[SLUG]; if(!cfg) return;
  cfg.forEach(def=>{
    const input = qs(`#${def.id}`);
    if(!input) return;
    // swap input -> textarea for better editing
    if(input.tagName!=='TEXTAREA'){
      const ta=document.createElement('textarea');
      ta.id=input.id; ta.value=input.value; ta.style.cssText='width:100%;min-height:120px;padding:12px;border:1px solid var(--border);border-radius:10px';
      input.replaceWith(ta);
    }
    const holder=document.createElement('div'); holder.className='card'; holder.style.marginTop='8px';
    const title=document.createElement('div'); title.style.fontWeight='700'; title.setAttribute('data-i18n','tablePreview'); title.textContent=t('tablePreview');
    const tableWrap=document.createElement('div'); holder.appendChild(title); holder.appendChild(tableWrap);
    const container = input?.closest('.card')||document.querySelector('main .card'); container?.appendChild(holder);

    const rerender = ()=>{
      const rows = parseCSV(qs(`#${def.id}`).value);
      // Map to objects
      const objs = rows.map(r=>Object.fromEntries(def.cols.map((k,i)=>[k, r[i]??''])));
      const columns = def.cols.map(k=>({key:k,label:k, money:def.moneyCols?.includes(k)}));
      const t = renderTable(tableWrap,{columns, rows:objs, calcTotal:def.totals});
      return t;
    };
    on(qs(`#${def.id}`),'input', ()=>rerender());
    rerender();
  });
}

function mountValidation(){
  const map = {
    'appeal-letter': [['policyNumber','required'],['claimNumber','required'],['dateOfLoss','date']],
    'demand-letter': [['amount','money'],['deadline','date']],
    'damage-inventory': [['location','required']],
    'claim-timeline': [['lossDate','date']],
    'repair-vs-replace': [['repairCost','money'],['replaceCost','money']],
    'expenses-log': [['period','required']],
    'appraisal-demand': [['policyNumber','required'],['claimNumber','required']],
    'delay-complaint': [['policyNumber','required'],['claimNumber','required']],
    'coverage-clarification': [['policyNumber','required'],['claimNumber','required']],
  };
  const rules = map[SLUG]; if(!rules) return ()=>true;
  return ()=>validate(rules.map(([id, kind])=>{
    const el=qs('#'+id);
    const fns = kind==='date' ? [isDate] : kind==='money' ? [(v)=>!isNaN(parseMoney(v))] : [required];
    return {el, rules:fns};
  }));
}

function wireActions(){
  const okCheck = mountValidation();
  const draftBtn = qs('#draft'), pdfBtn=qs('#pdf'), docxBtn=qs('#docx'), out=qs('#out');
  if(draftBtn && !draftBtn.dataset.bound){
    draftBtn.dataset.bound='1';
    draftBtn.textContent = t('draft');
    on(draftBtn,'click', async ()=>{
      if(!okCheck()) return toast(t('validateError'));
      const lang=getLang();
      // Collect all inputs in the grid
      const fields={}; document.querySelectorAll('input[id], textarea[id]').forEach(el=>{
        if(['details','tool-input'].includes(el.id)) return; // details handled separately
        fields[el.id]=el.value;
      });
      const payload={ type:SLUG, language:lang, fields, details: qs('#details')?.value||'' };
      out.innerHTML='<span class="spinner"></span> Drafting...';
      try{
        const r = await callAI(payload,{type:SLUG, language:lang});
        out.innerHTML=r.response||r.analysis||JSON.stringify(r)||'(no content)';
      }catch(e){ out.innerHTML=`<div style="color:#dc2626">Error: ${e.message}</div>`; }
    });
  }
  if(pdfBtn && !pdfBtn.dataset.bound){
    pdfBtn.dataset.bound='1'; pdfBtn.textContent=t('exportPDF');
    on(pdfBtn,'click', async ()=>{
      const html=out?.innerHTML?.trim(); if(!html) return toast('Draft first');
      try{ const r=await createDoc({content:html,format:'pdf',type:SLUG,filename:`${SLUG}_${Date.now()}`}); location.href=r.url||r.downloadUrl; }
      catch(e){ toast('Export failed: '+e.message); }
    });
  }
  if(docxBtn && !docxBtn.dataset.bound){
    docxBtn.dataset.bound='1'; docxBtn.textContent=t('exportDOCX');
    on(docxBtn,'click', async ()=>{
      const html=out?.innerHTML?.trim(); if(!html) return toast('Draft first');
      try{ const r=await createDoc({content:html,format:'docx',type:SLUG,filename:`${SLUG}_${Date.now()}`}); location.href=r.url||r.downloadUrl; }
      catch(e){ toast('Export failed: '+e.message); }
    });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  mountI18n();
  addStateSelector();
  upgradeCSVEditors();
  wireActions();
});
