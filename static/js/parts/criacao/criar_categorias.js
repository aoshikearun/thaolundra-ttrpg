// criar_categorias.js - Seleção de categoria, regras

if (typeof window._criarCategoriasLoaded === 'undefined') {
    window._criarCategoriasLoaded = true;

    // Inicializar a variável global
    window.speciesCarouselData = [];

    function carregarCategorias() {
        fetch('/api/ficha/categorias')
            .then(response => response.json())
            .then(data => {
                if (data.success) window.categoriasList = data.categorias;
            })
            .catch(error => console.error('Erro ao carregar categorias:', error));
    }

    function initCategoriaCards() {
        const cards = document.querySelectorAll('.categoria-card');
        const btnNext = document.getElementById('btn-next-categoria');

        if (!cards.length) {
            console.warn('Nenhum card de categoria encontrado');
            return;
        }

        cards.forEach(card => {
            // Remover listeners antigos para evitar duplicação
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);

            newCard.addEventListener('click', async () => {
                document.querySelectorAll('.categoria-card').forEach(c => c.style.borderColor = 'transparent');
                newCard.style.borderColor = 'var(--primary)';

                categoriaSelecionada = parseInt(newCard.dataset.categoriaId);
                fichaData.categoria_id = categoriaSelecionada;
                window.categoriaSelecionada = categoriaSelecionada;

                await carregarRegrasCategoria(categoriaSelecionada);
                await carregarEspeciesPorCategoria(categoriaSelecionada);

                if (btnNext) btnNext.disabled = false;
            });
        });
    }

    async function carregarRegrasCategoria(categoriaId) {
        try {
            const response = await fetch(`/api/ficha/categorias/${categoriaId}`);
            const data = await response.json();

            if (data.success) {
                categoriaData = data.categoria;
                window.categoriaData = categoriaData;
                window.permiteFontesHibridas = categoriaData.permite_fontes_hibridas === true;
                window.permiteRacasAvancadas = categoriaData.permite_racas_avancadas === true;

                if (categoriaData.limites_pericias) {
                    let limites = categoriaData.limites_pericias;
                    if (typeof limites === 'string') limites = JSON.parse(limites);

                    limitesCategorias.Combate.max = limites.Combate || 2;
                    limitesCategorias.Ofício.max = limites.Ofício || 2;
                    limitesCategorias.Conhecimento.max = limites.Conhecimento || 3;

                    const limiteCombate = document.getElementById('limite-combate');
                    const limiteOficio = document.getElementById('limite-oficio');
                    const limiteConhecimento = document.getElementById('limite-conhecimento');
                    if (limiteCombate) limiteCombate.textContent = limitesCategorias.Combate.max;
                    if (limiteOficio) limiteOficio.textContent = limitesCategorias.Ofício.max;
                    if (limiteConhecimento) limiteConhecimento.textContent = limitesCategorias.Conhecimento.max;
                }

                tecnicasAvancadasMax = categoriaData.tecnicas_avancadas_max || 1;
                tecnicasUltimasMax = categoriaData.tecnicas_ultimas_max || 0;
                window.tecnicasAvancadasMax = tecnicasAvancadasMax;
                window.tecnicasUltimasMax = tecnicasUltimasMax;

                const avancadaMaxSpan = document.getElementById('tecnicas-avancadas-max');
                const avancadaMaxBadge = document.getElementById('avancada-max');
                if (avancadaMaxSpan) avancadaMaxSpan.textContent = tecnicasAvancadasMax;
                if (avancadaMaxBadge) avancadaMaxBadge.textContent = tecnicasAvancadasMax;

                atributosBonusOriginal = categoriaData.atributos_bonus || 0;
                atributosBonusRestantes = atributosBonusOriginal;
                window.atributosBonusRestantes = atributosBonusRestantes;

                poderBonus = categoriaData.poder_bonus || 0;
                poderRollAmount = categoriaData.poder_roll_dice || 1;
                window.poderBonus = poderBonus;
                window.poderRollAmount = poderRollAmount;

                const poderInfoSpan = document.getElementById('categoria-poder-info');
                if (poderInfoSpan && (poderRollAmount !== 1 || poderBonus !== 0)) {
                    let texto = `🎲 Rolagem: ${poderRollAmount}d100`;
                    if (poderBonus > 0) texto += ` + ${poderBonus} bônus`;
                    if (poderBonus < 0) texto += ` ${poderBonus} (negativo)`;
                    poderInfoSpan.textContent = texto;
                }

                fichaData.experiencia_bonus = categoriaData.experiencia_inicial || 500;
            }
        } catch (error) {
            console.error('Erro ao carregar regras da categoria:', error);
        }
    }

    function aplicarRegrasCategoria() {
        if (!categoriaSelecionada) return;
        fetch(`/api/ficha/categorias/${categoriaSelecionada}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    categoriaData = data.categoria;
                    window.categoriaData = categoriaData;
                    if (categoriaData.limites_pericias) {
                        const limites = JSON.parse(categoriaData.limites_pericias);
                        limitesCategorias.Combate.max = limites.Combate || 2;
                        limitesCategorias.Ofício.max = limites.Ofício || 2;
                        limitesCategorias.Conhecimento.max = limites.Conhecimento || 3;
                        document.getElementById('limite-combate').textContent = limites.Combate || 2;
                        document.getElementById('limite-oficio').textContent = limites.Ofício || 2;
                        document.getElementById('limite-conhecimento').textContent = limites.Conhecimento || 3;
                    }
                    const avancadaMax = categoriaData.tecnicas_avancadas_max || 1;
                    document.getElementById('tecnicas-avancadas-max').textContent = avancadaMax;
                    document.getElementById('avancada-max').textContent = avancadaMax;
                    fichaData.experiencia_bonus = categoriaData.experiencia_inicial || 500;
                    if (categoriaData.poder_roll_dice) window.poderRollDice = categoriaData.poder_roll_dice;
                }
            });
    }

    function updateCarouselSpecies(species) {
        console.log('🔄 Atualizando carrossel de espécies com:', species.length, 'espécies');
        window.speciesCarouselData = species;
        if (typeof renderSpeciesCarousel === 'function') {
            renderSpeciesCarousel(species);
        }
    }

    // Exportar
    window.updateCarouselSpecies = updateCarouselSpecies;
    window.carregarCategorias = carregarCategorias;
    window.initCategoriaCards = initCategoriaCards;
    window.carregarRegrasCategoria = carregarRegrasCategoria;
    window.aplicarRegrasCategoria = aplicarRegrasCategoria;
}