// view_sheet.js - Tabs e modal EXP da ficha

function initViewSheetTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// EXP Modal
function openExpModal() {
    const modal = document.getElementById('modal-exp');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Inicializar sistema de EXP se não estiver
        if (typeof initProgressaoExp === 'function') {
            const expData = window.expData || { disponivel: 0, valoresBase: {} };
            initProgressaoExp(expData.disponivel, expData.valoresBase);
        }
    }
}

function closeExpModal() {
    const modal = document.getElementById('modal-exp');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Fechar com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeExpModal();
});

// Fechar ao clicar no overlay
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-exp');
    if (e.target === modal) closeExpModal();
});

function initExpModal() {
    const modal = document.getElementById('modal-exp');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeExpModal();
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initViewSheetTabs();
    initExpModal();
});

// Exportar funções globais
window.openExpModal = openExpModal;
window.closeExpModal = closeExpModal;