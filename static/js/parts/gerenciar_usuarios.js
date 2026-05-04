let usuariosData = [];

function carregarUsuarios() {
    const container = document.getElementById('usuarios-table-container');
    container.innerHTML = '<div class="loading">Carregando usuários...</div>';

    fetch('/api/usuarios')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                usuariosData = data.usuarios;
                renderUsuarios(usuariosData);
            } else {
                container.innerHTML = `<div class="error">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="error">Erro ao carregar usuários</div>';
        });
}

function getNivelNome(nivel) {
    const niveis = {
        0: 'Espectador',
        1: 'Jogador',
        2: 'Narrador',
        3: 'Guardião',
        4: 'Moderador',
        5: 'Administrador'
    };
    return niveis[nivel] || `Nível ${nivel}`;
}

function getNivelClasse(nivel) {
    return `nivel-${nivel}`;
}

function renderUsuarios(usuarios) {
    const container = document.getElementById('usuarios-table-container');
    const filtro = document.getElementById('filtro-usuarios')?.value.toLowerCase() || '';

    const usuariosFiltrados = usuarios.filter(usuario =>
        usuario.username.toLowerCase().includes(filtro) ||
        usuario.email.toLowerCase().includes(filtro) ||
        (usuario.nome_social && usuario.nome_social.toLowerCase().includes(filtro))
    );

    if (usuariosFiltrados.length === 0) {
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

    usuariosFiltrados.forEach(usuario => {
        const ultimoAcesso = formatarData(usuario.ultimo_acesso);
        const dataCriacao = formatarData(usuario.data_criacao);
        const nivel = usuario.nivel_credencial || 1;
        const nivelNome = getNivelNome(nivel);
        const nivelClasse = getNivelClasse(nivel);

        html += `
            <div class="table-row">
                <div class="usuario-info">
                    <strong>${escapeHtml(usuario.username)}</strong>
                    <span class="status-badge ${usuario.ativo ? 'status-ativo' : 'status-inativo'}">
                        ${usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                <div class="usuario-email">${escapeHtml(usuario.email || '-')}</div>
                <div class="usuario-nome-social">${escapeHtml(usuario.nome_social || '-')}</div>
                <div class="usuario-ultimo-acesso">${ultimoAcesso}</div>
                <div class="usuario-data-criacao">${dataCriacao}</div>
                <div class="usuario-nivel">
                    <span class="nivel-badge ${nivelClasse}">${nivelNome}</span>
                </div>
                <div class="acoes">
                    <button class="btn-small btn-edit" onclick="editarUsuario(${usuario.id})">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirUsuario(${usuario.id}, '${escapeHtml(usuario.username).replace(/'/g, "\\'")}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function filtrarUsuarios() {
    renderUsuarios(usuariosData);
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
            <div class="modal-content">
                <div class="modal-body">
                    <form id="form-usuario-edit" onsubmit="atualizarUsuario(event, ${usuario.id})">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="edit-username">Username *</label>
                                <input type="text" id="edit-username" name="username" value="${escapeHtml(usuario.username || '')}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-email">Email *</label>
                                <input type="email" id="edit-email" name="email" value="${escapeHtml(usuario.email || '')}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-nome_real">Nome Real</label>
                                <input type="text" id="edit-nome_real" name="nome_real" value="${escapeHtml(usuario.nome_real || '')}">
                            </div>

                            <div class="form-group">
                                <label for="edit-nome_social">Nome Social</label>
                                <input type="text" id="edit-nome_social" name="nome_social" value="${escapeHtml(usuario.nome_social || '')}">
                            </div>

                            <div class="form-group">
                                <label for="edit-data_nascimento">Data Nascimento</label>
                                <input type="date" id="edit-data_nascimento" name="data_nascimento" value="${usuario.data_nascimento || ''}">
                            </div>

                            <div class="form-group">
                                <label for="edit-nivel_credencial">Nível Credencial *</label>
                                <select id="edit-nivel_credencial" name="nivel_credencial" required>
                                    <option value="0" ${usuario.nivel_credencial == 0 ? 'selected' : ''}>0 - Espectador</option>
                                    <option value="1" ${usuario.nivel_credencial == 1 ? 'selected' : ''}>1 - Jogador</option>
                                    <option value="2" ${usuario.nivel_credencial == 2 ? 'selected' : ''}>2 - Narrador</option>
                                    <option value="3" ${usuario.nivel_credencial == 3 ? 'selected' : ''}>3 - Guardião</option>
                                    <option value="4" ${usuario.nivel_credencial == 4 ? 'selected' : ''}>4 - Moderador</option>
                                    <option value="5" ${usuario.nivel_credencial == 5 ? 'selected' : ''}>5 - Administrador</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="edit-ativo">Status</label>
                                <select id="edit-ativo" name="ativo">
                                    <option value="true" ${usuario.ativo ? 'selected' : ''}>Ativo</option>
                                    <option value="false" ${!usuario.ativo ? 'selected' : ''}>Inativo</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="edit-avatar_url">URL do Avatar</label>
                                <input type="text" id="edit-avatar_url" name="avatar_url" value="${escapeHtml(usuario.avatar_url || '')}">
                            </div>

                            <div class="form-group">
                                <label for="edit-discord_id">Discord ID</label>
                                <input type="text" id="edit-discord_id" name="discord_id" value="${escapeHtml(usuario.discord_id || '')}">
                            </div>

                            <div class="form-group">
                                <label for="edit-fuso_horario">Fuso Horário</label>
                                <input type="text" id="edit-fuso_horario" name="fuso_horario" value="${escapeHtml(usuario.fuso_horario || '')}" placeholder="Ex: America/Sao_Paulo">
                            </div>

                            <div class="form-group full-width">
                                <label for="edit-bio">Biografia</label>
                                <textarea id="edit-bio" name="bio" rows="3">${escapeHtml(usuario.bio || '')}</textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Atualizar Usuário</button>
                        </div>
                    </form>
                </div>
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

function fecharModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('active');
    modalContainer.innerHTML = '';
}

function excluirPersonagem(personagemId, nome) {
    if (!confirm(`Tem certeza que deseja excluir o personagem "${nome}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
        return;
    }

    fetch(`/api/personagens/${personagemId}/excluir`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ Personagem excluído com sucesso!');
            location.reload(); // ou remover o card da lista
        } else {
            alert(`❌ Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao excluir personagem');
    });
}

// Inicialização automática
document.addEventListener('pageContentLoaded', function(e) {
    if (e.detail.url === '/gerenciar-usuarios' || document.getElementById('usuarios-table-container')) {
        carregarUsuarios();
        const filtro = document.getElementById('filtro-usuarios');
        if (filtro) filtro.addEventListener('keyup', filtrarUsuarios);
    }
});
