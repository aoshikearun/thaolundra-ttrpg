// progressao_exp.js - Sistema de Gastos de Experiência

let expData = {
    disponivel: 0,
    total: 0,
    gasto: 0,
    gastosPendentes: {
        atributos: {
            forca: 0,
            destreza: 0,
            inteligencia: 0,
            constituicao: 0
        },
        pericias: {},
        tecnicas: {},
        fv: 0,
        pe: 0
    },
    valoresBase: {
        forca: 0,
        destreza: 0,
        inteligencia: 0,
        constituicao: 0,
        pericias: {},
        tecnicas: {},
        fv: 0,
        pe: 0
    },
    valoresAtuais: {
        forca: 0,
        destreza: 0,
        inteligencia: 0,
        constituicao: 0,
        pericias: {},
        tecnicas: {},
        fv: 0,
        pe: 0
    }
};

let cacheCustos = {};

function initProgressaoExp(experienciaInicial, valoresBase) {
    console.log('🎯 Inicializando sistema de progressão de EXP');

    expData.valoresBase = {
        forca: valoresBase.forca || 0,
        destreza: valoresBase.destreza || 0,
        inteligencia: valoresBase.inteligencia || 0,
        constituicao: valoresBase.constituicao || 0,
        pericias: valoresBase.pericias || {},
        tecnicas: valoresBase.tecnicas || {},
        fv: valoresBase.fv || 0,
        pe: valoresBase.pe || 0
    };

    expData.valoresAtuais = JSON.parse(JSON.stringify(expData.valoresBase));

    expData.total = experienciaInicial;
    expData.disponivel = experienciaInicial;
    expData.gasto = 0;

    resetarGastosPendentes();

    carregarTabelasProgressao();

    renderizarInterfaceExp();

    atualizarBarraProgresso();
}

function resetarGastosPendentes() {
    expData.gastosPendentes = {
        atributos: {
            forca: 0,
            destreza: 0,
            inteligencia: 0,
            constituicao: 0
        },
        pericias: {},
        tecnicas: {},
        fv: 0,
        pe: 0
    };
    expData.valoresAtuais = JSON.parse(JSON.stringify(expData.valoresBase));
    expData.gasto = 0;
    expData.disponivel = expData.total;
}

function carregarTabelasProgressao() {
    fetch('/api/progressao/tabelas')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.tabelasProgressao = data.dados;
                console.log('📊 Tabelas de progressão carregadas', window.tabelasProgressao);
            }
        })
        .catch(error => console.error('Erro ao carregar tabelas:', error));
}

async function calcularCusto(valorAtual, tipo, quantidade = 1) {
    const cacheKey = `${tipo}_${valorAtual}_${quantidade}`;

    if (cacheCustos[cacheKey]) {
        return cacheCustos[cacheKey];
    }

    try {
        const response = await fetch('/api/progressao/custos-multiplos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valor_atual: valorAtual,
                tipo: tipo,
                quantidade: quantidade
            })
        });

        const data = await response.json();

        if (data.success) {
            cacheCustos[cacheKey] = data;
            return data;
        }
    } catch (error) {
        console.error('Erro ao calcular custo:', error);
    }

    return null;
}

async function simularGasto(tipo, id, quantidade) {
    let valorAtual;

    if (tipo === 'atributo') {
        valorAtual = expData.valoresAtuais[id];
    } else if (tipo === 'pericia') {
        valorAtual = expData.valoresAtuais.pericias[id] || 1;
    } else if (tipo === 'tecnica') {
        valorAtual = expData.valoresAtuais.tecnicas[id] || 1;
    } else if (tipo === 'fv') {
        valorAtual = expData.valoresAtuais.fv;
    } else if (tipo === 'pe') {
        valorAtual = expData.valoresAtuais.pe;
    } else {
        return null;
    }

    const custoInfo = await calcularCusto(valorAtual, tipo, quantidade);

    if (!custoInfo) return null;

    if (custoInfo.custo_total > expData.disponivel) {
        return { sucesso: false, erro: 'exp_insuficiente', custo_necessario: custoInfo.custo_total };
    }

    return {
        sucesso: true,
        novo_valor: custoInfo.novo_valor,
        custo_total: custoInfo.custo_total,
        detalhes: custoInfo.detalhes
    };
}

async function aplicarGasto(tipo, id, quantidade) {
    const simulacao = await simularGasto(tipo, id, quantidade);

    if (!simulacao || !simulacao.sucesso) {
        if (simulacao && simulacao.erro === 'exp_insuficiente') {
            alert(`⚠️ EXP insuficiente! Necessário: ${simulacao.custo_necessario}`);
        }
        return false;
    }

    if (tipo === 'atributo') {
        expData.valoresAtuais[id] = simulacao.novo_valor;
        expData.gastosPendentes.atributos[id] += quantidade;
    } else if (tipo === 'pericia') {
        expData.valoresAtuais.pericias[id] = simulacao.novo_valor;
        expData.gastosPendentes.pericias[id] = (expData.gastosPendentes.pericias[id] || 0) + quantidade;
    } else if (tipo === 'tecnica') {
        expData.valoresAtuais.tecnicas[id] = simulacao.novo_valor;
        expData.gastosPendentes.tecnicas[id] = (expData.gastosPendentes.tecnicas[id] || 0) + quantidade;
    } else if (tipo === 'fv') {
        expData.valoresAtuais.fv = simulacao.novo_valor;
        expData.gastosPendentes.fv += quantidade;
    } else if (tipo === 'pe') {
        expData.valoresAtuais.pe = simulacao.novo_valor;
        expData.gastosPendentes.pe += quantidade;
    }

    expData.gasto += simulacao.custo_total;
    expData.disponivel = expData.total - expData.gasto;

    atualizarValorUI(tipo, id, simulacao.novo_valor);
    atualizarBarraProgresso();
    atualizarBotoesContexto();

    return true;
}

function resetarGastos() {
    if (confirm('Tem certeza? Todos os gastos de experiência serão revertidos.')) {
        resetarGastosPendentes();
        renderizarInterfaceExp();
        atualizarBarraProgresso();
        alert('✅ Gastos resetados com sucesso!');
    }
}

function renderizarInterfaceExp() {
    const container = document.getElementById('progressao-exp-container');
    if (!container) return;

    container.innerHTML = `
        <div class="exp-header">
            <div class="exp-bar-container">
                <div class="exp-bar-label">
                    <span>💰 EXPERIÊNCIA DISPONÍVEL</span>
                    <span class="exp-values">${expData.disponivel.toLocaleString()} / ${expData.total.toLocaleString()}</span>
                </div>
                <div class="exp-bar">
                    <div class="exp-bar-fill" style="width: ${(expData.gasto / expData.total) * 100}%"></div>
                </div>
                <div class="exp-stats">
                    <span>📊 Gasto: ${expData.gasto.toLocaleString()}</span>
                    <span>✨ Restante: ${expData.disponivel.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div class="exp-grid">
            <div class="exp-atributos">
                <h3>🎯 ATRIBUTOS</h3>
                <div class="atributos-grid">
                    ${renderizarCardAtributo('forca', '💪 FORÇA')}
                    ${renderizarCardAtributo('destreza', '🏃 DESTREZA')}
                    ${renderizarCardAtributo('inteligencia', '🧠 INTELIGÊNCIA')}
                    ${renderizarCardAtributo('constituicao', '❤️ CONSTITUIÇÃO')}
                </div>
            </div>

            <div class="exp-fv-pe">
                <h3>⚡ PODERES</h3>
                <div class="fv-pe-grid">
                    ${renderizarCardFVPE('fv', '❤️ FORÇA VITAL')}
                    ${renderizarCardFVPE('pe', '✨ PODER ELEMENTAL')}
                </div>
            </div>
        </div>

        <div class="exp-listas">
            <div class="exp-tecnicas">
                <h3>✨ TÉCNICAS</h3>
                <div class="tecnicas-list">
                    ${renderizarListaTecnicas()}
                </div>
            </div>

            <div class="exp-pericias">
                <h3>🎯 PERÍCIAS</h3>
                <div class="pericias-list">
                    ${renderizarListaPericias()}
                </div>
            </div>
        </div>

        <div class="exp-actions">
            <button class="btn-reset-exp" onclick="resetarGastos()">↺ RESETAR</button>
            <button class="btn-confirm-exp" onclick="confirmarGastos()">✅ CONFIRMAR</button>
        </div>
    `;
}

function renderizarCardAtributo(attr, nome) {
    const valorAtual = expData.valoresAtuais[attr];
    const valorBase = expData.valoresBase[attr];
    const modificador = valorAtual - valorBase;
    const modificadorTexto = modificador > 0 ? `+${modificador}` : '';

    return `
        <div class="exp-card atributo-card" data-tipo="atributo" data-id="${attr}">
            <div class="card-header">${nome}</div>
            <div class="card-valor">${valorAtual}</div>
            <div class="card-base">Base: ${valorBase} ${modificadorTexto ? `<span class="modificador">(${modificadorTexto})</span>` : ''}</div>
            <div class="card-botoes">
                <button class="btn-menos" onclick="decrementarGasto('atributo', '${attr}')" ${modificador === 0 ? 'disabled' : ''}>-1</button>
                <button class="btn-mais" onclick="incrementarGasto('atributo', '${attr}')">+1</button>
                <button class="btn-mais10" onclick="incrementarGasto('atributo', '${attr}', 10)">+10</button>
            </div>
            <div class="card-custo" id="custo-atributo-${attr}">---</div>
        </div>
    `;
}

function renderizarCardFVPE(tipo, nome) {
    const valorAtual = expData.valoresAtuais[tipo];
    const valorBase = expData.valoresBase[tipo];
    const modificador = valorAtual - valorBase;
    const modificadorTexto = modificador > 0 ? `+${modificador}` : '';

    return `
        <div class="exp-card fvpe-card" data-tipo="${tipo}" data-id="${tipo}">
            <div class="card-header">${nome}</div>
            <div class="card-valor">${valorAtual}</div>
            <div class="card-base">Base: ${valorBase} ${modificadorTexto ? `<span class="modificador">(${modificadorTexto})</span>` : ''}</div>
            <div class="card-botoes">
                <button class="btn-menos" onclick="decrementarGasto('${tipo}', '${tipo}')" ${modificador === 0 ? 'disabled' : ''}>-1</button>
                <button class="btn-mais" onclick="incrementarGasto('${tipo}', '${tipo}')">+1</button>
                <button class="btn-mais10" onclick="incrementarGasto('${tipo}', '${tipo}', 10)">+10</button>
                <button class="btn-mais100" onclick="incrementarGasto('${tipo}', '${tipo}', 100)">+100</button>
            </div>
            <div class="card-custo" id="custo-${tipo}">---</div>
        </div>
    `;
}

function renderizarListaTecnicas() {
    const tecnicas = Object.keys(expData.valoresAtuais.tecnicas);

    if (tecnicas.length === 0) {
        return '<div class="empty-list">Nenhuma técnica selecionada</div>';
    }

    return tecnicas.map(id => {
        const valorAtual = expData.valoresAtuais.tecnicas[id];
        const valorBase = expData.valoresBase.tecnicas[id] || 1;
        const modificador = valorAtual - valorBase;
        const nome = window.tecnicasList?.find(t => t.id == id)?.nome || `Técnica ${id}`;

        return `
            <div class="exp-item" data-tipo="tecnica" data-id="${id}">
                <div class="item-info">
                    <span class="item-nome">${escapeHtml(nome)}</span>
                    <span class="item-valor">${valorAtual}</span>
                    <span class="item-base">(base: ${valorBase})</span>
                </div>
                <div class="item-botoes">
                    <button class="btn-menos" onclick="decrementarGasto('tecnica', ${id})" ${modificador === 0 ? 'disabled' : ''}>-1</button>
                    <button class="btn-mais" onclick="incrementarGasto('tecnica', ${id})">+1</button>
                    <button class="btn-mais10" onclick="incrementarGasto('tecnica', ${id}, 10)">+10</button>
                </div>
                <div class="item-custo" id="custo-tecnica-${id}">---</div>
            </div>
        `;
    }).join('');
}

function renderizarListaPericias() {
    const pericias = Object.keys(expData.valoresAtuais.pericias);

    if (pericias.length === 0) {
        return '<div class="empty-list">Nenhuma perícia selecionada</div>';
    }

    return pericias.map(id => {
        const valorAtual = expData.valoresAtuais.pericias[id];
        const valorBase = expData.valoresBase.pericias[id] || 1;
        const modificador = valorAtual - valorBase;
        const pericia = window.periciasList?.find(p => p.id == id);
        let nome = pericia?.nome || `Perícia ${id}`;

        if (pericia?.id === 23) {
            const armaNome = window.periciasSelecionadas?.find(p => p.periciaId == id)?.armaNome;
            if (armaNome) nome = `Luta com ${armaNome}`;
        }

        return `
            <div class="exp-item" data-tipo="pericia" data-id="${id}">
                <div class="item-info">
                    <span class="item-nome">${escapeHtml(nome)}</span>
                    <span class="item-valor">${valorAtual}</span>
                    <span class="item-base">(base: ${valorBase})</span>
                </div>
                <div class="item-botoes">
                    <button class="btn-menos" onclick="decrementarGasto('pericia', ${id})" ${modificador === 0 ? 'disabled' : ''}>-1</button>
                    <button class="btn-mais" onclick="incrementarGasto('pericia', ${id})">+1</button>
                    <button class="btn-mais10" onclick="incrementarGasto('pericia', ${id}, 10)">+10</button>
                    <button class="btn-mais50" onclick="incrementarGasto('pericia', ${id}, 50)">+50</button>
                </div>
                <div class="item-custo" id="custo-pericia-${id}">---</div>
            </div>
        `;
    }).join('');
}

async function atualizarCustoUI(tipo, id) {
    let valorAtual;
    let elementoId;

    if (tipo === 'atributo') {
        valorAtual = expData.valoresAtuais[id];
        elementoId = `custo-atributo-${id}`;
    } else if (tipo === 'pericia') {
        valorAtual = expData.valoresAtuais.pericias[id];
        elementoId = `custo-pericia-${id}`;
    } else if (tipo === 'tecnica') {
        valorAtual = expData.valoresAtuais.tecnicas[id];
        elementoId = `custo-tecnica-${id}`;
    } else if (tipo === 'fv' || tipo === 'pe') {
        valorAtual = expData.valoresAtuais[tipo];
        elementoId = `custo-${tipo}`;
    } else {
        return;
    }

    const custoInfo = await calcularCusto(valorAtual, tipo === 'atributo' ? 'atributo' : tipo, 1);
    const elemento = document.getElementById(elementoId);

    if (elemento && custoInfo) {
        elemento.textContent = `+1 → ${custoInfo.custo_total} EXP`;
        elemento.style.color = custoInfo.custo_total > expData.disponivel ? 'var(--danger)' : 'var(--success)';
    }
}

function atualizarValorUI(tipo, id, novoValor) {
    if (tipo === 'atributo') {
        const card = document.querySelector(`.atributo-card[data-id="${id}"]`);
        if (card) {
            card.querySelector('.card-valor').textContent = novoValor;
            const base = expData.valoresBase[id];
            const modificador = novoValor - base;
            const btnMenos = card.querySelector('.btn-menos');
            if (btnMenos) btnMenos.disabled = modificador === 0;
        }
        atualizarCustoUI('atributo', id);
    } else if (tipo === 'pericia') {
        const item = document.querySelector(`.exp-item[data-tipo="pericia"][data-id="${id}"]`);
        if (item) {
            item.querySelector('.item-valor').textContent = novoValor;
            const btnMenos = item.querySelector('.btn-menos');
            const modificador = novoValor - (expData.valoresBase.pericias[id] || 1);
            if (btnMenos) btnMenos.disabled = modificador === 0;
        }
        atualizarCustoUI('pericia', id);
    } else if (tipo === 'tecnica') {
        const item = document.querySelector(`.exp-item[data-tipo="tecnica"][data-id="${id}"]`);
        if (item) {
            item.querySelector('.item-valor').textContent = novoValor;
            const btnMenos = item.querySelector('.btn-menos');
            const modificador = novoValor - (expData.valoresBase.tecnicas[id] || 1);
            if (btnMenos) btnMenos.disabled = modificador === 0;
        }
        atualizarCustoUI('tecnica', id);
    } else if (tipo === 'fv' || tipo === 'pe') {
        const card = document.querySelector(`.fvpe-card[data-id="${tipo}"]`);
        if (card) {
            card.querySelector('.card-valor').textContent = novoValor;
            const base = expData.valoresBase[tipo];
            const modificador = novoValor - base;
            const btnMenos = card.querySelector('.btn-menos');
            if (btnMenos) btnMenos.disabled = modificador === 0;
        }
        atualizarCustoUI(tipo, tipo);
    }
}

function atualizarBarraProgresso() {
    const percent = (expData.gasto / expData.total) * 100;
    const barraFill = document.querySelector('.exp-bar-fill');
    const expValues = document.querySelector('.exp-values');
    const expStats = document.querySelector('.exp-stats');

    if (barraFill) barraFill.style.width = `${percent}%`;
    if (expValues) expValues.textContent = `${expData.disponivel.toLocaleString()} / ${expData.total.toLocaleString()}`;
    if (expStats) {
        expStats.innerHTML = `
            <span>📊 Gasto: ${expData.gasto.toLocaleString()}</span>
            <span>✨ Restante: ${expData.disponivel.toLocaleString()}</span>
        `;
    }
}

function atualizarBotoesContexto() {
    document.querySelectorAll('.exp-card .btn-menos, .exp-item .btn-menos').forEach(btn => {
        const parent = btn.closest('[data-tipo]');
        if (parent) {
            const tipo = parent.dataset.tipo;
            const id = parent.dataset.id;

            if (tipo === 'atributo') {
                const modificador = expData.valoresAtuais[id] - expData.valoresBase[id];
                btn.disabled = modificador === 0;
            } else if (tipo === 'pericia') {
                const modificador = expData.valoresAtuais.pericias[id] - (expData.valoresBase.pericias[id] || 1);
                btn.disabled = modificador === 0;
            } else if (tipo === 'tecnica') {
                const modificador = expData.valoresAtuais.tecnicas[id] - (expData.valoresBase.tecnicas[id] || 1);
                btn.disabled = modificador === 0;
            } else if (tipo === 'fv' || tipo === 'pe') {
                const modificador = expData.valoresAtuais[tipo] - expData.valoresBase[tipo];
                btn.disabled = modificador === 0;
            }
        }
    });
}

window.incrementarGasto = async function(tipo, id, quantidade = 1) {
    const sucesso = await aplicarGasto(tipo, id, quantidade);
    if (sucesso) {
        const btn = event?.target;
        if (btn) {
            btn.style.transform = 'scale(0.95';
            setTimeout(() => { btn.style.transform = ''; }, 100);
        }
    }
};

window.decrementarGasto = function(tipo, id) {
    if (tipo === 'atributo') {
        const valorAtual = expData.valoresAtuais[id];
        const valorBase = expData.valoresBase[id];
        if (valorAtual <= valorBase) return;

        const gastoAtual = expData.gastosPendentes.atributos[id];
        if (gastoAtual <= 0) return;

        const novoValor = valorAtual - 1;

        expData.valoresAtuais[id] = novoValor;
        expData.gastosPendentes.atributos[id]--;
        expData.gasto = expData.gasto;
        expData.disponivel = expData.total - expData.gasto;

        atualizarValorUI('atributo', id, novoValor);
        atualizarBarraProgresso();
    }
};

window.confirmarGastos = function() {
    const totalGasto = expData.gasto;
    const dadosParaSalvar = {
        gastos: expData.gastosPendentes,
        valores_finais: {
            forca: expData.valoresAtuais.forca,
            destreza: expData.valoresAtuais.destreza,
            inteligencia: expData.valoresAtuais.inteligencia,
            constituicao: expData.valoresAtuais.constituicao,
            pericias: expData.valoresAtuais.pericias,
            tecnicas: expData.valoresAtuais.tecnicas,
            fv: expData.valoresAtuais.fv,
            pe: expData.valoresAtuais.pe
        },
        experiencia_gasta: totalGasto,
        experiencia_restante: expData.disponivel
    };

    console.log('💾 Gastos confirmados:', dadosParaSalvar);
    window.gastosExpConfirmados = dadosParaSalvar;

    alert(`✅ Gastos confirmados! Total gasto: ${totalGasto.toLocaleString()} EXP`);

    if (typeof nextStep === 'function') {
        nextStep(9);
    }
};

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

window.initProgressaoExp = initProgressaoExp;
window.calcularCusto = calcularCusto;
window.aplicarGasto = aplicarGasto;
window.resetarGastos = resetarGastos;
window.confirmarGastos = confirmarGastos;