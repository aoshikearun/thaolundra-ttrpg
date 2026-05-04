/**
 * carousel-species.js - Carrossel 3D para seleção de espécies
 * Adaptado para o sistema Thaolundra RPG
 */

let speciesCarouselProgress = 50;
let speciesCarouselStartX = 0;
let speciesCarouselActive = 0;
let speciesCarouselIsDown = false;
let speciesCarouselItems = [];
let speciesCarouselData = [];
let selectedSpeciesCarouselId = null;
let selectedSpeciesCarouselData = null;

// Constantes
const CAROUSEL_SPEED_WHEEL = 0.02;
const CAROUSEL_SPEED_DRAG = -0.1;

/**
 * Obtém o índice Z para cada item baseado na posição ativa
 */
function getCarouselZindex(array, index) {
    return array.map((_, i) =>
        (index === i) ? array.length : array.length - Math.abs(index - i)
    );
}

function updateCarouselFontes(fontes) {
    fontesData = fontes;
    renderFontesCards(fontes);
}
/**
 * Exibe/posiciona um item do carrossel
 */
function displayCarouselItem(item, index, active) {
    const zIndex = getCarouselZindex([...speciesCarouselItems], active)[index];
    item.style.setProperty('--zIndex', zIndex);
    item.style.setProperty('--active', (index - active) / speciesCarouselItems.length);

    // Atualizar opacidade do conteúdo
    const box = item.querySelector('.carousel-box');
    if (box) {
        const opacity = Math.max(0.3, Math.min(1, (zIndex / speciesCarouselItems.length) * 2));
        box.style.opacity = opacity;
    }
}

/**
 * Anima o carrossel - atualiza posições baseado no progresso
 */
function animateCarousel() {
    speciesCarouselProgress = Math.max(0, Math.min(speciesCarouselProgress, 100));
    speciesCarouselActive = Math.floor(speciesCarouselProgress / 100 * (speciesCarouselItems.length - 1));

    speciesCarouselItems.forEach((item, index) => {
        displayCarouselItem(item, index, speciesCarouselActive);
    });
}

/**
 * Renderiza os cards das espécies no carrossel
 */
function renderSpeciesCarousel(species) {
    const container = document.getElementById('carousel-items-container');
    if (!container) return;

    speciesCarouselData = species;
    container.innerHTML = '';

    const icons = {
        'Bestial': '🐺', 'Humano': '👤', 'Klaveck': '🗿',
        'Darch': '🍄', 'Sombra': '🌑', 'Mecha': '🤖',
        'Rokan': '🧛', 'Yun-hai': '🐉', 'Kyongun': '✨',
        'Demônio': '👿', 'Anjo': '😇'
    };

    const fontesMap = {
        'Bestial': 'Naturais + Magia', 'Humano': 'Naturais + Magia',
        'Klaveck': 'Naturais + Magia', 'Darch': 'Naturais + Magia',
        'Sombra': 'Naturais + Magia', 'Mecha': 'Mecânica',
        'Rokan': 'Ganyr', 'Yun-hai': 'Pura', 'Kyongun': 'Pura',
        'Demônio': 'Demoníaca', 'Anjo': 'Angelical'
    };

    species.forEach((specie, index) => {
        const icon = icons[specie.nome] || '🐉';
        const isAdvanced = specie.advanced === 1;
        const isHybrid = specie.hybrid === 1;

        let cardClass = 'carousel-item';
        if (isAdvanced) cardClass += ' advanced';
        if (isHybrid) cardClass += ' hybrid';

        const item = document.createElement('div');
        item.className = cardClass;
        item.setAttribute('data-id', specie.id);
        item.setAttribute('data-name', specie.nome);

        // Usar imagem placeholder ou ícone grande como fallback
        const imageUrl = `/static/imgs/especies/${specie.nome.toLowerCase()}.png`;

        item.innerHTML = `
            <div class="carousel-box">
                <div class="carousel-num">${String(index + 1).padStart(2, '0')}</div>
                ${isAdvanced ? '<div class="species-badge">⭐ Avançada</div>' : ''}
                ${isHybrid ? '<div class="species-badge hybrid">✨ Híbrida</div>' : ''}
                <img src="${imageUrl}"
                     onerror="this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"#2a2a3e\"/><text x=\"50\" y=\"55\" text-anchor=\"middle\" fill=\"#ffb347\" font-size=\"40\">' + icon + '</text></svg>')}'">
                <div class="carousel-title">${specie.nome}</div>
                <div class="carousel-power">⚡ Poder: <span>${specie.minimo_poder}-${specie.maximo_poder}</span></div>
                <div class="carousel-desc">${specie.descricao ? specie.descricao.substring(0, 120) + '...' : 'Sem descrição disponível.'}</div>
            </div>
        `;

        item.addEventListener('click', () => selectCarouselSpecies(specie.id));
        container.appendChild(item);
    });

    // Atualizar referência dos items e reiniciar animação
    speciesCarouselItems = document.querySelectorAll('.carousel-item');
    speciesCarouselProgress = 0;
    animateCarousel();
}

/**
 * Seleciona uma espécie no carrossel
 */
function selectCarouselSpecies(speciesId) {
    const species = speciesCarouselData.find(s => s.id === speciesId);
    if (!species) return;

    // Remover seleção anterior
    speciesCarouselItems.forEach(item => {
        item.classList.remove('selected');
    });

    // Adicionar seleção ao item clicado
    const selectedItem = document.querySelector(`.carousel-item[data-id="${speciesId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }

    selectedSpeciesCarouselId = speciesId;
    selectedSpeciesCarouselData = species;

    // Atualizar informação no rodapé (opcional)
    const selectedInfo = document.getElementById('carousel-selected-info');
    if (selectedInfo) {
        selectedInfo.textContent = `Selecionado: ${species.nome}`;
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

    console.log('Espécie selecionada:', species.nome);
}

/**
 * Confirma a seleção da espécie e fecha o modal
 */
function confirmCarouselSpecies() {
    if (!selectedSpeciesCarouselId || !selectedSpeciesCarouselData) {
        alert('Por favor, selecione uma espécie primeiro.');
        return;
    }

    // Atualizar o campo hidden no formulário principal
    const especieInput = document.getElementById('especie');
    if (especieInput) {
        especieInput.value = selectedSpeciesCarouselId;
    }

    // Atualizar o texto do botão
    const selectedNameSpan = document.getElementById('selected-species-name');
    if (selectedNameSpan) {
        selectedNameSpan.textContent = selectedSpeciesCarouselData.nome;
    }

    // Atualizar informações da espécie no formulário principal
    const especieInfo = document.getElementById('especie-info');
    const especieDesc = document.getElementById('especie-desc');
    const especieMin = document.getElementById('especie-min');
    const especieMax = document.getElementById('especie-max');

    if (especieInfo) especieInfo.style.display = 'block';
    if (especieDesc) especieDesc.textContent = selectedSpeciesCarouselData.descricao || 'Sem descrição';
    if (especieMin) especieMin.textContent = selectedSpeciesCarouselData.minimo_poder;
    if (especieMax) especieMax.textContent = selectedSpeciesCarouselData.maximo_poder;

    // Atualizar objeto global fichaData se existir
    if (typeof fichaData !== 'undefined') {
        fichaData.especie = selectedSpeciesCarouselData;
    }

    // Recarregar fontes de poder
    if (typeof carregarFontesPoder !== 'undefined') {
        carregarFontesPoder(selectedSpeciesCarouselId);
    }

    // Fechar modal
    closeCarouselSpeciesModal();
}

/**
 * Abre o modal do carrossel de espécies
 */
function openCarouselSpeciesModal() {
    const modal = document.getElementById('species-carousel-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Carregar espécies se ainda não foram carregadas
    if (speciesCarouselData.length === 0) {
        loadSpeciesForCarousel();
    } else {
        renderSpeciesCarousel(speciesCarouselData);
    }
}

/**
 * Fecha o modal do carrossel
 */
function closeCarouselSpeciesModal() {
    const modal = document.getElementById('species-carousel-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Carrega espécies da API para o carrossel
 */
function loadSpeciesForCarousel() {
    const container = document.getElementById('carousel-items-container');
    if (container) {
        container.innerHTML = '<div class="carousel-loading"><i class="fas fa-spinner fa-spin"></i><p>Carregando espécies...</p></div>';
    }

    fetch('/api/ficha/especies')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.especies) {
                renderSpeciesCarousel(data.especies);
            } else {
                if (container) {
                    container.innerHTML = '<div class="carousel-loading"><p>Erro ao carregar espécies</p></div>';
                }
            }
        })
        .catch(error => {
            console.error('Erro ao carregar espécies:', error);
            if (container) {
                container.innerHTML = '<div class="carousel-loading"><p>Erro ao carregar espécies</p></div>';
            }
        });
}

// ============================================
// EVENTOS DO CARROSSEL (wheel, drag, touch)
// ============================================

function handleCarouselWheel(e) {
    const wheelProgress = e.deltaY * CAROUSEL_SPEED_WHEEL;
    speciesCarouselProgress = speciesCarouselProgress + wheelProgress;
    animateCarousel();
}

function handleCarouselMouseMove(e) {
    // Movimento do cursor customizado
    const cursors = document.querySelectorAll('.carousel-cursor');
    cursors.forEach(cursor => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    if (!speciesCarouselIsDown) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const mouseProgress = (x - speciesCarouselStartX) * CAROUSEL_SPEED_DRAG;
    speciesCarouselProgress = speciesCarouselProgress + mouseProgress;
    speciesCarouselStartX = x;
    animateCarousel();
}

function handleCarouselMouseDown(e) {
    speciesCarouselIsDown = true;
    speciesCarouselStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
}

function handleCarouselMouseUp() {
    speciesCarouselIsDown = false;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function initCarouselSpecies() {
    console.log('🎠 Carrossel de espécies inicializado');

    // Registrar eventos
    const carouselContainer = document.querySelector('.species-carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('wheel', handleCarouselWheel);
        carouselContainer.addEventListener('mousedown', handleCarouselMouseDown);
        carouselContainer.addEventListener('mousemove', handleCarouselMouseMove);
        carouselContainer.addEventListener('mouseup', handleCarouselMouseUp);
        carouselContainer.addEventListener('touchstart', handleCarouselMouseDown);
        carouselContainer.addEventListener('touchmove', handleCarouselMouseMove);
        carouselContainer.addEventListener('touchend', handleCarouselMouseUp);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarouselSpecies);
} else {
    initCarouselSpecies();
}