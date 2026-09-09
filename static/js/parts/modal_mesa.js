// modal_mesa.js - Modal completo de gerenciamento da mesa

let mesaEditandoId = null;

// ============================================
// TABS
// ============================================

function trocarTabMesa(tab) {
    document.querySelectorAll('.modal-mesa-tabs button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });
}

// ============================================
// UPLOAD DE IMAGEM
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('mesa-imagem-upload');
    const preview = document.getElementById('upload-preview');
    const placeholder = document.getElementById('upload-placeholder');
    const previewImg = document.getElementById('upload-preview-img');
    const hiddenInput = document.getElementById('mesa-imagem');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', function(e) {
        if (e.target.closest('.upload-remove')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) processarArquivo(file);
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) processarArquivo(file);
    });

    function processarArquivo(file) {
        const tipos = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
        if (!tipos.includes(file.type)) {
            alert('⚠️ Formato não suportado. Use PNG, JPG, WEBP ou GIF.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ Imagem muito grande. Máximo 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            previewImg.src = base64;
            placeholder.style.display = 'none';
            preview.style.display = 'block';
            hiddenInput.value = base64;
            atualizarPreviewImagem(base64);
        };
        reader.readAsDataURL(file);
    }

    window.removerImagem = function() {
        preview.style.display = 'none';
        placeholder.style.display = 'block';
        hiddenInput.value = '';
        fileInput.value = '';
        atualizarPreviewImagem('');
    };
});

// ============================================
// ABRIR MODAL
// ============================================

function abrirModalCriarMesa() {
    mesaEditandoId = null;

    // Verificar se os elementos existem antes de acessar
    const titleText = document.getElementById('modal-mesa-title-text');
    const btnExcluir = document.getElementById('btn-excluir-mesa');
    const formMesa = document.getElementById('form-mesa');
    const mesaId = document.getElementById('mesa-id');
    const mesaImagem = document.getElementById('mesa-imagem');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const imagePreview = document.getElementById('mesa-image-preview');
    const dataCriacao = document.getElementById('mesa-data-criacao');
    const dataAtualizacao = document.getElementById('mesa-data-atualizacao');
    const mesaIdDisplay = document.getElementById('mesa-id-display');
    const toggleAtiva = document.getElementById('toggle-mesa-ativa');
    const togglePrivada = document.getElementById('toggle-mesa-privada');
    const labelAtiva = document.getElementById('label-toggle-mesa-ativa');
    const labelPrivada = document.getElementById('label-toggle-mesa-privada');
    const senhasArea = document.getElementById('mesa-senhas-area');

    if (titleText) titleText.textContent = 'Criar Mesa';
    if (btnExcluir) btnExcluir.style.display = 'none';
    if (formMesa) formMesa.reset();
    if (mesaId) mesaId.value = '';
    if (mesaImagem) mesaImagem.value = '';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
    if (imagePreview) imagePreview.innerHTML = '<div class="placeholder">🖼️ Nenhuma imagem selecionada</div>';
    if (dataCriacao) dataCriacao.textContent = '--';
    if (dataAtualizacao) dataAtualizacao.textContent = '--';
    if (mesaIdDisplay) mesaIdDisplay.textContent = '--';

    if (toggleAtiva) toggleAtiva.classList.add('active');
    if (togglePrivada) togglePrivada.classList.remove('active');
    if (labelAtiva) labelAtiva.textContent = 'Ativa';
    if (labelPrivada) labelPrivada.textContent = 'Pública';
    if (senhasArea) senhasArea.style.display = 'none';

    const modal = document.getElementById('modal-mesa');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function abrirModalEditarMesa(mesaId) {
    mesaEditandoId = mesaId;

    const titleText = document.getElementById('modal-mesa-title-text');
    const btnExcluir = document.getElementById('btn-excluir-mesa');

    if (titleText) titleText.textContent = 'Editar Mesa';
    if (btnExcluir) btnExcluir.style.display = 'block';

    fetch(`/mesa/api/${mesaId}/dados`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const mesa = data.mesa;

                const mesaIdEl = document.getElementById('mesa-id');
                const mesaIdDisplay = document.getElementById('mesa-id-display');
                const nomeEl = document.getElementById('mesa-nome');
                const descricaoEl = document.getElementById('mesa-descricao');
                const capJogadores = document.getElementById('mesa-capacidade-jogadores');
                const capEspectadores = document.getElementById('mesa-capacidade-espectadores');
                const dataCriacao = document.getElementById('mesa-data-criacao');
                const dataAtualizacao = document.getElementById('mesa-data-atualizacao');
                const mesaImagem = document.getElementById('mesa-imagem');
                const uploadPreviewImg = document.getElementById('upload-preview-img');
                const uploadPlaceholder = document.getElementById('upload-placeholder');
                const uploadPreview = document.getElementById('upload-preview');

                if (mesaIdEl) mesaIdEl.value = mesa.id;
                if (mesaIdDisplay) mesaIdDisplay.textContent = '#' + mesa.id;
                if (nomeEl) nomeEl.value = mesa.nome || '';
                if (descricaoEl) descricaoEl.value = mesa.descricao || '';
                if (capJogadores) capJogadores.value = mesa.capacidade || 6;
                if (capEspectadores) capEspectadores.value = mesa.capacidade_espectadores || 10;
                if (dataCriacao) dataCriacao.textContent = mesa.data_criacao || '--';
                if (dataAtualizacao) dataAtualizacao.textContent = mesa.data_atualizacao || '--';

                if (mesa.imagem_fundo) {
                    if (mesaImagem) mesaImagem.value = mesa.imagem_fundo;
                    if (uploadPreviewImg) uploadPreviewImg.src = mesa.imagem_fundo;
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                    if (uploadPreview) uploadPreview.style.display = 'block';
                    atualizarPreviewImagem(mesa.imagem_fundo);
                }

                const toggleAtiva = document.getElementById('toggle-mesa-ativa');
                const labelAtiva = document.getElementById('label-toggle-mesa-ativa');
                if (mesa.ativa) {
                    if (toggleAtiva) toggleAtiva.classList.add('active');
                    if (labelAtiva) labelAtiva.textContent = 'Ativa';
                } else {
                    if (toggleAtiva) toggleAtiva.classList.remove('active');
                    if (labelAtiva) labelAtiva.textContent = 'Inativa';
                }

                const togglePrivada = document.getElementById('toggle-mesa-privada');
                const labelPrivada = document.getElementById('label-toggle-mesa-privada');
                const senhasArea = document.getElementById('mesa-senhas-area');
                const senhaJogadores = document.getElementById('mesa-senha-jogadores');
                const senhaEspectadores = document.getElementById('mesa-senha-espectadores');

                if (mesa.privada) {
                    if (togglePrivada) togglePrivada.classList.add('active');
                    if (labelPrivada) labelPrivada.textContent = 'Privada';
                    if (senhasArea) senhasArea.style.display = 'block';
                    if (senhaJogadores) senhaJogadores.value = mesa.senha_jogadores || '';
                    if (senhaEspectadores) senhaEspectadores.value = mesa.senha_espectadores || '';
                } else {
                    if (togglePrivada) togglePrivada.classList.remove('active');
                    if (labelPrivada) labelPrivada.textContent = 'Pública';
                    if (senhasArea) senhasArea.style.display = 'none';
                }

                carregarMembros(mesaId);
                carregarInstancias(mesaId);

                const modal = document.getElementById('modal-mesa');
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('❌ Erro ao carregar dados da mesa');
        });
}

// ============================================
// FECHAR MODAL
// ============================================

function fecharModalMesa() {
    document.getElementById('modal-mesa').classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-mesa');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) fecharModalMesa();
        });
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fecharModalMesa();
});

// ============================================
// TOGGLES
// ============================================

function toggleMesaSwitch(id) {
    const el = document.getElementById(id);
    const labelId = 'label-' + id;
    const label = document.getElementById(labelId);
    el.classList.toggle('active');

    if (id === 'toggle-mesa-privada') {
        const isPrivate = el.classList.contains('active');
        document.getElementById('mesa-senhas-area').style.display = isPrivate ? 'block' : 'none';
        label.textContent = isPrivate ? 'Privada' : 'Pública';
    } else if (id === 'toggle-mesa-ativa') {
        label.textContent = el.classList.contains('active') ? 'Ativa' : 'Inativa';
    }
}

function revelarSenhaMesa(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ============================================
// PREVIEW DA IMAGEM
// ============================================

function atualizarPreviewImagem(url) {
    const preview = document.getElementById('mesa-image-preview');
    if (!preview) return;
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>❌ Erro ao carregar imagem</div>'">`;
    } else {
        preview.innerHTML = '<div class="placeholder">🖼️ Nenhuma imagem selecionada</div>';
    }
}

// ============================================
// MEMBROS
// ============================================

function carregarMembros(mesaId) {
    fetch(`/mesa/api/${mesaId}/membros`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const lista = document.getElementById('membros-lista');
                const count = document.getElementById('membros-count');
                lista.innerHTML = '';

                if (data.membros.length === 0) {
                    lista.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhum membro na mesa</div>';
                    count.textContent = '0 membros';
                    return;
                }

                data.membros.forEach(membro => {
                    const statusClass = membro.online ? 'online' : (membro.convite_aceito ? 'offline' : 'pendente');
                    const statusLabel = membro.online ? 'Online' : (membro.convite_aceito ? 'Offline' : 'Pendente');
                    const papelClass = membro.papel.toLowerCase();
                    const avatar = membro.username.charAt(0).toUpperCase();

                    const item = document.createElement('div');
                    item.className = 'membro-item';
                    if (statusClass === 'pendente') {
                        item.style.borderColor = 'var(--warning)';
                        item.style.borderStyle = 'dashed';
                    }
                    item.innerHTML = `
                        <div class="membro-info">
                            <div class="membro-avatar">${avatar}</div>
                            <span class="membro-nome">${membro.username}</span>
                            <span class="membro-status ${statusClass}">${statusLabel}</span>
                            <span class="membro-papel ${papelClass}">${membro.papel}</span>
                        </div>
                        <div class="membro-actions">
                            ${membro.papel !== 'Narrador' ? `
                                <button class="promover" onclick="promoverMembro(${membro.id})" title="Promover">⬆</button>
                                ${membro.papel !== 'Espectador' ? `<button class="rebaixar" onclick="rebaixarMembro(${membro.id})" title="Rebaixar">⬇</button>` : ''}
                            ` : ''}
                            <button class="remover" onclick="removerMembro(${membro.id})" title="Remover">🗑️</button>
                        </div>
                    `;
                    lista.appendChild(item);
                });

                count.textContent = data.membros.length + ' membros';
            }
        })
        .catch(error => console.error('Erro ao carregar membros:', error));
}

function adicionarMembro() {
    const input = document.getElementById('input-add-usuario');
    const papel = document.getElementById('select-papel');
    const nome = input.value.trim();

    if (!nome) {
        alert('Digite um nome de usuário');
        return;
    }
    if (!mesaEditandoId) {
        alert('Erro: ID da mesa não encontrado');
        return;
    }

    fetch('/mesa/api/convites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mesa_id: mesaEditandoId,
            username: nome,
            papel: papel.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ Convite enviado!');
            input.value = '';
            carregarMembros(mesaEditandoId);
        } else {
            alert('❌ ' + data.message);
        }
    })
    .catch(error => alert('❌ Erro ao enviar convite'));
}

function removerMembro(membroId) {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;
    fetch(`/mesa/api/membros/${membroId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) carregarMembros(mesaEditandoId);
            else alert('❌ ' + data.message);
        })
        .catch(error => alert('❌ Erro ao remover membro'));
}

function promoverMembro(membroId) {
    if (!confirm('Promover este membro para Narrador?')) return;
    fetch(`/mesa/api/membros/${membroId}/promover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novo_papel: 'Narrador' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) carregarMembros(mesaEditandoId);
        else alert('❌ ' + data.message);
    })
    .catch(error => alert('❌ Erro ao promover membro'));
}

function rebaixarMembro(membroId) {
    if (!confirm('Rebaixar este membro para Espectador?')) return;
    fetch(`/mesa/api/membros/${membroId}/rebaixar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novo_papel: 'Espectador' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) carregarMembros(mesaEditandoId);
        else alert('❌ ' + data.message);
    })
    .catch(error => alert('❌ Erro ao rebaixar membro'));
}

// ============================================
// INSTÂNCIAS
// ============================================

// Usar as funções globais getFonteSlug e getFonteClass (definidas no mesa.js)

function carregarInstancias(mesaId) {
    fetch(`/mesa/api/${mesaId}/instancias`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const grupoGrid = document.getElementById('grid-grupo');
                const npcsGrid = document.getElementById('grid-npcs');
                const grupoCount = document.getElementById('grupo-count');
                const npcsCount = document.getElementById('npcs-count');
                const espectadoresCount = document.getElementById('espectadores-count');

                grupoGrid.innerHTML = '';
                npcsGrid.innerHTML = '';

                let grupoTotal = 0, npcsTotal = 0, espectadoresTotal = 0;

                data.instancias.forEach(inst => {
                    const card = criarCardInstancia(inst);
                    if (inst.tipo === 'jogador') {
                        grupoGrid.appendChild(card);
                        grupoTotal++;
                    } else if (inst.tipo === 'npc') {
                        npcsGrid.appendChild(card);
                        npcsTotal++;
                    } else if (inst.tipo === 'espectador') {
                        npcsGrid.appendChild(card);
                        espectadoresTotal++;
                    }
                });

                if (grupoTotal === 0) {
                    grupoGrid.innerHTML = '<div class="empty-instancia">Nenhum jogador no grupo</div>';
                }
                if (npcsTotal === 0 && espectadoresTotal === 0) {
                    npcsGrid.innerHTML = '<div class="empty-instancia">Nenhum NPC ou espectador</div>';
                }

                grupoCount.textContent = grupoTotal;
                npcsCount.textContent = npcsTotal;
                espectadoresCount.textContent = espectadoresTotal;
            }
        })
        .catch(error => console.error('Erro ao carregar instâncias:', error));
}

function criarCardInstancia(inst) {
    const card = document.createElement('div');
    const fonteClass = typeof getFonteClass === 'function' ? getFonteClass(inst.fonte_nome || '') : '';
    card.className = `instancia-card ${fonteClass}`;
    if (inst.tipo === 'npc') card.style.borderColor = 'var(--primary)';
    if (!inst.ativo) card.style.opacity = '0.6';

    const fonteSlug = typeof getFonteSlug === 'function' ? getFonteSlug(inst.fonte_nome || '') : 'desconhecido';
    const symbolPath = `/static/imgs/symbols/${fonteSlug}-symbol.png`;

    const statusClass = inst.ativo ? 'ativo' : 'inativo';
    const statusLabel = inst.ativo ? 'Ativo' : 'Inativo';
    const tipoLabel = inst.tipo === 'npc' ? 'NPC' : (inst.tipo === 'espectador' ? 'Espectador' : '');

    card.innerHTML = `
        <div class="card-glow"></div>
        <div class="simbolo-fundo">
            <img src="${symbolPath}" alt="${inst.fonte_nome || ''}" onerror="this.style.display='none'">
        </div>
        <div class="conteudo">
            <div class="instancia-nome">${inst.nome_instancia || inst.nome_completo || 'Desconhecido'}</div>
            <div class="instancia-detalhes">
                <span>${inst.especie_nome || ''} ${inst.fonte_nome ? '• ' + inst.fonte_nome : ''}</span>
                <span>❤️ ${inst.fv_atual || 0}/${inst.fv_total || 0} • ✨ ${inst.pe_atual || 0}/${inst.pe_total || 0}</span>
            </div>
            <span class="instancia-status ${statusClass}">${statusLabel}${tipoLabel ? ' (' + tipoLabel + ')' : ''}</span>
        </div>
    `;
    return card;
}

function novaInstancia() {
    alert('🎭 Abrir seletor de personagens para criar nova instância');
}

// ============================================
// SALVAR MESA
// ============================================

function salvarMesa(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById('mesa-nome').value.trim();
    if (!nome) {
        alert('⚠️ O nome da mesa é obrigatório.');
        return;
    }

    const dados = {
        nome: nome,
        descricao: document.getElementById('mesa-descricao').value.trim(),
        capacidade: parseInt(document.getElementById('mesa-capacidade-jogadores').value) || 6,
        capacidade_espectadores: parseInt(document.getElementById('mesa-capacidade-espectadores').value) || 10,
        ativa: document.getElementById('toggle-mesa-ativa').classList.contains('active'),
        privada: document.getElementById('toggle-mesa-privada').classList.contains('active'),
        senha_jogadores: document.getElementById('mesa-senha-jogadores').value || null,
        senha_espectadores: document.getElementById('mesa-senha-espectadores').value || null,
        imagem_fundo: document.getElementById('mesa-imagem').value.trim() || null
    };

    const isEdit = mesaEditandoId !== null;
    const url = isEdit ? `/mesa/api/${mesaEditandoId}/config` : '/mesa/criar';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? '✅ Mesa atualizada com sucesso!' : '✅ Mesa criada com sucesso!');
            fecharModalMesa();
            location.reload();
        } else {
            alert('❌ ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar mesa');
    });
}

// ============================================
// EXCLUIR MESA
// ============================================

function excluirMesaModal() {
    const mesaId = document.getElementById('mesa-id').value;
    if (!mesaId) return;

    if (!confirm('⚠️ Tem certeza que deseja EXCLUIR esta mesa permanentemente?')) return;

    fetch(`/mesa/api/${mesaId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('🗑️ Mesa excluída com sucesso!');
            fecharModalMesa();
            location.reload();
        } else {
            alert('❌ ' + data.message);
        }
    })
    .catch(error => {
        alert('❌ Erro ao excluir mesa');
    });
}