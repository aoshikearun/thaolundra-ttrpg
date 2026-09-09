/**
 * gerenciar.js - CRUD completo para gerenciamento de conteúdo
 */

(function() {
    if (window._gerenciarLoaded) return;
    window._gerenciarLoaded = true;

    // ============================================
    // DADOS
    // ============================================

    let especiesData = [];
    let periciasData = [];
    let tecnicasData = [];
    let fontesPoderAdminData = [];
    let itensData = [];
    let regioesData = [];

    let especieEditandoId = null;
    let periciaEditandoId = null;
    let tecnicaEditandoId = null;
    let fonteEditandoId = null;

    let tabAtual = 'especies';

    // ============================================
    // MAPEAMENTO DE FONTES
    // ============================================

    const FONTE_SLUG_MAP = {
        'Fogo': 'fire', 'Água': 'water', 'Vento': 'wind', 'Terra': 'earth',
        'Floresta': 'forest', 'Trovão': 'thunder', 'Luz': 'light', 'Trevas': 'dark',
        'Fumaça': 'smoke', 'Magma': 'magma', 'Miasma': 'miasma', 'Tufão': 'typhoon',
        'Tempestade': 'storm', 'Primal': 'primal', 'Cottage': 'cottage',
        'Candieiro': 'candieiro', 'Retiro': 'retiro', 'Lâmina': 'blade',
        'Alvorada': 'dawn', 'Crepúsculo': 'twilight', 'Trovoada Flamejante': 'flaming-thunder',
        'Cristal': 'crystal', 'Mercúrio': 'mercury', 'Cascata': 'cascade'
    };

    const FONTE_CLASS_MAP = {
        'Fogo': 'fonte-fogo', 'Água': 'fonte-agua', 'Vento': 'fonte-vento',
        'Terra': 'fonte-terra', 'Floresta': 'fonte-floresta', 'Trovão': 'fonte-trovao',
        'Luz': 'fonte-luz', 'Trevas': 'fonte-trevas', 'Fumaça': 'fonte-fumaca',
        'Magma': 'fonte-magma', 'Miasma': 'fonte-miasma', 'Tufão': 'fonte-tufao',
        'Tempestade': 'fonte-tempestade', 'Primal': 'fonte-primal',
        'Cottage': 'fonte-cottage', 'Candieiro': 'fonte-candieiro',
        'Retiro': 'fonte-retiro', 'Lâmina': 'fonte-lamina',
        'Alvorada': 'fonte-alvorada', 'Crepúsculo': 'fonte-crepusculo',
        'Trovoada Flamejante': 'fonte-trovoada-flamejante',
        'Cristal': 'fonte-cristal', 'Mercúrio': 'fonte-mercurio',
        'Cascata': 'fonte-cascata'
    };

    function getFonteSlug(nome) {
        if (!nome) return 'desconhecido';
        for (const [key, value] of Object.entries(FONTE_SLUG_MAP)) {
            if (nome.toLowerCase().includes(key.toLowerCase())) return value;
        }
        return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z]/g, '');
    }

    function getFonteClass(nome) {
        if (!nome) return '';
        for (const [key, value] of Object.entries(FONTE_CLASS_MAP)) {
            if (nome.toLowerCase().includes(key.toLowerCase())) return value;
        }
        return `fonte-${getFonteSlug(nome)}`;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // SWITCH TABS
    // ============================================

    window.switchTab = function(tabName) {
        tabAtual = tabName;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === `tab-${tabName}`);
        });

        switch(tabName) {
            case 'especies': if (especiesData.length === 0) carregarEspeciesG(); break;
            case 'pericias': if (periciasData.length === 0) carregarPericiasG(); break;
            case 'tecnicas': if (tecnicasData.length === 0) carregarTecnicasG(); break;
            case 'fontes': if (fontesPoderAdminData.length === 0) carregarFontesPoderAdmin(); break;
            case 'itens': if (itensData.length === 0) carregarItens(); break;
            case 'regioes': if (regioesData.length === 0) carregarRegioes(); break;
        }
    };

    // ============================================
    // ESPÉCIES
    // ============================================

    function carregarEspeciesG() {
        const container = document.getElementById('especies-list');
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Carregando espécies...</div>';

        fetch('/api/especies')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    especiesData = data.especies;
                    renderEspecies(especiesData);
                    const statsEl = document.getElementById('especies-stats');
                    if (statsEl) statsEl.textContent = `${data.total} espécies cadastradas`;
                } else {
                    container.innerHTML = `<div class="error">❌ ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                container.innerHTML = '<div class="error">❌ Erro ao carregar espécies</div>';
            });
    }

    function renderEspecies(especies) {
        const container = document.getElementById('especies-list');
        if (!container) return;
        const filtro = document.getElementById('filtro-especies')?.value.toLowerCase() || '';

        const filtradas = especies.filter(e => e.nome.toLowerCase().includes(filtro));

        if (filtradas.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma espécie encontrada</div>';
            return;
        }

        let html = '';
        filtradas.forEach(e => {
            html += `
                <div class="item-card">
                    <div class="card-glow"></div>
                    <div class="camada-conteudo">
                        <div class="item-header">
                            <h3>${escapeHtml(e.nome)}</h3>
                            <div class="item-meta">
                                <span class="meta-tag">Poder: ${e.minimo_poder}-${e.maximo_poder}</span>
                                ${e.advanced ? '<span class="meta-tag" style="color:#a29bfe;border-color:rgba(162,155,254,0.2);background:rgba(162,155,254,0.1);">⭐ Avançada</span>' : ''}
                            </div>
                        </div>
                        ${e.descricao ? `<div class="item-desc">${escapeHtml(e.descricao.substring(0, 200))}${e.descricao.length > 200 ? '...' : ''}</div>` : ''}
                        <div class="item-actions">
                            <button class="btn-edit" onclick="editarEspecie(${e.id})">✏️ Editar</button>
                            <button class="btn-delete" onclick="excluirEspecie(${e.id}, '${e.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    window.criarEspecie = function() {
        especieEditandoId = null;
        document.getElementById('modal-especie-title').textContent = '➕ Nova Espécie';
        document.getElementById('form-especie').reset();
        document.getElementById('modal-especie').style.display = 'flex';
        document.getElementById('modal-especie').classList.add('active');
    };

    window.salvarEspecie = function() {
        const nome = document.getElementById('especie-nome')?.value.trim();
        if (!nome) { alert('Nome é obrigatório'); return; }

        const data = {
            nome: nome,
            minimo_poder: parseInt(document.getElementById('especie-minimo_poder')?.value) || 0,
            maximo_poder: parseInt(document.getElementById('especie-maximo_poder')?.value) || 0,
            advanced: parseInt(document.getElementById('especie-advanced')?.value) || 0,
            descricao: document.getElementById('especie-descricao')?.value || '',
            especificidades_mecanicas: document.getElementById('especie-especificidades')?.value || ''
        };

        const url = especieEditandoId ? `/api/especies/${especieEditandoId}` : '/api/especies';
        const method = especieEditandoId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(especieEditandoId ? '✅ Espécie atualizada!' : '✅ Espécie criada!');
                fecharModalEspecie();
                carregarEspeciesG();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao salvar espécie');
        });
    };

    window.editarEspecie = function(id) {
        const e = especiesData.find(item => item.id == id);
        if (!e) return;

        especieEditandoId = id;
        document.getElementById('especie-nome').value = e.nome || '';
        document.getElementById('especie-minimo_poder').value = e.minimo_poder || 0;
        document.getElementById('especie-maximo_poder').value = e.maximo_poder || 0;
        document.getElementById('especie-advanced').value = e.advanced || 0;
        document.getElementById('especie-descricao').value = e.descricao || '';
        document.getElementById('especie-especificidades').value = e.especificidades_mecanicas || '';

        document.getElementById('modal-especie-title').textContent = `✏️ Editar Espécie: ${e.nome}`;
        document.getElementById('modal-especie').style.display = 'flex';
        document.getElementById('modal-especie').classList.add('active');
    };

    window.excluirEspecie = function(id, nome) {
        if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

        fetch(`/api/especies/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Espécie excluída!');
                    carregarEspeciesG();
                } else {
                    alert(`❌ Erro: ${result.message}`);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('❌ Erro ao excluir');
            });
    };

    window.fecharModalEspecie = function() {
        document.getElementById('modal-especie').style.display = 'none';
        document.getElementById('modal-especie').classList.remove('active');
    };

    // ============================================
    // PERÍCIAS
    // ============================================

    function carregarPericiasG() {
        const container = document.getElementById('pericias-list');
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Carregando perícias...</div>';

        fetch('/api/pericias')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    periciasData = data.pericias;
                    renderPericias(periciasData);
                    let stats = `${data.total} perícias cadastradas`;
                    if (data.categorias) {
                        data.categorias.forEach(c => { stats += ` | ${c.categoria}: ${c.total}`; });
                    }
                    document.getElementById('pericias-stats').textContent = stats;
                } else {
                    container.innerHTML = `<div class="error">❌ ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                container.innerHTML = '<div class="error">❌ Erro ao carregar perícias</div>';
            });
    }

    function renderPericias(pericias) {
        const container = document.getElementById('pericias-list');
        if (!container) return;
        const filtroNome = document.getElementById('filtro-pericias')?.value.toLowerCase() || '';
        const filtroCategoria = document.getElementById('filtro-categoria-pericia')?.value || '';

        const filtradas = pericias.filter(p =>
            p.nome.toLowerCase().includes(filtroNome) &&
            (!filtroCategoria || p.categoria === filtroCategoria)
        );

        if (filtradas.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma perícia encontrada</div>';
            return;
        }

        let html = '';
        filtradas.forEach(p => {
            const catClass = p.categoria.toLowerCase();
            const icon = { 'Combate': '⚔️', 'Conhecimento': '📖', 'Ofício': '🔧', 'Vontade': '🧠', 'Simples': '📌', 'Sociais': '💬' }[p.categoria] || '📌';
            html += `
                <div class="item-card">
                    <div class="card-glow"></div>
                    <div class="camada-conteudo">
                        <div class="item-header">
                            <h3>${icon} ${escapeHtml(p.nome)}</h3>
                            <div class="item-meta">
                                <span class="meta-tag ${catClass}">${p.categoria}</span>
                                ${p.especializacao ? '<span class="meta-tag" style="color:#f59e0b;border-color:rgba(245,158,11,0.2);background:rgba(245,158,11,0.1);">⭐ Especialização</span>' : ''}
                            </div>
                        </div>
                        ${p.descricao_geral ? `<div class="item-desc">${escapeHtml(p.descricao_geral)}</div>` : ''}
                        <div class="item-actions">
                            <button class="btn-edit" onclick="editarPericia(${p.id})">✏️ Editar</button>
                            <button class="btn-delete" onclick="excluirPericia(${p.id}, '${p.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    window.criarPericia = function() {
        periciaEditandoId = null;
        document.getElementById('modal-pericia').style.display = 'flex';
        document.getElementById('modal-pericia').classList.add('active');
        document.getElementById('form-pericia').reset();
    };

    window.salvarPericia = function() {
        const nome = document.getElementById('pericia-nome')?.value.trim();
        if (!nome) { alert('Nome é obrigatório'); return; }

        const data = {
            nome: nome,
            categoria: document.getElementById('pericia-categoria')?.value,
            especializacao: document.getElementById('pericia-especializacao')?.value === 'true',
            descricao_geral: document.getElementById('pericia-descricao')?.value || ''
        };

        const url = periciaEditandoId ? `/api/pericias/${periciaEditandoId}` : '/api/pericias';
        const method = periciaEditandoId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(periciaEditandoId ? '✅ Perícia atualizada!' : '✅ Perícia criada!');
                fecharModalPericia();
                carregarPericiasG();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao salvar');
        });
    };

    window.editarPericia = function(id) {
        const p = periciasData.find(item => item.id == id);
        if (!p) return;

        periciaEditandoId = id;
        document.getElementById('pericia-nome').value = p.nome || '';
        document.getElementById('pericia-categoria').value = p.categoria || '';
        document.getElementById('pericia-especializacao').value = p.especializacao ? 'true' : 'false';
        document.getElementById('pericia-descricao').value = p.descricao_geral || '';

        document.getElementById('modal-pericia').style.display = 'flex';
        document.getElementById('modal-pericia').classList.add('active');
    };

    window.excluirPericia = function(id, nome) {
        if (!confirm(`Excluir "${nome}"?`)) return;

        fetch(`/api/pericias/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Perícia excluída!');
                    carregarPericiasG();
                } else {
                    alert(`❌ Erro: ${result.message}`);
                }
            });
    };

    window.fecharModalPericia = function() {
        document.getElementById('modal-pericia').style.display = 'none';
        document.getElementById('modal-pericia').classList.remove('active');
    };

    // ============================================
    // TÉCNICAS
    // ============================================

    function carregarFontesParaSelectTecnica() {
        fetch('/api/fontes-poder')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = document.getElementById('tecnica-fonte');
                    if (select) {
                        select.innerHTML = '<option value="">Selecione uma fonte...</option>';
                        data.fontes.forEach(f => {
                            select.innerHTML += `<option value="${f.id}">${escapeHtml(f.nome_exibicao)}</option>`;
                        });
                    }
                }
            })
            .catch(error => console.error('Erro ao carregar fontes:', error));
    }

    function carregarTecnicasG() {
        const container = document.getElementById('tecnicas-list');
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Carregando técnicas...</div>';

        fetch('/api/tecnicas')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    tecnicasData = data.tecnicas;
                    renderTecnicas(tecnicasData);

                    let stats = `${data.total} técnicas cadastradas`;
                    if (data.categorias) {
                        data.categorias.forEach(c => { stats += ` | ${c.categoria}: ${c.total}`; });
                    }
                    document.getElementById('tecnicas-stats').textContent = stats;

                    const filtroFonte = document.getElementById('filtro-fonte-tecnica');
                    if (filtroFonte && data.fontes) {
                        let options = '<option value="">Todas fontes</option>';
                        data.fontes.forEach(f => {
                            options += `<option value="${escapeHtml(f.fonte)}">${escapeHtml(f.fonte)}</option>`;
                        });
                        filtroFonte.innerHTML = options;
                    }
                } else {
                    container.innerHTML = `<div class="error">❌ ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                container.innerHTML = '<div class="error">❌ Erro ao carregar técnicas</div>';
            });
    }

    function renderTecnicas(tecnicas) {
        const container = document.getElementById('tecnicas-list');
        if (!container) return;
        const filtroNome = document.getElementById('filtro-tecnicas')?.value.toLowerCase() || '';
        const filtroCategoria = document.getElementById('filtro-categoria-tecnica')?.value || '';
        const filtroFonte = document.getElementById('filtro-fonte-tecnica')?.value || '';

        const filtradas = tecnicas.filter(t =>
            t.nome.toLowerCase().includes(filtroNome) &&
            (!filtroCategoria || t.categoria === filtroCategoria) &&
            (!filtroFonte || t.fonte_nome === filtroFonte)
        );

        if (filtradas.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma técnica encontrada</div>';
            return;
        }

        let html = '';
        filtradas.forEach(t => {
            let fonteNome = t.fonte_nome || 'Desconhecida';
            if (t.fonte_de_poder_id) {
                const fonteEncontrada = fontesPoderAdminData.find(f => f.id === t.fonte_de_poder_id);
                if (fonteEncontrada) fonteNome = fonteEncontrada.nome_exibicao;
            }

            const fonteSlug = getFonteSlug(fonteNome);
            const symbolPath = `/static/imgs/symbols/${fonteSlug}-symbol.png`;
            const fonteClass = getFonteClass(fonteNome);

            const catClass = { 'Inata': 'inata', 'Básica': 'basica', 'Avançada': 'avancada', 'Última': 'ultima' }[t.categoria] || '';
            const catIcon = { 'Inata': '🧬', 'Básica': '📘', 'Avançada': '⚡', 'Última': '🌟' }[t.categoria] || '✨';
            const custoDisplay = t.custo || t.efetividade || '—';

            html += `
                <div class="item-card ${fonteClass}">
                    <div class="card-glow"></div>
                    <div class="camada-simbolo">
                        <img src="${symbolPath}" alt="${escapeHtml(fonteNome)}" onerror="this.style.display='none'">
                    </div>
                    <div class="camada-conteudo">
                        <div class="item-header">
                            <h3>${escapeHtml(t.nome)}</h3>
                            <div class="item-meta">
                                <span class="meta-tag ${catClass}">${t.categoria}</span>
                                <span class="meta-tag">${escapeHtml(fonteNome)}</span>
                                ${t.especializacao ? '<span class="meta-tag" style="color:#f59e0b;border-color:rgba(245,158,11,0.2);background:rgba(245,158,11,0.1);">⭐ Especialização</span>' : ''}
                            </div>
                        </div>
                        ${t.descricao_geral ? `<div class="item-desc">${escapeHtml(t.descricao_geral.substring(0, 150))}${t.descricao_geral.length > 150 ? '...' : ''}</div>` : ''}
                        <div class="item-efetividade">${catIcon} Custo: <strong>${custoDisplay}</strong> PE</div>
                        <div class="item-actions">
                            <button class="btn-edit" onclick="editarTecnica(${t.id})">✏️ Editar</button>
                            <button class="btn-delete" onclick="excluirTecnica(${t.id}, '${t.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    window.criarTecnica = function() {
        tecnicaEditandoId = null;
        document.getElementById('modal-tecnica').style.display = 'flex';
        document.getElementById('modal-tecnica').classList.add('active');
        document.getElementById('form-tecnica').reset();
        carregarFontesParaSelectTecnica();
    };

    window.salvarTecnica = function() {
        const nome = document.getElementById('tecnica-nome')?.value.trim();
        if (!nome) { alert('Nome é obrigatório'); return; }

        const data = {
            nome: nome,
            categoria: document.getElementById('tecnica-categoria')?.value,
            fonte_de_poder_id: parseInt(document.getElementById('tecnica-fonte')?.value) || 0,
            especializacao: document.getElementById('tecnica-especializacao')?.value === 'true',
            descricao_geral: document.getElementById('tecnica-descricao')?.value || '',
            efetividade: document.getElementById('tecnica-efetividade')?.value || '',
            custo: document.getElementById('tecnica-custo')?.value || ''
        };

        const url = tecnicaEditandoId ? `/api/tecnicas/${tecnicaEditandoId}` : '/api/tecnicas';
        const method = tecnicaEditandoId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(tecnicaEditandoId ? '✅ Técnica atualizada!' : '✅ Técnica criada!');
                fecharModalTecnica();
                carregarTecnicasG();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao salvar');
        });
    };

    window.editarTecnica = function(id) {
        const t = tecnicasData.find(item => item.id == id);
        if (!t) return;

        tecnicaEditandoId = id;
        document.getElementById('tecnica-nome').value = t.nome || '';
        document.getElementById('tecnica-categoria').value = t.categoria || '';
        document.getElementById('tecnica-fonte').value = t.fonte_de_poder_id || '';
        document.getElementById('tecnica-especializacao').value = t.especializacao ? 'true' : 'false';
        document.getElementById('tecnica-descricao').value = t.descricao_geral || '';
        document.getElementById('tecnica-efetividade').value = t.efetividade || '';
        document.getElementById('tecnica-custo').value = t.custo || '';

        document.getElementById('modal-tecnica').style.display = 'flex';
        document.getElementById('modal-tecnica').classList.add('active');
        carregarFontesParaSelectTecnica();
        document.getElementById('tecnica-fonte').value = t.fonte_de_poder_id || '';
    };

    window.excluirTecnica = function(id, nome) {
        if (!confirm(`Excluir "${nome}"?`)) return;

        fetch(`/api/tecnicas/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Técnica excluída!');
                    carregarTecnicasG();
                } else {
                    alert(`❌ Erro: ${result.message}`);
                }
            });
    };

    window.fecharModalTecnica = function() {
        document.getElementById('modal-tecnica').style.display = 'none';
        document.getElementById('modal-tecnica').classList.remove('active');
    };

    // ============================================
    // FONTES DE PODER
    // ============================================

    function carregarFontesPoderAdmin() {
        const container = document.getElementById('fontes-list');
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Carregando fontes...</div>';

        fetch('/api/fontes-poder')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fontesPoderAdminData = data.fontes;
                    renderFontesPoderAdmin(fontesPoderAdminData);
                    let stats = `${data.fontes.length} fontes de poder`;
                    const porCategoria = {};
                    data.fontes.forEach(f => porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + 1);
                    Object.keys(porCategoria).forEach(c => { stats += ` | ${c}: ${porCategoria[c]}`; });
                    document.getElementById('fontes-stats').textContent = stats;
                } else {
                    container.innerHTML = `<div class="error">❌ ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                container.innerHTML = '<div class="error">❌ Erro ao carregar fontes</div>';
            });
    }

    function renderFontesPoderAdmin(fontes) {
        const container = document.getElementById('fontes-list');
        if (!container) return;

        if (fontes.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma fonte encontrada</div>';
            return;
        }

        let html = '';
        fontes.forEach(f => {
            const catClass = f.categoria ? f.categoria.toLowerCase() : '';
            const fonteClass = getFonteClass(f.nome_exibicao);
            const fonteSlug = getFonteSlug(f.nome_exibicao);
            const symbolPath = `/static/imgs/symbols/${fonteSlug}-symbol.png`;

            html += `
                <div class="item-card ${fonteClass}">
                    <div class="card-glow"></div>
                    <div class="camada-simbolo">
                        <img src="${symbolPath}" alt="${escapeHtml(f.nome_exibicao || '')}" onerror="this.style.display='none'">
                    </div>
                    <div class="camada-conteudo">
                        <div class="item-header">
                            <h3>${escapeHtml(f.nome_exibicao)}</h3>
                            <div class="item-meta">
                                <span class="meta-tag ${catClass}">${f.categoria}</span>
                                ${f.hybrid === 1 ? '<span class="meta-tag" style="color:#ffd700;border-color:rgba(255,215,0,0.2);background:rgba(255,215,0,0.1);">Híbrida</span>' : ''}
                            </div>
                        </div>
                        ${f.descricao_curta ? `<div class="item-desc">${escapeHtml(f.descricao_curta)}</div>` : ''}
                        <div class="item-actions">
                            <button class="btn-edit" onclick="editarFontePoderAdmin(${f.id})">✏️ Editar</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    window.criarFontePoder = function() {
        alert('Funcionalidade de criação de fonte em desenvolvimento.');
    };

    window.editarFontePoderAdmin = function(id) {
        const f = fontesPoderAdminData.find(item => item.id == id);
        if (!f) return;

        fonteEditandoId = id;
        document.getElementById('edit-fonte-nome').value = f.nome_exibicao || '';
        document.getElementById('edit-fonte-categoria').value = f.categoria || 'Natural';
        document.getElementById('edit-fonte-hybrid').value = f.hybrid || 0;
        document.getElementById('edit-fonte-descricao').value = f.descricao_curta || '';
        document.getElementById('edit-fonte-componentes').value = f.fontes_componentes || '';
        document.getElementById('edit-fonte-simbolo').value = f.simbolo_marca_url || '';

        document.getElementById('modal-fonte').style.display = 'flex';
        document.getElementById('modal-fonte').classList.add('active');
    };

    window.atualizarFontePoder = function() {
        const data = {
            nome_exibicao: document.getElementById('edit-fonte-nome')?.value,
            categoria: document.getElementById('edit-fonte-categoria')?.value,
            hybrid: parseInt(document.getElementById('edit-fonte-hybrid')?.value) || 0,
            descricao_curta: document.getElementById('edit-fonte-descricao')?.value || '',
            fontes_componentes: document.getElementById('edit-fonte-componentes')?.value || '',
            simbolo_marca_url: document.getElementById('edit-fonte-simbolo')?.value || ''
        };

        fetch(`/api/fontes-poder/${fonteEditandoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('✅ Fonte atualizada!');
                fecharModalFonte();
                carregarFontesPoderAdmin();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao atualizar fonte');
        });
    };

    window.fecharModalFonte = function() {
        document.getElementById('modal-fonte').style.display = 'none';
        document.getElementById('modal-fonte').classList.remove('active');
    };

    // ============================================
    // ITENS (placeholder)
    // ============================================

    function carregarItens() {
        const container = document.getElementById('itens-list');
        if (!container) return;
        container.innerHTML = `
            <div class="empty">
                <i class="fas fa-construction" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                <p>Gerenciamento de itens em desenvolvimento</p>
                <p style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">Em breve você poderá criar e gerenciar todos os itens do sistema</p>
            </div>
        `;
        document.getElementById('itens-stats').textContent = 'Em desenvolvimento';
    }

    window.criarItem = function() { alert('Funcionalidade em desenvolvimento'); };

    // ============================================
    // REGIÕES (placeholder)
    // ============================================

    function carregarRegioes() {
        const container = document.getElementById('regioes-list');
        if (!container) return;
        container.innerHTML = `
            <div class="empty">
                <i class="fas fa-construction" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                <p>Gerenciamento de regiões em desenvolvimento</p>
                <p style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">Em breve você poderá criar e gerenciar todas as regiões do mundo</p>
            </div>
        `;
        document.getElementById('regioes-stats').textContent = 'Em desenvolvimento';
    }

    window.criarRegiao = function() { alert('Funcionalidade em desenvolvimento'); };

    // ============================================
    // FILTROS AO VIVO
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('filtro-especies')?.addEventListener('input', () => renderEspecies(especiesData));
        document.getElementById('filtro-pericias')?.addEventListener('input', () => renderPericias(periciasData));
        document.getElementById('filtro-categoria-pericia')?.addEventListener('change', () => renderPericias(periciasData));
        document.getElementById('filtro-tecnicas')?.addEventListener('input', () => renderTecnicas(tecnicasData));
        document.getElementById('filtro-categoria-tecnica')?.addEventListener('change', () => renderTecnicas(tecnicasData));
        document.getElementById('filtro-fonte-tecnica')?.addEventListener('change', () => renderTecnicas(tecnicasData));

        carregarEspeciesG();
    });

    // ============================================
    // EXPORT
    // ============================================

    window.carregarEspeciesG = carregarEspeciesG;
    window.carregarPericiasG = carregarPericiasG;
    window.carregarTecnicasG = carregarTecnicasG;
    window.carregarFontesPoderAdmin = carregarFontesPoderAdmin;
    window.carregarItens = carregarItens;
    window.carregarRegioes = carregarRegioes;

    console.log('📚 Gerenciar.js carregado com sucesso!');
})();