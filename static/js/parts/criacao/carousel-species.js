/**
 * carousel-species.js - Carrossel 3D para seleção de espécies
 */

(function() {
    if (window._carouselSpeciesLoaded) return;
    window._carouselSpeciesLoaded = true;

    let speciesCarouselItems = [];
    let speciesCarouselData = [];
    let selectedSpeciesCarouselId = null;
    let selectedSpeciesCarouselData = null;
    let currentIndex = 5;
    let isDragging = false;
    let startX = 0;
    let startIndex = 0;
    let totalItems = 0;

    // ✅ FUNÇÃO PARA AVANÇAR NO CARROSSEL
    window.speciesCarouselNext = function() {
        if (totalItems === 0) return;
        const nextIndex = Math.min(currentIndex + 1, totalItems - 1);
        if (nextIndex !== currentIndex) {
            updateCarousel(nextIndex);
        }
    };

    // ✅ FUNÇÃO PARA VOLTAR NO CARROSSEL
    window.speciesCarouselPrev = function() {
        if (totalItems === 0) return;
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
            updateCarousel(prevIndex);
        }
    };

    function updateCarousel(index) {
        if (!speciesCarouselItems.length) return;
        index = Math.max(0, Math.min(index, totalItems - 1));
        currentIndex = index;

        speciesCarouselItems.forEach((item, i) => {
            const diff = i - index;
            const zIndex = totalItems - Math.abs(diff);

            item.style.setProperty('--zIndex', zIndex);
            item.style.setProperty('--active', diff / totalItems);

            const box = item.querySelector('.carousel-box');
            if (box) {
                const opacity = Math.max(0.3, Math.min(1, (zIndex / totalItems) * 2));
                box.style.opacity = opacity;
            }
        });
    }

    function onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(currentIndex + delta, totalItems - 1));
        if (newIndex !== currentIndex) {
            updateCarousel(newIndex);
        }
    }

    function onMouseDown(e) {
        isDragging = true;
        startX = e.clientX;
        startIndex = currentIndex;
        const container = document.querySelector('.species-carousel-container');
        if (container) container.style.cursor = 'grabbing';
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const threshold = 50;
        const deltaItems = Math.round(dx / threshold);
        if (deltaItems !== 0) {
            const newIndex = Math.max(0, Math.min(startIndex - deltaItems, totalItems - 1));
            if (newIndex !== currentIndex) {
                updateCarousel(newIndex);
            }
            startX = e.clientX;
            startIndex = currentIndex;
        }
    }

    function onMouseUp() {
        isDragging = false;
        const container = document.querySelector('.species-carousel-container');
        if (container) container.style.cursor = '';
    }

    function onTouchStart(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startIndex = currentIndex;
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const threshold = 50;
        const deltaItems = Math.round(dx / threshold);
        if (deltaItems !== 0) {
            const newIndex = Math.max(0, Math.min(startIndex - deltaItems, totalItems - 1));
            if (newIndex !== currentIndex) {
                updateCarousel(newIndex);
            }
            startX = e.touches[0].clientX;
            startIndex = currentIndex;
        }
    }

    function onTouchEnd() {
        isDragging = false;
    }

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

        species.forEach((specie, index) => {
            const icon = icons[specie.nome] || '🐉';
            const isAdvanced = specie.advanced === 1;
            const imageUrl = `/static/imgs/especies/${specie.nome.toLowerCase()}.png`;

            const item = document.createElement('div');
            item.className = `carousel-item ${isAdvanced ? 'advanced' : ''}`;
            item.setAttribute('data-id', specie.id);
            item.setAttribute('data-name', specie.nome);

            item.innerHTML = `
                <div class="carousel-box">
                    <div class="carousel-num">${String(index + 1).padStart(2, '0')}</div>
                    ${isAdvanced ? '<div class="species-badge">⭐ Avançada</div>' : ''}
                    <img src="${imageUrl}" onerror="this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"#2a2a3e\"/><text x=\"50\" y=\"55\" text-anchor=\"middle\" fill=\"#ffb347\" font-size=\"40\">' + icon + '</text></svg>')}'">
                    <div class="carousel-title">${specie.nome}</div>
                    <div class="carousel-power">⚡ Poder: <span>${specie.minimo_poder}-${specie.maximo_poder}</span></div>
                    <div class="carousel-desc">${specie.descricao ? specie.descricao.substring(0, 120) + '...' : 'Sem descrição'}</div>
                </div>
            `;

            item.addEventListener('click', () => selectCarouselSpecies(specie.id));
            container.appendChild(item);
        });

        speciesCarouselItems = document.querySelectorAll('.carousel-item');
        totalItems = speciesCarouselItems.length;
        currentIndex = 0;
        updateCarousel(currentIndex);

        initCarouselEvents();
    }

    function selectCarouselSpecies(speciesId) {
        const species = speciesCarouselData.find(s => s.id === speciesId);
        if (!species) return;

        speciesCarouselItems.forEach(item => item.classList.remove('selected'));
        const selectedItem = document.querySelector(`.carousel-item[data-id="${speciesId}"]`);
        if (selectedItem) selectedItem.classList.add('selected');

        selectedSpeciesCarouselId = speciesId;
        selectedSpeciesCarouselData = species;

        const selectedInfo = document.getElementById('carousel-selected-info');
        if (selectedInfo) {
            selectedInfo.textContent = `Selecionado: ${species.nome}`;
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

    function initCarouselEvents() {
        const container = document.querySelector('.species-carousel-container');
        if (!container) return;

        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);

        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mouseup', onMouseUp);
        container.addEventListener('touchstart', onTouchStart);
        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd);
    }

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
                } else if (container) {
                    container.innerHTML = '<div class="carousel-loading"><p>Erro ao carregar espécies</p></div>';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar espécies:', error);
                if (container) {
                    container.innerHTML = '<div class="carousel-loading"><p>Erro ao carregar espécies</p></div>';
                }
            });
    }

    // EXPORTAR FUNÇÕES PÚBLICAS
    window.confirmCarouselSpecies = function() {
        if (!selectedSpeciesCarouselId || !selectedSpeciesCarouselData) {
            alert('Selecione uma espécie primeiro.');
            return;
        }

        // ✅ ATUALIZAR AS VARIÁVEIS GLOBAIS
        window.selectedSpeciesId = selectedSpeciesCarouselId;
        window.selectedSpeciesData = selectedSpeciesCarouselData;

        const especieInput = document.getElementById('especie');
        if (especieInput) especieInput.value = selectedSpeciesCarouselId;

        const selectedNameSpan = document.getElementById('selected-species-name');
        if (selectedNameSpan) selectedNameSpan.textContent = selectedSpeciesCarouselData.nome;

        const especieInfo = document.getElementById('especie-info');
        const especieDesc = document.getElementById('especie-desc');
        const especieMin = document.getElementById('especie-min');
        const especieMax = document.getElementById('especie-max');

        if (especieInfo) especieInfo.style.display = 'block';
        if (especieDesc) especieDesc.textContent = selectedSpeciesCarouselData.descricao || 'Sem descrição';
        if (especieMin) especieMin.textContent = selectedSpeciesCarouselData.minimo_poder;
        if (especieMax) especieMax.textContent = selectedSpeciesCarouselData.maximo_poder;

        if (typeof fichaData !== 'undefined') fichaData.especie = selectedSpeciesCarouselData;

        if (typeof window.carregarFontesPoderFicha === 'function') {
            window.carregarFontesPoderFicha(selectedSpeciesCarouselId);
        }

        closeCarouselSpeciesModal();

        if (typeof goToStep === 'function') goToStep(3);
    };

    window.openCarouselSpeciesModal = function() {
        const modal = document.getElementById('species-carousel-modal');
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (speciesCarouselData.length === 0) {
            loadSpeciesForCarousel();
        } else {
            renderSpeciesCarousel(speciesCarouselData);
        }
    };

    window.closeCarouselSpeciesModal = function() {
        const modal = document.getElementById('species-carousel-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    function updateCarouselSpecies(species) {
        speciesCarouselData = species;
        renderSpeciesCarousel(species);
    }

    window.renderSpeciesCarousel = renderSpeciesCarousel;
    window.updateCarouselSpecies = updateCarouselSpecies;
    window.selectCarouselSpecies = selectCarouselSpecies;
    window.speciesCarouselNext = speciesCarouselNext;
    window.speciesCarouselPrev = speciesCarouselPrev;

})();