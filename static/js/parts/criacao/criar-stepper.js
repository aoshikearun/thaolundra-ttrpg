/**
 * criar-stepper.js - Stepper com ícones para criação de ficha
 */

// Usar variáveis globais para evitar redeclaração
if (typeof window.totalSteps === 'undefined') {
    window.totalSteps = 9;
    window.currentStep = 1;
}
const totalSteps = window.totalSteps;

// Mapeamento de passos para ícones e legendas (NOVA ORDEM)
const stepsConfig = {
    1: { icon: 'fa-chart-line', caption: 'Categoria' },
    2: { icon: 'fa-dragon', caption: 'Espécie' },
    3: { icon: 'fas fa-atom', caption: 'Fonte' },
    4: { icon: 'fa-dice-d20', caption: 'Atributos' },
    5: { icon: 'fa-screwdriver-wrench', caption: 'Perícias' },
    6: { icon: 'fa-hat-wizard', caption: 'Técnicas' },
    7: { icon: 'fa-users', caption: 'Sociais' },
    8: { icon: 'fa-scroll', caption: 'Finalização' },
    9: { icon: 'fa-unlock', caption: 'Publicação' }
};

/**
 * Inicializa o stepper no DOM
 */
function initStepper() {
    const stepperContainer = document.querySelector('.stepper-wrapper');
    if (!stepperContainer) {
        console.error('Stepper container não encontrado');
        return;
    }

    // Construir o HTML do stepper
    let circlesHtml = '';
    for (let i = 1; i <= totalSteps; i++) {
        const config = stepsConfig[i];
        const isActive = i === currentStep;
        const activeClass = isActive ? 'active' : '';
        circlesHtml += `
            <div class="circle ${activeClass}" data-step="${i}">
                <i class="icon fas ${config.icon}"></i>
                <div class="caption">${config.caption}</div>
            </div>
        `;
    }

    stepperContainer.innerHTML = `
        <div class="progress-container">
            <div class="progress" id="stepper-progress"></div>
            ${circlesHtml}
        </div>
    `;

    // Adicionar event listeners para os botões (se existirem no DOM)
    const prevBtn = document.getElementById('stepper-prev');
    const nextBtn = document.getElementById('stepper-next');

    if (prevBtn) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    }

    if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            } else {
                if (typeof finalizarPublicacao === 'function') {
                    finalizarPublicacao();
                } else if (typeof salvarFicha === 'function') {
                    salvarFicha();
                }
            }
        });
    }

    // Permitir clicar nos círculos
    document.querySelectorAll('.circle').forEach(circle => {
        circle.addEventListener('click', () => {
            const step = parseInt(circle.dataset.step);
            if (step && step !== currentStep) {
                goToStep(step);
            }
        });
    });

    // Inicializar mostrando apenas o passo 1
    loadStepContent(1);
}

/**
 * Navega para um passo específico
 */
function goToStep(step) {
    if (step < 1 || step > totalSteps) return;

    // Validar se podemos avançar
    if (step > currentStep) {
        if (!validarPassoStepper(currentStep)) {
            return;
        }
    }
    currentStep = step;
    updateStepperUI();
    loadStepContent(step);
}

/**
 * Atualiza a interface do stepper (progresso e classes)
 */
function updateStepperUI() {
    const progress = document.getElementById('stepper-progress');
    if (progress) {
        const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progress.style.width = percent + '%';
    }

    // Atualizar classes dos círculos
    document.querySelectorAll('.circle').forEach((circle, idx) => {
        const stepNum = idx + 1;
        circle.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            circle.classList.add('active');
        } else if (stepNum < currentStep) {
            circle.classList.add('completed');
        }
    });

    // Atualizar botões
    const prevBtn = document.getElementById('stepper-prev');
    const nextBtn = document.getElementById('stepper-next');

    if (prevBtn) {
        prevBtn.disabled = (currentStep === 1);
    }

    if (nextBtn) {
        if (currentStep === totalSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar';
        } else {
            nextBtn.innerHTML = 'Próximo <i class="fas fa-arrow-right"></i>';
        }
    }
}

/**
 * Valida se o passo atual está completo
 */
function validarPassoStepper(step) {
    if (typeof window.validarPasso === 'function') {
        return window.validarPasso(step);
    }
    return true;
}

/**
 * Carrega o conteúdo do passo
 */
function loadStepContent(step) {
    console.log('Carregando passo:', step);

    // Esconder TODOS os passos
    document.querySelectorAll('.ficha-step').forEach(stepEl => {
        stepEl.classList.remove('active');
        stepEl.style.display = 'none';
    });

    // Mostrar o passo atual
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.style.display = 'block';
        console.log('Passo', step, 'exibido');
    } else {
        console.error('Passo', step, 'não encontrado');
    }

    // Disparar eventos específicos por passo
    switch(step) {
        case 5: // Perícias
            if (typeof carregarPericias === 'function') {
                carregarPericias();
            }
            break;
        case 6: // Técnicas
            if (typeof iniciarPassoTecnicas === 'function') {
                iniciarPassoTecnicas();
            }
            break;
        case 8:
            if (typeof carregarPassoOito === 'function') {
                carregarPassoOito();
            }
            break;
        case 9: // Revisão (agora é passo 9, mas mantendo compatibilidade)
            if (typeof atualizarRevisao === 'function') {
                atualizarRevisao();
            } else if (typeof atualizarResumoCompleto === 'function') {
                atualizarResumoCompleto();
            }
            break;
    }

    // Disparar evento customizado
    const event = new CustomEvent('stepChanged', { detail: { step: step } });
    document.dispatchEvent(event);
}

/**
 * Finaliza e salva a ficha (chamado no passo 9 - Publicação)
 */
function finalizarPublicacao() {
    if (typeof salvarFicha === 'function') {
        // Verificar se todos os campos obrigatórios estão preenchidos
        const categoria = window.categoriaSelecionada;
        const especie = document.getElementById('especie')?.value;
        const fonte = document.getElementById('fonte_poder')?.value;
        const nome = document.getElementById('nome_completo')?.value?.trim();

        if (!categoria) {
            alert('⚠️ Categoria não selecionada. Volte ao passo 1.');
            goToStep(1);
            return;
        }
        if (!especie) {
            alert('⚠️ Espécie não selecionada. Volte ao passo 2.');
            goToStep(2);
            return;
        }
        if (!fonte) {
            alert('⚠️ Fonte de poder não selecionada. Volte ao passo 3.');
            goToStep(3);
            return;
        }
        if (!nome) {
            alert('⚠️ Nome do personagem não preenchido.');
            return;
        }

        salvarFicha();
    } else {
        console.error('Função salvarFicha não encontrada');
        alert('Erro ao salvar ficha. Tente recarregar a página.');
    }
}

// Exportar funções para uso global
window.goToStep = goToStep;
window.updateStepperUI = updateStepperUI;
window.loadStepContent = loadStepContent;
window.finalizarPublicacao = finalizarPublicacao;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStepper);
} else {
    initStepper();
}