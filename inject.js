let agendaLegendas = [];

function organizarAgenda(textoCru) {
    try {
        let json = JSON.parse(textoCru);

        if (json.events) {
            json.events.forEach(evento => {
                // Pegamos o tempo que começa e quanto tempo dura na tela
                if (evento.segs && evento.tStartMs !== undefined && evento.dDurationMs !== undefined) {
                    let textoLimpo = "";
                    evento.segs.forEach(seg => {
                        if (seg.utf8) textoLimpo += seg.utf8;
                    });
                    
                    textoLimpo = textoLimpo.trim();
                    if (textoLimpo.length > 0) {
                        const tempoInicio = evento.tStartMs / 1000;
                        const tempoFim = (evento.tStartMs + evento.dDurationMs) / 1000;
                        
                        // Verifica se a frase já está na agenda para não salvar repetido
                        const jaExiste = agendaLegendas.some(leg => leg.tempoInicio === tempoInicio && leg.texto === textoLimpo);
                        
                        if (!jaExiste) {
                            agendaLegendas.push({
                                tempoInicio: tempoInicio,
                                tempoFim: tempoFim,
                                texto: textoLimpo
                            });
                        }
                    }
                }
            });
        }
    } catch (e) {
        // Ignora se não for JSON
    }
}

// O Relógio: checa a cada 250 milissegundos
setInterval(() => {
    const video = document.querySelector('video');
    const caixaDeSom = document.getElementById('leitor-legendas-nvda');
    
    if (!video || agendaLegendas.length === 0 || !caixaDeSom) return;

    const tempoAtual = video.currentTime;
    
    // Procura na agenda uma legenda que o tempoInicial e tempoFinal combinem com o segundo atual do vídeo
    const legendaAtual = agendaLegendas.find(leg => tempoAtual >= leg.tempoInicio && tempoAtual <= leg.tempoFim);

    if (legendaAtual) {
        // Só injeta na caixa de som se o texto for diferente do que já está lá
        if (caixaDeSom.textContent !== legendaAtual.texto) {
            caixaDeSom.textContent = legendaAtual.texto;
        }
    } else {
        // Se ninguém está falando, limpa a caixa de som para evitar que o NVDA repita sem querer
        if (caixaDeSom.textContent !== "") {
            caixaDeSom.textContent = "";
        }
    }
}, 250);

// Espião do Fetch
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

    if (url.includes('timedtext')) {
        const clone = response.clone();
        clone.text().then(texto => organizarAgenda(texto)).catch(() => {});
    }
    return response;
};

// Espião do XHR
const originalXHR = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
        if (typeof url === 'string' && url.includes('timedtext')) {
            organizarAgenda(this.responseText);
        }
    });
    originalXHR.apply(this, arguments);
};
// Gatilho Automático: Liga as legendas do YouTube sozinho
setTimeout(() => {
    // Procura o botão de legendas (CC) no player do YouTube
    const botaoLegenda = document.querySelector('.ytp-subtitles-button');
    
    // Se o botão existir e a legenda estiver desligada, ele "clica" para ligar
    if (botaoLegenda && botaoLegenda.getAttribute('aria-pressed') === 'false') {
        botaoLegenda.click();
    }
}, 4000); // Espera 4 segundos para dar tempo do vídeo carregar na tela