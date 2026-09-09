// gerenciar_usuarios.js - Gerenciamento completo de usuários

let usuariosData = [];
let usuariosFiltrados = [];

// ============================================
// CARREGAR USUÁRIOS
// ============================================

function carregarUsuarios() {
    const container = document.getElementById('usuarios-table-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando usuários...</div>';

    fetch('/api/usuarios')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                usuariosData = data.usuarios;
                usuariosFiltrados = [...usuariosData];
                renderUsuarios(usuariosFiltrados);
                document.getElementById('total-usuarios').textContent = `${usuariosData.length} usuários`;
            } else {
                container.innerHTML = `<div class="error">❌ ${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">❌ Erro ao carregar usuários</div>';
        });
}

// ============================================
// RENDERIZAR USUÁRIOS
// ============================================

function renderUsuarios(usuarios) {
    const container = document.getElementById('usuarios-table-container');
    if (!container) return;

    if (usuarios.length === 0) {
        container.innerHTML = '<div class="empty">Nenhum usuário encontrado</div>';
        return;
    }

    let html = `
        <div class="usuarios-table">
            <div class="table-header">
                <div>Usuário</div>
                <div>Email</div>
                <div>Nome Social</div>
                <div>Último Acesso</div>
                <div>Data Criação</div>
                <div>Nível</div>
                <div>Ações</div>
            </div>
    `;

    usuarios.forEach(usuario => {
        const ultimoAcesso = formatarData(usuario.ultimo_acesso);
        const dataCriacao = formatarData(usuario.data_criacao);
        const nivel = usuario.nivel_credencial || 1;
        const nivelNome = getNivelNome(nivel);
        const nivelClasse = getNivelClasse(nivel);
        const statusClass = usuario.ativo ? 'status-ativo' : 'status-inativo';
        const statusText = usuario.ativo ? 'Ativo' : 'Inativo';

        html += `
            <div class="table-row" data-id="${usuario.id}">
                <div class="usuario-info">
                    <strong>${escapeHtml(usuario.username)}</strong>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="usuario-email">${escapeHtml(usuario.email || '-')}</div>
                <div class="usuario-nome-social">${escapeHtml(usuario.nome_social || '-')}</div>
                <div class="usuario-ultimo-acesso">${ultimoAcesso}</div>
                <div class="usuario-data-criacao">${dataCriacao}</div>
                <div class="usuario-nivel">
                    <span class="nivel-badge ${nivelClasse}">${nivelNome}</span>
                </div>
                <div class="acoes">
                    <button class="btn-small btn-edit" onclick="editarUsuario(${usuario.id})" title="Editar usuário">✏️</button>
                    <button class="btn-small btn-promote" onclick="promoverUsuario(${usuario.id})" title="Promover nível">⬆️</button>
                    <button class="btn-small btn-demote" onclick="rebaixarUsuario(${usuario.id})" title="Rebaixar nível">⬇️</button>
                    <button class="btn-small btn-delete" onclick="excluirUsuario(${usuario.id}, '${escapeHtml(usuario.username).replace(/'/g, "\\'")}')" title="Excluir usuário">🗑️</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// FILTROS
// ============================================

function aplicarFiltros() {
    const search = document.getElementById('filtro-usuarios').value.toLowerCase();
    const nivel = document.getElementById('filtro-nivel').value;
    const status = document.getElementById('filtro-status').value;

    usuariosFiltrados = usuariosData.filter(usuario => {
        const matchSearch = usuario.username.toLowerCase().includes(search) ||
                           usuario.email.toLowerCase().includes(search) ||
                           (usuario.nome_social && usuario.nome_social.toLowerCase().includes(search));
        const matchNivel = nivel === '' || usuario.nivel_credencial == parseInt(nivel);
        const matchStatus = status === '' || usuario.ativo == (status === '1');
        return matchSearch && matchNivel && matchStatus;
    });

    renderUsuarios(usuariosFiltrados);
    document.getElementById('total-usuarios').textContent = `${usuariosFiltrados.length} usuários`;
}

// ============================================
// UTILITÁRIOS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatarData(dataString) {
    if (!dataString) return 'Nunca';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString;
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getNivelNome(nivel) {
    const niveis = {
        0: 'Espectador', 1: 'Jogador', 2: 'Veterano', 3: 'Parceiro',
        4: 'VIP', 5: 'Narrador', 6: 'Guardião', 7: 'Moderador',
        8: 'Desenvolvedor', 9: 'Administrador'
    };
    return niveis[nivel] || `Nível ${nivel}`;
}

function getNivelClasse(nivel) {
    return `nivel-${nivel}`;
}

// ============================================
// AÇÕES: PROMOVER / REBAIXAR
// ============================================

function promoverUsuario(usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    if (!usuario) return;

    if (usuario.nivel_credencial >= 9) {
        alert('⚠️ Este usuário já está no nível máximo (Administrador)');
        return;
    }

    if (usuario.nivel_credencial >= 8 && window.currentUserNivel < 9) {
        alert('⚠️ Apenas Administradores (Nível 9) podem promover para Desenvolvedor ou acima');
        return;
    }

    if (!confirm(`Promover ${usuario.username} para ${getNivelNome(usuario.nivel_credencial + 1)}?`)) return;

    fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel_credencial: usuario.nivel_credencial + 1 })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ ${usuario.username} promovido com sucesso!`);
            carregarUsuarios();
        } else {
            alert(`❌ Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao promover usuário');
    });
}

function rebaixarUsuario(usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    if (!usuario) return;

    if (usuario.nivel_credencial <= 0) {
        alert('⚠️ Este usuário já está no nível mínimo (Espectador)');
        return;
    }

    if (!confirm(`Rebaixar ${usuario.username} para ${getNivelNome(usuario.nivel_credencial - 1)}?`)) return;

    fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel_credencial: usuario.nivel_credencial - 1 })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ ${usuario.username} rebaixado com sucesso!`);
            carregarUsuarios();
        } else {
            alert(`❌ Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao rebaixar usuário');
    });
}

// ============================================
// AÇÕES: EDITAR
// ============================================

function editarUsuario(usuarioId) {
    fetch(`/api/usuarios/${usuarioId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                abrirModalEdicaoUsuario(data.usuario);
            } else {
                alert(`❌ ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao carregar usuário');
        });
}

function abrirModalEdicaoUsuario(usuario) {
    const modalHTML = `
        <div class="modal active">
            <div class="modal-header">
                <h3>✏️ Editar Usuário: ${escapeHtml(usuario.username)}</h3>
                <button class="modal-close" onclick="fecharModal()">✕</button>
            </div>
            <div class="modal-body">
                <form id="form-usuario-edit" onsubmit="atualizarUsuario(event, ${usuario.id})">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-username">Username *</label>
                            <input type="text" id="edit-username" name="username" class="form-control" value="${escapeHtml(usuario.username || '')}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email *</label>
                            <input type="email" id="edit-email" name="email" class="form-control" value="${escapeHtml(usuario.email || '')}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-nome_real">Nome Real</label>
                            <input type="text" id="edit-nome_real" name="nome_real" class="form-control" value="${escapeHtml(usuario.nome_real || '')}">
                        </div>
                        <div class="form-group">
                            <label for="edit-nome_social">Nome Social</label>
                            <input type="text" id="edit-nome_social" name="nome_social" class="form-control" value="${escapeHtml(usuario.nome_social || '')}">
                        </div>
                        <div class="form-group">
                            <label for="edit-data_nascimento">Data Nascimento</label>
                            <input type="date" id="edit-data_nascimento" name="data_nascimento" class="form-control" value="${usuario.data_nascimento || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-nivel_credencial">Nível *</label>
                            <select id="edit-nivel_credencial" name="nivel_credencial" class="form-control" required>
                                ${[0,1,2,3,4,5,6,7,8,9].map(n => `
                                    <option value="${n}" ${usuario.nivel_credencial == n ? 'selected' : ''}>${n} - ${getNivelNome(n)}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-ativo">Status</label>
                            <select id="edit-ativo" name="ativo" class="form-control">
                                <option value="true" ${usuario.ativo ? 'selected' : ''}>Ativo</option>
                                <option value="false" ${!usuario.ativo ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-avatar_url">Avatar URL</label>
                            <input type="text" id="edit-avatar_url" name="avatar_url" class="form-control" value="${escapeHtml(usuario.avatar_url || '')}">
                        </div>
                        <div class="form-group">
                            <label for="edit-discord_id">Discord ID</label>
                            <input type="text" id="edit-discord_id" name="discord_id" class="form-control" value="${escapeHtml(usuario.discord_id || '')}">
                        </div>
                        <div class="form-group full-width">
                            <label for="edit-bio">Biografia</label>
                            <textarea id="edit-bio" name="bio" class="form-control" rows="3">${escapeHtml(usuario.bio || '')}</textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Atualizar Usuário</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = modalHTML;
    modalContainer.classList.add('active');
}

function atualizarUsuario(event, usuarioId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.ativo = data.ativo === 'true';
    data.nivel_credencial = parseInt(data.nivel_credencial);

    fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Usuário atualizado com sucesso!');
            fecharModal();
            carregarUsuarios();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao atualizar usuário');
    });
}

// ============================================
// AÇÕES: EXCLUIR
// ============================================

function excluirUsuario(usuarioId, username) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
        return;
    }

    fetch(`/api/usuarios/${usuarioId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('✅ Usuário excluído com sucesso!');
            carregarUsuarios();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir usuário');
    });
}

// ============================================
// MODAL CONTROLS
// ============================================

function fecharModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('active');
    modalContainer.innerHTML = '';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fecharModal();
});

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    carregarUsuarios();

    document.getElementById('filtro-usuarios')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') aplicarFiltros();
    });
});

// ============================================
// EXPORT
// ============================================

window.carregarUsuarios = carregarUsuarios;
window.aplicarFiltros = aplicarFiltros;
window.editarUsuario = editarUsuario;
window.excluirUsuario = excluirUsuario;
window.promoverUsuario = promoverUsuario;
window.rebaixarUsuario = rebaixarUsuario;
window.fecharModal = fecharModal;