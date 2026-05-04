// main.js - Navegação do sistema de abas

let currentPage = null;

const pages = {
    'todos_personagens': { title: '👥 Galeria de Personagens', url: '/personagens' },
    'criar_personagem': { title: '➕ Criar Personagem', url: '/criar-ficha' },
    'meus_personagens': { title: '📋 Meus Personagens', url: '/meus-personagens' },
    'mesas': { title: '🎲 Mesas Ativas', url: '/mesa' },
    'minhas_mesas': { title: '👑 Minhas Mesas', url: '/mesas/minhas' },
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
            <div class="welcome-message">
                <h2>✨ Bem-vindo ao Thaolundra RPG</h2>
                <p>Selecione uma opção no menu lateral para começar</p>
                <div class="quick-stats">
                    <p>Sistema de gerenciamento de campanhas de RPG</p>
                </div>
            </div>
        `;
    }
    currentPage = null;
}

function openWindow(windowType) {
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

    fetch(url)
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
                const newScript = document.createElement('script');
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                document.body.appendChild(newScript);
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
    currentPage = null;
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        window.location.href = '/logout';
    }
}