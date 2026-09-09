/**
 * gerenciar_mesas.js - Gerenciamento de mesas para admin (Nível 7+)
 */

(function() {
    if (window._gerenciarMesasLoaded) return;
    window._gerenciarMesasLoaded = true;

    let mesasData = [];

    // ============================================
    // DOM REFERENCES
    // ============================================

    function getEl(id) { return document.getElementById(id); }

    const container = getEl('mesas-list');
    const filtroInput = getEl('filtro-mesas');
    const filtroStatus = getEl('filtro-status-mesa');
    const btnAtualizar = getEl('btn-atualizar-mesas');

    const modalEditar = getEl('modal-editar-mesa');
    const btnFecharModal = getEl('btn-fechar-modal-mesa');
    const btnCancelarEdicao = getEl('btn-cancelar-edicao-mesa');
    const btnSalvarEdicao = getEl('btn-salvar-edicao-mesa');

    const editId = getEl('edit-mesa-id');
    const editNome = getEl('edit-mesa-nome');
    const editDescricao = getEl('edit-mesa-descricao');
    const editStatus = getEl('edit-mesa-status');

    // ============================================
    // UTILITÁRIOS
    // ============================================

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getStatusText(ativa) {
        if (ativa === true || ativa === 1) return '🟢 Ativa';
        return '🔴 Inativa';
    }

    function getStatusClass(ativa) {
        if (ativa === true || ativa === 1) return 'status-ativo';
        return 'status-inativo';
    }

    // ============================================
    // CARREGAR MESAS
    // ============================================

    function carregarMesasAdmin() {
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando mesas...</div>';

        fetch('/mesa/api/admin/todas')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    mesasData = data.mesas;
                    renderMesasAdmin(mesasData);
                } else {
                    container.innerHTML = `<div class="error">❌ ${escapeHtml(data.message)}</div>`;
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                container.innerHTML = '<div class="error">❌ Erro ao carregar mesas</div>';
            });
    }

    // ============================================
    // RENDERIZAR MESAS
    // ============================================

    function renderMesasAdmin(mesas) {
        if (!container) return;

        const filtro = filtroInput?.value.toLowerCase() || '';
        const filtroStatusVal = filtroStatus?.value || '';

        const filtradas = mesas.filter(m => {
            const matchNome = m.nome.toLowerCase().includes(filtro);
            const matchStatus = !filtroStatusVal || (m.ativa == (filtroStatusVal === '1'));
            return matchNome && matchStatus;
        });

        if (filtradas.length === 0) {
            container.innerHTML = '<div class="empty">Nenhuma mesa encontrada</div>';
            return;
        }

        let html = '';
        filtradas.forEach(m => {
            const statusText = getStatusText(m.ativa);
            const statusClass = getStatusClass(m.ativa);

            html += `
                <div class="mesa-card" data-id="${m.id}">
                    <div class="mesa-card-header">
                        <h3>${escapeHtml(m.nome)}</h3>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="mesa-card-body">
                        <p>${escapeHtml(m.descricao || 'Sem descrição')}</p>
                        <div class="mesa-stats">
                            <span>👥 Jogadores: ${m.participantes_atual || 0}/${m.capacidade || 5}</span>
                            <span>👁️ Espectadores: ${m.espectadores_atual || 0}</span>
                            <span>🎭 Narrador: ${escapeHtml(m.narrador_nome || 'Desconhecido')}</span>
                            <span>📅 Criada: ${m.data_criacao || '-'}</span>
                        </div>
                    </div>
                    <div class="mesa-card-footer">
                        <button class="btn-edit" data-id="${m.id}" data-action="editar">✏️ Editar</button>
                        <button class="btn-delete" data-id="${m.id}" data-action="excluir" data-nome="${escapeHtml(m.nome).replace(/'/g, "\\'")}">🗑️ Excluir</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Event listeners para os botões
        container.querySelectorAll('[data-action="editar"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                abrirModalEditarMesaAdmin(id);
            });
        });

        container.querySelectorAll('[data-action="excluir"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const nome = this.dataset.nome;
                excluirMesaAdmin(id, nome);
            });
        });
    }

    // ============================================
    // AÇÕES: EDITAR
    // ============================================

    function abrirModalEditarMesaAdmin(mesaId) {
        const mesa = mesasData.find(m => m.id === mesaId);
        if (!mesa) {
            alert('❌ Mesa não encontrada');
            return;
        }

        editId.value = mesaId;
        editNome.value = mesa.nome || '';
        editDescricao.value = mesa.descricao || '';
        editStatus.value = mesa.ativa ? 1 : 0;

        modalEditar.style.display = 'flex';
        modalEditar.classList.add('active');
    }

    function fecharModalEditarMesaAdmin() {
        modalEditar.style.display = 'none';
        modalEditar.classList.remove('active');
    }

    function salvarEdicaoMesaAdmin() {
        const id = parseInt(editId.value);
        const data = {
            nome: editNome.value.trim(),
            descricao: editDescricao.value.trim(),
            ativa: editStatus.value === '1'
        };

        if (!data.nome) {
            alert('⚠️ Nome é obrigatório');
            return;
        }

        btnSalvarEdicao.disabled = true;
        btnSalvarEdicao.textContent = 'Salvando...';

        fetch(`/mesa/api/admin/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('✅ Mesa atualizada com sucesso!');
                fecharModalEditarMesaAdmin();
                carregarMesasAdmin();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao atualizar mesa');
        })
        .finally(() => {
            btnSalvarEdicao.disabled = false;
            btnSalvarEdicao.textContent = 'Salvar';
        });
    }

    // ============================================
    // AÇÕES: EXCLUIR
    // ============================================

    function excluirMesaAdmin(mesaId, nome) {
        if (!confirm(`⚠️ Tem certeza que deseja excluir a mesa "${nome}"?\n\nEsta ação NÃO pode ser desfeita!\nTodos os dados da mesa serão perdidos.`)) {
            return;
        }

        fetch(`/mesa/api/admin/${mesaId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('✅ Mesa excluída com sucesso!');
                carregarMesasAdmin();
            } else {
                alert(`❌ Erro: ${result.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao excluir mesa');
        });
    }

    // ============================================
    // FILTROS AO VIVO
    // ============================================

    if (filtroInput) {
        filtroInput.addEventListener('input', function() {
            renderMesasAdmin(mesasData);
        });
    }

    if (filtroStatus) {
        filtroStatus.addEventListener('change', function() {
            renderMesasAdmin(mesasData);
        });
    }

    // ============================================
    // EVENT LISTENERS MODAL
    // ============================================

    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', fecharModalEditarMesaAdmin);
    }

    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', fecharModalEditarMesaAdmin);
    }

    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', salvarEdicaoMesaAdmin);
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', carregarMesasAdmin);
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') fecharModalEditarMesaAdmin();
    });

    // Fechar modal ao clicar no overlay
    if (modalEditar) {
        modalEditar.addEventListener('click', function(e) {
            if (e.target === this) fecharModalEditarMesaAdmin();
        });
    }

    // ============================================
    // EXPORT
    // ============================================

    window.carregarMesasAdmin = carregarMesasAdmin;
    window.renderMesasAdmin = renderMesasAdmin;
    window.abrirModalEditarMesaAdmin = abrirModalEditarMesaAdmin;
    window.fecharModalEditarMesaAdmin = fecharModalEditarMesaAdmin;
    window.salvarEdicaoMesaAdmin = salvarEdicaoMesaAdmin;
    window.excluirMesaAdmin = excluirMesaAdmin;

    console.log('📊 GerenciarMesas.js carregado com sucesso!');
})();