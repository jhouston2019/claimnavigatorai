const LANG_KEY='rc_lang';
const STRINGS={
  en:{draft:'Draft with AI',exportPDF:'Export PDF',exportDOCX:'Export DOCX',validateError:'Please correct highlighted fields.',lang:'Language',state:'State/Jurisdiction',suggestLaw:'Suggest statutes',tablePreview:'Preview',total:'Total',amount:'Amount',date:'Date'},
  es:{draft:'Redactar con IA',exportPDF:'Exportar PDF',exportDOCX:'Exportar DOCX',validateError:'Corrige los campos resaltados.',lang:'Idioma',state:'Estado/Jurisdicción',suggestLaw:'Sugerir leyes',tablePreview:'Vista previa',total:'Total',amount:'Monto',date:'Fecha'},
  pt:{draft:'Esboçar com IA',exportPDF:'Exportar PDF',exportDOCX:'Exportar DOCX',validateError:'Corrija os campos destacados.',lang:'Idioma',state:'Estado/Jurisdição',suggestLaw:'Sugerir estatutos',tablePreview:'Prévia',total:'Total',amount:'Valor',date:'Data'},
  fr:{draft:'Rédiger avec IA',exportPDF:'Exporter PDF',exportDOCX:'Exporter DOCX',validateError:'Corrigez les champs en surbrillance.',lang:'Langue',state:'État/Juridiction',suggestLaw:'Suggérer des lois',tablePreview:'Aperçu',total:'Total',amount:'Montant',date:'Date'},
  zh:{draft:'使用AI起草',exportPDF:'导出PDF',exportDOCX:'导出DOCX',validateError:'请修正标记字段。',lang:'语言',state:'州/司法辖区',suggestLaw:'建议法规',tablePreview:'预览',total:'合计',amount:'金额',date:'日期'}
};
let current = localStorage.getItem(LANG_KEY)||'en';
export function t(k){ return (STRINGS[current]&&STRINGS[current][k])||STRINGS.en[k]||k; }
export function getLang(){ return current; }
export function setLang(l){ current = STRINGS[l]?l:'en'; localStorage.setItem(LANG_KEY,current); apply(); }
export function apply(root=document){
  root.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n'); if(key) el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder'); if(key) el.setAttribute('placeholder', t(key));
  });
}
export function mountSwitcher(container){
  if(container.querySelector('#rc-lang')) return;
  const sel=document.createElement('select'); sel.id='rc-lang'; sel.style.marginLeft='10px';
  ['en','es','pt','fr','zh'].forEach(l=>{ const o=document.createElement('option'); o.value=l;o.textContent=l.toUpperCase(); if(l===current)o.selected=true; sel.appendChild(o);});
  sel.addEventListener('change',()=>setLang(sel.value));
  const label=document.createElement('span'); label.textContent=t('lang')+': '; label.style.marginLeft='8px';
  container.appendChild(label); container.appendChild(sel);
  apply();
}
