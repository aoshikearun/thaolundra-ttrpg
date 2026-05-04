// criar_fundamental.js - Espécie e Fonte de Poder

// ============================================
// CARREGAR DADOS DO SERVIDOR
// ============================================

function carregarEspecies() {
    if (categoriaSelecionada) {
        carregarEspeciesPorCategoria(categoriaSelecionada);
        return;
    }

    fetch('/api/ficha/especies')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.especies) {
                especiesList = data.especies;
                especiesListFull = data.especies;
                const select = document.getElementById('especie');
                if (select) {
                    select.innerHTML = '<option value="">Selecione uma espécie...</option>';
                    data.especies.forEach(especie => {
                        const option = document.createElement('option');
                        option.value = especie.id;
                        option.textContent = `${especie.nome} (Poder: ${especie.minimo_poder}-${especie.maximo_poder})`;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => console.error('Erro ao carregar espécies:', error));
}

async function carregarEspeciesPorCategoria(categoriaId) {
    try {
        const response = await fetch(`/api/ficha/especies-por-categoria?categoria_id=${categoriaId}`);
        const data = await response.json();

        if (data.success) {
            especiesList = data.especies;
            especiesListFull = data.especies;
            window.especiesList = especiesList;

            const select = document.getElementById('especie');
            if (select) {
                select.innerHTML = '<option value="">Selecione uma espécie...</option>';
                data.especies.forEach(especie => {
                    const option = document.createElement('option');
                    option.value = especie.id;
                    let texto = `${especie.nome} (Poder: ${especie.minimo_poder}-${especie.maximo_poder})`;
                    if (especie.advanced === 1) texto += ' 🌟 [Avançada]';
                    option.textContent = texto;
                    select.appendChild(option);
                });
            }

            if (typeof updateCarouselSpecies === 'function') {
                updateCarouselSpecies(data.especies);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar espécies por categoria:', error);
    }
}

function carregarFontesPoder(especieId = null) {
    let url = '/api/ficha/fontes-por-categoria';
    const params = new URLSearchParams();

    if (categoriaSelecionada) {
        params.append('categoria_id', categoriaSelecionada);
    }
    if (especieId) {
        params.append('especie_id', especieId);
    }

    if (params.toString()) {
        url += '?' + params.toString();
    }

    const grid = document.getElementById('fontes-grid');
    if (!grid) return;

    selectedFonteId = null;
    selectedFonteData = null;
    window.selectedFonteId = null;
    window.selectedFonteData = null;

    const fonteInput = document.getElementById('fonte_poder');
    if (fonteInput) fonteInput.value = '';

    const fonteInfo = document.getElementById('fonte-info');
    if (fonteInfo) fonteInfo.style.display = 'none';

    grid.innerHTML = '<div class="loading">Carregando fontes de poder...</div>';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fontesList = data.fontes;
                window.fontesList = fontesList;

                if (typeof fontesData !== 'undefined') {
                    window.fontesData = data.fontes;
                }

                if (typeof updateCarouselFontes === 'function') {
                    updateCarouselFontes(data.fontes);
                }
            } else {
                grid.innerHTML = '<div class="error">Erro ao carregar fontes</div>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar fontes:', error);
            grid.innerHTML = '<div class="error">Erro ao carregar fontes</div>';
        });
}

function carregarFaccoes() {
    fetch('/api/ficha/faccoes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('faccao');
                if (select) {
                    select.innerHTML = '<option value="0">Nenhuma facção</option>';
                    data.faccoes.forEach(faccao => {
                        const option = document.createElement('option');
                        option.value = faccao.id;
                        option.textContent = faccao.nome;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => console.error('Erro ao carregar facções:', error));
}

function carregarAuras() {
    fetch('/api/ficha/auras')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('aura');
                if (select) {
                    select.innerHTML = '<option value="">Selecione uma aura...</option>';
                    data.auras.forEach(aura => {
                        const option = document.createElement('option');
                        option.value = aura.id;
                        option.textContent = aura.nome;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => console.error('Erro ao carregar auras:', error));
}

// ============================================
// ESPÉCIE - MODAL
// ============================================

function initSpeciesModal() {
    const openBtn = document.getElementById('open-species-modal');

    if (openBtn) {
        const newOpenBtn = openBtn.cloneNode(true);
        openBtn.parentNode.replaceChild(newOpenBtn, openBtn);

        newOpenBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof openCarouselSpeciesModal === 'function') {
                openCarouselSpeciesModal();
            } else {
                console.error('openCarouselSpeciesModal não está definida.');
                alert('Erro ao abrir seletor de espécies.');
            }
        });
    }
}

function confirmarSelecaoEspecie() {
    if (!selectedSpeciesId || !selectedSpeciesData) {
        alert('Por favor, selecione uma espécie primeiro.');
        return;
    }

    const especieInput = document.getElementById('especie');
    if (especieInput) especieInput.value = selectedSpeciesId;

    const selectedNameSpan = document.getElementById('selected-species-name');
    if (selectedNameSpan) selectedNameSpan.textContent = selectedSpeciesData.nome;

    const especieInfo = document.getElementById('especie-info');
    const especieDesc = document.getElementById('especie-desc');
    const especieMin = document.getElementById('especie-min');
    const especieMax = document.getElementById('especie-max');

    if (especieInfo) especieInfo.style.display = 'block';
    if (especieDesc) especieDesc.textContent = selectedSpeciesData.descricao || 'Sem descrição';
    if (especieMin) especieMin.textContent = selectedSpeciesData.minimo_poder;
    if (especieMax) especieMax.textContent = selectedSpeciesData.maximo_poder;

    fichaData.especie = selectedSpeciesData;

    const limiteSpan = document.getElementById('limite-poder');
    if (limiteSpan) {
        limiteSpan.textContent = `${selectedSpeciesData.minimo_poder}-${selectedSpeciesData.maximo_poder}`;
    }

    carregarFontesPoder(selectedSpeciesId);

    fecharModalEspecie();

    if (typeof goToStep === 'function') {
        goToStep(3);
    }
}

function fecharModalEspecie() {
    const modal = document.getElementById('species-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================
// FONTE DE PODER - SELEÇÃO
// ============================================

function confirmarSelecaoFonte() {
    if (!selectedFonteId || !selectedFonteData) {
        alert('Por favor, selecione uma fonte de poder primeiro.');
        return;
    }

    const fonteInput = document.getElementById('fonte_poder');
    if (fonteInput) fonteInput.value = selectedFonteId;

    const fonteInfo = document.getElementById('fonte-info');
    const fonteDesc = document.getElementById('fonte-desc');
    const fonteCategoria = document.getElementById('fonte-categoria');

    if (fonteInfo) fonteInfo.style.display = 'block';
    if (fonteDesc) fonteDesc.textContent = selectedFonteData.descricao_curta || 'Sem descrição';
    if (fonteCategoria) fonteCategoria.textContent = selectedFonteData.categoria;

    fichaData.fontePoder = selectedFonteData;

    const btnText = document.getElementById('selected-fonte-name');
    if (btnText) {
        btnText.textContent = selectedFonteData.nome_exibicao;
    }

    if (typeof goToStep === 'function') {
        goToStep(4);
    }
}

// Exportar funções globais
window.carregarEspecies = carregarEspecies;
window.carregarEspeciesPorCategoria = carregarEspeciesPorCategoria;
window.carregarFontesPoder = carregarFontesPoder;
window.carregarFaccoes = carregarFaccoes;
window.carregarAuras = carregarAuras;
window.initSpeciesModal = initSpeciesModal;
window.confirmarSelecaoEspecie = confirmarSelecaoEspecie;
window.fecharModalEspecie = fecharModalEspecie;
window.confirmarSelecaoFonte = confirmarSelecaoFonte;