// Executado de forma bloqueante logo no início do <body>, antes de qualquer pintura —
// evita o "flash" de tema errado (FOUC) ao carregar a página. Mantém a mesma chave usada
// por src/lib/theme.ts.
export const themeInitScript = `(function(){try{var s=localStorage.getItem('seo-toolkit-theme');var p=(s==='light'||s==='dark')?s:'system';var r=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`;
