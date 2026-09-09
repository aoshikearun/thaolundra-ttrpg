/**
 * modal_criar_aura.js - Gerenciamento do modal de criação de aura
 */

(function() {
    if (window._modalCriarAuraLoaded) return;
    window._modalCriarAuraLoaded = true;

    let corAuraSelecionada = '#ff6b6b';

    // ============================================
    // SELECIONAR COR
    // ============================================

    window.selecionarCorAura = function(elemento, cor) {
        document.querySelectorAll('#modal-criar-aura .color-option').forEach(el => el.classList.remove('selected'));
        elemento.classList.add('selected');
        corAuraSelecionada = cor;
        document.getElementById('aura-cor').value = cor;
        atualizarPreviewAura();
    };

    // ============================================
    // COLOR PICKER CUSTOM
    // ============================================

    window.abrirColorPickerAura = function() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = corAuraSelecionada;
        input.addEventListener('input', function() {
            corAuraSelecionada = this.value;
            document.getElementById('aura-cor').value = this.value;
            document.querySelectorAll('#modal-criar-aura .color-option').forEach(el => el.classList.remove('selected'));
            document.querySelector('#modal-criar-aura .color-option.custom').classList.add('selected');
            atualizarPreviewAura();
        });
        input.click();
    };

    // ============================================
    // ATUALIZAR PREVIEW
    // ============================================

    function atualizarPreviewAura() {
        const cor = corAuraSelecionada;
        const circle = document.getElementById('aura-circle');
        circle.style.background = `radial-gradient(circle, ${cor}66, ${cor}22, transparent)`;
        circle.style.borderColor = cor;
    }

    // ============================================
    // ABRIR / FECHAR
    // ============================================

    window.abrirModalCriarAura = function() {
        const modal = document.getElementById('modal-criar-aura');
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset
        document.getElementById('aura-nome').value = '';
        document.getElementById('aura-descricao').value = '';
        document.getElementById('aura-preview-nome').textContent = 'Nome da Aura';
        document.getElementById('aura-preview-desc').textContent = 'Descrição da aura aparecerá aqui';

        corAuraSelecionada = '#ff6b6b';
        document.querySelectorAll('#modal-criar-aura .color-option').forEach(el => el.classList.remove('selected'));
        document.querySelector('#modal-criar-aura .color-option[style*="#ff6b6b"]').classList.add('selected');
        document.getElementById('aura-cor').value = '#ff6b6b';
        atualizarPreviewAura();
    };

    window.fecharModalCriarAura = function() {
        const modal = document.getElementById('modal-criar-aura');
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // ============================================
    // CRIAR AURA
    // ============================================

    window.criarAuraModal = function() {
        const nome = document.getElementById('aura-nome').value.trim();
        const desc = document.getElementById('aura-descricao').value.trim();
        const cor = document.getElementById('aura-cor').value;

        if (!nome) {
            alert('⚠️ Digite um nome para a aura.');
            return;
        }

        // Simular criação - em produção enviaria para o backend
        alert(`✅ Aura "${nome}" criada com sucesso!\n\n📝 Descrição: ${desc || 'Sem descrição'}\n🎨 Cor: ${cor}`);

        document.getElementById('aura-preview-nome').textContent = nome;
        document.getElementById('aura-preview-desc').textContent = desc || 'Sem descrição';

        window.fecharModalCriarAura();
    };

    // ============================================
    // EVENTOS GLOBAIS
    // ============================================

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.fecharModalCriarAura();
        }
    });

    document.getElementById('modal-criar-aura').addEventListener('click', function(e) {
        if (e.target === this) window.fecharModalCriarAura();
    });

    console.log('✨ ModalCriarAura.js carregado!');
})();