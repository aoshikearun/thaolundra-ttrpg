/**
 * editor_ficha.js - Editor de Ficha completo
 */

(function() {
    if (window._editorFichaLoaded) return;
    window._editorFichaLoaded = true;

    // ============================================
    // CORES DAS FONTES
    // ============================================

    const FONTES_CORES = {
        'fogo': { color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)',
            gradiente: false },
        'agua': { color: '#4dabf7', bg: 'rgba(77,171,247,0.15)', border: 'rgba(77,171,247,0.3)',
            gradiente: false },
        'vento': { color: '#ff85c8', bg: 'rgba(255,133,200,0.15)', border: 'rgba(255,133,200,0.3)',
            gradiente: false },
        'terra': { color: '#ff9c00', bg: 'rgba(255,156,0,0.15)', border: 'rgba(255,156,0,0.3)',
            gradiente: false },
        'floresta': { color: '#51cf66', bg: 'rgba(81,207,102,0.15)', border: 'rgba(81,207,102,0.3)',
            gradiente: false },
        'trovao': { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)',
            gradiente: false },
        'luz': { color: '#ffffff', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)',
            gradiente: false },
        'trevas': { color: '#845ef7', bg: 'rgba(132,94,247,0.15)', border: 'rgba(132,94,247,0.3)',
            gradiente: false },
        'hibrida': {
            color: '#ff6b6b',
            bg: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(77,171,247,0.15))',
            border: 'linear-gradient(135deg, #ff6b6b, #4dabf7)',
            gradiente: true
        }
    };

    // ============================================
    // CONTROLE DE ABAS
    // ============================================

    window.switchEditorTab = function(tabId) {
        const tabs = document.querySelectorAll('.modal-editor-tabs .tab-btn');
        const contents = document.querySelectorAll('.editor-tab-content');
        const fonteValor = document.getElementById('edit-fonte')?.value || 'fogo';
        const fonte = FONTES_CORES[fonteValor] || FONTES_CORES['fogo'];

        tabs.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
            if (btn.dataset.tab === tabId && btn.classList.contains('active')) {
                btn.style.color = fonte.color;
                btn.style.borderBottomColor = fonte.color;
            } else {
                btn.style.color = '';
                btn.style.borderBottomColor = '';
            }
        });

        contents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    };

    // ============================================
    // ATUALIZAR COR DA FONTE
    // ============================================

    window.atualizarCorFonteEditor = function(valor) {
        const fonte = FONTES_CORES[valor] || FONTES_CORES['fogo'];
        const badge = document.getElementById('editor-fonte-badge');
        if (!badge) return;
        const dot = badge.querySelector('.dot');

        badge.style.color = fonte.color;
        if (fonte.gradiente) {
            badge.className = 'fonte-badge hybrid';
            badge.style.background = fonte.bg;
            badge.style.borderImage = fonte.border;
            badge.style.borderImageSlice = 1;
            badge.style.border = '1px solid transparent';
        } else {
            badge.className = 'fonte-badge';
            badge.style.background = fonte.bg;
            badge.style.border = `1px solid ${fonte.border}`;
            badge.style.borderImage = 'none';
        }
        dot.style.background = fonte.color;

        const glow = document.querySelector('.header-glow');
        if (glow) {
            glow.style.background = `radial-gradient(circle, ${fonte.color}33, transparent 70%)`;
        }

        document.querySelectorAll('.modal-editor-tabs .tab-btn.active').forEach(tab => {
            tab.style.color = fonte.color;
            tab.style.borderBottomColor = fonte.color;
        });
    };

    // ============================================
    // AJUSTAR NÚMERO (atributos)
    // ============================================

    window.ajustarNumeroEditor = function(btn, delta) {
        const group = btn.closest('.number-input-group');
        const input = group.querySelector('.num-input');
        let val = parseInt(input.value) || 0;
        const min = parseInt(input.min) || -Infinity;
        const max = parseInt(input.max) || Infinity;
        val = Math.max(min, Math.min(max, val + delta));
        input.value = val;
        input.dispatchEvent(new Event('change'));
        verificarEspecializacaoEditor(input);
    };

    // ============================================
    // AJUSTAR NÚMERO (perícias/técnicas)
    // ============================================

    window.ajustarNumeroListaEditor = function(btn, delta) {
        const group = btn.closest('.number-input-group');
        const input = group.querySelector('.num-input');
        let val = parseInt(input.value) || 0;
        const min = parseInt(input.min) || 0;
        val = Math.max(min, val + delta);
        input.value = val;
        input.dispatchEvent(new Event('change'));
        verificarEspecializacaoEditor(input);
    };

    // ============================================
    // VERIFICAR ESPECIALIZAÇÃO (valor > 200)
    // ============================================

    function verificarEspecializacaoEditor(input) {
        const item = input.closest('.editor-list-item');
        if (!item) return;
        const btn = item.querySelector('.btn-especializar-item');
        if (!btn) return;

        const valor = parseInt(input.value) || 0;

        if (valor > 200) {
            item.classList.add('especializavel');
            btn.disabled = false;
            btn.classList.add('ativo');
            if (item.dataset.especializada === 'true') {
                btn.textContent = '⭐';
                btn.classList.add('especializado');
            } else {
                btn.textContent = '🎓';
                btn.classList.remove('especializado');
            }
        } else {
            item.classList.remove('especializavel');
            btn.disabled = true;
            btn.classList.remove('ativo');
            btn.classList.remove('especializado');
            btn.textContent = '🎓';
            item.dataset.especializada = 'false';
        }

        atualizarGlowGlobalEditor();
        atualizarBotaoEspecializarGlobalEditor();
    }

    // ============================================
    // GLOW GLOBAL
    // ============================================

    function atualizarGlowGlobalEditor() {
        const items = document.querySelectorAll('.editor-list-item.especializavel');
        const anyHover = document.querySelector('.btn-especializar-item.ativo:hover');

        if (anyHover) {
            items.forEach(item => item.classList.add('glow'));
        } else {
            items.forEach(item => item.classList.remove('glow'));
        }
    }

    // ============================================
    // TOGGLE ESPECIALIZAR ITEM
    // ============================================

    window.toggleEspecializarItemEditor = function(btn) {
        const item = btn.closest('.editor-list-item');
        const isEspecializada = item.dataset.especializada === 'true';

        if (isEspecializada) {
            item.dataset.especializada = 'false';
            btn.textContent = '🎓';
            btn.classList.remove('especializado');
            item.classList.remove('glow');
        } else {
            item.dataset.especializada = 'true';
            btn.textContent = '⭐';
            btn.classList.add('especializado');
            item.classList.add('glow');
        }

        atualizarBotaoEspecializarGlobalEditor();
    };

    // ============================================
    // BOTÃO GLOBAL ESPECIALIZAR
    // ============================================

    function atualizarBotaoEspecializarGlobalEditor() {
        const temEspecializada = document.querySelectorAll('.editor-list-item[data-especializada="true"]').length > 0;
        const botoes = document.querySelectorAll('.btn-especializar-global');

        botoes.forEach(btn => {
            if (temEspecializada) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });
    }

    // ============================================
    // ABRIR ESPECIALIZAÇÃO (modal)
    // ============================================

    window.abrirEspecializacao = function() {
        if (typeof abrirModalEspecializacao === 'function') {
            abrirModalEspecializacao();
        } else {
            alert('⚠️ Sistema de especialização não disponível.');
        }
    };

    // ============================================
    // FAVORES (HEART TANK)
    // ============================================

    window.toggleFavorEditor = function(el) {
        const isAtivo = el.classList.contains('ativo');
        if (isAtivo) {
            el.classList.remove('ativo');
        } else {
            el.classList.add('ativo');
        }
        atualizarContadorFavoresEditor();
    };

    function atualizarContadorFavoresEditor() {
        const ativos = document.querySelectorAll('.favor-slot.ativo').length;
        const label = document.getElementById('favores-count');
        if (label) {
            label.textContent = ativos;
        }
    }

    // ============================================
    // LISTAS DINÂMICAS
    // ============================================

    window.adicionarPericiaEditor = function() {
        const list = document.getElementById('editor-pericias-list');
        const empty = list.querySelector('.editor-list-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'editor-list-item';
        item.dataset.especializada = 'false';

        item.innerHTML = `
            <div class="editor-list-item-info">
                <select class="form-control-sm">
                    <option>Atletismo</option>
                    <option selected>Furtividade</option>
                    <option>Arcanismo</option>
                    <option>Luta com Espada</option>
                </select>
                <div class="number-input-group">
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -50)">-50</button>
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -10)">-10</button>
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -1)">-1</button>
                    <input type="number" class="num-input" value="1" min="0">
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 1)">+1</button>
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 10)">+10</button>
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 50)">+50</button>
                </div>
            </div>
            <button class="btn-especializar-item" disabled>🎓</button>
            <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
        `;

        list.appendChild(item);

        const input = item.querySelector('.num-input');
        if (input) {
            input.addEventListener('change', function() {
                verificarEspecializacaoEditor(this);
            });
            verificarEspecializacaoEditor(input);
        }
        atualizarBotaoEspecializarGlobalEditor();
    };

    window.adicionarTecnicaEditor = function() {
        const list = document.getElementById('editor-tecnicas-list');
        const empty = list.querySelector('.editor-list-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'editor-list-item';
        item.dataset.especializada = 'false';

        item.innerHTML = `
            <div class="editor-list-item-info">
                <select class="form-control-sm">
                    <option>Bola de Fogo</option>
                    <option selected>Escudo de Gelo</option>
                    <option>Raio Fulminante</option>
                </select>
                <div class="number-input-group">
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -50)">-50</button>
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -10)">-10</button>
                    <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -1)">-1</button>
                    <input type="number" class="num-input" value="1" min="0">
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 1)">+1</button>
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 10)">+10</button>
                    <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 50)">+50</button>
                </div>
            </div>
            <button class="btn-especializar-item" disabled>🎓</button>
            <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
        `;

        list.appendChild(item);

        const input = item.querySelector('.num-input');
        if (input) {
            input.addEventListener('change', function() {
                verificarEspecializacaoEditor(this);
            });
            verificarEspecializacaoEditor(input);
        }
        atualizarBotaoEspecializarGlobalEditor();
    };

    window.adicionarQualidadeEditor = function() {
        const list = document.getElementById('editor-qualidades-list');
        const empty = list.querySelector('.editor-list-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'editor-list-item';

        item.innerHTML = `
            <div class="editor-list-item-info-3col">
                <input type="text" class="form-control-sm" placeholder="Nome" style="flex:2;">
                <div class="number-input-group">
                    <button class="btn-num menos" onclick="ajustarNumeroEditor(this, -1)">−</button>
                    <input type="number" class="num-input" value="1" min="1" max="5">
                    <button class="btn-num mais" onclick="ajustarNumeroEditor(this, 1)">+</button>
                </div>
                <input type="text" class="form-control-sm" placeholder="Descrição" style="flex:2;">
            </div>
            <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
        `;

        list.appendChild(item);
    };

    window.adicionarDefeitoEditor = function() {
        const list = document.getElementById('editor-defeitos-list');
        const empty = list.querySelector('.editor-list-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'editor-list-item';

        item.innerHTML = `
            <div class="editor-list-item-info-3col">
                <input type="text" class="form-control-sm" placeholder="Nome" style="flex:2;">
                <div class="number-input-group">
                    <button class="btn-num menos" onclick="ajustarNumeroEditor(this, -1)">−</button>
                    <input type="number" class="num-input" value="-1" min="-5" max="-1">
                    <button class="btn-num mais" onclick="ajustarNumeroEditor(this, 1)">+</button>
                </div>
                <input type="text" class="form-control-sm" placeholder="Descrição" style="flex:2;">
            </div>
            <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
        `;

        list.appendChild(item);
    };

    window.adicionarTituloEditor = function() {
        const list = document.getElementById('editor-titulos-list');
        const empty = list.querySelector('.editor-list-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'editor-list-item';

        item.innerHTML = `
            <div class="editor-list-item-info">
                <input type="text" class="form-control" placeholder="Nome do título">
            </div>
            <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
        `;

        list.appendChild(item);
    };

    window.removerItemEditor = function(btn) {
        const item = btn.closest('.editor-list-item');
        const list = item.parentElement;
        item.remove();
        if (list.children.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'editor-list-empty';
            empty.innerHTML = `<i class="fas fa-plus-circle"></i> Nenhum item`;
            list.appendChild(empty);
        }
        atualizarBotaoEspecializarGlobalEditor();
    };

    // ============================================
    // ABRIR/FECHAR EDITOR
    // ============================================

    window.abrirEditorFicha = function(personagemId) {
        const modal = document.getElementById('modal-editor-ficha');
        if (!modal) {
            console.error('❌ Modal editor-ficha não encontrado!');
            return;
        }
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Carregar dados do personagem
        if (personagemId) {
            fetch(`/api/editor-ficha/carregar/${personagemId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        preencherEditor(data);
                    } else {
                        console.error('Erro ao carregar:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                });
        }

        // Resetar para primeira aba
        window.switchEditorTab('editor-basico');

        // Resetar favores
        document.querySelectorAll('.favor-slot').forEach((slot, index) => {
            if (index < 3) {
                slot.classList.add('ativo');
            } else {
                slot.classList.remove('ativo');
            }
        });
        atualizarContadorFavoresEditor();

        // Resetar especializações
        document.querySelectorAll('.editor-list-item .num-input').forEach(input => {
            verificarEspecializacaoEditor(input);
        });
        atualizarBotaoEspecializarGlobalEditor();
    };

    function preencherEditor(data) {
        const p = data.personagem;
        if (!p) return;

        document.getElementById('edit-nome').value = p.nome_completo || '';
        document.getElementById('edit-ocupacao').value = p.ocupacao || '';
        document.getElementById('edit-moradia').value = p.moradia || '';
        document.getElementById('edit-especie').value = p.especie_id || '';
        document.getElementById('edit-fonte').value = p.fonte_poder_id || '';
        document.getElementById('edit-forca').value = p.forca || 10;
        document.getElementById('edit-destreza').value = p.destreza || 10;
        document.getElementById('edit-inteligencia').value = p.inteligencia || 10;
        document.getElementById('edit-constituicao').value = p.constituicao || 10;
        document.getElementById('edit-poder').value = p.poder || 50;
        document.getElementById('edit-aparencia').value = p.aparencia || 10;
        document.getElementById('edit-fv-total').value = p.forca_vital_total || 100;
        document.getElementById('edit-pe-total').value = p.poder_elemental_total || 80;
        document.getElementById('edit-muny').value = p.muny || 0;
        document.getElementById('edit-anotacoes').value = p.anotacoes || '';
        document.getElementById('edit-favores').value = p.favores_elementais || 0;

        // Atualizar fonte badge
        if (p.fonte_poder_id) {
            fetch(`/api/fontes-poder/${p.fonte_poder_id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.fonte) {
                        const nome = data.fonte.nome_exibicao.toLowerCase();
                        window.atualizarCorFonteEditor(nome);
                    }
                })
                .catch(() => {});
        }

        // Carregar perícias
        const periciasList = document.getElementById('editor-pericias-list');
        if (periciasList && data.pericias) {
            periciasList.innerHTML = '';
            data.pericias.forEach(pericia => {
                const item = document.createElement('div');
                item.className = 'editor-list-item';
                item.dataset.especializada = 'false';
                const pontos = pericia.pontos || 1;
                item.innerHTML = `
                    <div class="editor-list-item-info">
                        <select class="form-control-sm">
                            <option value="${pericia.pericia_id}" selected>${pericia.pericia_nome}</option>
                        </select>
                        <div class="number-input-group">
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -50)">-50</button>
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -10)">-10</button>
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -1)">-1</button>
                            <input type="number" class="num-input" value="${pontos}" min="0">
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 1)">+1</button>
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 10)">+10</button>
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 50)">+50</button>
                        </div>
                    </div>
                    <button class="btn-especializar-item" disabled>🎓</button>
                    <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
                `;
                periciasList.appendChild(item);
                const input = item.querySelector('.num-input');
                if (input) {
                    input.addEventListener('change', function() {
                        verificarEspecializacaoEditor(this);
                    });
                    verificarEspecializacaoEditor(input);
                }
            });
            atualizarBotaoEspecializarGlobalEditor();
        }

        // Carregar técnicas
        const tecnicasList = document.getElementById('editor-tecnicas-list');
        if (tecnicasList && data.tecnicas) {
            tecnicasList.innerHTML = '';
            data.tecnicas.forEach(tecnica => {
                const item = document.createElement('div');
                item.className = 'editor-list-item';
                item.dataset.especializada = 'false';
                const pontos = tecnica.pontos || 1;
                item.innerHTML = `
                    <div class="editor-list-item-info">
                        <select class="form-control-sm">
                            <option value="${tecnica.tecnica_id}" selected>${tecnica.tecnica_nome}</option>
                        </select>
                        <div class="number-input-group">
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -50)">-50</button>
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -10)">-10</button>
                            <button class="btn-num menos" onclick="ajustarNumeroListaEditor(this, -1)">-1</button>
                            <input type="number" class="num-input" value="${pontos}" min="0">
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 1)">+1</button>
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 10)">+10</button>
                            <button class="btn-num mais" onclick="ajustarNumeroListaEditor(this, 50)">+50</button>
                        </div>
                    </div>
                    <button class="btn-especializar-item" disabled>🎓</button>
                    <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
                `;
                tecnicasList.appendChild(item);
                const input = item.querySelector('.num-input');
                if (input) {
                    input.addEventListener('change', function() {
                        verificarEspecializacaoEditor(this);
                    });
                    verificarEspecializacaoEditor(input);
                }
            });
            atualizarBotaoEspecializarGlobalEditor();
        }

        // Carregar qualidades
        const qualidadesList = document.getElementById('editor-qualidades-list');
        if (qualidadesList && data.qualidades) {
            qualidadesList.innerHTML = '';
            data.qualidades.forEach(q => {
                const item = document.createElement('div');
                item.className = 'editor-list-item';
                item.innerHTML = `
                    <div class="editor-list-item-info-3col">
                        <input type="text" class="form-control-sm" value="${q.nome}" style="flex:2;">
                        <div class="number-input-group">
                            <button class="btn-num menos" onclick="ajustarNumeroEditor(this, -1)">−</button>
                            <input type="number" class="num-input" value="${q.score || 1}" min="1" max="5">
                            <button class="btn-num mais" onclick="ajustarNumeroEditor(this, 1)">+</button>
                        </div>
                        <input type="text" class="form-control-sm" value="${q.descricao || ''}" placeholder="Descrição" style="flex:2;">
                    </div>
                    <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
                `;
                qualidadesList.appendChild(item);
            });
        }

        // Carregar defeitos
        const defeitosList = document.getElementById('editor-defeitos-list');
        if (defeitosList && data.defeitos) {
            defeitosList.innerHTML = '';
            data.defeitos.forEach(d => {
                const item = document.createElement('div');
                item.className = 'editor-list-item';
                item.innerHTML = `
                    <div class="editor-list-item-info-3col">
                        <input type="text" class="form-control-sm" value="${d.nome}" style="flex:2;">
                        <div class="number-input-group">
                            <button class="btn-num menos" onclick="ajustarNumeroEditor(this, -1)">−</button>
                            <input type="number" class="num-input" value="${d.score || -1}" min="-5" max="-1">
                            <button class="btn-num mais" onclick="ajustarNumeroEditor(this, 1)">+</button>
                        </div>
                        <input type="text" class="form-control-sm" value="${d.descricao || ''}" placeholder="Descrição" style="flex:2;">
                    </div>
                    <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
                `;
                defeitosList.appendChild(item);
            });
        }

        // Carregar títulos
        const titulosList = document.getElementById('editor-titulos-list');
        if (titulosList && data.titulos) {
            titulosList.innerHTML = '';
            data.titulos.forEach(t => {
                const item = document.createElement('div');
                item.className = 'editor-list-item';
                item.innerHTML = `
                    <div class="editor-list-item-info">
                        <input type="text" class="form-control" value="${t.nome}" placeholder="Nome do título">
                    </div>
                    <button class="btn-remove" onclick="removerItemEditor(this)">✕</button>
                `;
                titulosList.appendChild(item);
            });
        }
    }

    window.fecharEditorFicha = function() {
        const modal = document.getElementById('modal-editor-ficha');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // ============================================
    // SALVAR
    // ============================================

    window.salvarEditorFicha = function() {
        // Coletar dados do formulário
        const data = {
            nome: document.getElementById('edit-nome')?.value || '',
            ocupacao: document.getElementById('edit-ocupacao')?.value || '',
            moradia: document.getElementById('edit-moradia')?.value || '',
            especie_id: parseInt(document.getElementById('edit-especie')?.value) || 1,
            fonte_poder_id: parseInt(document.getElementById('edit-fonte')?.value) || 1,
            forca: parseInt(document.getElementById('edit-forca')?.value) || 10,
            destreza: parseInt(document.getElementById('edit-destreza')?.value) || 10,
            inteligencia: parseInt(document.getElementById('edit-inteligencia')?.value) || 10,
            constituicao: parseInt(document.getElementById('edit-constituicao')?.value) || 10,
            poder: parseInt(document.getElementById('edit-poder')?.value) || 50,
            aparencia: parseInt(document.getElementById('edit-aparencia')?.value) || 10,
            fv_total: parseInt(document.getElementById('edit-fv-total')?.value) || 100,
            pe_total: parseInt(document.getElementById('edit-pe-total')?.value) || 80,
            muny: parseInt(document.getElementById('edit-muny')?.value) || 0,
            anotacoes: document.getElementById('edit-anotacoes')?.value || '',
            privado: document.querySelector('input[name="edit-visibilidade"]:checked')?.value === 'privado'
        };

        // Coletar perícias
        const pericias = [];
        document.querySelectorAll('#editor-pericias-list .editor-list-item').forEach(item => {
            const select = item.querySelector('select');
            const input = item.querySelector('.num-input');
            if (select && input) {
                pericias.push({
                    pericia_id: parseInt(select.value),
                    pontos: parseInt(input.value) || 1
                });
            }
        });
        data.pericias = pericias;

        // Coletar técnicas
        const tecnicas = [];
        document.querySelectorAll('#editor-tecnicas-list .editor-list-item').forEach(item => {
            const select = item.querySelector('select');
            const input = item.querySelector('.num-input');
            if (select && input) {
                tecnicas.push({
                    tecnica_id: parseInt(select.value),
                    pontos: parseInt(input.value) || 1
                });
            }
        });
        data.tecnicas = tecnicas;

        // Coletar qualidades
        const qualidades = [];
        document.querySelectorAll('#editor-qualidades-list .editor-list-item').forEach(item => {
            const inputs = item.querySelectorAll('.form-control-sm');
            const scoreInput = item.querySelector('.num-input');
            if (inputs.length >= 2 && scoreInput) {
                qualidades.push({
                    nome: inputs[0].value.trim(),
                    descricao: inputs[1]?.value.trim() || '',
                    score: parseInt(scoreInput.value) || 1,
                    categoria: 'Qualidade'
                });
            }
        });
        data.qualidades = qualidades;

        // Coletar defeitos
        const defeitos = [];
        document.querySelectorAll('#editor-defeitos-list .editor-list-item').forEach(item => {
            const inputs = item.querySelectorAll('.form-control-sm');
            const scoreInput = item.querySelector('.num-input');
            if (inputs.length >= 2 && scoreInput) {
                defeitos.push({
                    nome: inputs[0].value.trim(),
                    descricao: inputs[1]?.value.trim() || '',
                    score: parseInt(scoreInput.value) || -1,
                    categoria: 'Defeito'
                });
            }
        });
        data.defeitos = defeitos;

        // Coletar títulos
        const titulos = [];
        document.querySelectorAll('#editor-titulos-list .editor-list-item').forEach(item => {
            const input = item.querySelector('.form-control');
            if (input && input.value.trim()) {
                titulos.push({ nome: input.value.trim() });
            }
        });
        data.titulos = titulos;

        // Favores
        const favoresAtivos = document.querySelectorAll('.favor-slot.ativo').length;
        data.favores = favoresAtivos;

        console.log('📝 Salvando personagem:', data);
        alert('✅ Personagem salvo com sucesso! (Simulação)');
        window.fecharEditorFicha();
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
        const btnFechar = document.getElementById('btn-fechar-editor-ficha');
        if (btnFechar) btnFechar.addEventListener('click', window.fecharEditorFicha);

        const btnCancelar = document.getElementById('btn-cancelar-editor');
        if (btnCancelar) btnCancelar.addEventListener('click', window.fecharEditorFicha);

        const btnSalvar = document.getElementById('btn-salvar-editor');
        if (btnSalvar) btnSalvar.addEventListener('click', window.salvarEditorFicha);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('modal-editor-ficha');
                if (modal && modal.classList.contains('active')) {
                    window.fecharEditorFicha();
                }
            }
        });

        const modal = document.getElementById('modal-editor-ficha');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) window.fecharEditorFicha();
            });
        }

        // Inicializar favores
        atualizarContadorFavoresEditor();
    });

    console.log('📝 EditorFicha.js carregado com sucesso!');
})();