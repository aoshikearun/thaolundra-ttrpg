/**
 * modal_criar_faccao.js - Gerenciamento do modal de criação de facção
 */

(function() {
    if (window._modalCriarFaccaoLoaded) return;
    window._modalCriarFaccaoLoaded = true;

    let corFaccaoSelecionada = '#ffb347';
    let emojiFaccaoSelecionado = '⚔️';

    // ============================================
    // SELECIONAR EMOJI
    // ============================================

    window.selecionarEmojiFaccao = function(elemento, emoji) {
        document.querySelectorAll('#modal-criar-faccao .emoji-option').forEach(el => el.classList.remove('selected'));
        elemento.classList.add('selected');
        emojiFaccaoSelecionado = emoji;
        document.getElementById('faccao-emoji-input').value = emoji;
        document.getElementById('flag-emoji').textContent = emoji;
    };

    // ============================================
    // EMOJI PICKER CUSTOM
    // ============================================

    window.abrirEmojiPickerFaccao = function() {
        // Abre um prompt para digitar o emoji
        const emoji = prompt('Digite o emoji desejado (ex: 🗡️, 🏰, ⚡):', '⚔️');
        if (emoji && emoji.trim()) {
            const emojiSelecionado = emoji.trim();
            // Remove seleção anterior
            document.querySelectorAll('#modal-criar-faccao .emoji-option').forEach(el => el.classList.remove('selected'));
            // Adiciona como custom
            const customOption = document.querySelector('#modal-criar-faccao .emoji-option.custom');
            if (customOption) {
                customOption.classList.add('selected');
                customOption.textContent = emojiSelecionado;
                customOption.style.fontSize = '24px';
            }
            emojiFaccaoSelecionado = emojiSelecionado;
            document.getElementById('faccao-emoji-input').value = emojiSelecionado;
            document.getElementById('flag-emoji').textContent = emojiSelecionado;
        }
    };

    // ============================================
    // SELECIONAR COR
    // ============================================

    window.selecionarCorFaccao = function(elemento, cor) {
        document.querySelectorAll('#modal-criar-faccao .color-option').forEach(el => el.classList.remove('selected'));
        elemento.classList.add('selected');
        corFaccaoSelecionada = cor;
        document.getElementById('faccao-cor').value = cor;
        document.getElementById('flag-color').style.background = cor;
        document.getElementById('flag-preview').style.borderColor = cor;
    };

    // ============================================
    // COLOR PICKER CUSTOM
    // ============================================

    window.abrirColorPickerFaccao = function() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = corFaccaoSelecionada;
        input.addEventListener('input', function() {
            corFaccaoSelecionada = this.value;
            document.getElementById('faccao-cor').value = this.value;
            document.getElementById('flag-color').style.background = this.value;
            document.getElementById('flag-preview').style.borderColor = this.value;
            document.querySelectorAll('#modal-criar-faccao .color-option').forEach(el => el.classList.remove('selected'));
            document.querySelector('#modal-criar-faccao .color-option.custom').classList.add('selected');
        });
        input.click();
    };

    // ============================================
    // ABRIR / FECHAR
    // ============================================

    window.abrirModalCriarFaccao = function() {
        const modal = document.getElementById('modal-criar-faccao');
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset
        document.getElementById('faccao-nome').value = '';
        document.getElementById('faccao-manifesto').value = '';
        document.getElementById('faccao-lema').value = '';
        document.getElementById('flag-preview-nome').textContent = 'Nome da Facção';
        document.getElementById('flag-preview-lema').textContent = 'Lema da facção';

        emojiFaccaoSelecionado = '⚔️';
        document.querySelectorAll('#modal-criar-faccao .emoji-option').forEach(el => el.classList.remove('selected'));
        document.querySelector('#modal-criar-faccao .emoji-option[onclick*="⚔️"]').classList.add('selected');
        document.getElementById('faccao-emoji-input').value = '⚔️';
        document.getElementById('flag-emoji').textContent = '⚔️';

        corFaccaoSelecionada = '#ffb347';
        document.querySelectorAll('#modal-criar-faccao .color-option').forEach(el => el.classList.remove('selected'));
        document.querySelector('#modal-criar-faccao .color-option[style*="#ffb347"]').classList.add('selected');
        document.getElementById('faccao-cor').value = '#ffb347';
        document.getElementById('flag-color').style.background = '#ffb347';
        document.getElementById('flag-preview').style.borderColor = '#ffb347';

        // Reset custom emoji option
        const customOption = document.querySelector('#modal-criar-faccao .emoji-option.custom');
        if (customOption) {
            customOption.textContent = '+';
            customOption.style.fontSize = '16px';
        }
    };

    window.fecharModalCriarFaccao = function() {
        const modal = document.getElementById('modal-criar-faccao');
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // ============================================
    // CRIAR FACÇÃO
    // ============================================

    window.criarFaccaoModal = function() {
        const nome = document.getElementById('faccao-nome').value.trim();
        const manifesto = document.getElementById('faccao-manifesto').value.trim();
        const lema = document.getElementById('faccao-lema').value.trim();
        const emoji = document.getElementById('faccao-emoji-input').value;
        const cor = document.getElementById('faccao-cor').value;

        if (!nome) {
            alert('⚠️ Digite um nome para a facção.');
            return;
        }

        // Simular criação - em produção enviaria para o backend
        alert(`✅ Facção "${nome}" criada com sucesso!\n\n📝 Manifesto: ${manifesto || 'Sem manifesto'}\n💬 Lema: ${lema || 'Sem lema'}\n🎨 Cor: ${cor}\n🔰 Emoji: ${emoji}`);

        document.getElementById('flag-preview-nome').textContent = nome;
        document.getElementById('flag-preview-lema').textContent = lema || 'Sem lema';
        document.getElementById('flag-emoji').textContent = emoji;

        window.fecharModalCriarFaccao();
    };

    // ============================================
    // EVENTOS GLOBAIS
    // ============================================

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.fecharModalCriarFaccao();
        }
    });

    document.getElementById('modal-criar-faccao').addEventListener('click', function(e) {
        if (e.target === this) window.fecharModalCriarFaccao();
    });

    console.log('🏛️ ModalCriarFaccao.js carregado!');
})();