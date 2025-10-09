const LANG='rc_lang';
const STR={
  en:{draft:'Draft with AI',exportPDF:'Export PDF',exportDOCX:'Export DOCX',search:'Search',open:'Open',state:'State',suggest:'Suggest statutes'},
  es:{draft:'Redactar con IA',exportPDF:'Exportar PDF',exportDOCX:'Exportar DOCX',search:'Buscar',open:'Abrir',state:'Estado',suggest:'Sugerir leyes'},
  pt:{draft:'Esboçar com IA',exportPDF:'Exportar PDF',exportDOCX:'Exportar DOCX',search:'Buscar',open:'Abrir',state:'Estado',suggest:'Sugerir leis'},
  fr:{draft:'Rédiger avec IA',exportPDF:'Exporter PDF',exportDOCX:'Exporter DOCX',search:'Rechercher',open:'Ouvrir',state:'État',suggest:'Suggérer lois'},
  zh:{draft:'使用AI起草',exportPDF:'导出PDF',exportDOCX:'导出DOCX',search:'搜索',open:'打开',state:'州',suggest:'建议法规'}
};
let cur=localStorage.getItem(LANG)||'en';
export const t=k=>STR[cur]?.[k]||STR.en[k]||k;
export const setLang=l=>{cur=STR[l]?l:'en';localStorage.setItem(LANG,cur);};
export const getLang=()=>cur;