// criar_tecnicas.js - Fases 1, 2 e 3 de técnicas

// ============================================
// MAPEAMENTO DE FONTES PARA SLUGS EM INGLÊS
// ============================================
const FONTE_SLUG_MAP = {
    // Fontes básicas
    'Fogo': 'fire',
    'Água': 'water',
    'Vento': 'wind',
    'Terra': 'earth',
    'Floresta': 'forest',
    'Trovão': 'thunder',
    'Luz': 'light',
    'Trevas': 'dark',
    // Fontes especiais
    'Fumaça': 'smoke',
    'Magma': 'magma',
    'Miasma': 'miasma',
    'Tufão': 'typhoon',
    'Tempestade': 'storm',
    'Primal': 'primal',
    'Cottage': 'cottage',
    'Candieiro': 'candieiro',
    'Retiro': 'retiro',
    'Lâmina': 'blade',
    'Alvorada': 'dawn',
    'Crepúsculo': 'twilight',
    'Trovoada Flamejante': 'flaming-thunder',
    'Cristal': 'crystal',
    'Mercúrio': 'mercury',
    'Cascata': 'cascade'
};

// ============================================
// MAPEAMENTO DE FONTES PARA CLASSES CSS
// ============================================
const FONTE_CLASS_MAP = {
    'Fogo': 'fonte-fogo',
    'Água': 'fonte-agua',
    'Vento': 'fonte-vento',
    'Terra': 'fonte-terra',
    'Floresta': 'fonte-floresta',
    'Trovão': 'fonte-trovao',
    'Luz': 'fonte-luz',
    'Trevas': 'fonte-trevas',
    'Fumaça': 'fonte-fumaca',
    'Magma': 'fonte-magma',
    'Miasma': 'fonte-miasma',
    'Tufão': 'fonte-tufao',
    'Tempestade': 'fonte-tempestade',
    'Primal': 'fonte-primal',
    'Cottage': 'fonte-cottage',
    'Candieiro': 'fonte-candieiro',
    'Retiro': 'fonte-retiro',
    'Lâmina': 'fonte-lamina',
    'Alvorada': 'fonte-alvorada',
    'Crepúsculo': 'fonte-crepusculo',
    'Trovoada Flamejante': 'fonte-trovoada-flamejante',
    'Cristal': 'fonte-cristal',
    'Mercúrio': 'fonte-mercurio',
    'Cascata': 'fonte-cascata'
};

// ============================================
// UTILITÁRIOS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFonteSlug(nome) {
    if (!nome) return 'desconhecido';

    // Tenta encontrar no mapeamento
    for (const [key, value] of Object.entries(FONTE_SLUG_MAP)) {
        if (nome.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Fallback: normaliza o nome
    return nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/[^a-z]/g, '');
}

function getFonteClass(nome) {
    if (!nome) return '';

    // Tenta encontrar no mapeamento
    for (const [key, value] of Object.entries(FONTE_CLASS_MAP)) {
        if (nome.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Fallback: gera a classe a partir do nome
    const slug = getFonteSlug(nome);
    return `fonte-${slug}`;
}

// ============================================
// EXPORTAR UTILITÁRIOS GLOBALMENTE
// ============================================
window.getFonteSlug = getFonteSlug;
window.getFonteClass = getFonteClass;
window.escapeHtml = escapeHtml;
window.FONTE_SLUG_MAP = FONTE_SLUG_MAP;
window.FONTE_CLASS_MAP = FONTE_CLASS_MAP;

// ============================================
// TÉCNICAS - CARREGAMENTO
// ============================================

async function carregarTecnicasCompletas() {
    // ✅ Verificar se selectedFonteId e selectedFonteData estão disponíveis
    if (!selectedFonteId || !selectedFonteData) {
        console.warn('Nenhuma fonte selecionada. selectedFonteId:', selectedFonteId, 'selectedFonteData:', selectedFonteData);
        return;
    }

    console.log('🔍 Carregando técnicas para fonte:', selectedFonteData.nome_exibicao, '(ID:', selectedFonteId, ')');

    // Verifica se é uma fonte híbrida
    const isHybrid = selectedFonteData.hybrid === 1 || selectedFonteData.hybrid === true;
    let fontesIds = [];

    if (isHybrid && selectedFonteData.fontes_componentes) {
        // Pega os IDs das fontes componentes
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

        // Adiciona o ID da própria fonte híbrida (para técnicas específicas dela)
        if (!fontesIds.includes(selectedFonteId)) {
            fontesIds.push(selectedFonteId);
        }
    } else {
        fontesIds = [selectedFonteId];
    }

    // Remove duplicatas
    fontesIds = [...new Set(fontesIds)];

    // Limpa os containers
    const containers = ['tecnicas-inatas-container', 'tecnicas-basicas-container', 'tecnicas-avancadas-container', 'tecnicas-ultimas-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="loading">Carregando técnicas...</div>';
    });

    try {
        let tecnicas = [];

        if (fontesIds.length === 1) {
            // Fonte única - usar endpoint antigo
            const response = await fetch(`/api/ficha/tecnicas/${fontesIds[0]}`);
            const data = await response.json();
            if (data.success) {
                tecnicas = data.tecnicas.filter(t => t.especializacao !== 1);
            }
        } else {
            // Múltiplas fontes - usar novo endpoint
            const response = await fetch('/api/ficha/tecnicas/multiples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fontes_ids: fontesIds })
            });
            const data = await response.json();
            if (data.success) {
                tecnicas = data.tecnicas.filter(t => t.especializacao !== 1);
            }
        }

        // Organiza por categoria
        tecnicasDisponiveis = { inatas: [], basicas: [], avancadas: [], ultimas: [] };

        tecnicas.forEach(t => {
            if (t.categoria === 'Inata') tecnicasDisponiveis.inatas.push(t);
            else if (t.categoria === 'Básica') tecnicasDisponiveis.basicas.push(t);
            else if (t.categoria === 'Avançada') tecnicasDisponiveis.avancadas.push(t);
            else if (t.categoria === 'Última') tecnicasDisponiveis.ultimas.push(t);
        });

        // ✅ Garantir que selectedFonteData está atualizado
        console.log('✅ Fonte para renderização:', selectedFonteData.nome_exibicao);

        // Renderiza
        renderizarTecnicasCards('inatas', tecnicasDisponiveis.inatas);
        renderizarTecnicasCards('basicas', tecnicasDisponiveis.basicas);
        renderizarTecnicasCards('avancadas', tecnicasDisponiveis.avancadas);

        // Últimas (se permitido pela categoria)
        const ultimasSection = document.getElementById('tecnicas-ultimas-section');
        if (ultimasSection) {
            const showUltimas = tecnicasUltimasMax > 0 && tecnicasDisponiveis.ultimas.length > 0;
            ultimasSection.style.display = showUltimas ? 'block' : 'none';
            if (showUltimas) {
                renderizarTecnicasCards('ultimas', tecnicasDisponiveis.ultimas);
            }
        }

        atualizarContadoresTecnicas();

    } catch (error) {
        console.error('Erro ao carregar técnicas:', error);
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="error">Erro ao carregar técnicas</div>';
        });
    }
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
        if (tipo === 'inatas' && window.tecnicaInataSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'avancadas' && window.tecnicaAvancadaSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'ultimas' && window.tecnicaUltimaSelecionada?.id === tecnica.id) isSelected = true;
        else if (tipo === 'basicas') isSelected = (window.tecnicasSelecionadas || []).some(t => t.id === tecnica.id);

        // ✅ BUSCAR A FONTE DA TÉCNICA PELO ID
        let fonteNome = 'desconhecida';
        let fonteId = tecnica.fonte_de_poder_id;

        // Tenta encontrar a fonte na lista de fontes disponíveis
        if (window.fontesList && fonteId) {
            const fonteEncontrada = window.fontesList.find(f => f.id == fonteId);
            if (fonteEncontrada) {
                fonteNome = fonteEncontrada.nome_exibicao;
            }
        }

        // Fallback: usar a fonte do personagem se não encontrar
        if (fonteNome === 'desconhecida' && window.selectedFonteData) {
            fonteNome = window.selectedFonteData.nome_exibicao || 'desconhecida';
        }

        console.log(`🎨 Técnica "${tecnica.nome}" (ID: ${tecnica.id}) - Fonte ID: ${fonteId} - Nome: ${fonteNome}`);

        const card = document.createElement('div');
        card.className = `tecnica-card ${tipo.slice(0, -1)} ${isSelected ? 'selected' : ''}`;
        card.dataset.id = tecnica.id;

        // ✅ ADICIONA A CLASSE DA FONTE DA TÉCNICA
        const fonteClass = getFonteClass(fonteNome);
        if (fonteClass) {
            card.classList.add(fonteClass);
        }

        // Ícone da categoria
        const categoriaIcones = {
            'Inata': '🧬',
            'Básica': '📘',
            'Avançada': '⚡',
            'Última': '🌟'
        };
        const categoriaIcon = categoriaIcones[tecnica.categoria] || '✨';

        const categoriaLabel = tecnica.categoria.toLowerCase();
        const labelClasses = {
            'inata': 'inata',
            'básica': 'basica',
            'avancada': 'avancada',
            'ultima': 'ultima'
        };
        const labelClass = labelClasses[categoriaLabel] || '';

        // Custo
        const custoDisplay = tecnica.custo || tecnica.efetividade || '—';

        // ✅ SLUG DA FONTE DA TÉCNICA PARA A IMAGEM
        const fonteSlug = getFonteSlug(fonteNome);
        const symbolPath = `/static/imgs/symbols/${fonteSlug}-symbol.png`;

        // Construir o card
        card.innerHTML = `
            <div class="card-glow"></div>
            <div class="camada-simbolo">
                <img src="${symbolPath}"
                     alt="${fonteNome}"
                     onerror="this.style.display='none'">
            </div>
            <div class="camada-conteudo">
                <div class="col-bolinha">
                    <div class="bolinha ${isSelected ? 'ativa' : ''}"></div>
                </div>
                <div class="col-conteudo">
                    <div class="top-row">
                        <span class="nome">${escapeHtml(tecnica.nome)}</span>
                    </div>
                    <div class="fonte">Fonte: <span>${escapeHtml(fonteNome)}</span> • Custo: ${custoDisplay}</div>
                    <div class="desc">${escapeHtml(tecnica.descricao_geral || 'Sem descrição')}</div>
                    <div class="custo">⚡ <strong>${custoDisplay}</strong> PE</div>
                </div>
                <div class="col-categoria">
                    <div class="cat">
                        <span class="icone">${categoriaIcon}</span>
                        <span class="label ${labelClass}">${tecnica.categoria}</span>
                    </div>
                </div>
            </div>
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

// ============================================
// FUNÇÃO PARA ATUALIZAR A FONTE SELECIONADA
// ============================================

function setSelectedFonte(fonteId, fonteData) {
    console.log('🔄 Atualizando fonte selecionada:', fonteData?.nome_exibicao);
    window.selectedFonteId = fonteId;
    window.selectedFonteData = fonteData;

    // Se estiver no passo de técnicas, recarregar
    const step6 = document.getElementById('step-6');
    if (step6 && step6.style.display !== 'none') {
        console.log('🔄 Recarregando técnicas com nova fonte...');
        carregarTecnicasCompletas();
    }
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
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
window.setSelectedFonte = setSelectedFonte;