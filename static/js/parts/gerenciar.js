/**
 * gerenciar.js - CRUD para gerenciamento de conteúdo
 */

let especiesData = [];
let periciasData = [];
let tecnicasData = [];
let fontesData = [];

// ============================================
// INICIALIZAÇÃO
// ============================================

function initGerenciamento() {
    console.log('🔧 Gerenciamento de conteúdo iniciado');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    carregarEspecies();
    carregarFontesPoder();
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');

        switch(tabName) {
            case 'especies':
                if (especiesData.length === 0) carregarEspecies();
                break;
            case 'pericias':
                if (periciasData.length === 0) carregarPericias();
                break;
            case 'tecnicas':
                if (tecnicasData.length === 0) carregarTecnicas();
                break;
            case 'fontes':
                if (fontesData.length === 0) carregarFontesPoder();
                break;
        }
    }
}

// ============================================
// ESPÉCIES
// ============================================

function carregarEspecies() {
    const container = document.getElementById('especies-list');
    container.innerHTML = '<div class="loading">Carregando espécies...</div>';

    fetch('/api/especies')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                especiesData = data.especies;
                renderEspecies(especiesData);
                document.getElementById('especies-stats').textContent =
                    `${data.total} espécies cadastradas`;
            } else {
                container.innerHTML = `<div class="error">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">Erro ao carregar espécies</div>';
        });
}

function renderEspecies(especies) {
    const container = document.getElementById('especies-list');
    const filtro = document.getElementById('filtro-especies')?.value.toLowerCase() || '';

    const especiesFiltradas = especies.filter(esp =>
        esp.nome.toLowerCase().includes(filtro)
    );

    if (especiesFiltradas.length === 0) {
        container.innerHTML = '<div class="empty">Nenhuma espécie encontrada</div>';
        return;
    }

    let html = '';

    especiesFiltradas.forEach(esp => {
        html += `
            <div class="item-card" data-id="${esp.id}">
                <div class="item-header">
                    <h3>${esp.nome}</h3>
                    <div class="item-meta">
                        <span class="meta-tag">Poder: ${esp.minimo_poder}-${esp.maximo_poder}</span>
                    </div>
                </div>
                ${esp.descricao ? `<div class="item-desc">${esp.descricao.substring(0, 200)}...</div>` : ''}
                ${esp.especificidades_mecanicas ? `<div class="item-efetividade">${esp.especificidades_mecanicas.substring(0, 300)}...</div>` : ''}
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editarEspecie(${esp.id})">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirEspecie(${esp.id}, '${esp.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function criarEspecie() {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>➕ Nova Espécie</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-especie" onsubmit="salvarEspecie(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="especie-nome">Nome *</label>
                            <input type="text" id="especie-nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="especie-minimo_poder">Poder Mínimo *</label>
                            <input type="number" id="especie-minimo_poder" name="minimo_poder" required>
                        </div>
                        <div class="form-group">
                            <label for="especie-maximo_poder">Poder Máximo *</label>
                            <input type="number" id="especie-maximo_poder" name="maximo_poder" required>
                        </div>
                        <div class="form-group">
                            <label for="especie-advanced">Raça Avançada</label>
                            <select id="especie-advanced" name="advanced">
                                <option value="0">Não</option>
                                <option value="1">Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="especie-descricao">Descrição</label>
                            <textarea id="especie-descricao" name="descricao" rows="4"></textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="especie-especificidades">Especificidades Mecânicas</label>
                            <textarea id="especie-especificidades" name="especificidades_mecanicas" rows="6"></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Espécie</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function salvarEspecie(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.advanced = parseInt(data.advanced);
    data.minimo_poder = parseInt(data.minimo_poder);
    data.maximo_poder = parseInt(data.maximo_poder);

    fetch('/api/especies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Espécie criada com sucesso!');
            fecharModal();
            carregarEspecies();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar espécie');
    });
}

function editarEspecie(especieId) {
    fetch(`/api/especies/${especieId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                abrirModalEdicaoEspecie(data.especie);
            } else {
                alert(`❌ ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao carregar espécie');
        });
}

function abrirModalEdicaoEspecie(especie) {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>✏️ Editar Espécie: ${especie.nome}</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-especie-edit" onsubmit="atualizarEspecie(event, ${especie.id})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-nome">Nome *</label>
                            <input type="text" id="edit-nome" name="nome" value="${especie.nome || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-minimo_poder">Poder Mínimo *</label>
                            <input type="number" id="edit-minimo_poder" name="minimo_poder" value="${especie.minimo_poder || 0}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-maximo_poder">Poder Máximo *</label>
                            <input type="number" id="edit-maximo_poder" name="maximo_poder" value="${especie.maximo_poder || 0}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-advanced">Raça Avançada</label>
                            <select id="edit-advanced" name="advanced">
                                <option value="0" ${especie.advanced === 0 ? 'selected' : ''}>Não</option>
                                <option value="1" ${especie.advanced === 1 ? 'selected' : ''}>Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-descricao">Descrição</label>
                            <textarea id="edit-descricao" name="descricao" rows="4">${especie.descricao || ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-especificidades">Especificidades Mecânicas</label>
                            <textarea id="edit-especificidades" name="especificidades_mecanicas" rows="6">${especie.especificidades_mecanicas || ''}</textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Atualizar Espécie</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function atualizarEspecie(event, especieId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.advanced = parseInt(data.advanced);
    data.minimo_poder = parseInt(data.minimo_poder);
    data.maximo_poder = parseInt(data.maximo_poder);

    fetch(`/api/especies/${especieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Espécie atualizada com sucesso!');
            fecharModal();
            carregarEspecies();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao atualizar espécie');
    });
}

function excluirEspecie(especieId, nome) {
    if (!confirm(`Tem certeza que deseja excluir a espécie "${nome}"?`)) {
        return;
    }

    fetch(`/api/especies/${especieId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Espécie excluída com sucesso!');
            carregarEspecies();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir espécie');
    });
}

// ============================================
// PERÍCIAS
// ============================================

function carregarPericias() {
    const container = document.getElementById('pericias-list');
    container.innerHTML = '<div class="loading">Carregando perícias...</div>';

    fetch('/api/pericias')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                periciasData = data.pericias;
                renderPericias(periciasData);

                let stats = `${data.total} perícias cadastradas | `;
                data.categorias.forEach((cat, index) => {
                    stats += `${cat.categoria}: ${cat.total}`;
                    if (index < data.categorias.length - 1) stats += ' | ';
                });

                document.getElementById('pericias-stats').textContent = stats;
            } else {
                container.innerHTML = `<div class="error">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">Erro ao carregar perícias</div>';
        });
}

function renderPericias(pericias) {
    const container = document.getElementById('pericias-list');
    const filtroNome = document.getElementById('filtro-pericias')?.value.toLowerCase() || '';
    const filtroCategoria = document.getElementById('filtro-categoria-pericia')?.value || '';

    const periciasFiltradas = pericias.filter(per =>
        per.nome.toLowerCase().includes(filtroNome) &&
        (!filtroCategoria || per.categoria === filtroCategoria)
    );

    if (periciasFiltradas.length === 0) {
        container.innerHTML = '<div class="empty">Nenhuma perícia encontrada</div>';
        return;
    }

    let html = '';

    periciasFiltradas.forEach(per => {
        html += `
            <div class="item-card" data-id="${per.id}">
                <div class="item-header">
                    <h3>${per.nome}</h3>
                    <div class="item-meta">
                        <span class="meta-tag ${per.categoria.toLowerCase()}">${per.categoria}</span>
                        ${per.especializacao ? '<span class="meta-tag" style="background: rgba(251,191,36,0.2); color: #fde68a;">Especialização</span>' : ''}
                    </div>
                </div>
                ${per.descricao_geral ? `<div class="item-desc">${per.descricao_geral}</div>` : ''}
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editarPericia(${per.id})">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirPericia(${per.id}, '${per.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function criarPericia() {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>➕ Nova Perícia</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-pericia" onsubmit="salvarPericia(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="pericia-nome">Nome *</label>
                            <input type="text" id="pericia-nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="pericia-categoria">Categoria *</label>
                            <select id="pericia-categoria" name="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="Simples">Simples</option>
                                <option value="Sociais">Sociais</option>
                                <option value="Combate">Combate</option>
                                <option value="Conhecimento">Conhecimento</option>
                                <option value="Ofício">Ofício</option>
                                <option value="Vontade">Vontade</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="pericia-especializacao">É especialização?</label>
                            <select id="pericia-especializacao" name="especializacao">
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="pericia-descricao">Descrição *</label>
                            <textarea id="pericia-descricao" name="descricao_geral" rows="6" required></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Perícia</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function salvarPericia(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.especializacao = data.especializacao === 'true';

    fetch('/api/pericias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Perícia criada com sucesso!');
            fecharModal();
            carregarPericias();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar perícia');
    });
}

function editarPericia(periciaId) {
    fetch('/api/pericias')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const pericia = data.pericias.find(p => p.id == periciaId);
                if (pericia) {
                    abrirModalEdicaoPericia(pericia);
                } else {
                    alert('Perícia não encontrada');
                }
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar perícia');
        });
}

function abrirModalEdicaoPericia(pericia) {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>✏️ Editar Perícia: ${pericia.nome}</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-pericia-edit" onsubmit="atualizarPericia(event, ${pericia.id})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-pericia-nome">Nome *</label>
                            <input type="text" id="edit-pericia-nome" name="nome" value="${pericia.nome || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-pericia-categoria">Categoria *</label>
                            <select id="edit-pericia-categoria" name="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="Simples" ${pericia.categoria === 'Simples' ? 'selected' : ''}>Simples</option>
                                <option value="Sociais" ${pericia.categoria === 'Sociais' ? 'selected' : ''}>Sociais</option>
                                <option value="Combate" ${pericia.categoria === 'Combate' ? 'selected' : ''}>Combate</option>
                                <option value="Conhecimento" ${pericia.categoria === 'Conhecimento' ? 'selected' : ''}>Conhecimento</option>
                                <option value="Ofício" ${pericia.categoria === 'Ofício' ? 'selected' : ''}>Ofício</option>
                                <option value="Vontade" ${pericia.categoria === 'Vontade' ? 'selected' : ''}>Vontade</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-pericia-especializacao">É especialização?</label>
                            <select id="edit-pericia-especializacao" name="especializacao">
                                <option value="false" ${!pericia.especializacao ? 'selected' : ''}>Não</option>
                                <option value="true" ${pericia.especializacao ? 'selected' : ''}>Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-pericia-descricao">Descrição</label>
                            <textarea id="edit-pericia-descricao" name="descricao_geral" rows="6">${pericia.descricao_geral || ''}</textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Atualizar Perícia</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function atualizarPericia(event, periciaId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.especializacao = data.especializacao === 'true';

    fetch(`/api/pericias/${periciaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Perícia atualizada com sucesso!');
            fecharModal();
            carregarPericias();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao atualizar perícia');
    });
}

function excluirPericia(periciaId, nome) {
    if (!confirm(`Tem certeza que deseja excluir a perícia "${nome}"?`)) {
        return;
    }

    fetch(`/api/pericias/${periciaId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Perícia excluída com sucesso!');
            carregarPericias();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir perícia');
    });
}

// ============================================
// TÉCNICAS
// ============================================

function carregarTecnicas() {
    const container = document.getElementById('tecnicas-list');
    container.innerHTML = '<div class="loading">Carregando técnicas...</div>';

    fetch('/api/tecnicas')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tecnicasData = data.tecnicas;
                renderTecnicas(tecnicasData);

                let stats = `${data.total} técnicas cadastradas | `;
                data.categorias.forEach((cat, index) => {
                    stats += `${cat.categoria}: ${cat.total}`;
                    if (index < data.categorias.length - 1) stats += ' | ';
                });

                document.getElementById('tecnicas-stats').textContent = stats;

                const filtroFonte = document.getElementById('filtro-fonte-tecnica');
                if (filtroFonte && data.fontes) {
                    let options = '<option value="">Todas fontes</option>';
                    data.fontes.forEach(fonte => {
                        options += `<option value="${fonte.fonte}">${fonte.fonte}</option>`;
                    });
                    filtroFonte.innerHTML = options;
                }
            } else {
                container.innerHTML = `<div class="error">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">Erro ao carregar técnicas</div>';
        });
}

function renderTecnicas(tecnicas) {
    const container = document.getElementById('tecnicas-list');
    const filtroNome = document.getElementById('filtro-tecnicas')?.value.toLowerCase() || '';
    const filtroCategoria = document.getElementById('filtro-categoria-tecnica')?.value || '';
    const filtroFonte = document.getElementById('filtro-fonte-tecnica')?.value || '';

    const tecnicasFiltradas = tecnicas.filter(tec =>
        tec.nome.toLowerCase().includes(filtroNome) &&
        (!filtroCategoria || tec.categoria === filtroCategoria) &&
        (!filtroFonte || tec.fonte_nome === filtroFonte)
    );

    if (tecnicasFiltradas.length === 0) {
        container.innerHTML = '<div class="empty">Nenhuma técnica encontrada</div>';
        return;
    }

    let html = '';

    tecnicasFiltradas.forEach(tec => {
        const categoriaClass = {
            'Inata': 'natural',
            'Básica': 'artificial',
            'Avançada': 'divina',
            'Última': 'mecanica'
        }[tec.categoria] || 'natural';

        html += `
            <div class="item-card" data-id="${tec.id}">
                <div class="item-header">
                    <h3>${tec.nome}</h3>
                    <div class="item-meta">
                        <span class="meta-tag ${categoriaClass}">${tec.categoria}</span>
                        <span class="meta-tag ${tec.fonte_categoria ? tec.fonte_categoria.toLowerCase() : ''}">${tec.fonte_nome}</span>
                        ${tec.especializacao ? '<span class="meta-tag" style="background: rgba(251,191,36,0.2); color: #fde68a;">Especialização</span>' : ''}
                    </div>
                </div>
                ${tec.descricao_geral ? `<div class="item-desc">${tec.descricao_geral.substring(0, 150)}...</div>` : ''}
                ${tec.efetividade ? `<div class="item-efetividade">${tec.efetividade.substring(0, 200)}...</div>` : ''}
                ${tec.custo ? `<div class="item-meta"><span class="meta-tag">Custo: ${tec.custo}</span></div>` : ''}
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editarTecnica(${tec.id})">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirTecnica(${tec.id}, '${tec.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function criarTecnica() {
    fetch('/api/fontes-poder')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                abrirModalCriacaoTecnica(data.fontes);
            } else {
                alert('Erro ao carregar fontes de poder');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar fontes de poder');
        });
}

function abrirModalCriacaoTecnica(fontes) {
    let fontesOptions = '<option value="">Selecione uma fonte de poder...</option>';
    fontes.forEach(fonte => {
        fontesOptions += `<option value="${fonte.id}">${fonte.nome_exibicao} (${fonte.categoria})</option>`;
    });

    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>➕ Nova Técnica</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-tecnica" onsubmit="salvarTecnica(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="tecnica-nome">Nome *</label>
                            <input type="text" id="tecnica-nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="tecnica-categoria">Categoria *</label>
                            <select id="tecnica-categoria" name="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="Inata">Inata</option>
                                <option value="Básica">Básica</option>
                                <option value="Avançada">Avançada</option>
                                <option value="Última">Última</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tecnica-fonte">Fonte de Poder *</label>
                            <select id="tecnica-fonte" name="fonte_de_poder_id" required>
                                ${fontesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tecnica-especializacao">É especialização?</label>
                            <select id="tecnica-especializacao" name="especializacao">
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="tecnica-descricao">Descrição *</label>
                            <textarea id="tecnica-descricao" name="descricao_geral" rows="6" required></textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="tecnica-efetividade">Efetividade (Tabela de pontuação)</label>
                            <textarea id="tecnica-efetividade" name="efetividade" rows="6" placeholder="Exemplo:\n1~50: efeito leve\n51~100: efeito moderado\n101~: efeito forte"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="tecnica-custo">Custo</label>
                            <input type="text" id="tecnica-custo" name="custo" placeholder="Ex: PE: 10 por turno">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Técnica</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function salvarTecnica(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.fonte_de_poder_id = parseInt(data.fonte_de_poder_id);
    data.especializacao = data.especializacao === 'true';

    fetch('/api/tecnicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Técnica criada com sucesso!');
            fecharModal();
            carregarTecnicas();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar técnica');
    });
}

function editarTecnica(tecnicaId) {
    fetch('/api/tecnicas')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tecnica = data.tecnicas.find(t => t.id == tecnicaId);
                if (tecnica) {
                    carregarFontesParaEdicaoTecnica(tecnica);
                }
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar técnica');
        });
}

function carregarFontesParaEdicaoTecnica(tecnica) {
    fetch('/api/fontes-poder')
        .then(response => response.json())
        .then(fontesData => {
            if (fontesData.success) {
                abrirModalEdicaoTecnica(tecnica, fontesData.fontes);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar fontes');
        });
}

function abrirModalEdicaoTecnica(tecnica, fontes) {
    let fontesOptions = '';
    fontes.forEach(fonte => {
        const selected = fonte.id == tecnica.fonte_de_poder_id ? 'selected' : '';
        fontesOptions += `<option value="${fonte.id}" ${selected}>${fonte.nome_exibicao} (${fonte.categoria})</option>`;
    });

    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>✏️ Editar Técnica: ${tecnica.nome}</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-tecnica-edit" onsubmit="atualizarTecnica(event, ${tecnica.id})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-tecnica-nome">Nome *</label>
                            <input type="text" id="edit-tecnica-nome" name="nome" value="${tecnica.nome || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-tecnica-categoria">Categoria *</label>
                            <select id="edit-tecnica-categoria" name="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="Inata" ${tecnica.categoria === 'Inata' ? 'selected' : ''}>Inata</option>
                                <option value="Básica" ${tecnica.categoria === 'Básica' ? 'selected' : ''}>Básica</option>
                                <option value="Avançada" ${tecnica.categoria === 'Avançada' ? 'selected' : ''}>Avançada</option>
                                <option value="Última" ${tecnica.categoria === 'Última' ? 'selected' : ''}>Última</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-tecnica-fonte">Fonte de Poder *</label>
                            <select id="edit-tecnica-fonte" name="fonte_de_poder_id" required>
                                ${fontesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-tecnica-especializacao">É especialização?</label>
                            <select id="edit-tecnica-especializacao" name="especializacao">
                                <option value="false" ${!tecnica.especializacao ? 'selected' : ''}>Não</option>
                                <option value="true" ${tecnica.especializacao ? 'selected' : ''}>Sim</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-tecnica-descricao">Descrição *</label>
                            <textarea id="edit-tecnica-descricao" name="descricao_geral" rows="6" required>${tecnica.descricao_geral || ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-tecnica-efetividade">Efetividade</label>
                            <textarea id="edit-tecnica-efetividade" name="efetividade" rows="6">${tecnica.efetividade || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-tecnica-custo">Custo</label>
                            <input type="text" id="edit-tecnica-custo" name="custo" value="${tecnica.custo || ''}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Atualizar Técnica</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function atualizarTecnica(event, tecnicaId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.fonte_de_poder_id = parseInt(data.fonte_de_poder_id);
    data.especializacao = data.especializacao === 'true';

    fetch(`/api/tecnicas/${tecnicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Técnica atualizada com sucesso!');
            fecharModal();
            carregarTecnicas();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao atualizar técnica');
    });
}

function excluirTecnica(tecnicaId, nome) {
    if (!confirm(`Tem certeza que deseja excluir a técnica "${nome}"?`)) {
        return;
    }

    fetch(`/api/tecnicas/${tecnicaId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Técnica excluída com sucesso!');
            carregarTecnicas();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir técnica');
    });
}

// ============================================
// FONTES DE PODER
// ============================================

function carregarFontesPoder() {
    const container = document.getElementById('fontes-list');
    container.innerHTML = '<div class="loading">Carregando fontes de poder...</div>';

    fetch('/api/fontes-poder')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fontesData = data.fontes;
                renderFontesPoder(fontesData);

                const total = data.fontes.length;
                const porCategoria = {};

                data.fontes.forEach(fonte => {
                    porCategoria[fonte.categoria] = (porCategoria[fonte.categoria] || 0) + 1;
                });

                let stats = `${total} fontes de poder | `;
                Object.keys(porCategoria).forEach((cat, index) => {
                    stats += `${cat}: ${porCategoria[cat]}`;
                    if (index < Object.keys(porCategoria).length - 1) stats += ' | ';
                });

                document.getElementById('fontes-stats').textContent = stats;
            } else {
                container.innerHTML = `<div class="error">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">Erro ao carregar fontes de poder</div>';
        });
}

function renderFontesPoder(fontes) {
    const container = document.getElementById('fontes-list');

    if (fontes.length === 0) {
        container.innerHTML = '<div class="empty">Nenhuma fonte de poder encontrada</div>';
        return;
    }

    let html = '';

    fontes.forEach(fonte => {
        html += `
            <div class="item-card">
                <div class="item-header">
                    <h3>${fonte.nome_exibicao}</h3>
                    <div class="item-meta">
                        <span class="meta-tag ${fonte.categoria.toLowerCase()}">${fonte.categoria}</span>
                        ${fonte.hybrid === 1 ? '<span class="meta-tag" style="background: rgba(255,215,0,0.2); color: #ffd700;">Híbrida</span>' : ''}
                    </div>
                </div>
                ${fonte.descricao_curta ? `<div class="item-desc">${fonte.descricao_curta}</div>` : ''}
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editarFontePoder(${fonte.id})">✏️ Editar</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editarFontePoder(fonteId) {
    const fonte = fontesData.find(f => f.id == fonteId);
    if (fonte) {
        abrirModalEdicaoFontePoder(fonte);
    }
}

function abrirModalEdicaoFontePoder(fonte) {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>✏️ Editar Fonte: ${fonte.nome_exibicao}</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-content">
                <form id="form-fonte-edit" onsubmit="atualizarFontePoder(event, ${fonte.id})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-fonte-nome">Nome *</label>
                            <input type="text" id="edit-fonte-nome" name="nome_exibicao" value="${fonte.nome_exibicao || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-fonte-categoria">Categoria *</label>
                            <select id="edit-fonte-categoria" name="categoria" required>
                                <option value="Natural" ${fonte.categoria === 'Natural' ? 'selected' : ''}>Natural</option>
                                <option value="Artificial" ${fonte.categoria === 'Artificial' ? 'selected' : ''}>Artificial</option>
                                <option value="Divina" ${fonte.categoria === 'Divina' ? 'selected' : ''}>Divina</option>
                                <option value="Mecânica" ${fonte.categoria === 'Mecânica' ? 'selected' : ''}>Mecânica</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-fonte-hybrid">Tipo</label>
                            <select id="edit-fonte-hybrid" name="hybrid">
                                <option value="0" ${fonte.hybrid === 0 ? 'selected' : ''}>Pura</option>
                                <option value="1" ${fonte.hybrid === 1 ? 'selected' : ''}>Híbrida</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-fonte-descricao">Descrição Curta</label>
                            <textarea id="edit-fonte-descricao" name="descricao_curta" rows="3">${fonte.descricao_curta || ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-fonte-componentes">Fontes Componentes (para híbridas)</label>
                            <input type="text" id="edit-fonte-componentes" name="fontes_componentes" value="${fonte.fontes_componentes || ''}" placeholder="Ex: [1, 2, 3]">
                        </div>
                        <div class="form-group">
                            <label for="edit-fonte-simbolo">URL do Símbolo</label>
                            <input type="text" id="edit-fonte-simbolo" name="simbolo_marca_url" value="${fonte.simbolo_marca_url || ''}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Atualizar Fonte</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    document.getElementById('modal-container').classList.add('active');
}

function atualizarFontePoder(event, fonteId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.hybrid = parseInt(data.hybrid);

    fetch(`/api/fontes-poder/${fonteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Fonte de poder atualizada com sucesso!');
            fecharModal();
            carregarFontesPoder();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao atualizar fonte de poder');
    });
}

function criarFontePoder() {
    alert('Funcionalidade de criação de fonte de poder em desenvolvimento.');
}

// ============================================
// UTILITÁRIOS
// ============================================

function fecharModal() {
    document.getElementById('modal-container').classList.remove('active');
    document.getElementById('modal-container').innerHTML = '';
}

// Filtros em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const filtroEspecies = document.getElementById('filtro-especies');
    if (filtroEspecies) {
        filtroEspecies.addEventListener('keyup', function() {
            renderEspecies(especiesData);
        });
    }

    const filtroPericias = document.getElementById('filtro-pericias');
    const filtroCategoriaPericia = document.getElementById('filtro-categoria-pericia');

    if (filtroPericias) {
        filtroPericias.addEventListener('keyup', function() {
            renderPericias(periciasData);
        });
    }

    if (filtroCategoriaPericia) {
        filtroCategoriaPericia.addEventListener('change', function() {
            renderPericias(periciasData);
        });
    }

    const filtroTecnicas = document.getElementById('filtro-tecnicas');
    const filtroCategoriaTecnica = document.getElementById('filtro-categoria-tecnica');
    const filtroFonteTecnica = document.getElementById('filtro-fonte-tecnica');

    if (filtroTecnicas) {
        filtroTecnicas.addEventListener('keyup', function() {
            renderTecnicas(tecnicasData);
        });
    }

    if (filtroCategoriaTecnica) {
        filtroCategoriaTecnica.addEventListener('change', function() {
            renderTecnicas(tecnicasData);
        });
    }

    if (filtroFonteTecnica) {
        filtroFonteTecnica.addEventListener('change', function() {
            renderTecnicas(tecnicasData);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initGerenciamento();
});

window.initGerenciamento = initGerenciamento;
window.criarEspecie = criarEspecie;
window.editarEspecie = editarEspecie;
window.excluirEspecie = excluirEspecie;
window.carregarEspecies = carregarEspecies;
window.criarPericia = criarPericia;
window.editarPericia = editarPericia;
window.excluirPericia = excluirPericia;
window.carregarPericias = carregarPericias;
window.criarTecnica = criarTecnica;
window.editarTecnica = editarTecnica;
window.excluirTecnica = excluirTecnica;
window.carregarTecnicas = carregarTecnicas;
window.criarFontePoder = criarFontePoder;
window.editarFontePoder = editarFontePoder;
window.carregarFontesPoder = carregarFontesPoder;
window.fecharModal = fecharModal;