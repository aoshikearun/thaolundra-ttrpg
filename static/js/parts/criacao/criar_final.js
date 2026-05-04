// criar_final.js - Sociais (qualidades/defeitos) + salvarFicha

// ============================================
// CARACTERÍSTICAS (QUALIDADES/DEFEITOS)
// ============================================

let caracteristicasTemp = { qualidades: [], defeitos: [], outras: [] };

function abrirModalCaracteristica(categoria) {
    document.getElementById('caracteristica-categoria').value = categoria;
    document.getElementById('modal-caracteristica-title').textContent = `Adicionar ${categoria}`;
    document.getElementById('caracteristica-nome').value = '';
    document.getElementById('caracteristica-descricao').value = '';
    document.getElementById('caracteristica-score').value = categoria === 'Defeito' ? -1 : 1;

    const modal = document.getElementById('modal-caracteristica');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function fecharModalCaracteristica() {
    const modal = document.getElementById('modal-caracteristica');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function adicionarCaracteristica(event) {
    event.preventDefault();

    const categoria = document.getElementById('caracteristica-categoria').value;
    const nome = document.getElementById('caracteristica-nome').value.trim();
    const descricao = document.getElementById('caracteristica-descricao').value.trim();
    let score = parseInt(document.getElementById('caracteristica-score').value) || 0;

    if (!nome) {
        alert('Digite um nome para a característica.');
        return;
    }

    if (categoria === 'Qualidade' && score < 0) score = Math.abs(score);
    if (categoria === 'Defeito' && score > 0) score = -Math.abs(score);

    const novaCarac = { id: Date.now(), nome, descricao, score, categoria };

    if (categoria === 'Qualidade') {
        if (caracteristicasTemp.qualidades.length >= 5) {
            alert('Limite de 5 qualidades atingido.');
            return;
        }
        caracteristicasTemp.qualidades.push(novaCarac);
        renderizarQualidades();
    } else if (categoria === 'Defeito') {
        if (caracteristicasTemp.defeitos.length >= 5) {
            alert('Limite de 5 defeitos atingido.');
            return;
        }
        caracteristicasTemp.defeitos.push(novaCarac);
        renderizarDefeitos();
    } else {
        caracteristicasTemp.outras.push(novaCarac);
        renderizarOutras();
    }

    atualizarScoreTotal();
    fecharModalCaracteristica();
}

function removerCaracteristica(categoria, index) {
    if (categoria === 'Qualidade') caracteristicasTemp.qualidades.splice(index, 1);
    else if (categoria === 'Defeito') caracteristicasTemp.defeitos.splice(index, 1);
    else caracteristicasTemp.outras.splice(index, 1);

    renderizarQualidades();
    renderizarDefeitos();
    renderizarOutras();
    atualizarScoreTotal();
}

function renderizarQualidades() {
    const container = document.getElementById('qualidades-lista');
    if (!container) return;

    document.getElementById('qualidades-count').textContent = caracteristicasTemp.qualidades.length;

    if (caracteristicasTemp.qualidades.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhuma qualidade adicionada.</div>';
        return;
    }

    container.innerHTML = caracteristicasTemp.qualidades.map((c, i) => `
        <div class="caracteristica-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color);">
            <div>
                <strong>${escapeHtml(c.nome)}</strong> <span style="color: #2ecc71;">(+${c.score})</span>
                ${c.descricao ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(c.descricao)}</div>` : ''}
            </div>
            <button type="button" class="btn-small btn-remove" onclick="removerCaracteristica('Qualidade', ${i})" style="background: none; color: var(--danger);">🗑️</button>
        </div>
    `).join('');
}

function renderizarDefeitos() {
    const container = document.getElementById('defeitos-lista');
    if (!container) return;

    document.getElementById('defeitos-count').textContent = caracteristicasTemp.defeitos.length;

    if (caracteristicasTemp.defeitos.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhum defeito adicionado.</div>';
        return;
    }

    container.innerHTML = caracteristicasTemp.defeitos.map((c, i) => `
        <div class="caracteristica-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color);">
            <div>
                <strong>${escapeHtml(c.nome)}</strong> <span style="color: #e74c3c;">(${c.score})</span>
                ${c.descricao ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(c.descricao)}</div>` : ''}
            </div>
            <button type="button" class="btn-small btn-remove" onclick="removerCaracteristica('Defeito', ${i})" style="background: none; color: var(--danger);">🗑️</button>
        </div>
    `).join('');
}

function renderizarOutras() {
    const container = document.getElementById('outras-lista');
    if (!container) return;

    if (caracteristicasTemp.outras.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhuma outra característica adicionada.</div>';
        return;
    }

    container.innerHTML = caracteristicasTemp.outras.map((c, i) => `
        <div class="caracteristica-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color);">
            <div>
                <strong>${escapeHtml(c.nome)}</strong> <span style="color: var(--text-muted);">(${c.score})</span>
                ${c.descricao ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(c.descricao)}</div>` : ''}
            </div>
            <button type="button" class="btn-small btn-remove" onclick="removerCaracteristica('Outras', ${i})" style="background: none; color: var(--danger);">🗑️</button>
        </div>
    `).join('');
}

function atualizarScoreTotal() {
    const todas = [...caracteristicasTemp.qualidades, ...caracteristicasTemp.defeitos, ...caracteristicasTemp.outras];
    const totalScore = todas.reduce((sum, c) => sum + c.score, 0);
    const expBonus = -totalScore * 100;

    document.getElementById('score-total').textContent = totalScore;
    document.getElementById('exp-bonus').textContent = expBonus >= 0 ? `+${expBonus}` : expBonus;

    fichaData.caracteristicas = caracteristicasTemp;
    fichaData.exp_bonus_caracteristicas = expBonus;
}

// ============================================
// SALVAR FICHA
// ============================================

function salvarFicha() {
    console.log('💾 Iniciando salvamento da ficha...');

    const nome = document.getElementById('nome_completo')?.value.trim();
    const privado = document.getElementById('privado')?.checked || false;

    if (!nome) {
        alert('Digite o nome do personagem.');
        return;
    }

    const especieId = parseInt(document.getElementById('especie')?.value || 0);
    const fonteId = parseInt(document.getElementById('fonte_poder')?.value || 0);

    if (!especieId) {
        alert('Selecione uma espécie');
        return;
    }
    if (!fonteId) {
        alert('Selecione uma fonte de poder');
        return;
    }

    let experienciaTotal = (categoriaData?.experiencia_inicial || 500);

    let expBonusCaracteristicas = 0;
    if (window.caracteristicasTemp) {
        const todasCarac = [...window.caracteristicasTemp.qualidades, ...window.caracteristicasTemp.defeitos, ...window.caracteristicasTemp.outras];
        const scoreTotal = todasCarac.reduce((sum, c) => sum + (c.score || 0), 0);
        expBonusCaracteristicas = -scoreTotal * 100;
        experienciaTotal += expBonusCaracteristicas;
    }

    let expGasta = 0;
    let valoresFinais = {};
    let gastosPendentes = {};

    if (window.gastosExpConfirmados) {
        expGasta = window.gastosExpConfirmados.experiencia_gasta || 0;
        valoresFinais = window.gastosExpConfirmados.valores_finais || {};
        gastosPendentes = window.gastosExpConfirmados.gastos || {};
        experienciaTotal -= expGasta;
    }

    const forcaFinal = valoresFinais.forca || fichaData.atributos.forca;
    const destrezaFinal = valoresFinais.destreza || fichaData.atributos.destreza;
    const inteligenciaFinal = valoresFinais.inteligencia || fichaData.atributos.inteligencia;
    const constituicaoFinal = valoresFinais.constituicao || fichaData.atributos.constituicao;
    const poderFinal = fichaData.atributos.poder;
    const aparenciaFinal = fichaData.atributos.aparencia;

    const fvFinal = valoresFinais.fv || fichaData.pontos.forca_vital || 0;
    const peFinal = valoresFinais.pe || fichaData.pontos.poder_elemental || 0;

    const fichaCompleta = {
        nome_completo: nome,
        privado: privado,
        categoria_personagem_id: categoriaSelecionada,
        especie_id: especieId,
        fonte_poder_id: fonteId,
        faccao_id: parseInt(document.getElementById('faccao')?.value || 0),
        aura_id: parseInt(document.getElementById('aura')?.value || 0) || null,
        ocupacao: document.getElementById('ocupacao')?.value || '',
        moradia: document.getElementById('moradia')?.value || '',
        npc: document.getElementById('npc')?.value === 'true',
        forca: forcaFinal,
        destreza: destrezaFinal,
        inteligencia: inteligenciaFinal,
        constituicao: constituicaoFinal,
        poder: poderFinal,
        aparencia: aparenciaFinal,
        forca_vital: fvFinal,
        poder_elemental: peFinal,
        experiencia: experienciaTotal,
        experiencia_gasta: expGasta,
        experiencia_bonus_caracteristicas: expBonusCaracteristicas,
        pericias: fichaData.pericias.map(p => ({
            pericia_id: p.periciaId,
            pontos: periciasPontos[p.armaId ? `${p.periciaId}_${p.armaId}` : p.periciaId] || 1,
            arma_id: p.armaId || null,
            arma_nome: p.armaNome || null
        })),
        tecnicas: (valoresFinais.tecnicas ?
            Object.entries(valoresFinais.tecnicas).map(([id, pontos]) => ({
                tecnica_id: parseInt(id),
                pontos: pontos
            })) :
            (fichaData.tecnicas || []).map(t => ({
                tecnica_id: t.id,
                pontos: t.pontos || 1
            }))
        ),
        gastos_exp: gastosPendentes,
        caracteristicas: {
            qualidades: window.caracteristicasTemp?.qualidades || [],
            defeitos: window.caracteristicasTemp?.defeitos || [],
            outras: window.caracteristicasTemp?.outras || []
        },
        dados_rolagem: {
            atributos: atributosTentativas,
            poder: poderTentativas,
            aparencia: aparenciaFinal
        }
    };

    console.log('📦 Dados a serem salvos:', fichaCompleta);

    fetch('/api/ficha/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fichaCompleta)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ ${nome} foi criado com sucesso!`);
            window.location.href = '/main';
        } else {
            alert(`❌ Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar ficha:', error);
        alert('❌ Erro ao salvar ficha. Tente novamente.');
    });
}

// ============================================
// MODAIS (FACÇÃO E AURA)
// ============================================

function abrirModalCriarFaccao() {
    const modal = document.getElementById('modal-faccao');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function fecharModalFaccao() {
    const modal = document.getElementById('modal-faccao');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    const form = document.getElementById('form-faccao');
    if (form) form.reset();
}

function criarFaccao(event) {
    event.preventDefault();

    const nomeInput = document.getElementById('faccao-nome');
    const nome = nomeInput ? nomeInput.value.trim() : '';

    if (!nome) {
        alert('❌ O nome da facção é obrigatório');
        return;
    }

    const data = {
        nome: nome,
        manifesto: document.getElementById('faccao-manifesto')?.value || ''
    };

    fetch('/api/ficha/criar-faccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Facção criada com sucesso!');
            fecharModalFaccao();
            carregarFaccoes();
            setTimeout(() => {
                const faccaoSelect = document.getElementById('faccao');
                if (faccaoSelect && result.faccao_id) faccaoSelect.value = result.faccao_id;
            }, 500);
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro ao criar facção:', error);
        alert('❌ Erro ao criar facção');
    });
}

function abrirModalCriarAura() {
    const modal = document.getElementById('modal-aura');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function fecharModalAura() {
    const modal = document.getElementById('modal-aura');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    const form = document.getElementById('form-aura');
    if (form) form.reset();
}

function criarAura(event) {
    event.preventDefault();

    const nomeInput = document.getElementById('aura-nome');
    const nome = nomeInput ? nomeInput.value.trim() : '';

    if (!nome) {
        alert('❌ O nome da aura é obrigatório');
        return;
    }

    const data = {
        nome: nome,
        descricao: document.getElementById('aura-descricao')?.value || ''
    };

    fetch('/api/ficha/criar-aura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Aura criada com sucesso!');
            fecharModalAura();
            carregarAuras();
            setTimeout(() => {
                const auraSelect = document.getElementById('aura');
                if (auraSelect && result.aura_id) auraSelect.value = result.aura_id;
            }, 500);
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro ao criar aura:', error);
        alert('❌ Erro ao criar aura');
    });
}

// ============================================
// PASSO 8 - FINALIZAÇÃO (FICHA COMPLETA)
// ============================================

function carregarPassoOito() {
    console.log('🎯 Carregando passo 8 - Ficha completa');

    if (typeof calcularPontos === 'function') calcularPontos();

    const frenteHtml = construirFrenteFicha();
    const frenteContainer = document.getElementById('passo8-frente-conteudo');
    if (frenteContainer) frenteContainer.innerHTML = frenteHtml;

    const versoHtml = construirVersoFicha();
    const versoContainer = document.getElementById('passo8-verso-conteudo');
    if (versoContainer) versoContainer.innerHTML = versoHtml;

    initPasso8Tabs();
}

function initPasso8Tabs() {
    const step8Container = document.querySelector('#step-8 .sheet-container');
    if (!step8Container) return;

    const tabBtns = step8Container.querySelectorAll('.tab-btn');
    const tabContents = step8Container.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function(e) {
            const tabId = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const target = step8Container.querySelector(`#tab-${tabId}`);
            if (target) target.classList.add('active');
        });
    });
}

function construirFrenteFicha() {
    console.log('Construindo frente da ficha...');
    const f = fichaData.atributos;

    const fisicos = Math.floor((((f.forca + (f.destreza / 2) + (f.constituicao / 2)) / 2) * 5));
    const agilidade = Math.floor((((f.destreza + (f.forca / 2) + (f.inteligencia / 2)) / 2) * 5));
    const mentais = Math.floor((((f.inteligencia + (f.destreza / 2) + (f.poder / 20)) / 2) * 5));
    const vitalidade = Math.floor((((f.forca + f.constituicao) / 2) * 5));

    const danoBase = Math.floor(fisicos / 2);
    const armadura = Math.floor(vitalidade / 2);
    const resistenciaMagica = Math.floor(f.poder / 10);

    const fv = vitalidade * 2;
    const pe = mentais * 2;

    const cabeca = Math.floor(fv * 0.10);
    const torso = Math.floor(fv * 0.40);
    const bracoE = Math.floor(fv * 0.10);
    const bracoD = Math.floor(fv * 0.10);
    const pernaE = Math.floor(fv * 0.15);
    const pernaD = Math.floor(fv * 0.15);

    return `
        <div class="top-row">
            <div class="field"><span class="field-label">NOME</span><span class="field-value">${escapeHtml(document.getElementById('nome_completo')?.value || '---')}</span></div>
            <div class="field"><span class="field-label">NÍVEL</span><span class="field-value" id="preview-nivel">${calcularNivelPreview()}</span></div>
            <div class="field"><span class="field-label">OCUPAÇÃO</span><span class="field-value">${escapeHtml(document.getElementById('ocupacao')?.value || '-')}</span></div>
            <div class="field"><span class="field-label">JOGADOR</span><span class="field-value">${window.currentUser?.username || 'Jogador'}</span></div>
            <div class="field"><span class="field-label">FACÇÃO</span><span class="field-value">${document.getElementById('faccao')?.options[document.getElementById('faccao')?.selectedIndex]?.text || 'Nenhuma'}</span></div>
            <div class="field"><span class="field-label">MORADIA</span><span class="field-value">${escapeHtml(document.getElementById('moradia')?.value || '-')}</span></div>
        </div>
        <div class="atributos-row">
            <div class="atributo-card"><div class="atributo-nome">FOR</div><div class="atributo-valor">${f.forca}</div><div class="atributo-base">base: ${f.forca}</div></div>
            <div class="atributo-card"><div class="atributo-nome">DEX</div><div class="atributo-valor">${f.destreza}</div><div class="atributo-base">base: ${f.destreza}</div></div>
            <div class="atributo-card"><div class="atributo-nome">INT</div><div class="atributo-valor">${f.inteligencia}</div><div class="atributo-base">base: ${f.inteligencia}</div></div>
            <div class="atributo-card"><div class="atributo-nome">CON</div><div class="atributo-valor">${f.constituicao}</div><div class="atributo-base">base: ${f.constituicao}</div></div>
            <div class="atributo-card"><div class="atributo-nome">APA</div><div class="atributo-valor">${f.aparencia}</div><div class="atributo-base">base: ${f.aparencia}</div></div>
            <div class="atributo-card"><div class="atributo-nome">POD</div><div class="atributo-valor">${f.poder}</div><div class="atributo-base">base: ${f.poder}</div></div>
        </div>
        <div class="testes-combate-row">
            <div class="testes-box">
                <div class="section-titulo">🎲 TESTES</div>
                <div class="testes-grid">
                    <div class="teste-item"><div class="teste-nome">💪 FÍSICOS</div><div class="teste-valor">${fisicos}</div></div>
                    <div class="teste-item"><div class="teste-nome">🏃 AGILIDADE</div><div class="teste-valor">${agilidade}</div></div>
                    <div class="teste-item"><div class="teste-nome">🧠 MENTAIS</div><div class="teste-valor">${mentais}</div></div>
                    <div class="teste-item"><div class="teste-nome">❤️ VITALIDADE</div><div class="teste-valor">${vitalidade}</div></div>
                </div>
            </div>
            <div class="combate-box">
                <div class="section-titulo">⚔️ COMBATE</div>
                <div class="combate-grid">
                    <div class="combate-item"><span>dano base</span><strong>${danoBase}</strong></div>
                    <div class="combate-item"><span>armadura</span><strong>${armadura}</strong></div>
                    <div class="combate-item"><span>res. mágica</span><strong>${resistenciaMagica}</strong></div>
                </div>
            </div>
        </div>
        <div class="pericias-tecnicas-row">
            <div class="lista-box">
                <div class="lista-titulo">📚 PERÍCIAS</div>
                <div class="lista-items">
                    ${periciasSelecionadas.map(p => {
                        const pericia = periciasList.find(pe => pe.id === p.periciaId);
                        const pontos = periciasPontos[p.armaId ? `${p.periciaId}_${p.armaId}` : p.periciaId] || 1;
                        return `<div class="lista-item"><span>${pericia?.nome || p.periciaId}${p.armaNome ? ` (${p.armaNome})` : ''}</span><span>${pontos}</span></div>`;
                    }).join('') || '<div class="lista-item"><span>Nenhuma perícia</span><span>-</span></div>'}
                </div>
            </div>
            <div class="lista-box">
                <div class="lista-titulo">✨ TÉCNICAS</div>
                <div class="lista-items">
                    ${(fichaData.tecnicas || []).map(t => `<div class="lista-item"><span>${t.nome}</span><span>${t.pontos || 1}</span></div>`).join('') || '<div class="lista-item"><span>Nenhuma técnica</span><span>-</span></div>'}
                </div>
            </div>
        </div>
        <div class="corpo-vital-row">
            <div class="corpo-box">
                <div class="section-titulo">🛡️ DANO LOCALIZADO</div>
                <div class="corpo-grid">
                    <div class="corpo-item"><span>🧠 CABEÇA</span><div class="field-value">${cabeca}</div><small>(10%)</small></div>
                    <div class="corpo-item"><span>💪 TORSO</span><div class="field-value">${torso}</div><small>(40%)</small></div>
                    <div class="corpo-item"><span>🦾 BRAÇO E</span><div class="field-value">${bracoE}</div><small>(10%)</small></div>
                    <div class="corpo-item"><span>🦾 BRAÇO D</span><div class="field-value">${bracoD}</div><small>(10%)</small></div>
                    <div class="corpo-item"><span>🦵 PERNA E</span><div class="field-value">${pernaE}</div><small>(15%)</small></div>
                    <div class="corpo-item"><span>🦵 PERNA D</span><div class="field-value">${pernaD}</div><small>(15%)</small></div>
                </div>
            </div>
            <div class="vital-box">
                <div class="section-titulo">💪 VITALIDADE</div>
                <div class="vital-grid">
                    <div class="vital-item">
                        <div class="vital-label">Força Vital</div>
                        <div class="vital-valor">${fv}</div>
                        <div class="vital-sub"><span>ATUAL</span><span>${fv}</span></div>
                        <div class="vital-sub"><span>TOTAL</span><span>${fv}</span></div>
                    </div>
                    <div class="vital-item">
                        <div class="vital-label">Poder Elemental</div>
                        <div class="vital-valor">${pe}</div>
                        <div class="vital-sub"><span>ATUAL</span><span>${pe}</span></div>
                        <div class="vital-sub"><span>TOTAL</span><span>${pe}</span></div>
                    </div>
                </div>
                <div class="rodape-info">
                    <div><span class="vital-label">aura</span><br><span>${document.getElementById('aura')?.options[document.getElementById('aura')?.selectedIndex]?.text || '-'}</span></div>
                    <div><span class="vital-label">exp</span><br><span>${(categoriaData?.experiencia_inicial || 500) + (fichaData.exp_bonus_caracteristicas || 0)}</span></div>
                    <div><span class="vital-label">muny</span><br><span>0</span></div>
                    <div><span class="vital-label">marca</span><br><span>-</span></div>
                    <div><span class="vital-label">Favores</span><br><span>0</span></div>
                </div>
            </div>
        </div>
    `;
}

function construirVersoFicha() {
    console.log('Construindo verso da ficha...');

    const qualidades = window.caracteristicasTemp?.qualidades || [];
    const defeitos = window.caracteristicasTemp?.defeitos || [];
    const outras = window.caracteristicasTemp?.outras || [];

    return `
        <div class="verso-grid">
            <div class="verso-col">
                <div class="verso-card">
                    <div class="verso-card-header">✨ QUALIDADES</div>
                    <div class="verso-card-body">
                        ${qualidades.map(q => `<div class="qualidade-item"><span>${escapeHtml(q.nome)}</span><span class="qualidade-score">+${q.score}</span></div>`).join('') || '<div class="qualidade-item"><span>Nenhuma qualidade</span><span class="qualidade-score">-</span></div>'}
                    </div>
                </div>
                <div class="verso-card">
                    <div class="verso-card-header">⚠️ DEFEITOS</div>
                    <div class="verso-card-body">
                        ${defeitos.map(d => `<div class="defeito-item"><span>${escapeHtml(d.nome)}</span><span class="defeito-score">${d.score}</span></div>`).join('') || '<div class="defeito-item"><span>Nenhum defeito</span><span class="defeito-score">-</span></div>'}
                    </div>
                </div>
            </div>
            <div class="verso-col">
                <div class="verso-card">
                    <div class="verso-card-header">📝 OBSERVAÇÕES</div>
                    <div class="verso-card-body">
                        <div class="anotacoes-texto">${escapeHtml(document.getElementById('anotacoes')?.value || 'Nenhuma anotação.')}</div>
                    </div>
                </div>
                <div class="verso-card">
                    <div class="verso-card-header">📜 OUTRAS CARACTERÍSTICAS</div>
                    <div class="verso-card-body">
                        ${outras.map(o => `<div class="inventario-item">${escapeHtml(o.nome)}${o.descricao ? `: ${escapeHtml(o.descricao)}` : ''}</div>`).join('') || '<div class="inventario-item">Nenhuma</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function calcularNivelPreview() {
    const f = fichaData.atributos;
    const maiorAtributo = Math.max(f.forca, f.destreza, f.inteligencia, f.constituicao);
    const poderNivel = Math.floor(f.poder / 10);
    const maioresPericias = Object.values(periciasPontos).length > 0 ? Math.max(...Object.values(periciasPontos)) : 1;
    const periciaNivel = Math.floor(maioresPericias / 10);
    const maioresTecnicas = (fichaData.tecnicas || []).length > 0 ? Math.max(...(fichaData.tecnicas.map(t => t.pontos || 1))) : 1;
    const tecnicaNivel = Math.floor(maioresTecnicas / 10);
    const peNivel = Math.floor((fichaData.pontos.poder_elemental || 0) / 50);
    const feNivel = 0;

    return Math.max(poderNivel, maiorAtributo, periciaNivel, tecnicaNivel, peNivel, feNivel);
}

// ============================================
// FUNÇÕES AUXILIARES DO PASSO 8
// ============================================

function atualizarMetricasCalculadas() {
    const forca = expData?.valoresAtuais?.forca || fichaData.atributos.forca;
    const destreza = expData?.valoresAtuais?.destreza || fichaData.atributos.destreza;
    const inteligencia = expData?.valoresAtuais?.inteligencia || fichaData.atributos.inteligencia;
