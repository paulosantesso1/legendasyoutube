// Cria o elemento invisível
const caixaDeSom = document.createElement('div');
caixaDeSom.id = 'leitor-legendas-nvda';
caixaDeSom.setAttribute('aria-live', 'polite');
caixaDeSom.style.position = 'absolute';
caixaDeSom.style.left = '-9999px';

// Anexa na raiz absoluta da página para não dar erro de carregamento
document.documentElement.appendChild(caixaDeSom);

// Injeta o espião
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
document.documentElement.appendChild(script);