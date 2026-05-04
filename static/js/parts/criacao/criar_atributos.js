// criar_atributos.js - Rolagem de atributos, distribuição, drag-and-drop, poder, aparência

// ============================================
// ATRIBUTOS - CORE
// ============================================

function getAttrNameByIndex(index) {
    const mapping = ['forca', 'destreza', 'inteligencia', 'constituicao'];
    return mapping[index];
}

function atualizarMaiorInitValue() {
    const maxValue = Math.max(...instancias.map(inst => inst.initValue));
    const indicesComMax = instancias.reduce((acc, inst, idx) => {
        if (inst.initValue === maxValue) acc.push(idx);
        return acc;
    }, []);
    maiorInitIndex = indicesComMax.length === 1 ? indicesComMax[0] : -1;
    window.maiorInitIndex = maiorInitIndex;
}

function criarInstanciasAPartirDeResultados(resultados) {
    instancias = resultados.map((valor, idx) => new Atributo(valor, idx));
    window.instancias = instancias;
    atualizarMaiorInitValue();
}

function associarInstanciasAosCards() {
    for (let i = 0; i < instancias.length; i++) {
        const attrName = getAttrNameByIndex(i);
        const slot = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
        if (slot) {
            const numberDiv = slot.querySelector('.card-number');
            const extrasDiv = slot.querySelector('.pontos-extras');
            if (numberDiv) numberDiv.textContent = instancias[i].nowValue;
            if (extrasDiv) {
                const disponiveis = instancias[i].getPontosDisponiveis();
                extrasDiv.innerHTML = `⊕ <span>${disponiveis}</span> ${disponiveis === 1 ? 'disponível' : 'disponíveis'}`;
            }
        }
    }
}

function atualizarDisplays() {
    for (let i = 0; i < instancias.length; i++) {
        const attrName = getAttrNameByIndex(i);
        const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
        if (card) {
            const numberDiv = card.querySelector('.card-number');
            const extrasDiv = card.querySelector('.pontos-extras');
            numberDiv.textContent = instancias[i].nowValue;
            if (extrasDiv) {
                const disponiveis = instancias[i].getPontosDisponiveis();
                extrasDiv.innerHTML = `⊕ <span>${disponiveis}</span> ${disponiveis === 1 ? 'disponível' : 'disponíveis'}`;
            }
        }
    }
}

function atualizarVisibilidadeBotoes() {
    const podeTransferir = categoriaData && categoriaData.pode_transferir_atributos === true;

    for (let i = 0; i < instancias.length; i++) {
        const card = document.querySelector(`.atributo-slot[data-atributo="${getAttrNameByIndex(i)}"]`);
        if (!card) continue;

        const btnMenos = card.querySelector('.btn-card-menos');
        const btnMais = card.querySelector('.btn-card-mais');
        const atributo = instancias[i];

        if (!podeTransferir) {
            if (btnMenos) btnMenos.style.display = 'none';
            if (btnMais) btnMais.style.display = 'none';
            continue;
        }

        const isMaiorUnico = (i === maiorInitIndex);
        const podePerder = atributo.nowValue > 1 && (!isMaiorUnico || atributo.nowValue > atributo.initValue);
        if (btnMenos) btnMenos.style.display = podePerder ? 'block' : 'none';

        let existeDoadora = false;
        for (let j = 0; j < instancias.length; j++) {
            if (j !== i) {
                const doador = instancias[j];
                if (doador.getPontosDisponiveis() > 0 && doador.initValue <= atributo.initValue) {
                    existeDoadora = true;
                    break;
                } else if (atributo.getPontosDisponiveis() > 0) {
                    existeDoadora = true;
                    break;
                }
            }
        }
        if (btnMais) btnMais.style.display = existeDoadora ? 'block' : 'none';
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

    if (pontosPendentes > 0) {
        btnConfirmar.style.display = 'none';
        if (notificacao && mensagemSpan) {
            mensagemSpan.textContent = '⚠️ Você ainda tem pontos extras para distribuir! Use os botões + para transferi-los.';
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
        forca: instancias[atributoParaIndice.forca].nowValue,
        destreza: instancias[atributoParaIndice.destreza].nowValue,
        inteligencia: instancias[atributoParaIndice.inteligencia].nowValue,
        constituicao: instancias[atributoParaIndice.constituicao].nowValue
    };
}

function atualizarTudo() {
    atualizarMaiorInitValue();
    atualizarDisplays();
    atualizarVisibilidadeBotoes();
    atualizarVisibilidadeBtnConfirmar();
}

// ============================================
// TRANSFERÊNCIA DE PONTOS
// ============================================

function transferirPonto(doadoraIndex, receptoraIndex) {
    const doadora = instancias[doadoraIndex];
    const receptora = instancias[receptoraIndex];

    if (doadora.initValue > receptora.initValue) return false;
    if (doadora.getPontosDisponiveis() <= 0) return false;

    doadora.consumirPontoProprio();
    receptora.receberPonto(doadoraIndex);
    return true;
}

function botaoMenosClick(indice) {
    const atributo = instancias[indice];
    const origemIndex = atributo.devolverPonto();

    if (origemIndex !== -1) {
        instancias[origemIndex].nowValue++;
        atualizarTudo();
        return;
    }

    const isMaiorUnico = (indice === maiorInitIndex);
    const podePerder = atributo.nowValue > 1 && (!isMaiorUnico || atributo.nowValue > atributo.initValue);

    if (podePerder) {
        atributo.perderPonto();
        atualizarTudo();
    }
}

function botaoMaisClick(indiceReceptor) {
    const receptor = instancias[indiceReceptor];

    if (receptor.getPontosDisponiveis() > 0) {
        receptor.pointsCounters[receptor.meuIndex]--;
        receptor.nowValue++;
        atualizarTudo();
        return;
    }

    const doadoras = [];
    for (let j = 0; j < instancias.length; j++) {
        if (j !== indiceReceptor) {
            const doador = instancias[j];
            if (doador.getPontosDisponiveis() > 0 && doador.initValue <= receptor.initValue) {
                doadoras.push({
                    index: j,
                    nome: getAttrNameByIndex(j),
                    valor: doador.nowValue,
                    disponiveis: doador.getPontosDisponiveis()
                });
            }
        }
    }

    if (doadoras.length === 0) return;
    if (doadoras.length === 1) {
        transferirPonto(doadoras[0].index, indiceReceptor);
        atualizarTudo();
        return;
    }

    mostrarSeletorDoadoras(doadoras, indiceReceptor);
}

function mostrarSeletorDoadoras(doadoras, indiceReceptor) {
    const options = doadoras.map((d, idx) =>
        `${idx}: ${d.nome} (${d.valor}) - ⊕${d.disponiveis} disponíveis`
    ).join('\n');

    const escolha = prompt(`De qual atributo você quer receber o ponto?\n\n${options}\n\nDigite o número:`, "0");
    const index = parseInt(escolha);
    if (index >= 0 && index < doadoras.length) {
        transferirPonto(doadoras[index].index, indiceReceptor);
        atualizarTudo();
    }
}

function aplicarBonusAtributos() {
    if (atributosBonusRestantes <= 0) return;

    instancias[0].pointsCounters[0] += atributosBonusRestantes;

    const attrName = getAttrNameByIndex(0);
    const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
    if (card) {
        const extrasDiv = card.querySelector('.pontos-extras');
        if (extrasDiv) {
            const disponiveis = instancias[0].getPontosDisponiveis();
            extrasDiv.innerHTML = `⊕ <span>${disponiveis}</span> ${disponiveis === 1 ? 'disponível' : 'disponíveis'}`;
        }
    }

    alert(`✨ Você recebeu ${atributosBonusRestantes} pontos bônus para distribuir! Use os botões + nos atributos.`);
    atributosBonusRestantes = 0;
    window.atributosBonusRestantes = 0;
}

// ============================================
// ROLAGEM DE ATRIBUTOS
// ============================================

window.rolarAtributos = function(tentativa) {
    fetch('/api/ficha/rolar-atributos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tentativa: tentativa })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            atributosTentativas[tentativa] = data.resultados;
            const container = document.getElementById(`tentativa-${tentativa}`);
            const linhas = container.querySelectorAll('.atributo-linha');

            linhas.forEach((linha, index) => {
                const r = data.resultados[index];
                let descartado = false;
                const dadosHtml = r.dados.map(dado => {
                    let isMenor = false;
                    if (dado === r.menor && !descartado) {
                        isMenor = true;
                        descartado = true;
                    }
                    return `<span class="dado ${isMenor ? 'descartado' : ''}">${dado}</span>`;
                }).join('');
                linha.querySelector('.dados-container').innerHTML = dadosHtml;
                linha.querySelector('.resultado').textContent = r.valor;
            });

            const botoesHtml = `
                <div class="tentativa-acoes">
                    <button class="btn-aceitar" onclick="aceitarTentativa(${tentativa})">✅ Aceitar Tentativa</button>
                    ${tentativa < 3 ? `<button class="btn-rejeitar" onclick="rejeitarAtributos(${tentativa})">❌ Rejeitar Tentativa</button>` : ''}
                </div>
            `;

            const oldButtons = container.querySelector('.tentativa-acoes');
            if (oldButtons) oldButtons.remove();
            container.insertAdjacentHTML('beforeend', botoesHtml);
            const btnRolar = container.querySelector('.btn-rolar');
            if (btnRolar) btnRolar.disabled = true;
        } else {
            alert(`Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao rolar atributos');
    });
};

window.rejeitarAtributos = function(tentativa) {
    if (tentativa >= 3) {
        alert('Esta é a última tentativa. Você não pode rejeitar.');
        return;
    }
    document.getElementById(`tentativa-${tentativa}`).style.display = 'none';
    const proxima = tentativa + 1;
    document.getElementById(`tentativa-${proxima}`).style.display = 'block';
    alert(`Tentativa ${tentativa} rejeitada. Agora você está na tentativa ${proxima}.`);
};

window.aceitarTentativa = function(tentativa) {
    const resultados = atributosTentativas[tentativa];
    if (!resultados) return;

    const valores = resultados.map(r => r.valor);
    criarInstanciasAPartirDeResultados(valores);

    document.getElementById('atributos-rolagem-container').style.display = 'none';
    const distribuicaoSection = document.querySelector('.distribuicao-section');
    if (distribuicaoSection) distribuicaoSection.style.display = 'block';

    associarInstanciasAosCards();
    atualizarDisplays();
    atualizarVisibilidadeBotoes();
    atualizarVisibilidadeBtnConfirmar();
    initBotoesCardAtributos();
    initDragDropAtributos();

    aplicarBonusAtributos();

    for (let i = 1; i <= 3; i++) {
        const btn = document.querySelector(`#tentativa-${i} .btn-rolar`);
        if (btn) btn.disabled = true;
        const btnsAcao = document.querySelector(`#tentativa-${i} .tentativa-acoes`);
        if (btnsAcao) btnsAcao.style.display = 'none';
    }

    const btnResetar = document.getElementById('resetar-atributos');
    if (btnResetar) btnResetar.style.display = 'block';

    alert(`✅ Tentativa ${tentativa} aceita! Agora distribua os valores usando os botões + e - ou arrastando os números.`);
};

// ============================================
// RESETAR E CONFIRMAR ATRIBUTOS
// ============================================

window.resetarAtributos = function() {
    if (!instancias.length) return;
    if (confirm('Tem certeza? Isso irá descartar a distribuição atual e voltar aos valores originais.')) {

        let bonusGastos = 0;
        for (let i = 0; i < instancias.length; i++) {
            const pontosGastos = instancias[i].nowValue - instancias[i].initValue;
            if (pontosGastos > 0) {
                bonusGastos += pontosGastos;
            }
            instancias[i].nowValue = instancias[i].initValue;
            instancias[i].pointsCounters = [0, 0, 0, 0];
        }

        if (categoriaData && categoriaData.atributos_bonus && bonusGastos > 0) {
            if (typeof atributosBonusOriginal === 'undefined') {
                atributosBonusOriginal = categoriaData.atributos_bonus || 0;
            }
            atributosBonusRestantes = atributosBonusOriginal;
            window.atributosBonusRestantes = atributosBonusRestantes;

            instancias[0].pointsCounters[0] += atributosBonusRestantes;

            alert(`🔄 Reset concluído. ${atributosBonusRestantes} pontos bônus estão novamente disponíveis.`);
        } else {
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

    if (pontosPendentes > 0) {
        alert('⚠️ Você ainda tem pontos extras para distribuir! Use os botões + para transferi-los.');
        return;
    }

    for (const inst of instancias) {
        if (inst.nowValue < 1) {
            alert('⚠️ O valor final de seu atributo não pode ser menor que 1.');
            return;
        }
    }

    if (fichaData.especie) {
        const valores = obterNowValuesParaValidacao();
        const especieNome = fichaData.especie.nome;

        if (especieNome === 'Klaveck' && valores.inteligencia > 3) {
            alert(`⚠️ Klaveck não pode ter Inteligência maior que 3. Valor atual: ${valores.inteligencia}`);
            return;
        }
        if (especieNome === 'Darch' && valores.constituicao > 3) {
            alert(`⚠️ Darch não pode ter Constituição maior que 3. Valor atual: ${valores.constituicao}`);
            return;
        }
        if (especieNome === 'Mecha' && valores.constituicao < 10) {
            alert(`⚠️ Mecha precisa ter Constituição mínima de 10. Valor atual: ${valores.constituicao}`);
            return;
        }
    }

    fichaData.atributos.forca = instancias[atributoParaIndice.forca].nowValue;
    fichaData.atributos.destreza = instancias[atributoParaIndice.destreza].nowValue;
    fichaData.atributos.inteligencia = instancias[atributoParaIndice.inteligencia].nowValue;
    fichaData.atributos.constituicao = instancias[atributoParaIndice.constituicao].nowValue;

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

    alert('✅ Atributos básicos confirmados! Agora role Poder e Aparência.');
};

// ============================================
// DRAG AND DROP
// ============================================

function initDragDropAtributos() {
    const cards = document.querySelectorAll('.atributo-slot');
    let dragSourceIndex = null;

    cards.forEach((card, idx) => card.setAttribute('data-array-index', idx));

    cards.forEach(card => {
        const numberDiv = card.querySelector('.card-number');
        numberDiv.setAttribute('draggable', 'true');

        numberDiv.addEventListener('dragstart', function(e) {
            dragSourceIndex = parseInt(card.getAttribute('data-array-index'));
            e.dataTransfer.setData('text/plain', dragSourceIndex);
            e.dataTransfer.effectAllowed = 'move';
            this.style.opacity = '0.5';
        });

        numberDiv.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            dragSourceIndex = null;
        });

        card.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', function() {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', function(e) {
            e.preventDefault();
            card.classList.remove('drag-over');

            const targetIndex = parseInt(this.getAttribute('data-array-index'));
            if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
                [instancias[dragSourceIndex], instancias[targetIndex]] =
                [instancias[targetIndex], instancias[dragSourceIndex]];

                const allCards = document.querySelectorAll('.atributo-slot');
                allCards.forEach((c, idx) => c.setAttribute('data-array-index', idx));

                atualizarTudo();
            }
        });
    });
}

function initBotoesCardAtributos() {
    for (let i = 0; i < 4; i++) {
        const attrName = getAttrNameByIndex(i);
        const card = document.querySelector(`.atributo-slot[data-atributo="${attrName}"]`);
        if (card) {
            card.setAttribute('data-array-index', i);

            const btnMenos = card.querySelector('.btn-card-menos');
            const btnMais = card.querySelector('.btn-card-mais');

            if (btnMenos) {
                const newBtnMenos = btnMenos.cloneNode(true);
                btnMenos.parentNode.replaceChild(newBtnMenos, btnMenos);
                newBtnMenos.addEventListener('click', () => botaoMenosClick(i));
            }

            if (btnMais) {
                const newBtnMais = btnMais.cloneNode(true);
                btnMais.parentNode.replaceChild(newBtnMais, btnMais);
                newBtnMais.addEventListener('click', () => botaoMaisClick(i));
            }
        }
    }
}

// ============================================
// ROLAGEM DE PODER
// ============================================

function atualizarLimitePoder() {
    const limiteSpan = document.getElementById('limite-poder');
    if (limiteSpan && fichaData.especie) {
        limiteSpan.textContent = `${fichaData.especie.minimo_poder}-${fichaData.especie.maximo_poder}`;
    } else if (limiteSpan && !fichaData.especie) {
        limiteSpan.textContent = '1-100';
    }
}

window.rolarPoder = function(tentativa) {
    fetch('/api/ficha/rolar-poder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tentativa: tentativa,
            roll_amount: poderRollAmount
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            poderTentativas[tentativa] = data.poder;
            const poderDiv = document.getElementById(`poder-${tentativa}`);
            const container = document.getElementById(`poder-tentativa-${tentativa}`);

            if (poderDiv) poderDiv.textContent = data.poder;

            let isValido = true;
            if (fichaData.especie) {
                if (data.poder < fichaData.especie.minimo_poder || data.poder > fichaData.especie.maximo_poder) {
                    isValido = false;
                    poderDiv.classList.add('valor-ilegal');
                } else {
                    poderDiv.classList.remove('valor-ilegal');
                }
            }

            const oldButtons = container.querySelector('.tentativa-acoes');
            if (oldButtons) oldButtons.remove();

            if (isValido) {
                const botoesHtml = `
                    <div class="tentativa-acoes">
                        <button class="btn-aceitar" onclick="aceitarPoder(${tentativa})">✅ Aceitar</button>
                        ${tentativa < 3 ? `<button class="btn-rejeitar" onclick="rejeitarPoder(${tentativa})">❌ Rejeitar</button>` : ''}
                    </div>
                `;
                const btnRolar = container.querySelector('.btn-rolar');
                if (btnRolar) {
                    btnRolar.disabled = true;
                    btnRolar.style.display = 'none';
                }
                container.insertAdjacentHTML('beforeend', botoesHtml);
            } else {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'aviso-ilegal';
                msgDiv.textContent = `⚠️ Fora do limite (${fichaData.especie.minimo_poder}-${fichaData.especie.maximo_poder})`;
                container.appendChild(msgDiv);
                setTimeout(() => {
                    if (msgDiv.parentNode) msgDiv.remove();
                }, 3000);
            }
        } else {
            alert(`Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao rolar poder');
    });
};

window.aceitarPoder = function(tentativa) {
    let poder = poderTentativas[tentativa];
    if (!poder) return;

    if (fichaData.especie) {
        if (poder < fichaData.especie.minimo_poder || poder > fichaData.especie.maximo_poder) {
            alert(`⚠️ ${fichaData.especie.nome} requer poder entre ${fichaData.especie.minimo_poder} e ${fichaData.especie.maximo_poder}.`);
            rolarPoder(tentativa);
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

    calcularPontos();

    const aparenciaSection = document.getElementById('aparencia-section');
    if (aparenciaSection) aparenciaSection.style.display = 'block';
};

window.rejeitarPoder = function(tentativa) {
    if (tentativa >= 3) {
        alert('Esta é a última tentativa. Você não pode rejeitar.');
        return;
    }
    document.getElementById(`poder-tentativa-${tentativa}`).style.display = 'none';
    const proxima = tentativa + 1;
    document.getElementById(`poder-tentativa-${proxima}`).style.display = 'block';
    alert(`Tentativa ${tentativa} rejeitada. Agora você está na tentativa ${proxima}.`);
};

// ============================================
// ROLAGEM DE APARÊNCIA
// ============================================

window.rolarAparencia = function() {
    const btn = document.querySelector('.rolagem-aparencia .btn-rolar');
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
        } else {
            alert(`Erro: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao rolar aparência');
    });
};

// ============================================
// CÁLCULOS
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

            const elementos = {
                'pontos-pericias': data.pontos.pericias,
                'pontos-tecnicas': data.pontos.tecnicas,
                'calc-fv': data.pontos.forca_vital,
                'calc-pe': data.pontos.poder_elemental,
                'calc-pericias': data.pontos.pericias,
                'calc-tecnicas': data.pontos.tecnicas
            };

            Object.keys(elementos).forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = elementos[id];
            });
        }
    })
    .catch(error => console.error('Erro ao calcular pontos:', error));
}

// Exportar funções globais
window.getAttrNameByIndex = getAttrNameByIndex;
window.atualizarMaiorInitValue = atualizarMaiorInitValue;
window.criarInstanciasAPartirDeResultados = criarInstanciasAPartirDeResultados;
window.associarInstanciasAosCards = associarInstanciasAosCards;
window.atualizarDisplays = atualizarDisplays;
window.atualizarVisibilidadeBotoes = atualizarVisibilidadeBotoes;
window.atualizarVisibilidadeBtnConfirmar = atualizarVisibilidadeBtnConfirmar;
window.transferirPonto = transferirPonto;
window.botaoMenosClick = botaoMenosClick;
window.botaoMaisClick = botaoMaisClick;
window.atualizarTudo = atualizarTudo;
window.initDragDropAtributos = initDragDropAtributos;
window.initBotoesCardAtributos = initBotoesCardAtributos;
window.aplicarBonusAtributos = aplicarBonusAtributos;
window.atualizarLimitePoder = atualizarLimitePoder;
window.calcularPontos = calcularPontos;