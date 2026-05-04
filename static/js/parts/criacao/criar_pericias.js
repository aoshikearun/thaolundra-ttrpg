// criar_pericias.js - Fase 1 e 2 de perícias, cards, pontos

// ============================================
// PERÍCIAS - CARREGAMENTO
// ============================================

function carregarPericias() {
    console.log('🚀 Carregando perícias...');

    if (fichaData.pontos.pericias === 0) {
        calcularPontos();
    }

    fetch('/api/ficha/pericias')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                periciasList = data.pericias;
                window.periciasList = periciasList;
                renderPericiasCards(data.pericias);
                atualizarLimitesUI();

                const pontosSpan = document.getElementById('pontos-pericias');
                if (pontosSpan) pontosSpan.textContent = fichaData.pontos.pericias || 0;
            }
        })
        .catch(error => console.error('Erro:', error));
}

function renderPericiasCards(pericias) {
    const container = document.getElementById('pericias-container');
    if (!container) return;

    container.innerHTML = '';

    const categorias = ['Combate', 'Ofício', 'Conhecimento', 'Vontade', 'Simples', 'Sociais'];
    const icons = {
        'Combate': '⚔️', 'Ofício': '🔧', 'Conhecimento': '🔬',
        'Vontade': '🧠', 'Simples': '⚪', 'Sociais': '💬'
    };

    categorias.forEach(categoria => {
        const periciasCategoria = pericias.filter(p => p.categoria === categoria);

        periciasCategoria.forEach(pericia => {
            const instanciasPericia = periciasSelecionadas.filter(p => p.periciaId === pericia.id);
            const isSelected = instanciasPericia.length > 0;

            const card = document.createElement('div');
            card.className = `pericia-card ${categoria.toLowerCase()} ${isSelected ? 'selected' : ''}`;
            card.dataset.id = pericia.id;

            let nomeHtml = `<div class="pericia-nome">${pericia.nome}</div>`;

            if (pericia.id === 23) {
                if (instanciasPericia.length === 0) {
                    criarCardLuta(pericia, categoria, null, icons[categoria], container);
                } else {
                    instanciasPericia.forEach(instancia => {
                        criarCardLuta(pericia, categoria, instancia, icons[categoria], container);
                    });
                    if (instanciasPericia.length < limitesCategorias[categoria].max) {
                        criarCardLuta(pericia, categoria, null, icons[categoria], container);
                    }
                }
                return;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        ${nomeHtml}
                        <div class="card-categoria">${categoria}</div>
                    </div>
                    <div class="category-icon">${icons[categoria]}</div>
                </div>
                <div class="card-body">
                    <div class="card-desc">${pericia.descricao_geral || 'Sem descrição'}</div>
                </div>
                <div class="card-footer">
                    <div class="select-indicator"></div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList && e.target.classList.contains('luta-btn')) return;
                togglePericiaSelecao(pericia.id, categoria);
            });

            container.appendChild(card);
        });
    });
}

function togglePericiaSelecao(periciaId, categoria) {
    const pericia = periciasList.find(p => p.id === periciaId);
    if (!pericia) return;

    const pontosTotais = fichaData.pontos.pericias || 0;
    const pontosUsadosAtuais = calcularTotalPontosUsados();
    const pontosRestantes = pontosTotais - pontosUsadosAtuais;
    const limite = limitesCategorias[categoria];

    const jaSelecionada = periciasSelecionadas.some(p => p.periciaId === periciaId && !p.armaId);

    if (jaSelecionada) {
        const index = periciasSelecionadas.findIndex(p => p.periciaId === periciaId && !p.armaId);
        periciasSelecionadas.splice(index, 1);
        delete periciasPontos[periciaId];
        limite.atual--;
    } else {
        if (limite.max !== 999 && limite.atual >= limite.max) {
            alert(`⚠️ Limite de ${limite.max} perícias de ${categoria} atingido.`);
            return;
        }
        if (pontosRestantes < 1) {
            alert(`⚠️ Você não tem pontos suficientes. Disponíveis: ${pontosRestantes}`);
            return;
        }
        periciasSelecionadas.push({ periciaId: periciaId, armaId: null, armaNome: null });
        periciasPontos[periciaId] = 1;
        limite.atual++;
    }

    renderPericiasCards(periciasList);
    atualizarLimitesUI();
    atualizarResumoPontosPericias();
}

function criarCardLuta(pericia, categoria, instancia, icon, container) {
    const isSelected = !!instancia;
    const card = document.createElement('div');
    card.className = `pericia-card ${categoria.toLowerCase()} ${isSelected ? 'selected' : ''}`;
    card.dataset.id = pericia.id;

    let nomeHtml = '';
    if (isSelected) {
        nomeHtml = `
            <div class="pericia-nome">
                <span class="luta-nome">Luta com ${instancia.armaNome}</span>
                <button type="button" class="btn-small luta-edit-btn" data-arma-id="${instancia.armaId}" style="margin-left: 8px;">✏️</button>
                <button type="button" class="btn-small luta-remove-btn" data-arma-id="${instancia.armaId}" style="margin-left: 4px;">🗑️</button>
            </div>
        `;
    } else {
        nomeHtml = `
            <div class="pericia-nome">
                <span class="luta-nome">Luta com ?</span>
                <button type="button" class="btn-small luta-add-btn" style="margin-left: 8px;">⚔️</button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="card-header">
            <div>
                ${nomeHtml}
                <div class="card-categoria">${categoria}</div>
            </div>
            <div class="category-icon">${icon}</div>
        </div>
        <div class="card-body">
            <div class="card-desc">${pericia.descricao_geral || 'Sem descrição'}</div>
        </div>
        <div class="card-footer">
            <div class="select-indicator"></div>
        </div>
    `;

    const addBtn = card.querySelector('.luta-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalLutaCom(pericia.id, (armaId, armaNome) => {
                const jaExiste = periciasSelecionadas.some(p => p.periciaId === pericia.id && p.armaId === armaId);
                if (jaExiste) {
                    alert(`⚠️ Você já selecionou "Luta com ${armaNome}".`);
                    return;
                }
                periciasSelecionadas.push({ periciaId: pericia.id, armaId: armaId, armaNome: armaNome });
                const key = `${pericia.id}_${armaId}`;
                periciasPontos[key] = 1;
                limitesCategorias[categoria].atual++;
                renderPericiasCards(periciasList);
                atualizarResumoPontosPericias();
            });
        });
    }

    const editBtn = card.querySelector('.luta-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const armaIdAntiga = parseInt(editBtn.dataset.armaId);
            abrirModalLutaCom(pericia.id, (novaArmaId, novaArmaNome) => {
                const index = periciasSelecionadas.findIndex(p => p.periciaId === pericia.id && p.armaId === armaIdAntiga);
                if (index !== -1) {
                    const oldKey = `${pericia.id}_${armaIdAntiga}`;
                    const newKey = `${pericia.id}_${novaArmaId}`;
                    const pontos = periciasPontos[oldKey] || 1;
                    delete periciasPontos[oldKey];
                    periciasPontos[newKey] = pontos;
                    periciasSelecionadas[index].armaId = novaArmaId;
                    periciasSelecionadas[index].armaNome = novaArmaNome;
                    renderPericiasCards(periciasList);
                    atualizarResumoPontosPericias();
                }
            });
        });
    }

    const removeBtn = card.querySelector('.luta-remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const armaId = parseInt(removeBtn.dataset.armaId);
            const index = periciasSelecionadas.findIndex(p => p.periciaId === pericia.id && p.armaId === armaId);
            if (index !== -1) {
                const key = `${pericia.id}_${armaId}`;
                delete periciasPontos[key];
                periciasSelecionadas.splice(index, 1);
                limitesCategorias[categoria].atual--;
                renderPericiasCards(periciasList);
                atualizarResumoPontosPericias();
            }
        });
    }
    container.appendChild(card);
}

function atualizarLimitesUI() {
    const limiteElements = {
        'Combate': document.querySelector('.limite-badge.combate'),
        'Ofício': document.querySelector('.limite-badge.oficio'),
        'Conhecimento': document.querySelector('.limite-badge.conhecimento'),
        'Vontade': document.querySelector('.limite-badge.vontade')
    };

    for (const [cat, element] of Object.entries(limiteElements)) {
        if (element) {
            const limite = limitesCategorias[cat];
            if (limite) {
                element.textContent = `${getIconByCategoria(cat)} ${cat}: ${limite.atual}/${limite.max}`;
                element.style.opacity = limite.atual >= limite.max ? '0.7' : '1';
            }
        }
    }
}

function getIconByCategoria(categoria) {
    const icons = {
        'Combate': '⚔️', 'Ofício': '🔧', 'Conhecimento': '🔬', 'Vontade': '🧠'
    };
    return icons[categoria] || '📋';
}

// ============================================
// PERÍCIAS - FASES
// ============================================

function avancarFasePericias() {
    const temVontade = periciasSelecionadas.some(item => {
        const pericia = periciasList.find(p => p.id === item.periciaId);
        return pericia && pericia.categoria === 'Vontade';
    });

    if (!temVontade) {
        alert('⚠️ Você precisa selecionar pelo menos uma perícia de Vontade (ex: Autocontrole).');
        return;
    }

    if (periciasSelecionadas.length === 0) {
        alert('⚠️ Selecione pelo menos uma perícia antes de continuar.');
        return;
    }

    document.getElementById('fase1-pericias').style.display = 'none';
    document.getElementById('fase2-pericias').style.display = 'block';
    renderizarFase2Pericias();
}

function voltarFasePericias() {
    document.getElementById('fase2-pericias').style.display = 'none';
    document.getElementById('fase1-pericias').style.display = 'block';
}

function renderizarFase2Pericias() {
    const container = document.getElementById('pericias-selecionadas-container');
    if (!container) return;

    container.innerHTML = '';

    const pontosTotais = fichaData.pontos.pericias || 0;
    let pontosUsados = 0;

    periciasSelecionadas.forEach(item => {
        const pericia = periciasList.find(p => p.id === item.periciaId);
        if (!pericia) return;

        const key = item.armaId ? `${item.periciaId}_${item.armaId}` : item.periciaId;
        const pontos = periciasPontos[key] || 1;
        pontosUsados += pontos;

        let nomeExibicao = pericia.nome;
        if (item.armaNome) nomeExibicao = `Luta com ${item.armaNome}`;

        const categoriaIcon = {
            'Combate': '⚔️', 'Ofício': '🔧', 'Conhecimento': '🔬', 'Vontade': '🧠',
            'Simples': '⚪', 'Sociais': '💬'
        }[pericia.categoria] || '📋';

        const card = document.createElement('div');
        card.className = 'pericia-card-compact';
        card.dataset.key = key;

        card.innerHTML = `
            <div class="pericia-info-compact">
                <div class="pericia-icon-compact">${categoriaIcon}</div>
                <div>
                    <div class="pericia-nome-compact">${escapeHtml(nomeExibicao)}</div>
                    <div class="pericia-categoria-compact">${pericia.categoria}</div>
                </div>
            </div>
            <div class="pontos-control">
                <button class="btn-ponto danger" data-acao="-10">-10</button>
                <button class="btn-ponto" data-acao="-1">-1</button>
                <span class="valor-ponto">${pontos}</span>
                <button class="btn-ponto" data-acao="+1">+1</button>
                <button class="btn-ponto" data-acao="+10">+10</button>
            </div>
        `;

        const botoes = card.querySelectorAll('.btn-ponto');
        botoes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const acao = btn.dataset.acao;
                ajustarPontoPericia(key, acao);
            });
        });

        container.appendChild(card);
    });

    atualizarResumoPontosPericias();
}

function ajustarPontoPericia(key, acao) {
    let pontosAtuais = periciasPontos[key] || 1;
    let novoValor = pontosAtuais;

    if (acao === '+1') novoValor = Math.min(200, pontosAtuais + 1);
    else if (acao === '-1') novoValor = Math.max(1, pontosAtuais - 1);
    else if (acao === '+10') novoValor = Math.min(200, pontosAtuais + 10);
    else if (acao === '-10') novoValor = Math.max(1, pontosAtuais - 10);

    if (novoValor !== pontosAtuais) {
        const pontosTotais = fichaData.pontos.pericias || 0;
        const pontosUsadosAtuais = calcularTotalPontosUsados();
        const diferenca = novoValor - pontosAtuais;

        if (pontosUsadosAtuais + diferenca > pontosTotais) {
            alert(`⚠️ Você não tem pontos suficientes. Disponíveis: ${pontosTotais - pontosUsadosAtuais}`);
            return;
        }

        periciasPontos[key] = novoValor;

        const card = document.querySelector(`.pericia-card-compact[data-key="${key}"]`);
        if (card) {
            const valorSpan = card.querySelector('.valor-ponto');
            if (valorSpan) valorSpan.textContent = novoValor;
        }

        atualizarResumoPontosPericias();
    }
}

function atualizarResumoPontosPericias() {
    const pontosTotais = fichaData.pontos.pericias || 0;
    const pontosUsados = calcularTotalPontosUsados();
    const restantes = pontosTotais - pontosUsados;

    const disponiveisSpan = document.getElementById('pontos-pericias-disponiveis');
    const usadosSpan = document.getElementById('pontos-usados');
    const barraFill = document.getElementById('barra-pontos-fill');

    if (disponiveisSpan) disponiveisSpan.textContent = restantes;
    if (usadosSpan) usadosSpan.textContent = pontosUsados;
    if (barraFill) {
        const percent = pontosTotais > 0 ? (pontosUsados / pontosTotais) * 100 : 0;
        barraFill.style.width = Math.min(100, percent) + '%';
    }

    const pontosDisponiveisFase1 = document.getElementById('pontos-pericias');
    if (pontosDisponiveisFase1) pontosDisponiveisFase1.textContent = pontosTotais;

    const pontosUsadosFase1 = document.getElementById('pontos-usados-pericias');
    if (pontosUsadosFase1) pontosUsadosFase1.textContent = pontosUsados;

    const btnAvancarFase1 = document.querySelector('#fase1-pericias .btn-next-fase');
    if (btnAvancarFase1) {
        btnAvancarFase1.disabled = pontosUsados > pontosTotais;
        btnAvancarFase1.style.opacity = pontosUsados > pontosTotais ? '0.5' : '1';
    }

    const btnConfirmar = document.querySelector('#fase2-pericias .btn-next');
    if (btnConfirmar) {
        btnConfirmar.disabled = restantes < 0;
        btnConfirmar.style.opacity = restantes < 0 ? '0.5' : '1';
    }
}

function confirmarPericias() {
    const pontosTotais = fichaData.pontos.pericias || 0;
    const pontosUsados = calcularTotalPontosUsados();

    if (pontosUsados > pontosTotais) {
        alert(`⚠️ Você usou ${pontosUsados} pontos, mas tem apenas ${pontosTotais} disponíveis.`);
        return;
    }

    fichaData.pericias = periciasSelecionadas;

    alert(`✅ Perícias confirmadas! ${periciasSelecionadas.length} perícias selecionadas, ${pontosUsados} pontos usados.`);

    if (typeof nextStep === 'function') nextStep(6);
}

function calcularTotalPontosUsados() {
    let total = 0;
    for (const item of periciasSelecionadas) {
        const key = item.armaId ? `${item.periciaId}_${item.armaId}` : item.periciaId;
        total += periciasPontos[key] || 1;
    }
    return total;
}

// ============================================
// MODAL LUTA COM ARMAS
// ============================================

function carregarArmasLuta() {
    fetch('/api/armas-luta')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                armasList = data.armas;
                const select = document.getElementById('arma-select');
                if (select) {
                    select.innerHTML = '<option value="">-- Selecione --</option>';
                    armasList.forEach(arma => {
                        const option = document.createElement('option');
                        option.value = arma.id;
                        option.textContent = arma.nome;
                        select.appendChild(option);
                    });
                }
            }
        });
}

function abrirModalLutaCom(periciaId, callback) {
    lutaCallbackTemp = callback;
    carregarArmasLuta();
    const modal = document.getElementById('modal-luta-com');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function fecharModalLutaCom() {
    const modal = document.getElementById('modal-luta-com');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    document.getElementById('nova-arma').value = '';
    lutaCallbackTemp = null;
}

function selecionarArmaLuta(event) {
    event.preventDefault();
    const select = document.getElementById('arma-select');
    const armaId = select.value;
    if (!armaId) {
        alert('Selecione uma arma');
        return;
    }
    const arma = armasList.find(a => a.id == armaId);
    if (arma && lutaCallbackTemp) lutaCallbackTemp(arma.id, arma.nome);
    fecharModalLutaCom();
}

function criarNovaArmaLuta() {
    const input = document.getElementById('nova-arma');
    const nome = input.value.trim();
    if (!nome) {
        alert('Digite o nome da arma');
        return;
    }
    fetch('/api/armas-luta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(`✅ Arma "${nome}" criada`);
            carregarArmasLuta();
            setTimeout(() => {
                const select = document.getElementById('arma-select');
                if (select && result.arma_id) select.value = result.arma_id;
                document.getElementById('nova-arma').value = '';
            }, 300);
        }
    });
}

// Exportar funções globais
window.carregarPericias = carregarPericias;
window.avancarFasePericias = avancarFasePericias;
window.voltarFasePericias = voltarFasePericias;
window.confirmarPericias = confirmarPericias;
window.calcularTotalPontosUsados = calcularTotalPontosUsados;
window.abrirModalLutaCom = abrirModalLutaCom;
window.fecharModalLutaCom = fecharModalLutaCom;
window.selecionarArmaLuta = selecionarArmaLuta;
window.criarNovaArmaLuta = criarNovaArmaLuta;
window.carregarArmasLuta = carregarArmasLuta;