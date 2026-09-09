/**
 * meus_personagens.js - Visualização e edição de personagens
 */

// ============================================
// ABRIR FICHA (VISUALIZAÇÃO)
// ============================================

function abrirFicha(id) {
    const modal = document.getElementById('ficha-modal');
    const body = document.getElementById('ficha-modal-body');
    modal.classList.add('active');
    body.innerHTML = '<div class="loading">Carregando ficha...</div>';
    modal.classList.add('active', 'modal-large');
    
    fetch(`/personagem/${id}`)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.sheet-container');

            if (content) {
                body.innerHTML = content.innerHTML;

                if (!document.getElementById('ficha-modal-styles')) {
                    const link = document.createElement('link');
                    link.id = 'ficha-modal-styles';
                    link.rel = 'stylesheet';
                    link.href = '/static/css/parts/view_sheet.css';
                    document.head.appendChild(link);

                    const linkItems = document.createElement('link');
                    linkItems.rel = 'stylesheet';
                    linkItems.href = '/static/css/parts/items.css';
                    document.head.appendChild(linkItems);

                    const linkExp = document.createElement('link');
                    linkExp.rel = 'stylesheet';
                    linkExp.href = '/static/css/parts/progressao_exp.css';
                    document.head.appendChild(linkExp);
                }

                const tabBtns = body.querySelectorAll('.tab-btn');
                const tabContents = body.querySelectorAll('.tab-content');

                tabBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const tabId = btn.dataset.tab;
                        tabBtns.forEach(b => b.classList.remove('active'));
                        tabContents.forEach(t => t.classList.remove('active'));
                        btn.classList.add('active');
                        const target = body.querySelector(`#tab-${tabId}`);
                        if (target) target.classList.add('active');
                    });
                });
            } else {
                body.innerHTML = '<div class="error">Erro ao carregar ficha</div>';
            }
        })
        .catch(error => {
            body.innerHTML = '<div class="error">Erro ao carregar ficha</div>';
            console.error('Erro:', error);
        });
}

// ============================================
// EDITAR PERSONAGEM (ABRE MODAL)
// ============================================

function editarPersonagem(id) {
    console.log('📝 Editando personagem ID:', id);
    
    if (typeof abrirEditorFicha === 'function') {
        abrirEditorFicha(id);
    } else {
        console.error('❌ abrirEditorFicha não encontrado');
        alert('Erro ao abrir editor. Recarregue a página e tente novamente.');
    }
}

// ============================================
// EXCLUIR PERSONAGEM
// ============================================

function excluirPersonagem(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
        return;
    }

    fetch(`/api/personagens/${id}/excluir`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ Personagem excluído com sucesso!');
            location.reload();
        } else {
            alert(`❌ Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir personagem');
    });
}

// ============================================
// FECHAR MODAL
// ============================================

function fecharModal() {
    const modal = document.getElementById('ficha-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModal();
            // Se o editor estiver aberto, fechar também
            if (typeof fecharEditorFicha === 'function') {
                const editor = document.getElementById('modal-editor-ficha');
                if (editor && editor.classList.contains('active')) {
                    fecharEditorFicha();
                }
            }
        }
    });
});

// ============================================
// EXPORT (para uso em outros contextos)
// ============================================

window.abrirFicha = abrirFicha;
window.editarPersonagem = editarPersonagem;
window.excluirPersonagem = excluirPersonagem;
window.fecharModal = fecharModal;