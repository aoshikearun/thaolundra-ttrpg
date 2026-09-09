// main.js - Navegação do sistema de abas

let currentPage = null;

const pages = {
    'todos_personagens': { title: '👥 Galeria de Personagens', url: '/personagens' },
    'criar_personagem': { title: '➕ Criar Personagem', url: '/criar-ficha' },
    'meus_personagens': { title: '📋 Meus Personagens', url: '/meus-personagens' },
    'mesas': { title: '🎲 Mesas Ativas', url: '/mesa/ativas' },
    'minhas_mesas': { title: '👑 Minhas Mesas', url: '/mesa/minhas' },
    'gerenciar_conteudo': { title: '📚 Gerenciar Conteúdo', url: '/gerenciar-conteudo' },
    'gerenciar_usuarios': { title: '👥 Gerenciar Usuários', url: '/gerenciar-usuarios' },
    'gerenciar_mesas': { title: '⚙️ Gerenciar Mesas', url: '/gerenciar-mesas' },
    'administracao': { title: '🔧 Configurações', url: '/config' },
    'painel_servidores': { title: '🖥️ Painel de Servidores', url: '/painel' }
};

function restoreFromHash() {
    if (window.location.hash) {
        const windowType = window.location.hash.substring(1);
        if (pages[windowType]) {
            openWindow(windowType);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thaolundra RPG carregado');

    if (typeof ThemeManager !== 'undefined') {
        window.themeManager = new ThemeManager();
    }

    restoreFromHash();

    if (!window.location.hash) {
        loadWelcomePage();
    }
});

window.addEventListener('hashchange', function() {
    const windowType = window.location.hash.substring(1);
    if (pages[windowType]) {
        openWindow(windowType);
    } else {
        loadWelcomePage();
    }
});

function loadWelcomePage() {
    const container = document.querySelector('.page-container');
    if (container) {
        container.innerHTML = `
            <div id="welcome-canvas-container" class="welcome-canvas-container">
                <div class="welcome-message">
                    <img src="/static/imgs/logo.png" class="logo" alt="Logo de Thaolundra" width="350" height="350">
                    <h2>BEM-VINDO</h2>
                    <div class="quick-stats">
                        <p>Selecione uma opção no menu lateral para começar</p>
                    </div>
                    <div class="dash-stats-container">
                        <div class="dash-stats-grid">
                            <div class="dash-stats-card dash-stats-card-users">
                                <div class="dash-stats-icon">👥</div>
                                <div class="dash-stats-number" id="dash-total-users">--</div>
                                <div class="dash-stats-label">USUÁRIOS</div>
                            </div>
                            <div class="dash-stats-card dash-stats-card-characters">
                                <div class="dash-stats-icon">📝</div>
                                <div class="dash-stats-number" id="dash-total-characters">--</div>
                                <div class="dash-stats-label">PERSONAGENS</div>
                                <div class="dash-stats-divider"></div>
                                <div class="dash-stats-sub">
                                    <div>📌 Públicos</div>
                                    <div class="dash-stats-sub-value" id="dash-public-characters">--</div>
                                </div>
                            </div>
                            <div class="dash-stats-card dash-stats-card-tables">
                                <div class="dash-stats-icon">🎲</div>
                                <div class="dash-stats-number" id="dash-total-tables">--</div>
                                <div class="dash-stats-label">MESAS</div>
                                <div class="dash-stats-divider"></div>
                                <div class="dash-stats-sub">
                                    <div>✅ Ativas</div>
                                    <div class="dash-stats-sub-value" id="dash-active-tables">--</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            var oldCanvas = document.querySelector('#welcome-canvas-container canvas');
            if (oldCanvas) oldCanvas.remove();

            if (typeof App !== 'undefined' && App.setup) {
                App.setup();
                App.draw();
            }
        }, 50);

        loadDashboardStats();
    }
    currentPage = null;
}

function openWindow(windowType) {
    var looseCanvas = document.querySelector('body > canvas');
    if (looseCanvas) looseCanvas.remove();
    window.location.hash = windowType;

    const pageContainer = document.querySelector('.page-container');
    if (!pageContainer) return;

    const page = pages[windowType];
    if (!page) {
        console.error('Página não encontrada:', windowType);
        return;
    }

    currentPage = windowType;

    pageContainer.innerHTML = `
        <div class="page-header">
            <h2>${page.title}</h2>
            <button class="close-page-btn" onclick="closePage()">✕</button>
        </div>
        <div class="page-content">
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando...</p>
            </div>
        </div>
    `;

    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
    }

    loadPageContent(page.url);
}

function loadPageContent(url) {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    let fullUrl = url;
    if (!url.startsWith('http')) {
        fullUrl = window.location.origin + url;
    }
    fullUrl = fullUrl.replace(/^http:/, 'https:');

    console.log('🔗 Carregando:', fullUrl);

    fetch(fullUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(html => {
            pageContent.innerHTML = html;
            const event = new CustomEvent('pageContentLoaded', { detail: { url: url } });
            document.dispatchEvent(event);

            const scripts = pageContent.querySelectorAll('script');
            scripts.forEach(oldScript => {
                if (!oldScript.src) {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                }
                oldScript.remove();
            });
        })
        .catch(error => {
            console.error('Erro:', error);
            pageContent.innerHTML = `
                <div class="error-container">
                    <p>Erro ao carregar a página: ${error.message}</p>
                    <button class="btn btn-primary" onclick="openWindow('${currentPage}')">Tentar novamente</button>
                </div>
            `;
        });
}

function closePage() {
    window.location.hash = '';
    loadWelcomePage();
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        window.location.href = '/logout';
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats/dashboard');
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;

            const totalUsers = document.getElementById('dash-total-users');
            if (totalUsers) totalUsers.textContent = stats.total_users?.toLocaleString() || '--';

            const totalChars = document.getElementById('dash-total-characters');
            const publicChars = document.getElementById('dash-public-characters');
            if (totalChars) totalChars.textContent = stats.total_characters?.toLocaleString() || '--';
            if (publicChars) publicChars.textContent = stats.public_characters?.toLocaleString() || '--';

            const totalTables = document.getElementById('dash-total-tables');
            const activeTables = document.getElementById('dash-active-tables');
            if (totalTables) totalTables.textContent = stats.total_tables?.toLocaleString() || '--';
            if (activeTables) activeTables.textContent = stats.active_tables?.toLocaleString() || '--';
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
});

// ============================================
// PAGE CONTENT LOADED - CARREGAR SCRIPTS
// ============================================

document.addEventListener('pageContentLoaded', function(e) {
    const url = e.detail.url;
    console.log('📄 pageContentLoaded:', url);

    // ===== CRIAÇÃO DE FICHA =====
    if (url === '/criar-ficha') {
        console.log('🎯 Carregando scripts de criação de ficha...');

        const scripts = [
            '/static/js/parts/criacao/criar_ficha.js',
            '/static/js/parts/criacao/criar_categorias.js',
            '/static/js/parts/criacao/criar_fundamental.js',
            '/static/js/parts/criacao/criar_atributos.js',
            '/static/js/parts/criacao/criar_pericias.js',
            '/static/js/parts/criacao/criar_tecnicas.js',
            '/static/js/parts/criacao/criar_final.js',
            '/static/js/parts/criacao/carousel-species.js',
            '/static/js/parts/criacao/carousel-fontes.js',
            '/static/js/parts/criacao/criar-stepper.js',
            '/static/js/parts/progressao_exp.js'
        ];

        let scriptsLoaded = 0;

        scripts.forEach(src => {
            if (!document.querySelector(`script[src="${src}"]`)) {
                const script = document.createElement('script');
                script.src = src;
                script.onload = function() {
                    scriptsLoaded++;
                    console.log(`✅ Carregado: ${src} (${scriptsLoaded}/${scripts.length})`);
                    if (scriptsLoaded === scripts.length) {
                        console.log('🚀 Todos os scripts carregados! Inicializando...');
                        setTimeout(() => {
                            if (typeof carregarEspecies === 'function') carregarEspecies();
                            if (typeof initSpeciesModal === 'function') initSpeciesModal();
                            if (typeof initStepper === 'function') initStepper();
                        }, 100);
                    }
                };
                document.body.appendChild(script);
            } else {
                scriptsLoaded++;
            }
        });

        if (scriptsLoaded === scripts.length) {
            setTimeout(() => {
                if (typeof carregarEspecies === 'function') carregarEspecies();
                if (typeof initSpeciesModal === 'function') initSpeciesModal();
                if (typeof initStepper === 'function') initStepper();
            }, 100);
        }
    }

    // ===== GERENCIAR USUÁRIOS =====
    if (url === '/gerenciar-usuarios') {
        if (typeof carregarUsuarios === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/parts/gerenciar_usuarios.js';
            script.onload = function() {
                console.log('✅ gerenciar_usuarios.js carregado');
                if (typeof carregarUsuarios === 'function') carregarUsuarios();
            };
            document.body.appendChild(script);
        } else {
            carregarUsuarios();
        }
    }

    // ===== GERENCIAR CONTEÚDO =====
    if (url === '/gerenciar-conteudo') {
        if (typeof initGerenciamento === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/parts/gerenciar.js';
            script.onload = function() {
                console.log('✅ gerenciar.js carregado');
                if (typeof initGerenciamento === 'function') initGerenciamento();
            };
            document.body.appendChild(script);
        } else {
            initGerenciamento();
        }
    }

    // ===== GERENCIAR MESAS =====
    if (url === '/gerenciar-mesas') {
        console.log('🎯 Carregando gerenciar_mesas.js...');
        if (typeof carregarMesasAdmin === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/parts/gerenciar_mesas.js';
            script.onload = function() {
                console.log('✅ gerenciar_mesas.js carregado');
                if (typeof carregarMesasAdmin === 'function') carregarMesasAdmin();
            };
            document.body.appendChild(script);
        } else {
            carregarMesasAdmin();
        }
    }

    // ===== MESAS (lista) =====
    if (url === '/mesa' || url === '/mesa/minhas' || url === '/mesa/ativas') {
        if (typeof abrirModalEditarMesa === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/parts/modal_mesa.js';
            document.body.appendChild(script);
            console.log('✅ modal_mesa.js carregado');
        }
    }

    // ============================================
    // ===== MEUS PERSONAGENS (EDITOR) =====
    // ============================================
    if (url === '/meus-personagens' || url === '/personagens') {
        console.log('🎯 Carregando editor de ficha...');

        // Carregar editor_ficha.js
        if (typeof abrirEditorFicha === 'undefined') {
            const scriptEditor = document.createElement('script');
            scriptEditor.src = '/static/js/parts/editor_ficha.js';
            scriptEditor.onload = function() {
                console.log('✅ editor_ficha.js carregado');
            };
            document.body.appendChild(scriptEditor);
        }

        // Carregar modal_especializacao.js
        if (typeof abrirModalEspecializacao === 'undefined') {
            const scriptEspec = document.createElement('script');
            scriptEspec.src = '/static/js/parts/modal_especializacao.js';
            scriptEspec.onload = function() {
                console.log('✅ modal_especializacao.js carregado');
            };
            document.body.appendChild(scriptEspec);
        }

        // Garantir que meus_personagens.js está carregado
        if (typeof abrirFicha === 'undefined') {
            const scriptMeus = document.createElement('script');
            scriptMeus.src = '/static/js/parts/meus_personagens.js';
            document.body.appendChild(scriptMeus);
        }
    }
});

// ============================================
// FUNÇÃO GLOBAL PARA FECHAR PÁGINA
// ============================================

window.closePage = closePage;
window.logout = logout;
window.openWindow = openWindow;