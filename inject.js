let agendaLegendas = [];
let urlAtual = location.href;

function organizarAgenda(textoCru) {
    try {
        let json = JSON.parse(textoCru);
        if (json.events) {
            json.events.forEach(evento => {
                if (evento.segs && evento.tStartMs !== undefined && evento.dDurationMs !== undefined) {
                    let textoLimpo = "";
                    evento.segs.forEach(seg => {
                        if (seg.utf8) textoLimpo += seg.utf8;
                    });
                    
                    textoLimpo = textoLimpo.trim();
                    if (textoLimpo.length > 0) {
                        const tempoInicio = evento.tStartMs / 1000;
                        const tempoFim = (evento.tStartMs + evento.dDurationMs) / 1000;
                        
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
    // Limpeza de cache se você pular para outro vídeo
    if (location.href !== urlAtual) {
        agendaLegendas = [];
        urlAtual = location.href;
        return;
    }

    const video = document.querySelector('video');
    const caixaDeSom = document.getElementById('leitor-legendas-nvda');
    const botaoLegenda = document.querySelector('.ytp-subtitles-button');
    
    if (!video || !caixaDeSom) return;

    // Verifica se o botão do YouTube está com o status "pressionado/ligado"
    const legendasLigadas = botaoLegenda && botaoLegenda.getAttribute('aria-pressed') === 'true';

    // Se a legenda estiver desligada ou se a agenda estiver vazia, entra em silêncio
    if (!legendasLigadas || agendaLegendas.length === 0) {
        if (caixaDeSom.textContent !== "") {
            caixaDeSom.textContent = ""; // Limpa a caixa de som para calar o NVDA
        }
        return; // Puxa o freio de mão e não lê o resto do código
    }

    // Se estiver ligada, procura a legenda no tempo exato
    const tempoAtual = video.currentTime;
    const legendaAtual = agendaLegendas.find(leg => tempoAtual >= leg.tempoInicio && tempoAtual <= leg.tempoFim);

    if (legendaAtual) {
        if (caixaDeSom.textContent !== legendaAtual.texto) {
            caixaDeSom.textContent = legendaAtual.texto;
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