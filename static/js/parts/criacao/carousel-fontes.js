/**
 * carousel-fontes.js - Carrossel de Fontes de Poder com Swiper e fundo SVG animado
 */

let fontesData = [];
let swiperInstance = null;

// Ícones para cada fonte
const fonteIcons = {
    1: '🔥',   // Fogo
    2: '💧',   // Água
    3: '💨',   // Vento
    4: '⛰️',   // Terra
    5: '🌿',   // Floresta
    6: '⚡',   // Trovão
    7: '✨',   // Luz
    8: '🌙',   // Trevas
    9: '🔮',   // Magia
    10: '🌀',  // Ganyr
    11: '😈',  // Demoníaca
    12: '👼',  // Angelical
    13: '💎',  // Pura
    14: '⚙️',  // Mecânica
    15: '🌆',  // Crepúsculo
    16: '💨'   // Fumaça
};

// Cores de glow para cada categoria
const glowColors = {
    'Natural': '#4ecdc4',
    'Artificial': '#0984e3',
    'Divina': '#74b9ff',
    'Mecânica': '#b2bec3'
};

/**
 * Inicializa o Swiper
 */
function updateSvgColorByFonte(fonte) {
    const svg = document.querySelector('.fontes-carousel-container .animated-bg svg');
    if (!svg) return;

    // Três cores para cada fonte (tom1, tom2, tom3)
    const cores = {
        1: ['#FF4500', '#FF6347', '#FF8C00'],      // Fogo (mantido)
        2: ['#0066FF', '#0000FF', '#00C8FF'],      // Água (azul mais saturado, sem escuro)
        3: ['#FF69B4', '#FF85C8', '#CCCCCC'],      // Vento (rosa mais saturado)
        4: ['#FF9C00', '#8B5A2B', '#CD853F'],      // Terra (mantido)
        5: ['#1B4D1B', '#228B22', '#32CD32'],      // Floresta (mantido)
        6: ['#FFD700', '#FFEA00', '#FFF44F'],      // Trovão (amarelo puro incluído)
        7: ['#E0E0E0', '#F0F0F0', '#FFFFFF'],      // Luz (mais claro, quase branco)
        8: ['#3A3A4A', '#553A6B', '#2A2A4A'],      // Trevas (cinza escuro + roxo/azul escuro)
        9: ['#E6E6FA', '#CC00DB', '#4801FA'],      // Magia (mais claro, lavanda/roxo pastel)
        10: ['#006994', '#00BFFF', '#87CEEB'],     // Ganyr (mantido)
        11: ['#0B3D0B', '#1B5E1B', '#2E7D32'],     // Demoníaca (mantido)
        12: ['#FFC0CB', '#FFB6C1', '#FFD1DC'],     // Angelical (mantido)
        13: ['#DAA520', '#FFD700', '#FFF8DC'],     // Pura (mantido)
        14: ['#2F4F4F', '#708090', '#A9A9A9'],     // Mecânica (mantido)
        15: ['#FF5600', '#808080', '#7300FF'],     // Crepúsculo (mais saturado)
        16: ['#FF0000', '#AA00AA', '#0033CC']      // Fumaça (vermelho + roxo + azul, mais saturado)
    };

    const nomeFonte = fonte.nome_exibicao;
    const [cor1, cor2, cor3] = cores[fonte.id] || ['#e8505b', '#f9d56e', '#14b1ab'];

    // Aplicar cores diferentes aos paths baseado em sua posição/índice
    const paths = svg.querySelectorAll('path');
    paths.forEach((path, index) => {
        let novaCor;
        if (index % 3 === 0) novaCor = cor1;
        else if (index % 3 === 1) novaCor = cor2;
        else novaCor = cor3;
        path.setAttribute('stroke', novaCor);
    });

    // Atualizar máscaras
    const defs = svg.querySelector('defs');
    if (defs) {
        const masks = defs.querySelectorAll('mask');
        masks.forEach((mask, idx) => {
            const clonePath = mask.querySelector('path');
            if (clonePath) {
                if (idx % 3 === 0) clonePath.setAttribute('stroke', cor1);
                else if (idx % 3 === 1) clonePath.setAttribute('stroke', cor2);
                else clonePath.setAttribute('stroke', cor3);
            }
        });
    }
}

function initSwiper() {
    if (swiperInstance) {
        swiperInstance.destroy(true, true);
    }

    swiperInstance = new Swiper('.fontes-carousel-container .swiper', {
        effect: 'coverflow',
        loop: true,
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 1,
        coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true
        },
        pagination: {
            el: '.fontes-carousel-container .swiper-pagination',
            clickable: true
        },
        on: {
            slideChange: function() {
                const activeIndex = this.activeIndex;
                const activeSlide = this.slides[activeIndex];
                const fonteId = activeSlide?.querySelector('.fonte-card')?.dataset.id;
                const fonte = fontesData.find(f => f.id == fonteId);

                console.log('activeIndex:', activeIndex, 'fonteId:', fonteId);

                if (fonte && fonte.id !== window.ultimaFonte) {
                    window.ultimaFonte = fonte.id;
                    updateSvgColorByFonte(fonte);
                }
            },
            init: function() {
                const primeiraFonte = fontesData[0];
                if (primeiraFonte) {
                    window.ultimaFonte = primeiraFonte.id;
                    console.log('🎨 Init - aplicando cores para primeira fonte:', primeiraFonte.id, primeiraFonte.nome_exibicao);
                    updateSvgColorByFonte(primeiraFonte);
                }
            }
        },
            breakpoints: {
                320: { slidesPerView: 1.5 },
                580: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                992: { slidesPerView: 3.5 },
                1200: { slidesPerView: 4 },
                1400: { slidesPerView: 4.5 }
            }
    });
}

function updateCarouselFontes(fontes) {
    fontesData = fontes;
    renderFontesCards(fontes);
}

/**
 * Renderiza os cards das fontes
 */
function renderFontesCards(fontes) {
    const container = document.querySelector('.fontes-carousel-container .swiper-wrapper');
    if (!container) return;
    
    container.innerHTML = '';
    
    fontes.forEach(fonte => {
        const icon = fonteIcons[fonte.id] || '🔮';
        const isHybrid = fonte.hybrid === 1;
        const category = fonte.categoria;
        
        let categoriaClass = '';
        let glowColor = glowColors[category] || '#ffb347';
        
        if (category === 'Natural') categoriaClass = 'categoria-natural';
        else if (category === 'Artificial') categoriaClass = 'categoria-artificial';
        else if (category === 'Divina') categoriaClass = 'categoria-divina';
        else if (category === 'Mecânica') categoriaClass = 'categoria-mecanica';
        
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        slide.innerHTML = `
            <div class="fonte-card" data-id="${fonte.id}" data-name="${fonte.nome_exibicao}" style="--glow-color: ${glowColor}">
                ${isHybrid ? '<div class="hybrid-badge">✨ Híbrida</div>' : ''}
                <div class="fonte-icon">${icon}</div>
                <div class="fonte-nome">${fonte.nome_exibicao}</div>
                <span class="fonte-categoria ${categoriaClass}">${category}</span>
                <div class="fonte-desc">${fonte.descricao_curta ? fonte.descricao_curta.substring(0, 70) + '...' : 'Sem descrição disponível'}</div>
            </div>
        `;
        
        const card = slide.querySelector('.fonte-card');
        card.addEventListener('click', () => selectFonteCard(fonte.id));
        
        container.appendChild(slide);
    });
    
    // Reinicializar Swiper
    if (swiperInstance) {
        swiperInstance.update();
    } else {
        initSwiper();
    }
}

/**
 * Seleciona uma fonte
 */
function selectFonteCard(fonteId) {
    const fonte = fontesData.find(f => f.id === fonteId);
    if (!fonte) return;
    
    // Remover seleção anterior
    document.querySelectorAll('.fontes-carousel-container .fonte-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Adicionar seleção
    const selectedCard = document.querySelector(`.fontes-carousel-container .fonte-card[data-id="${fonteId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    selectedFonteId = fonteId;
    selectedFonteData = fonte;
    
    // Mostrar feedback
    const selectedInfo = document.getElementById('fontes-carousel-selected-info');
    if (selectedInfo) {
        selectedInfo.textContent = `✨ ${fonte.nome_exibicao} selecionada!`;
        selectedInfo.style.display = 'block';
        selectedInfo.style.top = '20px';
        selectedInfo.style.bottom = 'auto';
        setTimeout(() => {
            selectedInfo.style.opacity = '0';
            setTimeout(() => {
                selectedInfo.style.display = 'none';
                selectedInfo.style.opacity = '1';
            }, 500);
        }, 2000);
    }
}

/**
 * Confirma a seleção
 */
function confirmFonteSelection() {
    if (!selectedFonteId || !selectedFonteData) {
        alert('⚠️ Por favor, selecione uma fonte de poder primeiro.');
        return;
    }
    
    // Atualizar campo hidden
    const fonteInput = document.getElementById('fonte_poder');
    if (fonteInput) {
        fonteInput.value = selectedFonteId;
    }
    
    // Atualizar informações no formulário
    const fonteInfo = document.getElementById('fonte-info');
    const fonteDesc = document.getElementById('fonte-desc');
    const fonteCategoria = document.getElementById('fonte-categoria');
    
    if (fonteInfo) fonteInfo.style.display = 'block';
    if (fonteDesc) fonteDesc.textContent = selectedFonteData.descricao_curta || 'Sem descrição';
    if (fonteCategoria) fonteCategoria.textContent = selectedFonteData.categoria;
    
    // Atualizar objeto global
    if (typeof fichaData !== 'undefined') {
        fichaData.fontePoder = selectedFonteData;
    }
    
    // Carregar técnicas
    if (typeof carregarTecnicasFonte === 'function') {
        carregarTecnicasFonte();
    }
    
    // Atualizar texto do botão no passo 2
    const btnText = document.getElementById('selected-fonte-name');
    if (btnText) {
        btnText.textContent = selectedFonteData.nome_exibicao;
    }
    
    // Fechar modal
    closeFontesCarouselModal();
    
    // Avançar para próximo passo se stepper existir
    if (typeof goToStep === 'function') {
        goToStep(3);
    }
}

/**
 * Abre o modal
 */
function openFontesCarouselModal() {
    const modal = document.getElementById('fontes-carousel-modal');
    if (!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    initSvgAnimation();
    
    // Carregar fontes
    if (fontesData.length === 0) {
        loadFontesForCarousel();
    } else {
        renderFontesCards(fontesData);
    }
}

/**
 * Fecha o modal
 */
function closeFontesCarouselModal() {
    const modal = document.getElementById('fontes-carousel-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Carrega fontes da API
 */
function loadFontesForCarousel() {
    const container = document.querySelector('.fontes-carousel-container .swiper-wrapper');
    if (container) {
        container.innerHTML = '<div class="swiper-slide" style="text-align: center; padding: 50px;">Carregando fontes...</div>';
    }
    
    const especieId = document.getElementById('especie')?.value;
    let url = '/api/ficha/fontes-poder';
    if (especieId && especieId !== '0' && especieId !== '') {
        url += `?especie_id=${especieId}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.fontes) {
                fontesData = data.fontes;
                renderFontesCards(fontesData);
                initSvgAnimation();
            } else {
                console.error('Erro ao carregar fontes:', data);
                if (container) {
                    container.innerHTML = '<div class="swiper-slide" style="text-align: center; padding: 50px;">❌ Erro ao carregar fontes</div>';
                }
            }
        })
        .catch(error => {
            console.error('Erro ao carregar fontes:', error);
            if (container) {
                container.innerHTML = '<div class="swiper-slide" style="text-align: center; padding: 50px;">❌ Erro ao carregar fontes</div>';
            }
        });
}

/**
 * Inicializa animação do SVG
 */
function initSvgAnimation() {
    const svg = document.querySelector('.fontes-carousel-container .animated-bg svg');
    if (!svg) return;
    
    const paths = svg.querySelectorAll('path');
    const defs = svg.querySelector('defs');
    
    if (!defs) return;
    
    svg.style.opacity = '1';
    
    paths.forEach((p, i) => {
        const clone = p.cloneNode();
        clone.setAttribute('stroke-dasharray', '');
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', `fontes-mask-${i}`);
        mask.appendChild(clone);
        defs.appendChild(mask);
        p.setAttribute('mask', `url(#fontes-mask-${i})`);
        
        const length = clone.getTotalLength();
        gsap.set(clone, {
            strokeDasharray: length,
            strokeDashoffset: length
        });
        gsap.to(clone, {
            duration: 10,
            delay: i * 0.1,
            repeat: -1,
            strokeDashoffset: length * 3,
            ease: 'power1.inOut'
        });
        gsap.to(p, {
            duration: 10,
            repeat: -1,
            strokeDashoffset: length * 0.4,
            ease: 'none'
        });
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSvgAnimation();
    });
} else {
    initSvgAnimation();
}

// Exportar funções globais
window.openFontesCarouselModal = openFontesCarouselModal;
window.closeFontesCarouselModal = closeFontesCarouselModal;
window.confirmFonteSelection = confirmFonteSelection;
window.updateSvgColorByFonte = updateSvgColorByFonte;