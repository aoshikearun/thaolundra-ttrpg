// criar_atributos.js - Rolagem de atributos, distribuição, drag-and-drop
// Versão com arquitetura de valores separados da ordem visual

if (typeof window._criarAtributosLoaded === 'undefined') {
    window._criarAtributosLoaded = true;

    // ============================================
    // Nomes dos atributos (ordem fixa)
    // ============================================
    const ATRIBUTOS_NOMES = ['forca', 'destreza', 'inteligencia', 'constituicao'];

    function getAttrNameByIndex(index) {
        return ATRIBUTOS_NOMES[index];
    }

    function getAttrIndexByName(nome) {
        return ATRIBUTOS_NOMES.indexOf(nome);
    }

    // ============================================
    // ESTRUTURA PRINCIPAL
    // ============================================
    let instancias = [];           // Valores rolados (ordem fixa)
    let ordemAtributos = [];       // Mapeamento: atributo -> índice da instancia
    let atributosBonusRestantes = 0;
    let atributosBonusOriginal = 0;

    // Pontos extras da categoria
    let initExtra = 0;
    let nowExtra = 0;
    let arrayextras = [0, 0, 0, 0];

    // Tentativas
    let atributosTentativas = {1: null, 2: null, 3: null};
    let maiorInitIndex = -1;
    let atributosConfirmados = false;

    // Poder e Aparência
    let poderBonus = 0;
    let poderRollAmount = 1;
    let poderTentativas = {1: null, 2: null, 3: null};
    let poderAceito = false;
    let aparenciaRolada = false;

    // ============================================
    // CLASSE ATRIBUTO (VALOR)
    // ============================================
    class Atributo {
        constructor(initValue, meuIndex) {
            this.initValue = initValue;
            this.nowValue = initValue;
            this.meuIndex = meuIndex;
            this.pointsCounters = [0, 0, 0, 0];
        }

        getPontosDisponiveis() {
            return this.pointsCounters[this.meuIndex];
        }

        getTotalRecebido() {
            let total = 0;
            for (let i = 0; i < this.pointsCounters.length; i++) {
                if (i !== this.meuIndex && this.pointsCounters[i] > 0) {
                    total += this.pointsCounters[i];
                }
            }
            return total;
        }

        getTotalPerdido() {
            let total = 0;
            for (let i = 0; i < this.pointsCounters.length; i++) {
                if (i !== this.meuIndex && this.pointsCounters[i] < 0) {
                    total += Math.abs(this.pointsCounters[i]);
                }
            }
            return total;
        }

        // Remover ponto próprio (criar ponto disponível)
        perderPonto() {
            if (this.nowValue > 1) {
                this.nowValue--;
                this.pointsCounters[this.meuIndex]++;
                return true;
            }
            return false;
        }

        // Receber ponto de outro índice
        receberPonto(origemIndex) {
            if (origemIndex >= 0 && origemIndex < 4) {
                this.nowValue++;
                if (this.pointsCounters[origemIndex] !== undefined) {
                    this.pointsCounters[origemIndex]++;
                } else {
                    this.pointsCounters[origemIndex] = 1;
                }
                return true;
            }
            return false;
        }

        // Devolver ponto que veio de outro (transferência de volta)
        devolverPontoRecebido() {
            for (let i = 0; i < this.pointsCounters.length; i++) {
                if (i !== this.meuIndex && this.pointsCounters[i] > 0) {
                    this.pointsCounters[i]--;
                    this.nowValue--;
                    return i;
                }
            }
            return -1;
        }

        // Consumir ponto próprio (usar para transferir)
        consumirPontoProprio() {
            if (this.pointsCounters[this.meuIndex] > 0) {
                this.pointsCounters[this.meuIndex]--;
                return true;
            }
            return false;
        }

        // Devolver ponto extra
        devolverPontoExtra() {
            if (arrayextras[this.meuIndex] > 0) {
                arrayextras[this.meuIndex]--;
                nowExtra++;
                this.nowValue--;
                return true;
            }
            return false;
        }

        // Adicionar ponto extra
        adicionarPontoExtra() {
            if (nowExtra > 0) {
                nowExtra--;
                arrayextras[this.meuIndex]++;
                this.nowValue++;
                return true;
            }
            return false;
        }
    }

    // ============================================
    // FUNÇÕES DE INICIALIZAÇÃO
    // ============================================

    function criarInstanciasAPartirDeResultados(resultados) {
        // Cria instâncias na ordem da rolagem
        instancias = resultados.map((valor, idx) => new Atributo(valor, idx));
        window.instancias = instancias;

        // Inicializa ordem visual (1:1 no início)
        ordemAtributos = ATRIBUTOS_NOMES.map((nome, idx) => ({
            atributo: nome,
            instanciaIndex: idx
        }));

        window.ordemAtributos = ordemAtributos;
        atualizarMaiorInitValue();
    }

    function atualizarMaiorInitValue() {
        if (!instancias.length) return;
        const maxValue = Math.max(...instancias.map(inst => inst.initValue));
        const indicesComMax = instancias.reduce((acc, inst, idx) => {
            if (inst.initValue === maxValue) acc.push(idx);
            return acc;
        }, []);
        maiorInitIndex = indicesComMax.length === 1 ? indicesComMax[0] : -1;
        window.maiorInitIndex = maiorInitIndex;
    }

    // ============================================
    // VISUALIZAÇÃO (pega o valor do índice mapeado)
    // ============================================

    function getValorVisualPorAtributo(atributoNome) {
        const ordem = ordemAtributos.find(o => o.atributo === atributoNome);
        if (!ordem) return 1;
        return instancias[ordem.instanciaIndex]?.nowValue || 1;
    }

    function getInstanciaIndexPorAtributo(atributoNome) {
        return ordemAtributos.find(o => o.atributo === atributoNome)?.instanciaIndex;
    }

    function getAtributoPorInstanciaIndex(instanciaIndex) {
        return ordemAtributos.find(o => o.instanciaIndex === instanciaIndex)?.atributo;
    }

    function associarInstanciasAosCards() {
        for (let i = 0; i < ATRIBUTOS_NOMES.length; i++) {
            const attrName = ATRIBUTOS_NOMES[i];
            const slot = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
            if (slot) {
                const numberDiv = slot.querySelector('.card-number');
                const extrasDiv = slot.querySelector('.pontos-extras');
                const valor = getValorVisualPorAtributo(attrName);
                if (numberDiv) numberDiv.textContent = valor;
                if (extrasDiv) {
                    const instanciaIndex = getInstanciaIndexPorAtributo(attrName);
                    const disponiveis = instancias[instanciaIndex]?.getPontosDisponiveis() || 0;
                    extrasDiv.innerHTML = `⊕ <span>${disponiveis}</span> ${disponiveis === 1 ? 'disponível' : 'disponíveis'}`;
                }
            }
        }
    }

    function atualizarDisplays() {
        for (let i = 0; i < ATRIBUTOS_NOMES.length; i++) {
            const attrName = ATRIBUTOS_NOMES[i];
            const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
            if (card) {
                const numberDiv = card.querySelector('.card-number');
                const extrasDiv = card.querySelector('.pontos-extras');
                const valor = getValorVisualPorAtributo(attrName);
                if (numberDiv) numberDiv.textContent = valor;
                if (extrasDiv) {
                    const instanciaIndex = getInstanciaIndexPorAtributo(attrName);
                    const disponiveis = instancias[instanciaIndex]?.getPontosDisponiveis() || 0;
                    extrasDiv.innerHTML = `⊕ <span>${disponiveis}</span> ${disponiveis === 1 ? 'disponível' : 'disponíveis'}`;
                }
            }
        }
        atualizarDisplayExtras();
    }

    function atualizarDisplayExtras() {
        const extrasText = document.getElementById('pontos-extras-display');
        if (extrasText && nowExtra !== undefined) {
            extrasText.textContent = nowExtra;
        }
    }

    // ============================================
    // REGRAS DE TRANSFERÊNCIA
    // ============================================

    function podeTransferirPara(receptorAttrNome, doadorInstanciaIndex) {
        const receptorInstanciaIndex = getInstanciaIndexPorAtributo(receptorAttrNome);
        if (receptorInstanciaIndex === undefined) return false;

        const doador = instancias[doadorInstanciaIndex];
        const receptor = instancias[receptorInstanciaIndex];

        // Só pode transferir se initValue do doador <= initValue do receptor
        return doador.initValue <= receptor.initValue;
    }

    function podeTransferirDe(doadorAttrNome, receptorInstanciaIndex) {
        const doadorInstanciaIndex = getInstanciaIndexPorAtributo(doadorAttrNome);
        if (doadorInstanciaIndex === undefined) return false;

        const doador = instancias[doadorInstanciaIndex];
        const receptor = instancias[receptorInstanciaIndex];

        return doador.initValue <= receptor.initValue;
    }

    // Transferir ponto de um instanciaIndex para um atributo visual
    function transferirPonto(doadorInstanciaIndex, receptorAttrNome) {
        const doador = instancias[doadorInstanciaIndex];
        const receptorInstanciaIndex = getInstanciaIndexPorAtributo(receptorAttrNome);
        const receptor = instancias[receptorInstanciaIndex];

        if (doador.initValue > receptor.initValue) return false;
        if (doador.getPontosDisponiveis() <= 0) return false;

        doador.consumirPontoProprio();
        receptor.receberPonto(doadorInstanciaIndex);
        return true;
    }

    // Transferir ponto de um atributo visual para um instanciaIndex
    function transferirPontoDe(doadorAttrNome, receptorInstanciaIndex) {
        const doadorInstanciaIndex = getInstanciaIndexPorAtributo(doadorAttrNome);
        const doador = instancias[doadorInstanciaIndex];
        const receptor = instancias[receptorInstanciaIndex];

        if (doador.initValue > receptor.initValue) return false;
        if (doador.getPontosDisponiveis() <= 0) return false;

        doador.consumirPontoProprio();
        receptor.receberPonto(doadorInstanciaIndex);
        return true;
    }

    // ============================================
    // VISIBILIDADE DOS BOTÕES
    // ============================================

    function atualizarVisibilidadeBotoes() {
    const atributos = ['forca', 'destreza', 'inteligencia', 'constituicao'];

    for (let i = 0; i < atributos.length; i++) {
        const attrName = atributos[i];
        const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
        if (!card) continue;

        const btnMenos = card.querySelector('.btn-card-menos');
        const btnMais = card.querySelector('.btn-card-mais');

        const instanciaIndex = getInstanciaIndexPorAtributo(attrName);
        if (instanciaIndex === undefined) continue;

        const atributo = instancias[instanciaIndex];

        // REGRA DO BOTÃO MENOS (-)
        const ehUnicoMaior = (maiorInitIndex !== -1 && maiorInitIndex === instanciaIndex);
        const podePerder = atributo.nowValue > 1 && !ehUnicoMaior;

        if (btnMenos) {
            btnMenos.style.display = podePerder ? 'flex' : 'none';
        }

        // REGRA DO BOTÃO MAIS (+)
        let podeGanhar = false;

        if (nowExtra > 0) podeGanhar = true;
        if (atributo.getPontosDisponiveis() > 0) podeGanhar = true;

        for (let j = 0; j < instancias.length; j++) {
            if (j !== instanciaIndex) {
                const doador = instancias[j];
                if (doador.getPontosDisponiveis() > 0 && doador.initValue <= atributo.initValue) {
                    podeGanhar = true;
                    break;
                }
            }
        }

        if (btnMais) {
            btnMais.style.display = podeGanhar ? 'flex' : 'none';
        }
    }
}
    function atualizarVisibilidadeBtnConfirmar() {
        const btnConfirmar = document.getElementById('confirmar-atributos');
        const notificacao = document.getElementById('confirmar-notificacao');
        const mensagemSpan = notificacao?.querySelector('.notificacao-mensagem');
        if (!btnConfirmar || !instancias.length) return;
        if (notificacao) notificacao.classList.remove('visible');

        let pontosPendentes = 0;
        for (const inst of instancias) {
            pontosPendentes += inst.getPontosDisponiveis();
        }

        const extrasPendentes = nowExtra > 0;

        if (pontosPendentes > 0 || extrasPendentes) {
            btnConfirmar.style.display = 'none';
            if (notificacao && mensagemSpan) {
                if (pontosPendentes > 0 && extrasPendentes) {
                    mensagemSpan.textContent = `⚠️ Você ainda tem ${pontosPendentes} ponto(s) para transferir e ${nowExtra} ponto(s) extra(s) para distribuir!`;
                } else if (pontosPendentes > 0) {
                    mensagemSpan.textContent = `⚠️ Você ainda tem ${pontosPendentes} ponto(s) para transferir!`;
                } else {
                    mensagemSpan.textContent = `⚠️ Você ainda tem ${nowExtra} ponto(s) extra(s) para distribuir!`;
                }
                notificacao.classList.add('visible');
            }
            return;
        }

        for (const inst of instancias) {
            if (inst.nowValue < 1) {
                btnConfirmar.style.display = 'none';
                if (notificacao && mensagemSpan) {
                    mensagemSpan.textContent = '⚠️ Atributo não pode ser menor que 1.';
                    notificacao.classList.add('visible');
                }
                return;
            }
        }

        if (fichaData.especie) {
            const valores = obterNowValuesParaValidacao();
            const especieNome = fichaData.especie.nome;
            if (especieNome === 'Klaveck' && valores.inteligencia > 3) {
                btnConfirmar.style.display = 'none';
                if (notificacao && mensagemSpan) {
                    mensagemSpan.textContent = `⚠️ Klaveck: Inteligência máxima é 3. (Atual: ${valores.inteligencia})`;
                    notificacao.classList.add('visible');
                }
                return;
            }
            if (especieNome === 'Darch' && valores.constituicao > 3) {
                btnConfirmar.style.display = 'none';
                if (notificacao && mensagemSpan) {
                    mensagemSpan.textContent = `⚠️ Darch: Constituição máxima é 3. (Atual: ${valores.constituicao})`;
                    notificacao.classList.add('visible');
                }
                return;
            }
            if (especieNome === 'Mecha' && valores.constituicao < 10) {
                btnConfirmar.style.display = 'none';
                if (notificacao && mensagemSpan) {
                    mensagemSpan.textContent = `⚠️ Mecha: Constituição mínima é 10. (Atual: ${valores.constituicao})`;
                    notificacao.classList.add('visible');
                }
                return;
            }
        }

        btnConfirmar.style.display = 'block';
        if (notificacao) notificacao.classList.remove('visible');
    }

    function obterNowValuesParaValidacao() {
        return {
            forca: getValorVisualPorAtributo('forca'),
            destreza: getValorVisualPorAtributo('destreza'),
            inteligencia: getValorVisualPorAtributo('inteligencia'),
            constituicao: getValorVisualPorAtributo('constituicao')
        };
    }

    function atualizarTudo() {
        atualizarMaiorInitValue();
        atualizarDisplays();
        atualizarVisibilidadeBotoes();
        atualizarVisibilidadeBtnConfirmar();
        atualizarDisplayExtras();
    }

    // ============================================
    // AÇÕES DOS BOTÕES
    // ============================================

    function botaoMaisClick(attrName) {
        const instanciaIndex = getInstanciaIndexPorAtributo(attrName);
        if (instanciaIndex === undefined) return;

        const receptor = instancias[instanciaIndex];

        // PRIORIDADE 1: Usar pontos próprios disponíveis
        if (receptor.getPontosDisponiveis() > 0) {
            receptor.consumirPontoProprio();
            receptor.nowValue++;
            atualizarTudo();
            return;
        }

        // PRIORIDADE 2: Buscar doadores (outros instanciaIndex)
        const doadores = [];
        for (let j = 0; j < instancias.length; j++) {
            if (j !== instanciaIndex) {
                const doador = instancias[j];
                if (doador.getPontosDisponiveis() > 0 && doador.initValue <= receptor.initValue) {
                    doadores.push(j);
                }
            }
        }

        if (doadores.length > 0) {
            let doadorIndex = doadores[0];
            if (doadores.length > 1) {
                const options = doadores.map((idx, i) => {
                    const attr = getAtributoPorInstanciaIndex(idx);
                    return `${i}: ${attr || `Valor ${idx + 1}`}`;
                }).join('\n');
                const escolha = prompt(`De qual valor você quer receber o ponto?\n\n${options}\n\nDigite o número:`, "0");
                const escolhaIdx = parseInt(escolha);
                if (escolhaIdx >= 0 && escolhaIdx < doadores.length) {
                    doadorIndex = doadores[escolhaIdx];
                }
            }

            const doador = instancias[doadorIndex];
            if (doador.getPontosDisponiveis() > 0) {
                doador.consumirPontoProprio();
                receptor.receberPonto(doadorIndex);
                atualizarTudo();
            }
            return;
        }

        // PRIORIDADE 3: Usar pontos extras
        if (receptor.adicionarPontoExtra()) {
            atualizarTudo();
            return;
        }
    }

    function botaoMenosClick(attrName) {
        const instanciaIndex = getInstanciaIndexPorAtributo(attrName);
        if (instanciaIndex === undefined) return;

        const atributo = instancias[instanciaIndex];

        // PRIORIDADE 1: Devolver ponto extra
        if (atributo.devolverPontoExtra()) {
            atualizarTudo();
            return;
        }

        // PRIORIDADE 2: Devolver ponto recebido de outro
        const origemIndex = atributo.devolverPontoRecebido();
        if (origemIndex !== -1) {
            instancias[origemIndex].nowValue++;
            atualizarTudo();
            return;
        }

        // PRIORIDADE 3: Remover ponto próprio (criar disponível)
        if (atributo.nowValue > 1) {
            // Verificar se pode perder (não é o único maior)
            const naoEhUnicoMaior = (maiorInitIndex === -1) || (maiorInitIndex !== instanciaIndex);
            if (naoEhUnicoMaior || atributo.nowValue > atributo.initValue) {
                atributo.perderPonto();
                atualizarTudo();
            }
        }
    }

    // ============================================
    // DRAG AND DROP (trocar ordem visual)
    // ============================================

    function initDragDropAtributos() {
        const cards = document.querySelectorAll('.atributo-slot');
        let dragSourceAttr = null;
        let touchStartAttr = null;
        let touchStartY = null;

        cards.forEach(card => {
            const numberDiv = card.querySelector('.card-number');
            if (!numberDiv) return;

            const attrName = card.getAttribute('data-atributo');

            // Mouse events
            numberDiv.setAttribute('draggable', 'true');

            numberDiv.addEventListener('dragstart', function(e) {
                dragSourceAttr = attrName;
                e.dataTransfer.setData('text/plain', attrName);
                e.dataTransfer.effectAllowed = 'move';
                this.style.opacity = '0.5';
            });

            numberDiv.addEventListener('dragend', function(e) {
                this.style.opacity = '1';
                dragSourceAttr = null;
            });

            card.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

            card.addEventListener('drop', function(e) {
                e.preventDefault();
                card.classList.remove('drag-over');
                const targetAttr = this.getAttribute('data-atributo');

                if (dragSourceAttr && dragSourceAttr !== targetAttr) {
                    // Trocar os instanciaIndex entre os dois atributos
                    const sourceIndex = getInstanciaIndexPorAtributo(dragSourceAttr);
                    const targetIndex = getInstanciaIndexPorAtributo(targetAttr);

                    if (sourceIndex !== undefined && targetIndex !== undefined) {
                        const sourceOrdem = ordemAtributos.find(o => o.atributo === dragSourceAttr);
                        const targetOrdem = ordemAtributos.find(o => o.atributo === targetAttr);

                        if (sourceOrdem && targetOrdem) {
                            const temp = sourceOrdem.instanciaIndex;
                            sourceOrdem.instanciaIndex = targetOrdem.instanciaIndex;
                            targetOrdem.instanciaIndex = temp;

                            atualizarTudo();
                        }
                    }
                }
            });

            // Touch events
            numberDiv.addEventListener('touchstart', function(e) {
                e.preventDefault();
                touchStartAttr = attrName;
                touchStartY = e.touches[0].clientY;
                this.style.opacity = '0.5';
            }, { passive: false });

            numberDiv.addEventListener('touchmove', function(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const deltaY = Math.abs(touch.clientY - touchStartY);
                if (deltaY < 10) return;

                const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetCard = elementAtTouch?.closest('.atributo-slot');

                cards.forEach(c => c.classList.remove('drag-over'));
                if (targetCard && targetCard !== card) {
                    targetCard.classList.add('drag-over');
                }
            }, { passive: false });

            numberDiv.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.style.opacity = '1';

                const touch = e.changedTouches[0];
                const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetCard = elementAtTouch?.closest('.atributo-slot');

                if (targetCard && touchStartAttr) {
                    const targetAttr = targetCard.getAttribute('data-atributo');
                    if (touchStartAttr !== targetAttr) {
                        const sourceIndex = getInstanciaIndexPorAtributo(touchStartAttr);
                        const targetIndex = getInstanciaIndexPorAtributo(targetAttr);

                        if (sourceIndex !== undefined && targetIndex !== undefined) {
                            const sourceOrdem = ordemAtributos.find(o => o.atributo === touchStartAttr);
                            const targetOrdem = ordemAtributos.find(o => o.atributo === targetAttr);

                            if (sourceOrdem && targetOrdem) {
                                const temp = sourceOrdem.instanciaIndex;
                                sourceOrdem.instanciaIndex = targetOrdem.instanciaIndex;
                                targetOrdem.instanciaIndex = temp;
                                atualizarTudo();
                            }
                        }
                    }
                }

                cards.forEach(c => c.classList.remove('drag-over'));
                touchStartAttr = null;
                touchStartY = null;
            });
        });
    }

    function initBotoesCardAtributos() {
        for (let i = 0; i < ATRIBUTOS_NOMES.length; i++) {
            const attrName = ATRIBUTOS_NOMES[i];
            const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
            if (card) {
                const btnMenos = card.querySelector('.btn-card-menos');
                const btnMais = card.querySelector('.btn-card-mais');

                if (btnMenos) {
                    const newBtnMenos = btnMenos.cloneNode(true);
                    btnMenos.parentNode.replaceChild(newBtnMenos, btnMenos);
                    newBtnMenos.addEventListener('click', () => botaoMenosClick(attrName));
                }
                if (btnMais) {
                    const newBtnMais = btnMais.cloneNode(true);
                    btnMais.parentNode.replaceChild(newBtnMais, btnMais);
                    newBtnMais.addEventListener('click', () => botaoMaisClick(attrName));
                }
            }
        }
    }

    // ============================================
    // BÔNUS E RESET
    // ============================================

    function aplicarBonusAtributos() {
        if (atributosBonusRestantes <= 0) return;

        nowExtra = atributosBonusRestantes;
        initExtra = atributosBonusRestantes;
        arrayextras = [0, 0, 0, 0];

        atualizarDisplayExtras();

        alert(`✨ Você recebeu ${atributosBonusRestantes} pontos bônus para distribuir! Use os botões "+" para alocá-los nos atributos.`);

        atributosBonusRestantes = 0;
        window.atributosBonusRestantes = 0;
        window.nowExtra = nowExtra;
        window.initExtra = initExtra;
        window.arrayextras = arrayextras;

        atualizarVisibilidadeBotoes();
        atualizarVisibilidadeBtnConfirmar();
    }

    window.resetarAtributos = function() {
        if (!instancias.length) return;
        if (confirm('Resetar distribuição?')) {
            // Resetar valores das instâncias
            for (let i = 0; i < instancias.length; i++) {
                instancias[i].nowValue = instancias[i].initValue;
                instancias[i].pointsCounters = [0, 0, 0, 0];
            }

            // Resetar ordem visual para 1:1
            ordemAtributos = ATRIBUTOS_NOMES.map((nome, idx) => ({
                atributo: nome,
                instanciaIndex: idx
            }));

            // Resetar pontos extras
            if (categoriaData && categoriaData.atributos_bonus) {
                nowExtra = categoriaData.atributos_bonus;
                initExtra = categoriaData.atributos_bonus;
                arrayextras = [0, 0, 0, 0];
                alert(`🔄 Reset concluído. ${nowExtra} pontos bônus disponíveis.`);
            } else {
                nowExtra = 0;
                initExtra = 0;
                arrayextras = [0, 0, 0, 0];
                alert('✅ Valores resetados para os originais!');
            }

            atualizarTudo();
        }
    };

    window.confirmarAtributos = function() {
        let pontosPendentes = 0;
        for (const inst of instancias) {
            pontosPendentes += inst.getPontosDisponiveis();
        }

        if (pontosPendentes > 0 || nowExtra > 0) {
            alert(`⚠️ Você ainda tem ${pontosPendentes} ponto(s) para transferir e ${nowExtra} ponto(s) extra(s) para distribuir!`);
            return;
        }

        for (const inst of instancias) {
            if (inst.nowValue < 1) {
                alert('⚠️ Atributo não pode ser menor que 1.');
                return;
            }
        }

        if (fichaData.especie) {
            const valores = obterNowValuesParaValidacao();
            const especieNome = fichaData.especie.nome;
            if (especieNome === 'Klaveck' && valores.inteligencia > 3) {
                alert(`⚠️ Klaveck não pode ter Inteligência > 3. Atual: ${valores.inteligencia}`);
                return;
            }
            if (especieNome === 'Darch' && valores.constituicao > 3) {
                alert(`⚠️ Darch não pode ter Constituição > 3. Atual: ${valores.constituicao}`);
                return;
            }
            if (especieNome === 'Mecha' && valores.constituicao < 10) {
                alert(`⚠️ Mecha precisa ter Constituição mínima 10. Atual: ${valores.constituicao}`);
                return;
            }
        }

        // Salvar valores finais no fichaData (mapeados pelos atributos)
        fichaData.atributos.forca = getValorVisualPorAtributo('forca');
        fichaData.atributos.destreza = getValorVisualPorAtributo('destreza');
        fichaData.atributos.inteligencia = getValorVisualPorAtributo('inteligencia');
        fichaData.atributos.constituicao = getValorVisualPorAtributo('constituicao');

        atributosConfirmados = true;
        window.atributosConfirmados = true;

        document.querySelectorAll('.btn-card-menos, .btn-card-mais').forEach(btn => btn.style.display = 'none');
        document.querySelectorAll('.card-number').forEach(el => el.setAttribute('draggable', 'false'));

        const btnResetar = document.getElementById('resetar-atributos');
        const btnConfirmar = document.getElementById('confirmar-atributos');
        if (btnResetar) btnResetar.style.display = 'none';
        if (btnConfirmar) btnConfirmar.style.display = 'none';

        const poderSection = document.getElementById('poder-section');
        if (poderSection) poderSection.style.display = 'block';

        alert('✅ Atributos confirmados! Role Poder e Aparência.');
    };

    // ============================================
    // ROLAGEM DE ATRIBUTOS (COM ENTRADA MANUAL)
    // ============================================

    function criarInputManual(tentativa) {
        const container = document.getElementById(`tentativa-${tentativa}`);
        if (!container) return;

        const atributos = ['forca', 'destreza', 'inteligencia', 'constituicao'];

        let html = `<h4>Tentativa ${tentativa} (Inserção Manual)</h4>`;
        html += `<div class="atributos-rolagem">`;

        atributos.forEach((attr, index) => {
            html += `
                <div class="atributo-linha" data-atributo="${attr}">
                    <label style="width: 100px;">${attr.toUpperCase()}:</label>
                    <input type="number" id="manual-${tentativa}-${attr}" class="manual-input" min="1" max="30" value="10" style="width: 80px; padding: 8px; border-radius: 8px;">
                </div>
            `;
        });

        html += `</div>`;
        html += `<div class="tentativa-acoes">`;
        html += `<button class="btn-aceitar" onclick="aceitarManual(${tentativa})">✅ Aceitar Valores</button>`;
        if (tentativa < 3) {
            html += `<button class="btn-rejeitar" onclick="rejeitarAtributos(${tentativa})">❌ Rejeitar</button>`;
        }
        html += `<button class="btn-rolar" onclick="rolarAtributos(${tentativa})" style="margin-left: 10px;">🎲 Rolar Dados</button>`;
        html += `</div>`;

        container.innerHTML = html;
    }

    window.rolarAtributos = function(tentativa) {
        fetch('/api/ficha/rolar-atributos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tentativa: tentativa })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.atributosTentativas[tentativa] = data.resultados;
                criarVisualizacaoRolagem(tentativa, data.resultados);
            } else {
                alert(`Erro: ${data.message}`);
            }
        });
    };

    function criarVisualizacaoRolagem(tentativa, resultados) {
        let container = document.getElementById(`tentativa-${tentativa}`);
        if (!container) {
            container = document.createElement('div');
            container.id = `tentativa-${tentativa}`;
            container.className = tentativa === 1 ? 'tentativa-ativa' : 'tentativa-oculta';
            if (tentativa !== 1) container.style.display = 'none';
            document.getElementById('atributos-rolagem-container').appendChild(container);
        }

        let html = `<h4>Tentativa ${tentativa} (Rolagem de Dados)</h4>`;
        html += `<div class="atributos-rolagem">`;

        const atributos = ['forca', 'destreza', 'inteligencia', 'constituicao'];
        atributos.forEach((attr, index) => {
            const r = resultados[index];
            let descartado = false;
            const dadosHtml = r.dados.map(dado => {
                let isMenor = false;
                if (dado === r.menor && !descartado) {
                    isMenor = true;
                    descartado = true;
                }
                return `<span class="dado ${isMenor ? 'descartado' : ''}">${dado}</span>`;
            }).join('');

            html += `
                <div class="atributo-linha" data-atributo="${attr}">
                    <div class="dados-container">${dadosHtml}</div>
                    <span class="resultado">${r.valor}</span>
                </div>
            `;
        });
        html += `</div>`;
        html += `<div class="tentativa-acoes">`;
        html += `<button class="btn-aceitar" onclick="aceitarTentativa(${tentativa})">✅ Aceitar</button>`;
        if (tentativa < 3) {
            html += `<button class="btn-rejeitar" onclick="rejeitarAtributos(${tentativa})">❌ Rejeitar</button>`;
        }
        html += `</div>`;

        container.innerHTML = html;
    }

    window.aceitarManual = function(tentativa) {
        const atributos = ['forca', 'destreza', 'inteligencia', 'constituicao'];
        const valores = [];

        for (const attr of atributos) {
            const input = document.getElementById(`manual-${tentativa}-${attr}`);
            if (!input) {
                alert(`Erro: Campo ${attr} não encontrado`);
                return;
            }
            const valor = parseInt(input.value);
            if (isNaN(valor) || valor < 1 || valor > 30) {
                alert(`Valor inválido para ${attr}. Use números entre 1 e 30.`);
                return;
            }
            valores.push(valor);
        }

        // Criar estrutura de resultados simulada
        const resultados = valores.map((valor, idx) => ({
            dados: [valor, valor, valor, valor],
            menor: valor,
            soma: valor * 4,
            valor: valor
        }));

        window.atributosTentativas[tentativa] = resultados;
        aceitarTentativa(tentativa);
    };

    window.aceitarTentativa = function(tentativa) {
        const resultados = window.atributosTentativas[tentativa];
        if (!resultados) return;

        const valores = resultados.map(r => r.valor);
        criarInstanciasAPartirDeResultados(valores);

        document.getElementById('atributos-rolagem-container').style.display = 'none';
        const distribuicaoSection = document.querySelector('.distribuicao-section');
        if (distribuicaoSection) distribuicaoSection.style.display = 'block';

        // Inicializar variáveis de pontos extras
        initExtra = 0;
        nowExtra = 0;
        arrayextras = [0, 0, 0, 0];

        setTimeout(() => {
            const btnConfirmar = document.getElementById('confirmar-atributos');
            if (btnConfirmar) {
                btnConfirmar.onclick = window.confirmarAtributos;
                console.log('onclick do confirmar atribuído');
            }
            if (document.querySelector('.atributo-slot')) {
                associarInstanciasAosCards();
                atualizarDisplays();
                atualizarVisibilidadeBotoes();
                atualizarVisibilidadeBtnConfirmar();
                initBotoesCardAtributos();
                initDragDropAtributos();
                aplicarBonusAtributos();
            } else {
                console.warn('Elementos .atributo-slot não encontrados, tentando novamente...');
                setTimeout(() => {
                    associarInstanciasAosCards();
                    atualizarDisplays();
                    atualizarVisibilidadeBotoes();
                    atualizarVisibilidadeBtnConfirmar();
                    initBotoesCardAtributos();
                    initDragDropAtributos();
                    aplicarBonusAtributos();
                }, 200);
            }
        }, 150);

        for (let i = 1; i <= 3; i++) {
            const btn = document.querySelector(`#tentativa-${i} .btn-rolar`);
            if (btn) btn.disabled = true;
            const btnsAcao = document.querySelector(`#tentativa-${i} .tentativa-acoes`);
            if (btnsAcao) btnsAcao.style.display = 'none';
        }

        const btnResetar = document.getElementById('resetar-atributos');
        if (btnResetar) btnResetar.style.display = 'block';
        alert(`✅ Tentativa ${tentativa} aceita! Agora distribua os valores.`);
    };

    window.rejeitarAtributos = function(tentativa) {
        if (tentativa >= 3) {
            alert('Última tentativa. Não pode rejeitar.');
            return;
        }

        const proxima = tentativa + 1;
        const atualDiv = document.getElementById(`tentativa-${tentativa}`);
        if (atualDiv) atualDiv.style.display = 'none';

        let proximaDiv = document.getElementById(`tentativa-${proxima}`);
        if (!proximaDiv) {
            proximaDiv = document.createElement('div');
            proximaDiv.id = `tentativa-${proxima}`;
            proximaDiv.className = 'tentativa-oculta';
            document.getElementById('atributos-rolagem-container').appendChild(proximaDiv);
        }

        proximaDiv.style.display = 'block';

        // Criar opção de inserção manual para a próxima tentativa
        if (!proximaDiv.querySelector('.btn-rolar') && !proximaDiv.querySelector('.btn-manual')) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'tentativa-acoes';
            btnContainer.innerHTML = `
                <button class="btn-rolar" onclick="rolarAtributos(${proxima})">🎲 Rolar Dados</button>
            `;
            proximaDiv.appendChild(btnContainer);
        }

        alert(`Tentativa ${tentativa} rejeitada. Agora na tentativa ${proxima}.`);
    };

    // ============================================
    // PODER E APARÊNCIA
    // ============================================
    function calcularPontos() {
        if (!fichaData.atributos) return;
        fetch('/api/ficha/calcular-pontos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fichaData.atributos)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fichaData.pontos = data.pontos;
                const elementos = ['pontos-pericias', 'pontos-tecnicas', 'calc-fv', 'calc-pe', 'calc-pericias', 'calc-tecnicas'];
                elementos.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = data.pontos[id.replace('calc-', '')] || data.pontos[id] || 0;
                });
            }
        })
        .catch(error => console.error('Erro ao calcular pontos:', error));
    }
    
    window.rolarPoder = function(tentativa) {
        fetch('/api/ficha/rolar-poder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tentativa: tentativa, roll_amount: poderRollAmount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.poderTentativas[tentativa] = data.poder;
                const container = document.getElementById(`poder-tentativa-${tentativa}`);
                const poderDiv = document.getElementById(`poder-${tentativa}`);

                let isValido = true;

                if (fichaData.especie) {
                    if (data.poder < fichaData.especie.minimo_poder || data.poder > fichaData.especie.maximo_poder) {
                        isValido = false;
                    }
                }

                // Remover botões antigos (todos os .tentativa-acoes e botões soltos)
                if (container) {
                    const oldAcoes = container.querySelector('.tentativa-acoes');
                    if (oldAcoes) oldAcoes.remove();

                    const oldBotoesSoltos = container.querySelectorAll('.btn-rolar, .btn-manual');
                    oldBotoesSoltos.forEach(btn => {
                        if (!btn.closest('.tentativa-acoes')) {
                            btn.remove();
                        }
                    });
                }

                if (isValido && container) {
                    // VALOR VÁLIDO
                    if (poderDiv) {
                        poderDiv.textContent = data.poder;
                        poderDiv.style.color = '';
                        poderDiv.classList.remove('valor-ilegal');
                    }

                    const botoesHtml = `
                        <div class="tentativa-acoes">
                            <button class="btn-aceitar" onclick="aceitarPoder(${tentativa})">✅ Aceitar</button>
                            ${tentativa < 3 ? `<button class="btn-rejeitar" onclick="rejeitarPoder(${tentativa})">❌ Rejeitar</button>` : ''}
                            <button class="btn-manual" onclick="inserirPoderManual(${tentativa})">✏️ Inserir Manualmente</button>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', botoesHtml);

                } else if (container) {
                    // VALOR INVÁLIDO
                    if (poderDiv) {
                        poderDiv.textContent = `⚠️ ${data.poder} (fora do limite)`;
                        poderDiv.style.color = 'var(--danger)';
                        poderDiv.classList.add('valor-ilegal');
                    }

                    // Botão Rolar Poder
                    const btnRolar = document.createElement('button');
                    btnRolar.className = 'btn-rolar';
                    btnRolar.textContent = '🎲 Rolar Poder';
                    btnRolar.onclick = () => window.rolarPoder(tentativa);
                    container.appendChild(btnRolar);

                    // Botão Inserir Manualmente
                    const btnManual = document.createElement('button');
                    btnManual.className = 'btn-manual';
                    btnManual.textContent = '✏️ Inserir Manualmente';
                    btnManual.onclick = () => inserirPoderManual(tentativa);
                    btnManual.style.marginLeft = '10px';
                    container.appendChild(btnManual);

                    alert(`⚠️ Poder ${data.poder} fora do limite (${fichaData.especie.minimo_poder}-${fichaData.especie.maximo_poder}). Tente novamente.`);
                }

            } else {
                alert(`Erro: ${data.message}`);
            }
        });
    };

    window.inserirPoderManual = function(tentativa) {
        const limiteMin = fichaData.especie?.minimo_poder || 1;
        const limiteMax = fichaData.especie?.maximo_poder || 100;

        const valor = prompt(`Digite o valor do Poder (entre ${limiteMin} e ${limiteMax}):`);
        if (!valor) return;

        const poder = parseInt(valor);
        if (isNaN(poder) || poder < limiteMin || poder > limiteMax) {
            alert(`Valor inválido. Use entre ${limiteMin} e ${limiteMax}.`);
            return;
        }

        window.poderTentativas[tentativa] = poder;
        const poderDiv = document.getElementById(`poder-${tentativa}`);
        const container = document.getElementById(`poder-tentativa-${tentativa}`);
        if (poderDiv) poderDiv.textContent = poder;

        const oldButtons = container?.querySelector('.tentativa-acoes');
        if (oldButtons) oldButtons.remove();

        if (container) {
            const botoesHtml = `
                <div class="tentativa-acoes">
                    <button class="btn-aceitar" onclick="aceitarPoder(${tentativa})">✅ Aceitar</button>
                    ${tentativa < 3 ? `<button class="btn-rejeitar" onclick="rejeitarPoder(${tentativa})">❌ Rejeitar</button>` : ''}
                    <button class="btn-manual" onclick="inserirPoderManual(${tentativa})">✏️ Editar</button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', botoesHtml);
        }
    };

    window.aceitarPoder = function(tentativa) {
        let poder = window.poderTentativas[tentativa];
        if (!poder) return;

        if (fichaData.especie) {
            if (poder < fichaData.especie.minimo_poder || poder > fichaData.especie.maximo_poder) {
                alert(`⚠️ ${fichaData.especie.nome} requer poder entre ${fichaData.especie.minimo_poder} e ${fichaData.especie.maximo_poder}.`);
                return;
            }
        }

        if (poderBonus !== 0) {
            const poderOriginal = poder;
            poder = poder + poderBonus;
            alert(`✨ Poder base: ${poderOriginal} + ${poderBonus} de bônus = ${poder}`);
        }

        fichaData.atributos.poder = poder;
        poderAceito = true;
        window.poderAceito = true;
        alert(`✅ Poder ${poder} aceito!`);

        const container = document.getElementById(`poder-tentativa-${tentativa}`);
        const botoes = container?.querySelector('.tentativa-acoes');
        if (botoes) botoes.style.display = 'none';

        calcularPontos();
    const aparenciaSection = document.getElementById('aparencia-section');
    if (aparenciaSection) aparenciaSection.style.display = 'block';
};

    window.rejeitarPoder = function(tentativa) {
        if (tentativa >= 3) {
            alert('Última tentativa. Não pode rejeitar.');
            return;
        }

        const proxima = tentativa + 1;

        // Esconder tentativa atual
        const atualDiv = document.getElementById(`poder-tentativa-${tentativa}`);
        if (atualDiv) atualDiv.style.display = 'none';

        // Pegar ou criar a próxima tentativa
        let proximaDiv = document.getElementById(`poder-tentativa-${proxima}`);
        if (!proximaDiv) {
            proximaDiv = document.createElement('div');
            proximaDiv.id = `poder-tentativa-${proxima}`;
            proximaDiv.className = 'poder-tentativa-oculta';
            document.getElementById('poder-rolagem-container').appendChild(proximaDiv);
        }

        // SEMPRE recriar o conteúdo da próxima tentativa para garantir que o #poder-X exista
        proximaDiv.innerHTML = `
            <h4>Tentativa ${proxima}</h4>
            <div class="resultado-poder" id="poder-${proxima}">-</div>
        `;

        proximaDiv.style.display = 'block';

        // Adicionar botão de rolar
        const btnRolar = document.createElement('button');
        btnRolar.className = 'btn-rolar';
        btnRolar.textContent = '🎲 Rolar Poder';
        btnRolar.onclick = () => window.rolarPoder(proxima);
        proximaDiv.appendChild(btnRolar);

        // Adicionar botão manual
        const btnManual = document.createElement('button');
        btnManual.className = 'btn-manual';
        btnManual.textContent = '✏️ Inserir Manualmente';
        btnManual.onclick = () => inserirPoderManual(proxima);
        btnManual.style.marginLeft = '10px';
        proximaDiv.appendChild(btnManual);

        alert(`Tentativa ${tentativa} rejeitada. Agora na tentativa ${proxima}.`);
    };

    window.rolarAparencia = function() {
        const btn = document.querySelector('#aparencia-rolagem-container .btn-rolar');
        if (btn && btn.disabled) {
            alert('Você já rolou a aparência!');
            return;
        }

        fetch('/api/ficha/rolar-aparencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('aparencia-result').textContent = data.aparencia;
                fichaData.atributos.aparencia = data.aparencia;
                if (btn) btn.style.display = 'none';
                aparenciaRolada = true;
                window.aparenciaRolada = true;
                alert(`Aparência rolada: ${data.aparencia}`);
            }
        });
    };

    window.inserirAparenciaManual = function() {
        const valor = prompt("Digite o valor da Aparência (1 a 20):");
        if (!valor) return;

        const aparencia = parseInt(valor);
        if (isNaN(aparencia) || aparencia < 1 || aparencia > 20) {
            alert("Valor inválido. Use entre 1 e 20.");
            return;
        }

        document.getElementById('aparencia-result').textContent = aparencia;
        fichaData.atributos.aparencia = aparencia;
        aparenciaRolada = true;
        window.aparenciaRolada = true;

        const btn = document.querySelector('#aparencia-rolagem-container .btn-rolar');
        if (btn) btn.style.display = 'none';

        const btnManual = document.querySelector('#aparencia-manual-container .btn-manual');
        if (btnManual) btnManual.style.display = 'none';

        alert(`Aparência definida: ${aparencia}`);
    };

    // ============================================
    // NAVEGAÇÃO - PODER
    // ============================================

    window.mostrarPoderMetodo = function() {
        const metodo = document.getElementById('poder-metodo-container');
        const rolagem = document.getElementById('poder-rolagem-container');
        const manual = document.getElementById('poder-manual-container');
        if (metodo) metodo.style.display = 'flex';
        if (rolagem) rolagem.style.display = 'none';
        if (manual) manual.style.display = 'none';
    };

    window.mostrarPoderRolagem = function() {
        const metodo = document.getElementById('poder-metodo-container');
        const rolagem = document.getElementById('poder-rolagem-container');
        const manual = document.getElementById('poder-manual-container');
        if (metodo) metodo.style.display = 'none';
        if (rolagem) rolagem.style.display = 'block';
        if (manual) manual.style.display = 'none';
    };

    window.mostrarPoderInsercaoManual = function() {
        const metodo = document.getElementById('poder-metodo-container');
        const rolagem = document.getElementById('poder-rolagem-container');
        const manual = document.getElementById('poder-manual-container');
        if (metodo) metodo.style.display = 'none';
        if (rolagem) rolagem.style.display = 'none';
        if (manual) manual.style.display = 'block';
    };

    window.aceitarManualPoder = function() {
        const input = document.getElementById('manual-poder');
        const poder = parseInt(input.value);
        const limiteMin = fichaData.especie?.minimo_poder || 1;
        const limiteMax = fichaData.especie?.maximo_poder || 100;

        if (isNaN(poder) || poder < limiteMin || poder > limiteMax) {
            alert(`⚠️ Poder deve estar entre ${limiteMin} e ${limiteMax}.`);
            return;
        }

        if (poderBonus !== 0) {
            const poderOriginal = poder;
            const poderFinal = poder + poderBonus;
            alert(`✨ Poder base: ${poderOriginal} + ${poderBonus} de bônus = ${poderFinal}`);
            fichaData.atributos.poder = poderFinal;
        } else {
            fichaData.atributos.poder = poder;
        }

        poderAceito = true;
        window.poderAceito = true;
        alert(`✅ Poder ${fichaData.atributos.poder} aceito!`);
        calcularPontos();

        const aparenciaSection = document.getElementById('aparencia-section');
        if (aparenciaSection) {
            aparenciaSection.style.display = 'block';
            if (typeof window.mostrarAparenciaMetodo === 'function') {
                window.mostrarAparenciaMetodo();
            }
        }
    };

    // ============================================
    // NAVEGAÇÃO - APARÊNCIA
    // ============================================

    window.mostrarAparenciaMetodo = function() {
        const metodo = document.getElementById('aparencia-metodo-container');
        const rolagem = document.getElementById('aparencia-rolagem-container');
        const manual = document.getElementById('aparencia-manual-container');
        if (metodo) metodo.style.display = 'flex';
        if (rolagem) rolagem.style.display = 'none';
        if (manual) manual.style.display = 'none';
    };

    window.mostrarAparenciaRolagem = function() {
        const metodo = document.getElementById('aparencia-metodo-container');
        const rolagem = document.getElementById('aparencia-rolagem-container');
        const manual = document.getElementById('aparencia-manual-container');
        if (metodo) metodo.style.display = 'none';
        if (rolagem) rolagem.style.display = 'block';
        if (manual) manual.style.display = 'none';
    };

    window.mostrarAparenciaInsercaoManual = function() {
        const metodo = document.getElementById('aparencia-metodo-container');
        const rolagem = document.getElementById('aparencia-rolagem-container');
        const manual = document.getElementById('aparencia-manual-container');
        if (metodo) metodo.style.display = 'none';
        if (rolagem) rolagem.style.display = 'none';
        if (manual) manual.style.display = 'block';
    };

    window.aceitarManualAparencia = function() {
        const input = document.getElementById('manual-aparencia');
        const aparencia = parseInt(input.value);

        if (isNaN(aparencia) || aparencia < 1 || aparencia > 20) {
            alert('⚠️ Aparência deve estar entre 1 e 20.');
            return;
        }

        document.getElementById('aparencia-result').textContent = aparencia;
        fichaData.atributos.aparencia = aparencia;
        aparenciaRolada = true;
        window.aparenciaRolada = true;
        alert(`✅ Aparência ${aparencia} aceita!`);
    };

    // ============================================
    // NAVEGAÇÃO - ATRIBUTOS
    // ============================================

    window.mostrarMetodo = function() {
        document.getElementById('atributos-metodo-container').style.display = 'flex';
        document.getElementById('atributos-rolagem-container').style.display = 'none';
        document.getElementById('atributos-manual-container').style.display = 'none';
    };

    window.mostrarRolagem = function() {
        document.getElementById('atributos-metodo-container').style.display = 'none';
        document.getElementById('atributos-rolagem-container').style.display = 'block';
        document.getElementById('atributos-manual-container').style.display = 'none';
    };

    window.mostrarInsercaoManual = function() {
        document.getElementById('atributos-metodo-container').style.display = 'none';
        document.getElementById('atributos-rolagem-container').style.display = 'none';
        document.getElementById('atributos-manual-container').style.display = 'block';
    };

    window.aceitarManualAtributos = function() {
        const valores = {
            forca: parseInt(document.getElementById('manual-forca').value),
            destreza: parseInt(document.getElementById('manual-destreza').value),
            inteligencia: parseInt(document.getElementById('manual-inteligencia').value),
            constituicao: parseInt(document.getElementById('manual-constituicao').value)
        };

        for (const [attr, val] of Object.entries(valores)) {
            if (isNaN(val) || val < 1 || val > 30) {
                alert(`Valor inválido para ${attr}. Use números entre 1 e 30.`);
                return;
            }
        }

        const resultados = [
            { valor: valores.forca },
            { valor: valores.destreza },
            { valor: valores.inteligencia },
            { valor: valores.constituicao }
        ];

        window.atributosTentativas[1] = resultados;
        window.aceitarTentativa(1);
    };
    // ============================================
    // LIMITE DE PODER
    // ============================================

    function atualizarLimitePoder() {
        const limiteSpan = document.getElementById('limite-poder');
        if (!limiteSpan) return;

        // Se tem espécie selecionada, usa os limites dela
        if (fichaData.especie && fichaData.especie.minimo_poder !== undefined) {
            limiteSpan.textContent = `${fichaData.especie.minimo_poder}-${fichaData.especie.maximo_poder}`;
            return;
        }

        // Fallback: busca da API
        const especieId = document.getElementById('especie')?.value;
        if (especieId) {
            fetch(`/api/especies/${especieId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.especie) {
                        limiteSpan.textContent = `${data.especie.minimo_poder}-${data.especie.maximo_poder}`;
                        fichaData.especie = data.especie;
                    }
                })
                .catch(error => console.error('Erro ao buscar limites da espécie:', error));
        } else {
            limiteSpan.textContent = '1-100';
        }
    };
    // ============================================
    // EXPORTAÇÕES
    // ============================================

    window.getAttrNameByIndex = getAttrNameByIndex;
    window.getAttrIndexByName = getAttrIndexByName;
    window.getValorVisualPorAtributo = getValorVisualPorAtributo;
    window.getInstanciaIndexPorAtributo = getInstanciaIndexPorAtributo;
    window.atualizarMaiorInitValue = atualizarMaiorInitValue;
    window.criarInstanciasAPartirDeResultados = criarInstanciasAPartirDeResultados;
    window.associarInstanciasAosCards = associarInstanciasAosCards;
    window.atualizarDisplays = atualizarDisplays;
    window.atualizarVisibilidadeBotoes = atualizarVisibilidadeBotoes;
    window.atualizarVisibilidadeBtnConfirmar = atualizarVisibilidadeBtnConfirmar;
    window.transferirPonto = transferirPonto;
    window.atualizarTudo = atualizarTudo;
    window.initDragDropAtributos = initDragDropAtributos;
    window.initBotoesCardAtributos = initBotoesCardAtributos;
    window.aplicarBonusAtributos = aplicarBonusAtributos;
    window.atualizarLimitePoder = atualizarLimitePoder;
    window.calcularPontos = calcularPontos;
    window.criarInputManual = criarInputManual;
    window.inserirPoderManual = inserirPoderManual;
    window.inserirAparenciaManual = inserirAparenciaManual;
    window.mostrarPoderMetodo = mostrarPoderMetodo;
    window.mostrarPoderRolagem = mostrarPoderRolagem;
    window.mostrarPoderInsercaoManual = mostrarPoderInsercaoManual;
    window.aceitarManualPoder = aceitarManualPoder;
    window.mostrarAparenciaMetodo = mostrarAparenciaMetodo;
    window.mostrarAparenciaRolagem = mostrarAparenciaRolagem;
    window.mostrarAparenciaInsercaoManual = mostrarAparenciaInsercaoManual;
    window.aceitarManualAparencia = aceitarManualAparencia;

    // Exportar variáveis globais
    window.initExtra = 0;
    window.nowExtra = 0;
    window.arrayextras = [0, 0, 0, 0];
    window.ordemAtributos = ordemAtributos;
}