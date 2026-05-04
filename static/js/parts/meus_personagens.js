function abrirFicha(id) {
    const modal = document.getElementById('ficha-modal');
    const body = document.getElementById('ficha-modal-body');
    modal.classList.add('active');
    body.innerHTML = '<div class="loading">Carregando ficha...</div>';

    fetch(`/personagem/${id}`)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.sheet-container');

            if (content) {
                body.innerHTML = content.innerHTML;

                // Adicionar CSS dinamicamente se não existir
                if (!document.getElementById('ficha-modal-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'ficha-modal-styles';
                    // Extrair CSS do documento original
                    const originalStyle = doc.querySelector('style');
                    if (originalStyle) {
                        styles.textContent = originalStyle.textContent;
                    } else {
                        // CSS fallback (copiar do view_sheet.html)
                        styles.textContent = `
                            .sheet-container { max-width: 1100px; margin: 0 auto; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-light); overflow: hidden; }
                            .tabs { display: flex; background: var(--bg-secondary); border-bottom: 1px solid var(--border-light); }
                            .tab-btn { flex: 1; padding: 16px 24px; background: none; border: none; color: var(--text-secondary); font-weight: bold; cursor: pointer; }
                            .tab-btn.active { color: var(--primary); border-bottom: 2px solid var(--primary); background: var(--bg-tertiary); }
                            .tab-content { display: none; }
                            .tab-content.active { display: block; }
                            .ficha-inner, .verso-inner { padding: 28px 32px; }
                            .top-row { display: grid; grid-template-columns: 2fr 1fr 1.5fr 1.5fr 2fr 1.5fr; gap: 12px; margin-bottom: 28px; border-bottom: 2px solid var(--border-light); padding-bottom: 16px; }
                            .field { display: flex; flex-direction: column; }
                            .field-label { font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; }
                            .field-value { font-weight: bold; font-size: 0.9rem; border-bottom: 1px solid var(--border-light); padding: 4px 0; color: var(--primary); }
                            .atributos-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 28px; }
                            .atributo-card { background: var(--bg-tertiary); border-radius: 12px; padding: 12px 8px; text-align: center; border: 1px solid var(--border-light); }
                            .atributo-valor { font-size: 1.8rem; font-weight: bold; color: var(--primary); }
                            .testes-combate-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
                            .testes-box, .combate-box { background: var(--bg-tertiary); border-radius: 12px; padding: 16px; }
                            .testes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                            .pericias-tecnicas-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
                            .lista-box { background: var(--bg-tertiary); border-radius: 12px; padding: 16px; }
                            .corpo-vital-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                            .verso-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                            @media (max-width: 800px) {
                                .top-row { grid-template-columns: repeat(3, 1fr); }
                                .atributos-row { grid-template-columns: repeat(3, 1fr); }
                                .testes-combate-row { grid-template-columns: 1fr; }
                                .pericias-tecnicas-row { grid-template-columns: 1fr; }
                                .corpo-vital-row { grid-template-columns: 1fr; }
                                .verso-grid { grid-template-columns: 1fr; }
                            }
                        `;
                    }
                    document.head.appendChild(styles);
                }

                // Re-inicializar tabs
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

function editarPersonagem(id) {
    // Redirecionar para página de edição (criar-ficha com modo edição)
    window.location.href = `/criar-ficha?id=${id}&edit=true`;
}

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

function fecharModal() {
    const modal = document.getElementById('ficha-modal');
    modal.classList.remove('active');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') fecharModal();
    });
});