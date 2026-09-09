/**
 * modal_especializacao.js - Sistema de Especialização
 */

(function() {
    if (window._especializacaoLoaded) return;
    window._especializacaoLoaded = true;

    // ============================================
    // DOM REFERENCES
    // ============================================

    const modalPrincipal = document.getElementById('modal-especializacao');
    const modalPopup = document.getElementById('modal-popup-criar-espec');

    const btnFechar = document.getElementById('btn-fechar-especializacao');
    const btnCancelar = document.getElementById('btn-cancelar-especializacao');
    const btnConfirmar = document.getElementById('btn-confirmar-especializacao');

    const btnAbrirPopup = document.getElementById('btn-abrir-popup-espec');
    const btnFecharPopup = document.getElementById('btn-fechar-popup-espec');
    const btnCancelarPopup = document.getElementById('btn-cancelar-popup-espec');
    const btnCriarPopup = document.getElementById('btn-criar-popup-espec');

    const itensSelecionadosContainer = document.getElementById('itens-selecionados');
    const especDisponiveisContainer = document.getElementById('espec-disponiveis');
    const badgeItens = document.getElementById('badge-itens');
    const custoTotal = document.getElementById('custo-total');
    const custoHumano = document.getElementById('custo-humano');

    const resultadoTipo = document.getElementById('resultado-tipo');
    const resultadoFonte = document.getElementById('resultado-fonte');
    const resultadoBadge = document.getElementById('resultado-badge');
    const descricaoTexto = document.getElementById('espec-descricao-texto');

    const popupNome = document.getElementById('popup-espec-nome');
    const popupDesc = document.getElementById('popup-espec-desc');

    // ============================================
    // ESTADO
    // ============================================

    let especSelecionada = null;
    let itensSelecionados = [];
    let especDisponiveis = [];
    let descricoesCache = {};

    // ============================================
    // UTILITÁRIOS
    // ============================================

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getFonteEmoji(fonte) {
        const emojis = {
            'Fogo': '🔥',
            'Água': '💧',
            'Vento': '🌪️',
            'Terra': '🪨',
            'Floresta': '🌿',
            'Trovão': '⚡',
            'Luz': '☀️',
            'Trevas': '🌙'
        };
        return emojis[fonte] || '✨';
    }

    // ============================================
    // INICIALIZAR
    // ============================================

    function initEspecializacao() {
        // Dados de exemplo - em produção viriam do backend
        itensSelecionados = [
            { id: 1, nome: 'Luta com Espada Longa', tipo: 'pericia', fonte: null },
            { id: 2, nome: 'Bola de Fogo', tipo: 'tecnica', fonte: 'Fogo' },
            { id: 3, nome: 'Furtividade', tipo: 'pericia', fonte: null }
        ];

        especDisponiveis = [
            { id: 1, nome: 'Mestre Espadachim', descricao: 'Ataques com espada causam +2d6 de dano adicional. Além disso, você pode realizar um ataque extra como ação bônus uma vez por rodada.' },
            { id: 2, nome: 'Piromante Avançado', descricao: 'Magias de fogo custam -2 PE. Além disso, você ganha resistência a dano de fogo.' },
            { id: 3, nome: 'Sombra Veloz', descricao: '+10 em testes de furtividade. Você pode se mover silenciosamente mesmo em terreno difícil.' },
            { id: 4, nome: 'Lâmina Elemental', descricao: 'Ataques causam dano elemental adicional baseado na sua fonte de poder principal.' }
        ];

        // Preencher descrições no cache
        especDisponiveis.forEach(e => {
            descricoesCache[e.nome] = e.descricao;
        });

        renderizarItensSelecionados();
        renderizarEspecDisponiveis();
        atualizarResultado();
        atualizarCusto();
        atualizarBadge();
    }

    // ============================================
    // RENDERIZAR ITENS SELECIONADOS
    // ============================================

    function renderizarItensSelecionados() {
        if (!itensSelecionadosContainer) return;

        if (itensSelecionados.length === 0) {
            itensSelecionadosContainer.innerHTML = `
                <div class="espec-list-empty">
                    <i class="fas fa-plus-circle"></i>
                    Nenhum item selecionado
                </div>
            `;
            return;
        }

        let html = '';
        itensSelecionados.forEach(item => {
            const tipoClass = item.tipo === 'pericia' ? 'pericia' : 'tecnica';
            const tipoLabel = item.tipo === 'pericia' ? 'Perícia' : 'Técnica';
            const fonteHtml = item.fonte ?
                `<span class="item-fonte">${getFonteEmoji(item.fonte)} ${item.fonte}</span>` :
                '';

            html += `
                <div class="espec-list-item selecionado">
                    <span class="item-nome">${escapeHtml(item.nome)}</span>
                    <span class="item-tipo ${tipoClass}">${tipoLabel}</span>
                    ${fonteHtml}
                </div>
            `;
        });

        itensSelecionadosContainer.innerHTML = html;
    }

    // ============================================
    // RENDERIZAR ESPECIALIZAÇÕES DISPONÍVEIS
    // ============================================

    function renderizarEspecDisponiveis() {
        if (!especDisponiveisContainer) return;

        if (especDisponiveis.length === 0) {
            especDisponiveisContainer.innerHTML = `
                <div class="espec-list-empty">
                    <i class="fas fa-plus-circle"></i>
                    Nenhuma especialização disponível
                </div>
            `;
            return;
        }

        let html = '';
        especDisponiveis.forEach(item => {
            html += `
                <div class="espec-disponivel-item" data-id="${item.id}" onclick="selecionarEspecDisponivel(this)">
                    <span class="espec-nome">${escapeHtml(item.nome)}</span>
                    <span class="espec-select">○</span>
                </div>
            `;
        });

        especDisponiveisContainer.innerHTML = html;
    }

    // ============================================
    // SELECIONAR ESPECIALIZAÇÃO
    // ============================================

    window.selecionarEspecDisponivel = function(el) {
        // Remover seleção anterior
        document.querySelectorAll('.espec-disponivel-item').forEach(item => {
            item.classList.remove('selecionado');
            item.querySelector('.espec-select').textContent = '○';
        });

        // Selecionar novo
        el.classList.add('selecionado');
        el.querySelector('.espec-select').textContent = '●';

        const nome = el.querySelector('.espec-nome').textContent;
        especSelecionada = nome;

        // Buscar descrição
        const desc = descricoesCache[nome] || 'Descrição não disponível para esta especialização.';
        descricaoTexto.textContent = desc;
        descricaoTexto.className = 'desc-texto selecionado';
    };

    // ============================================
    // ATUALIZAR RESULTADO
    // ============================================

    function atualizarResultado() {
        const temTecnica = itensSelecionados.some(item => item.tipo === 'tecnica');

        if (temTecnica) {
            // Resultado é Técnica
            resultadoTipo.textContent = '✨ Técnica';
            resultadoTipo.className = 'resultado-tipo tecnica';

            // Buscar fontes das técnicas
            const fontes = itensSelecionados
                .filter(item => item.tipo === 'tecnica' && item.fonte)
                .map(item => item.fonte);

            if (fontes.length === 0) {
                // Sem fonte definida - Pura
                resultadoFonte.style.display = 'none';
                resultadoBadge.style.display = 'none';
            } else {
                // Contar frequência das fontes
                const contagem = {};
                fontes.forEach(f => {
                    contagem[f] = (contagem[f] || 0) + 1;
                });

                let maxCount = 0;
                let fonteMaisFrequente = fontes[0];
                for (const [fonte, count] of Object.entries(contagem)) {
                    if (count > maxCount) {
                        maxCount = count;
                        fonteMaisFrequente = fonte;
                    }
                }

                const empatadas = Object.entries(contagem).filter(([f, c]) => c === maxCount);
                const temEmpate = empatadas.length > 1;

                // Mostrar fonte
                resultadoFonte.style.display = 'inline';

                if (temEmpate) {
                    // Híbrida entre as fontes empatadas
                    const fontesEmpatadas = empatadas.map(([f]) => f);
                    const nomeHibrido = fontesEmpatadas.join(' + ');
                    resultadoFonte.querySelector('.fonte-nome').textContent = `🌀 ${nomeHibrido}`;
                    resultadoBadge.style.display = 'inline';
                    resultadoBadge.textContent = 'Híbrida';
                } else {
                    // Fonte única - Pura
                    const emoji = getFonteEmoji(fonteMaisFrequente);
                    resultadoFonte.querySelector('.fonte-nome').textContent = `${emoji} ${fonteMaisFrequente}`;
                    resultadoBadge.style.display = 'none';
                }
            }
        } else {
            // Resultado é Perícia (apenas perícias selecionadas)
            resultadoTipo.textContent = '📋 Perícia';
            resultadoTipo.className = 'resultado-tipo pericia';
            resultadoFonte.style.display = 'none';
            resultadoBadge.style.display = 'none';
        }
    }

    // ============================================
    // ATUALIZAR CUSTO
    // ============================================

    function atualizarCusto() {
        const totalItens = itensSelecionados.length;
        const custoPorItem = 2000;
        const total = totalItens * custoPorItem;
        const totalHumano = Math.floor(total / 2);

        custoTotal.textContent = `${total.toLocaleString()} EXP`;
        custoHumano.textContent = `(humano: ${totalHumano.toLocaleString()} EXP)`;
    }

    // ============================================
    // ATUALIZAR BADGE
    // ============================================

    function atualizarBadge() {
        const total = itensSelecionados.length;
        badgeItens.textContent = `${total} itens`;
    }

    // ============================================
    // ABRIR/FECHAR MODAL PRINCIPAL
    // ============================================

    window.abrirModalEspecializacao = function() {
        modalPrincipal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Resetar seleção
        especSelecionada = null;
        descricaoTexto.textContent = 'Selecione uma especialização para ver a descrição.';
        descricaoTexto.className = 'desc-texto vazio';
        document.querySelectorAll('.espec-disponivel-item').forEach(item => {
            item.classList.remove('selecionado');
            item.querySelector('.espec-select').textContent = '○';
        });
    };

    function fecharModalEspecializacao() {
        modalPrincipal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ============================================
    // ABRIR/FECHAR MODAL POPUP
    // ============================================

    function abrirPopupCriar() {
        modalPopup.classList.add('active');
        popupNome.value = '';
        popupDesc.value = '';
        popupNome.focus();
    }

    function fecharPopupCriar() {
        modalPopup.classList.remove('active');
    }

    // ============================================
    // CRIAR NOVA ESPECIALIZAÇÃO
    // ============================================

    function criarNovaEspecPopup() {
        const nome = popupNome.value.trim();
        const desc = popupDesc.value.trim();

        if (!nome) {
            alert('⚠️ Digite um nome para a especialização.');
            return;
        }

        if (!desc) {
            alert('⚠️ Digite uma descrição para a especialização.');
            return;
        }

        // Adicionar à lista de disponíveis
        const novoId = especDisponiveis.length + 1;
        especDisponiveis.push({ id: novoId, nome: nome, descricao: desc });
        descricoesCache[nome] = desc;

        renderizarEspecDisponiveis();

        // Adicionar à lista de itens selecionados (display only)
        const temTecnica = itensSelecionados.some(i => i.tipo === 'tecnica');
        const tipoLabel = temTecnica ? 'Técnica' : 'Perícia';
        const tipoClass = temTecnica ? 'tecnica' : 'pericia';
        const fonteInfo = temTecnica ? ' <span class="item-fonte">🔥 Fogo</span>' : '';

        const novoItem = document.createElement('div');
        novoItem.className = 'espec-list-item selecionado';
        novoItem.innerHTML = `
            <span class="item-nome">✨ ${escapeHtml(nome)}</span>
            <span class="item-tipo ${tipoClass}">${tipoLabel}</span>
            ${fonteInfo}
        `;
        itensSelecionadosContainer.appendChild(novoItem);

        // Atualizar badge
        atualizarBadge();

        fecharPopupCriar();

        // Selecionar a nova especialização
        const items = document.querySelectorAll('.espec-disponivel-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
            window.selecionarEspecDisponivel(lastItem);
        }

        alert(`✅ Especialização "${nome}" criada com sucesso!`);
    }

    // ============================================
    // CONFIRMAR ESPECIALIZAÇÃO
    // ============================================

    function confirmarEspecializacao() {
        if (!especSelecionada) {
            alert('⚠️ Selecione uma especialização antes de confirmar.');
            return;
        }

        const listaNomes = itensSelecionados.map(item => item.nome).join(', ');
        const totalItens = itensSelecionados.length;
        const custoTotalCalc = totalItens * 2000;
        const custoHumanoCalc = Math.floor(custoTotalCalc / 2);
        const temTecnica = itensSelecionados.some(i => i.tipo === 'tecnica');
        const tipoResultado = temTecnica ? 'Técnica' : 'Perícia';

        const confirmMsg =
            `✅ Confirmar especialização "${especSelecionada}"?\n\n` +
            `📋 Itens afetados:\n${listaNomes}\n\n` +
            `📌 Resultado: ${tipoResultado}\n` +
            `💰 Custo: ${custoTotalCalc.toLocaleString()} EXP (humano: ${custoHumanoCalc.toLocaleString()} EXP)\n\n` +
            `Esta ação NÃO pode ser desfeita!`;

        if (confirm(confirmMsg)) {
            alert(`🎉 "${especSelecionada}" aplicada com sucesso!\n\nItens especializados:\n${listaNomes}`);
            fecharModalEspecializacao();
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Fechar modal principal
    if (btnFechar) btnFechar.addEventListener('click', fecharModalEspecializacao);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalEspecializacao);

    // Confirmar
    if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarEspecializacao);

    // Abrir/fechar popup
    if (btnAbrirPopup) btnAbrirPopup.addEventListener('click', abrirPopupCriar);
    if (btnFecharPopup) btnFecharPopup.addEventListener('click', fecharPopupCriar);
    if (btnCancelarPopup) btnCancelarPopup.addEventListener('click', fecharPopupCriar);

    // Criar especialização
    if (btnCriarPopup) btnCriarPopup.addEventListener('click', criarNovaEspecPopup);

    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalPopup && modalPopup.classList.contains('active')) {
                fecharPopupCriar();
            } else if (modalPrincipal && modalPrincipal.classList.contains('active')) {
                fecharModalEspecializacao();
            }
        }
    });

    // Fechar ao clicar no overlay
    if (modalPrincipal) {
        modalPrincipal.addEventListener('click', function(e) {
            if (e.target === this) fecharModalEspecializacao();
        });
    }

    if (modalPopup) {
        modalPopup.addEventListener('click', function(e) {
            if (e.target === this) fecharPopupCriar();
        });
    }

    // Enter no popup
    if (popupNome) {
        popupNome.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') popupDesc.focus();
        });
    }

    if (popupDesc) {
        popupDesc.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                criarNovaEspecPopup();
            }
        });
    }

    // ============================================
    // EXPORT
    // ============================================

    window.fecharModalEspecializacao = fecharModalEspecializacao;
    window.fecharPopupCriar = fecharPopupCriar;
    window.confirmarEspecializacao = confirmarEspecializacao;
    window.criarNovaEspecPopup = criarNovaEspecPopup;

    // ============================================
    // INIT
    // ============================================

    document.addEventListener('DOMContentLoaded', initEspecializacao);

    console.log('📚 ModalEspecializacao.js carregado com sucesso!');
})();