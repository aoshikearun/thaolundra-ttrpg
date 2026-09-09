/**
 * carousel-fontes.js - Carrossel de Fontes de Poder com Swiper e fundo SVG animado
 */

let fontesData = [];
let swiperInstance = null;
let selectedFonteId = null;
let selectedFonteData = null;

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

function updateSvgColorByFonte(fonte) {
    const svg = document.querySelector('.fontes-carousel-container .animated-bg svg');
    if (!svg) return;

    const cores = {
        1: ['#FF4500', '#FF6347', '#FF8C00'],
        2: ['#0066FF', '#0000FF', '#00C8FF'],
        3: ['#FF69B4', '#FF85C8', '#CCCCCC'],
        4: ['#FF9C00', '#8B5A2B', '#CD853F'],
        5: ['#1B4D1B', '#228B22', '#32CD32'],
        6: ['#FFD700', '#FFEA00', '#FFF44F'],
        7: ['#E0E0E0', '#F0F0F0', '#FFFFFF'],
        8: ['#3A3A4A', '#553A6B', '#2A2A4A'],
        9: ['#E6E6FA', '#CC00DB', '#4801FA'],
        10: ['#006994', '#00BFFF', '#87CEEB'],
        11: ['#0B3D0B', '#1B5E1B', '#2E7D32'],
        12: ['#FFC0CB', '#FFB6C1', '#FFD1DC'],
        13: ['#DAA520', '#FFD700', '#FFF8DC'],
        14: ['#2F4F4F', '#708090', '#A9A9A9'],
        15: ['#FF5600', '#808080', '#7300FF'],
        16: ['#FF0000', '#AA00AA', '#0033CC']
    };

    const [cor1, cor2, cor3] = cores[fonte.id] || ['#e8505b', '#f9d56e', '#14b1ab'];

    const paths = svg.querySelectorAll('path');
    paths.forEach((path, index) => {
        let novaCor;
        if (index % 3 === 0) novaCor = cor1;
        else if (index % 3 === 1) novaCor = cor2;
        else novaCor = cor3;
        path.setAttribute('stroke', novaCor);
    });

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

                if (fonte && fonte.id !== window.ultimaFonte) {
                    window.ultimaFonte = fonte.id;
                    updateSvgColorByFonte(fonte);
                }
            },
            init: function() {
                const primeiraFonte = fontesData[0];
                if (primeiraFonte) {
                    window.ultimaFonte = primeiraFonte.id;
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

function renderFontesCards(fontes) {
    const container = document.querySelector('.fontes-carousel-container .swiper-wrapper');
    if (!container) return;

    container.innerHTML = '';

    // Mapeamento de ID da fonte para nome do arquivo de imagem
    const imagemPorId = {
        1: 'fire-symbol.png',      // Fogo
        2: 'water-symbol.png',     // Água
        3: 'wind-symbol.png',      // Vento
        4: 'earth-symbol.png',     // Terra
        5: 'forest-symbol.png',    // Floresta
        6: 'thunder-symbol.png',   // Trovão
        7: 'light-symbol.png',     // Luz
        8: 'dark-symbol.png'       // Trevas
    };

    fontes.forEach(fonte => {
        const isHybrid = fonte.hybrid === 1;
        const category = fonte.categoria;

        let categoriaClass = '';
        let glowColor = glowColors[category] || '#ffb347';

        if (category === 'Natural') categoriaClass = 'categoria-natural';
        else if (category === 'Artificial') categoriaClass = 'categoria-artificial';
        else if (category === 'Divina') categoriaClass = 'categoria-divina';
        else if (category === 'Mecânica') categoriaClass = 'categoria-mecanica';

        const nomeArquivo = imagemPorId[fonte.id];
        const emojiIcon = fonteIcons[fonte.id] || '🔮';

        // Define a classe de cor baseada no ID da fonte
        let classeCor = '';
        switch(parseInt(fonte.id)) {
            case 1: classeCor = 'fogo'; break;
            case 2: classeCor = 'agua'; break;
            case 3: classeCor = 'vento'; break;
            case 4: classeCor = 'terra'; break;
            case 5: classeCor = 'floresta'; break;
            case 6: classeCor = 'trovao'; break;
            case 7: classeCor = 'luz'; break;
            case 8: classeCor = 'trevas'; break;
            default: classeCor = '';
        }

        let iconHtml = '';
        if (nomeArquivo) {
            const imagemPath = `/static/imgs/symbols/${nomeArquivo}`;
            iconHtml = `<img src="${imagemPath}" class="fonte-imagem ${classeCor}" alt="${fonte.nome_exibicao}" onerror="this.style.display='none'; this.parentElement.querySelector('.fonte-icon-emoji').style.display='inline-block';">`;
            iconHtml += `<span class="fonte-icon-emoji" style="display: none;">${emojiIcon}</span>`;
        } else {
            iconHtml = `<span class="fonte-icon-emoji">${emojiIcon}</span>`;
        }

        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        slide.innerHTML = `
            <div class="fonte-card" data-id="${fonte.id}" data-name="${fonte.nome_exibicao}" style="--glow-color: ${glowColor}">
                ${isHybrid ? '<div class="hybrid-badge">✨ Híbrida</div>' : ''}
                <div class="fonte-icon">${iconHtml}</div>
                <div class="fonte-nome">${fonte.nome_exibicao}</div>
                <span class="fonte-categoria ${categoriaClass}">${category}</span>
                <div class="fonte-desc">${fonte.descricao_curta ? fonte.descricao_curta.substring(0, 70) + '...' : 'Sem descrição disponível'}</div>
            </div>
        `;

        const card = slide.querySelector('.fonte-card');
        card.addEventListener('click', () => selectFonteCard(fonte.id));

        container.appendChild(slide);
    });

    if (swiperInstance) {
        swiperInstance.update();
    } else {
        initSwiper();
    }
}

function selectFonteCard(fonteId) {
    const fonte = fontesData.find(f => f.id == fonteId);
    if (!fonte) return;

    // ✅ ATUALIZAR AS VARIÁVEIS GLOBAIS NA SELEÇÃO
    window.selectedFonteId = fonteId;
    window.selectedFonteData = fonte;

    const container = document.querySelector('.fontes-carousel-container');
    if (container) {
        container.setAttribute('data-fonte-id', fonteId);
    }

    document.querySelectorAll('.fontes-carousel-container .fonte-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`.fontes-carousel-container .fonte-card[data-id="${fonteId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    selectedFonteId = fonteId;
    selectedFonteData = fonte;

    const selectedInfo = document.getElementById('fontes-carousel-selected-info');
    if (selectedInfo) {
        selectedInfo.textContent = `✨ ${fonte.nome_exibicao} selecionada!`;
        selectedInfo.style.display = 'block';
        setTimeout(() => {
            selectedInfo.style.opacity = '0';
            setTimeout(() => {
                selectedInfo.style.display = 'none';
                selectedInfo.style.opacity = '1';
            }, 500);
        }, 2000);
    }
}

function confirmFonteSelection() {
    if (!selectedFonteId || !selectedFonteData) {
        alert('⚠️ Por favor, selecione uma fonte de poder primeiro.');
        return;
    }

    // ✅ ATUALIZAR AS VARIÁVEIS GLOBAIS ANTES DE QUALQUER COISA
    window.selectedFonteId = selectedFonteId;
    window.selectedFonteData = selectedFonteData;

    console.log('✅ Fonte confirmada:', window.selectedFonteData.nome_exibicao, '(ID:', window.selectedFonteId, ')');

    const fonteInput = document.getElementById('fonte_poder');
    if (fonteInput) {
        fonteInput.value = selectedFonteId;
    }

    const fonteInfo = document.getElementById('fonte-info');
    const fonteDesc = document.getElementById('fonte-desc');
    const fonteCategoria = document.getElementById('fonte-categoria');

    if (fonteInfo) fonteInfo.style.display = 'block';
    if (fonteDesc) fonteDesc.textContent = selectedFonteData.descricao_curta || 'Sem descrição';
    if (fonteCategoria) fonteCategoria.textContent = selectedFonteData.categoria;

    if (typeof fichaData !== 'undefined') {
        fichaData.fontePoder = selectedFonteData;
    }

    const btnText = document.getElementById('selected-fonte-name');
    if (btnText) {
        btnText.textContent = selectedFonteData.nome_exibicao;
    }

    closeFontesCarouselModal();

    // ✅ IR PARA O PRÓXIMO PASSO DEPOIS DE ATUALIZAR TUDO
    if (typeof goToStep === 'function') {
        goToStep(4);  // Vai direto para Atributos (passo 4)
    }
}

function openFontesCarouselModal() {
    const modal = document.getElementById('fontes-carousel-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    initSvgAnimation();

    if (fontesData.length === 0) {
        loadFontesForCarousel();
    } else {
        renderFontesCards(fontesData);
    }
}

function closeFontesCarouselModal() {
    const modal = document.getElementById('fontes-carousel-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

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

function updateCarouselFontes(fontes) {
    fontesData = fontes;
    renderFontesCards(fontes);
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSvgAnimation();
    });
} else {
    initSvgAnimation();
}

window.updateCarouselFontes = updateCarouselFontes;
window.openFontesCarouselModal = openFontesCarouselModal;
window.closeFontesCarouselModal = closeFontesCarouselModal;
window.confirmFonteSelection = confirmFonteSelection;
window.updateSvgColorByFonte = updateSvgColorByFonte;