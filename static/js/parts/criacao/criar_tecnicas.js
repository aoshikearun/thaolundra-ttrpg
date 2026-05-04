// criar_tecnicas.js - Fases 1, 2 e 3 de técnicas

// ============================================
// TÉCNICAS - CARREGAMENTO
// ============================================

async function carregarTecnicasCompletas() {
    if (!selectedFonteId || !selectedFonteData) {
        console.warn('Nenhuma fonte selecionada');
        return;
    }

    let fontesIds = [];

    if (selectedFonteData.fontes_componentes) {
        if (Array.isArray(selectedFonteData.fontes_componentes)) {
            fontesIds = selectedFonteData.fontes_componentes;
        } else if (typeof selectedFonteData.fontes_componentes === 'string') {
            try {
                const parsed = JSON.parse(selectedFonteData.fontes_componentes);
                fontesIds = Array.isArray(parsed) ? parsed : [selectedFonteId];
            } catch(e) {
                fontesIds = [selectedFonteId];
            }
        } else {
            fontesIds = [selectedFonteId];
        }
    } else {
        fontesIds = [selectedFonteId];
    }

    if (!Array.isArray(fontesIds) || fontesIds.length === 0) {
        fontesIds = [selectedFonteId];
    }

    const containerInatas = document.getElementById('tecnicas-inatas-container');
    const containerBasicas = document.getElementById('tecnicas-basicas-container');
    const containerAvancadas = document.getElementById('tecnicas-avancadas-container');
    const containerUltimas = document.getElementById('tecnicas-ultimas-container');

    if (containerInatas) containerInatas.innerHTML = '<div class="loading">Carregando técnicas...</div>';
    if (containerBasicas) containerBasicas.innerHTML = '<div class="loading">Carregando técnicas...</div>';
    if (containerAvancadas) containerAvancadas.innerHTML = '<div class="loading">Carregando técnicas...</div>';
    if (containerUltimas && tecnicasUltimasMax > 0) {
        containerUltimas.innerHTML = '<div class="loading">Carregando técnicas...</div>';
    }

    const todasTecnicas = [];

    for (const fonteId of fontesIds) {
        try {
            const response = await fetch(`/api/ficha/tecnicas/${fonteId}`);
            const data = await response.json();
            if (data.success && data.tecnicas) todasTecnicas.push(...data.tecnicas);
        } catch (error) {
            console.error(`Erro ao carregar técnicas da fonte ${fonteId}:`, error);
        }
    }

    const tecnicasUnicas = [];
    const idsVistos = new Set();

    for (const tecnica of todasTecnicas) {
        if (!idsVistos.has(tecnica.id)) {
            idsVistos.add(tecnica.id);
            tecnicasUnicas.push(tecnica);
        }
    }

    tecnicasDisponiveis = { inatas: [], basicas: [], avancadas: [], ultimas: [] };
    window.tecnicasDisponiveis = tecnicasDisponiveis;

    for (const tecnica of tecnicasUnicas) {
        const categoria = tecnica.categoria;
        if (categoria === 'Especialização') continue;

        if (categoria === 'Inata') tecnicasDisponiveis.inatas.push(tecnica);
        else if (categoria === 'Básica') tecnicasDisponiveis.basicas.push(tecnica);
        else if (categoria === 'Avançada') tecnicasDisponiveis.avancadas.push(tecnica);
        else if (categoria === 'Última' && tecnicasUltimasMax > 0) tecnicasDisponiveis.ultimas.push(tecnica);
    }

    renderizarTecnicasCards('inatas', tecnicasDisponiveis.inatas);
    renderizarTecnicasCards('basicas', tecnicasDisponiveis.basicas);
    renderizarTecnicasCards('avancadas', tecnicasDisponiveis.avancadas);

    const ultimasSection = document.getElementById('tecnicas-ultimas-section');
    if (ultimasSection) {
        ultimasSection.style.display = tecnicasUltimasMax > 0 ? 'block' : 'none';
        if (tecnicasUltimasMax > 0) {
            renderizarTecnicasCards('ultimas', tecnicasDisponiveis.ultimas);
        }
    }

    atualizarContadoresTecnicas();
}

function renderizarTecnicasCards(tipo, tecnicas) {
    const containerId = `tecnicas-${tipo}-container`;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tecnicas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma técnica disponível.</p>';
        return;
    }

    container.innerHTML = '';

    tecnicas.forEach(tecnica => {
        let isSelected = false;
        if (tipo === 'inatas' && tecnicaInataSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'avancadas' && tecnicaAvancadaSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'ultimas' && tecnicaUltimaSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'basicas') isSelected = tecnicasSelecionadas.some(t => t.id === tecnica.id);

        const card = document.createElement('div');
        card.className = `tecnica-card ${tipo.slice(0, -1)} ${isSelected ? 'selected' : ''}`;
        card.dataset.id = tecnica.id;

        card.innerHTML = `
            <div class="tecnica-header">
                <span class="tecnica-nome">${escapeHtml(tecnica.nome)}</span>
                <span class="tecnica-categoria-badge ${tipo.slice(0, -1)}">${tecnica.categoria}</span>
            </div>
            <div class="tecnica-desc">${escapeHtml(tecnica.descricao_geral || 'Sem descrição')}</div>
            ${tecnica.custo ? `<div class="tecnica-custo"><strong>Custo base:</strong> ${tecnica.custo}</div>` : ''}
        `;

        card.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTecnicaSelecao(tecnica.id, tipo, tecnica.nome);
        });

        container.appendChild(card);
    });
}

function toggleTecnicaSelecao(tecnicaId, tipo, tecnicaNome) {
    if (tipo === 'inatas') {
        if (tecnicaInataSelecionada?.id === tecnicaId) {
            tecnicaInataSelecionada = null;
        } else {
            tecnicaInataSelecionada = { id: tecnicaId, pontos: 1, nome: tecnicaNome, categoria: 'Inata' };
        }
        renderizarTecnicasCards('inatas', tecnicasDisponiveis.inatas);
    } else if (tipo === 'avancadas') {
        const avancadasAtuais = tecnicasAvancadasMax > 0 ? (tecnicaAvancadaSelecionada ? 1 : 0) : 0;
        if (tecnicaAvancadaSelecionada?.id === tecnicaId) {
            tecnicaAvancadaSelecionada = null;
        } else if (avancadasAtuais < tecnicasAvancadasMax) {
            tecnicaAvancadaSelecionada = { id: tecnicaId, pontos: 1, nome: tecnicaNome, categoria: 'Avançada' };
        } else {
            alert(`⚠️ Limite de ${tecnicasAvancadasMax} técnica(s) Avançada(s) atingido.`);
            return;
        }
        renderizarTecnicasCards('avancadas', tecnicasDisponiveis.avancadas);
    } else if (tipo === 'ultimas') {
        if (tecnicaUltimaSelecionada?.id === tecnicaId) {
            tecnicaUltimaSelecionada = null;
        } else if (!tecnicaUltimaSelecionada && tecnicasUltimasMax > 0) {
            tecnicaUltimaSelecionada = { id: tecnicaId, pontos: 1, nome: tecnicaNome, categoria: 'Última' };
        } else {
            alert(`⚠️ Limite de ${tecnicasUltimasMax} técnica(s) Última(s) atingido.`);
            return;
        }
        if (tecnicasUltimasMax > 0) {
            renderizarTecnicasCards('ultimas', tecnicasDisponiveis.ultimas);
        }
    } else if (tipo === 'basicas') {
        const index = tecnicasSelecionadas.findIndex(t => t.id === tecnicaId);
        if (index !== -1) {
            tecnicasSelecionadas.splice(index, 1);
        } else {
            tecnicasSelecionadas.push({ id: tecnicaId, pontos: 1, nome: tecnicaNome, categoria: 'Básica' });
        }
        renderizarTecnicasCards('basicas', tecnicasDisponiveis.basicas);
    }

    atualizarContadoresTecnicas();
    validarBotoesFaseTecnicas();
}

function atualizarContadoresTecnicas() {
    const badgeAvancada = document.querySelector('.limite-badge.avancada');
    if (badgeAvancada) {
        const count = tecnicaAvancadaSelecionada ? 1 : 0;
        badgeAvancada.textContent = `⚡ Avançada: ${count}/${tecnicasAvancadasMax}`;
    }

    const badgeUltima = document.querySelector('.limite-badge.ultima');
    if (badgeUltima && tecnicasUltimasMax > 0) {
        const count = tecnicaUltimaSelecionada ? 1 : 0;
        badgeUltima.textContent = `🌟 Última: ${count}/${tecnicasUltimasMax}`;
    }

    validarBotoesFaseTecnicas();
}

function validarBotoesFaseTecnicas() {
    const btnConfirmarInata = document.getElementById('btn-confirmar-inata');
    if (btnConfirmarInata) btnConfirmarInata.disabled = !tecnicaInataSelecionada;

    const btnContinuar = document.getElementById('btn-continuar-tecnicas');
    if (btnContinuar) btnContinuar.disabled = false;
}

// ============================================
// TÉCNICAS - FASES
// ============================================

function confirmarInata() {
    if (!tecnicaInataSelecionada) {
        alert('Você precisa selecionar uma técnica Inata.');
        return;
    }

    document.getElementById('fase1-tecnicas').style.display = 'none';
    document.getElementById('fase2-tecnicas').style.display = 'block';
}

function voltarFaseTecnicas(fase) {
    if (fase === 2) {
        document.getElementById('fase2-tecnicas').style.display = 'none';
        document.getElementById('fase1-tecnicas').style.display = 'block';
        renderizarTecnicasCards('basicas', tecnicasDisponiveis.basicas);
        renderizarTecnicasCards('avancadas', tecnicasDisponiveis.avancadas);
    } else if (fase === 3) {
        document.getElementById('fase3-tecnicas').style.display = 'none';
        document.getElementById('fase2-tecnicas').style.display = 'block';
        renderizarTecnicasCards('basicas', tecnicasDisponiveis.basicas);
        renderizarTecnicasCards('avancadas', tecnicasDisponiveis.avancadas);
        atualizarContadoresTecnicas();
    }
}

function irParaDistribuicaoTecnicas() {
    const todasTecnicas = [];

    if (tecnicaInataSelecionada) todasTecnicas.push({ ...tecnicaInataSelecionada });
    todasTecnicas.push(...tecnicasSelecionadas);
    if (tecnicaAvancadaSelecionada) todasTecnicas.push({ ...tecnicaAvancadaSelecionada });
    if (tecnicaUltimaSelecionada) todasTecnicas.push({ ...tecnicaUltimaSelecionada });

    if (todasTecnicas.length === 0) {
        alert('Selecione pelo menos uma técnica (a Inata é obrigatória).');
        return;
    }

    window.tecnicasTemp = todasTecnicas;
    renderizarFase3Tecnicas(todasTecnicas);

    document.getElementById('fase2-tecnicas').style.display = 'none';
    document.getElementById('fase3-tecnicas').style.display = 'block';
}

function renderizarFase3Tecnicas(tecnicas) {
    const container = document.getElementById('tecnicas-selecionadas-container');
    if (!container) return;

    const pontosTotais = fichaData.pontos.tecnicas || 0;
    let pontosUsados = tecnicas.reduce((sum, t) => sum + (t.pontos || 1), 0);

    container.innerHTML = '';

    tecnicas.forEach((tecnica, idx) => {
        const card = document.createElement('div');
        card.className = 'tecnica-card-compact';
        card.dataset.index = idx;

        const categoriaIcon = {
            'Inata': '🧬',
            'Básica': '📘',
            'Avançada': '⚡',
            'Última': '🌟'
        }[tecnica.categoria] || '✨';

        card.innerHTML = `
            <div class="tecnica-info-compact">
                <div class="tecnica-icon-compact">${categoriaIcon}</div>
                <div>
                    <div class="tecnica-nome-compact">${escapeHtml(tecnica.nome)}</div>
                    <div class="tecnica-categoria-compact">${tecnica.categoria}</div>
                </div>
            </div>
            <div class="pontos-control">
                <button class="btn-ponto danger" data-acao="-10">-10</button>
                <button class="btn-ponto" data-acao="-1">-1</button>
                <span class="valor-ponto">${tecnica.pontos || 1}</span>
                <button class="btn-ponto" data-acao="+1">+1</button>
                <button class="btn-ponto" data-acao="+10">+10</button>
            </div>
        `;

        const botoes = card.querySelectorAll('.btn-ponto');
        botoes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const acao = btn.dataset.acao;
                ajustarPontoTecnica(idx, acao);
            });
        });

        container.appendChild(card);
    });

    atualizarResumoPontosTecnicas();
}

function ajustarPontoTecnica(index, acao) {
    const tecnicas = window.tecnicasTemp;
    if (!tecnicas || index >= tecnicas.length) return;

    let pontosAtuais = tecnicas[index].pontos || 1;
    let novoValor = pontosAtuais;

    if (acao === '+1') novoValor = Math.min(200, pontosAtuais + 1);
    else if (acao === '-1') novoValor = Math.max(1, pontosAtuais - 1);
    else if (acao === '+10') novoValor = Math.min(200, pontosAtuais + 10);
    else if (acao === '-10') novoValor = Math.max(1, pontosAtuais - 10);

    if (novoValor !== pontosAtuais) {
        const pontosTotais = fichaData.pontos.tecnicas || 0;
        const pontosUsadosAtuais = tecnicas.reduce((sum, t) => sum + (t.pontos || 1), 0);
        const diferenca = novoValor - pontosAtuais;

        if (pontosUsadosAtuais + diferenca > pontosTotais) {
            alert(`⚠️ Você não tem pontos suficientes. Disponíveis: ${pontosTotais - pontosUsadosAtuais}`);
            return;
        }

        tecnicas[index].pontos = novoValor;

        const card = document.querySelector(`.tecnica-card-compact[data-index="${index}"]`);
        if (card) card.querySelector('.valor-ponto').textContent = novoValor;

        atualizarResumoPontosTecnicas();
    }
}

function atualizarResumoPontosTecnicas() {
    const pontosTotais = fichaData.pontos.tecnicas || 0;
    const tecnicas = window.tecnicasTemp || [];
    const pontosUsados = tecnicas.reduce((sum, t) => sum + (t.pontos || 1), 0);
    const restantes = pontosTotais - pontosUsados;

    const disponiveisSpan = document.getElementById('pontos-tecnicas-disponiveis');
    const usadosSpan = document.getElementById('pontos-usados-tecnicas');
    const barraFill = document.getElementById('barra-pontos-tecnicas-fill');

    if (disponiveisSpan) disponiveisSpan.textContent = restantes;
    if (usadosSpan) usadosSpan.textContent = pontosUsados;
    if (barraFill) {
        const percent = pontosTotais > 0 ? (pontosUsados / pontosTotais) * 100 : 0;
        barraFill.style.width = Math.min(100, percent) + '%';
    }
}

function confirmarTecnicas() {
    const pontosTotais = fichaData.pontos.tecnicas || 0;
    const tecnicas = window.tecnicasTemp || [];
    const pontosUsados = tecnicas.reduce((sum, t) => sum + (t.pontos || 1), 0);

    if (pontosUsados > pontosTotais) {
        alert(`⚠️ Você usou ${pontosUsados} pontos, mas tem apenas ${pontosTotais} disponíveis.`);
        return;
    }

    if (!tecnicas.some(t => t.categoria === 'Inata')) {
        alert('Você precisa selecionar uma técnica Inata.');
        return;
    }

    const avancadasCount = tecnicas.filter(t => t.categoria === 'Avançada').length;
    if (avancadasCount > tecnicasAvancadasMax) {
        alert(`Você só pode selecionar no máximo ${tecnicasAvancadasMax} técnica(s) Avançada(s).`);
        return;
    }

    const ultimasCount = tecnicas.filter(t => t.categoria === 'Última').length;
    if (ultimasCount > tecnicasUltimasMax) {
        alert(`Você só pode selecionar no máximo ${tecnicasUltimasMax} técnica(s) Última(s).`);
        return;
    }

    fichaData.tecnicas = tecnicas;
    alert(`✅ Técnicas confirmadas! ${tecnicas.length} técnicas selecionadas, ${pontosUsados} pontos usados.`);

    if (typeof nextStep === 'function') nextStep(7);
}

function iniciarPassoTecnicas() {
    tecnicasSelecionadas = [];
    tecnicaInataSelecionada = null;
    tecnicaAvancadaSelecionada = null;
    tecnicaUltimaSelecionada = null;
    window.tecnicasTemp = [];

    document.getElementById('fase1-tecnicas').style.display = 'block';
    document.getElementById('fase2-tecnicas').style.display = 'none';
    document.getElementById('fase3-tecnicas').style.display = 'none';

    carregarTecnicasCompletas();
}

// Exportar funções globais
window.carregarTecnicasCompletas = carregarTecnicasCompletas;
window.renderizarTecnicasCards = renderizarTecnicasCards;
window.toggleTecnicaSelecao = toggleTecnicaSelecao;
window.atualizarContadoresTecnicas = atualizarContadoresTecnicas;
window.confirmarInata = confirmarInata;
window.voltarFaseTecnicas = voltarFaseTecnicas;
window.irParaDistribuicaoTecnicas = irParaDistribuicaoTecnicas;
window.confirmarTecnicas = confirmarTecnicas;
window.iniciarPassoTecnicas = iniciarPassoTecnicas;
window.ajustarPontoTecnica = ajustarPontoTecnica;
window.atualizarResumoPontosTecnicas = atualizarResumoPontosTecnicas;