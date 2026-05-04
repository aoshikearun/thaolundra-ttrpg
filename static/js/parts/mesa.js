// mesa.js - Sistema de Mesa com Janelas Arrastáveis

let currentMesaId = null;
let currentPersonagem = null;
let availablePersonagens = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mesa RPG inicializando...');

    // Obter ID da mesa da URL
    const path = window.location.pathname;
    const match = path.match(/\/mesa\/(\d+)/);
    if (match) {
        currentMesaId = parseInt(match[1]);
        carregarEstadoMesa();
    } else {
        console.error('ID da mesa não encontrado na URL');
    }

    // Inicializar barra de ferramentas arrastável
    initToolbar();

    // Inicializar janelas flutuantes
    initFloatingWindows();
});

// ============================================
// CARREGAR ESTADO DA MESA
// ============================================

function carregarEstadoMesa() {
    fetch(`/api/mesa/${currentMesaId}/estado`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.personagem_ativo) {
                    currentPersonagem = data.personagem_ativo;
                    carregarPersonagemAtivo();
                } else {
                    mostrarSeletorPersonagens(data.personagens_disponiveis);
                }
            } else {
                console.error('Erro:', data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar estado da mesa:', error);
        });
}

function mostrarSeletorPersonagens(personagens) {
    availablePersonagens = personagens;

    const overlay = document.createElement('div');
    overlay.className = 'personagem-selector-overlay';
    overlay.id = 'personagem-selector';

    overlay.innerHTML = `
        <div class="personagem-selector-modal">
            <h3>🎭 Escolha seu Personagem</h3>
            <p>Selecione qual personagem você vai controlar nesta mesa:</p>
            <select id="personagem-select">
                <option value="">-- Selecione --</option>
                ${personagens.map(p => `<option value="${p.id}">${p.nome_completo} (Nv. ${p.nivel})</option>`).join('')}
            </select>
            <button id="confirmar-personagem" class="btn btn-primary">Confirmar</button>
        </div>
    `;

    document.getElementById('mesa-container').appendChild(overlay);

    document.getElementById('confirmar-personagem').onclick = function() {
        const select = document.getElementById('personagem-select');
        const personagemId = parseInt(select.value);
        if (personagemId) {
            selecionarPersonagem(personagemId);
        } else {
            alert('Selecione um personagem');
        }
    };
}

function selecionarPersonagem(personagemId) {
    fetch(`/api/mesa/${currentMesaId}/selecionar-personagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personagem_id: personagemId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('personagem-selector')?.remove();
            currentPersonagem = data.personagem;
            carregarPersonagemAtivo();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao selecionar personagem:', error);
        alert('Erro ao selecionar personagem');
    });
}

function carregarPersonagemAtivo() {
    if (!currentPersonagem) return;

    // Carregar dados completos do personagem
    fetch(`/api/personagens/${currentPersonagem.id}/ficha`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentPersonagem = data.personagem;
                atualizarJanelaPersonagem();
                atualizarJanelaAcoes();
                carregarGrupo();
                carregarInteracoes();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar ficha:', error);
        });
}

// ============================================
// BARRA DE FERRAMENTAS ARRASTÁVEL
// ============================================

function initToolbar() {
    const toolbar = document.getElementById('toolbar');
    const handle = document.querySelector('.toolbar-handle');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // Posição inicial salva ou padrão
    const savedPos = localStorage.getItem(`toolbar_pos_${currentMesaId}`);
    if (savedPos) {
        const pos = JSON.parse(savedPos);
        toolbar.style.left = pos.left + 'px';
        toolbar.style.top = pos.top + 'px';
        toolbar.style.right = 'auto';
    }

    handle.addEventListener('mousedown', startDrag);

    function startDrag(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = toolbar.offsetLeft;
        startTop = toolbar.offsetTop;

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        toolbar.style.cursor = 'grabbing';
    }

    function onDrag(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        // Limitar à tela
        newLeft = Math.max(0, Math.min(window.innerWidth - toolbar.offsetWidth, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - toolbar.offsetHeight, newTop));

        toolbar.style.left = newLeft + 'px';
        toolbar.style.top = newTop + 'px';
        toolbar.style.right = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        toolbar.style.cursor = 'grab';

        // Salvar posição
        localStorage.setItem(`toolbar_pos_${currentMesaId}`, JSON.stringify({
            left: toolbar.offsetLeft,
            top: toolbar.offsetTop
        }));
    }

    // Alternar orientação (duplo clique)
    toolbar.addEventListener('dblclick', function() {
        toolbar.classList.toggle('horizontal');
        localStorage.setItem(`toolbar_orient_${currentMesaId}`, toolbar.classList.contains('horizontal') ? 'horizontal' : 'vertical');
    });

    // Carregar orientação salva
    const savedOrient = localStorage.getItem(`toolbar_orient_${currentMesaId}`);
    if (savedOrient === 'horizontal') {
        toolbar.classList.add('horizontal');
    }

    // Botões das janelas
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const windowId = this.getAttribute('data-window');
            toggleWindow(windowId);
        });
    });
}

// ============================================
// JANELAS FLUTUANTES
// ============================================

function initFloatingWindows() {
    const windows = document.querySelectorAll('.floating-window');

    windows.forEach(window => {
        const header = window.querySelector('.window-header');
        const closeBtn = window.querySelector('.window-close');

        // Fechar
        closeBtn.addEventListener('click', () => {
            window.style.display = 'none';
            localStorage.setItem(`window_${window.dataset.window}_visible`, 'false');
        });

        // Arrastar
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', startDrag);

        function startDrag(e) {
            if (e.target === closeBtn || closeBtn.contains(e.target)) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = window.offsetLeft;
            startTop = window.offsetTop;

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            header.style.cursor = 'grabbing';
        }

        function onDrag(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            newLeft = Math.max(0, Math.min(window.innerWidth - window.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - window.offsetHeight, newTop));

            window.style.left = newLeft + 'px';
            window.style.top = newTop + 'px';
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            header.style.cursor = 'grab';

            // Salvar posição
            localStorage.setItem(`window_${window.dataset.window}_pos`, JSON.stringify({
                left: window.style.left,
                top: window.style.top
            }));
        }

        // Carregar posição salva
        const savedPos = localStorage.getItem(`window_${window.dataset.window}_pos`);
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            window.style.left = pos.left;
            window.style.top = pos.top;
        }

        // Carregar visibilidade salva (padrão: visível)
        const savedVisible = localStorage.getItem(`window_${window.dataset.window}_visible`);
        if (savedVisible === 'false') {
            window.style.display = 'none';
        } else {
            window.style.display = 'block';
        }
    });
}

function toggleWindow(windowId) {
    const window = document.getElementById(`window-${windowId}`);
    if (window.style.display === 'none') {
        window.style.display = 'block';
        localStorage.setItem(`window_${windowId}_visible`, 'true');
    } else {
        window.style.display = 'none';
        localStorage.setItem(`window_${windowId}_visible`, 'false');
    }
}

// ============================================
// JANELA MEU PERSONAGEM
// ============================================

function atualizarJanelaPersonagem() {
    const body = document.querySelector('#window-personagem .window-body');
    if (!body || !currentPersonagem) return;

    const p = currentPersonagem;
    const fvPercent = (p.fv_atual / p.fv_max) * 100;
    const pePercent = (p.pe_atual / p.pe_max) * 100;

    body.innerHTML = `
        <div class="personagem-compacto">
            <div class="personagem-header-info">
                <h3>${p.nome_completo}</h3>
                <p>Jogador: ${p.jogador_nome || 'Você'}</p>
                <div class="personagem-especie-fonte">
                    <span>${p.especie_nome}</span>
                    <span>
                        <img class="fonte-icon" src="/static/images/fontes/${p.fonte_icone || 'padrao.png'}" alt="${p.fonte_nome}">
                        ${p.fonte_nome}
                    </span>
                </div>
            </div>

            <div class="status-bar-compacto">
                <label>💚 Força Vital</label>
                <div class="bar-container-compacto">
                    <div class="bar-fill-compacto fv" style="width: ${fvPercent}%"></div>
                    <span class="bar-text-compacto">${p.fv_atual} / ${p.fv_max}</span>
                </div>
            </div>

            <div class="status-bar-compacto">
                <label>✨ Poder Elemental</label>
                <div class="bar-container-compacto">
                    <div class="bar-fill-compacto pe" style="width: ${pePercent}%"></div>
                    <span class="bar-text-compacto">${p.pe_atual} / ${p.pe_max}</span>
                </div>
            </div>

            <div class="atributos-rapidos">
                <div class="atributo-rapido">For<br><span>${p.forca}</span></div>
                <div class="atributo-rapido">Des<br><span>${p.destreza}</span></div>
                <div class="atributo-rapido">Int<br><span>${p.inteligencia}</span></div>
                <div class="atributo-rapido">Con<br><span>${p.constituicao}</span></div>
                <div class="atributo-rapido">Pod<br><span>${p.poder}</span></div>
            </div>
        </div>
    `;
}

// ============================================
// JANELA AÇÕES
// ============================================

function atualizarJanelaAcoes() {
    const body = document.querySelector('#window-acao .window-body');
    if (!body || !currentPersonagem) return;

    // Agrupar perícias por categoria
    const periciasPorCategoria = {};
    currentPersonagem.pericias?.forEach(p => {
        if (!periciasPorCategoria[p.categoria]) periciasPorCategoria[p.categoria] = [];
        periciasPorCategoria[p.categoria].push(p);
    });

    let html = '';

    // Perícias
    if (currentPersonagem.pericias?.length) {
        html += `<div class="acoes-categoria"><h4>📋 PERÍCIAS</h4>`;
        for (const [cat, pericias] of Object.entries(periciasPorCategoria)) {
            pericias.forEach(p => {
                html += `
                    <div class="acao-item" onclick="rolarPericia(${p.id}, '${p.nome}', ${p.pontos})">
                        <span class="acao-nome">${p.nome}</span>
                        <span class="acao-dado">d20+${p.pontos + (currentPersonagem.agilidade || 0)}</span>
                    </div>
                `;
            });
        }
        html += `</div>`;
    }

    // Técnicas
    if (currentPersonagem.tecnicas?.length) {
        html += `<div class="acoes-categoria"><h4>✨ TÉCNICAS</h4>`;
        currentPersonagem.tecnicas.forEach(t => {
            html += `
                <div class="acao-item" onclick="rolarTecnica(${t.id}, '${t.nome}', ${t.pontos})">
                    <span class="acao-nome">${t.nome}</span>
                    <span class="acao-dado">d100+${t.pontos}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Testes gerais
    html += `<div class="acoes-categoria"><h4>🎲 TESTES GERAIS</h4>`;
    html += `<div class="acao-item" onclick="rolarTeste('Sorte', 20, 0)"><span class="acao-nome">Sorte</span><span class="acao-dado">d20</span></div>`;
    html += `<div class="acao-item" onclick="rolarTeste('Vontade', 20, ${currentPersonagem.autocontrole || 0})"><span class="acao-nome">Vontade</span><span class="acao-dado">d20+${currentPersonagem.autocontrole || 0}</span></div>`;
    html += `</div>`;

    body.innerHTML = html;
}

// Funções de rolagem (placeholder - serão implementadas depois)
function rolarPericia(id, nome, bonus) {
    console.log(`Rolando perícia ${nome} com bônus ${bonus}`);
    alert(`🎲 Rolando ${nome}: d20 + ${bonus}`);
}

function rolarTecnica(id, nome, bonus) {
    console.log(`Rolando técnica ${nome} com bônus ${bonus}`);
    alert(`🎲 Rolando ${nome}: d100 + ${bonus}`);
}

function rolarTeste(nome, dado, bonus) {
    console.log(`Rolando ${nome}: d${dado} + ${bonus}`);
    alert(`🎲 Rolando ${nome}: d${dado} + ${bonus}`);
}

// ============================================
// JANELA GRUPO
// ============================================

function carregarGrupo() {
    fetch(`/api/mesa/${currentMesaId}/grupo`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                atualizarJanelaGrupo(data.personagens);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar grupo:', error);
        });
}

function atualizarJanelaGrupo(personagens) {
    const body = document.querySelector('#window-grupo .window-body');
    if (!body) return;

    if (!personagens || personagens.length === 0) {
        body.innerHTML = '<div class="empty">Nenhum personagem no grupo</div>';
        return;
    }

    let html = '<div class="grupo-lista">';
    personagens.forEach(p => {
        const fvPercent = (p.fv_atual / p.fv_max) * 100;
        html += `
            <div class="grupo-item" onclick="verPersonagemGrupo(${p.id})">
                <span class="grupo-item-nome">${p.nome_completo}</span>
                <div class="grupo-item-fv">
                    <div class="mini-bar">
                        <div class="mini-bar-fill" style="width: ${fvPercent}%"></div>
                    </div>
                    <span style="font-size:10px">${p.fv_atual}/${p.fv_max}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';

    body.innerHTML = html;
}

function verPersonagemGrupo(id) {
    console.log('Ver personagem do grupo:', id);
    alert('Detalhes do personagem em breve');
}

// ============================================
// JANELA INTERAÇÕES
// ============================================

function carregarInteracoes() {
    fetch(`/api/mesa/${currentMesaId}/interacoes`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                atualizarJanelaInteracoes(data.interacoes);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar interações:', error);
        });
}

function atualizarJanelaInteracoes(interacoes) {
    const body = document.querySelector('#window-interacoes .window-body');
    if (!body) return;

    if (!interacoes || interacoes.length === 0) {
        body.innerHTML = '<div class="empty">Nenhuma interação próxima</div>';
        return;
    }

    let html = '<div class="interacoes-lista">';
    interacoes.forEach(i => {
        html += `
            <div class="interacao-item" onclick="interagir(${i.id}, '${i.tipo}')">
                <div class="interacao-icon">${i.icone || '❓'}</div>
                <div class="interacao-info">
                    <div class="interacao-nome">${i.nome}</div>
                    <div class="interacao-distancia">📏 ${i.distancia}m</div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    body.innerHTML = html;
}

function interagir(id, tipo) {
    console.log(`Interagindo com ${tipo} ID ${id}`);
    alert(`Interação com ${tipo} em desenvolvimento`);
}