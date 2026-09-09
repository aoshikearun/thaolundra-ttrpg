/**
 * criar-stepper.js - Stepper com ícones para criação de ficha
 */

// Usar variáveis globais para evitar redeclaração
if (typeof window.totalSteps === 'undefined') {
    window.totalSteps = 10;
    window.currentStep = 1;
}
const totalSteps = window.totalSteps;

// Mapeamento de passos para ícones e legendas
const stepsConfig = {
    1: { icon: 'fa-chart-simple', caption: 'Categoria' },
    2: { icon: 'fa-dragon', caption: 'Espécie' },
    3: { icon: 'fas fa-atom', caption: 'Fonte' },
    4: { icon: 'fa-dice-d20', caption: 'Atributos' },
    5: { icon: 'fa-screwdriver-wrench', caption: 'Perícias' },
    6: { icon: 'fa-hat-wizard', caption: 'Técnicas' },
    7: { icon: 'fa-users', caption: 'Sociais' },
    8: { icon: 'fa-scroll', caption: 'Finalização' },
    9: { icon: 'fa-magnifying-glass', caption: 'Revisão' },
    10: { icon: 'fa-unlock', caption: 'Publicação' }
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

    // Adicionar event listeners
    const prevBtn = document.getElementById('stepper-prev');
    const nextBtn = document.getElementById('stepper-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            } else {
                // Se for o último passo, chamar a função de salvar
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

function updateStepperUI() {
    const progress = document.getElementById('stepper-progress');
    if (progress) {
        const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progress.style.width = percent + '%';
    }

    // Atualiza classes dos círculos
    document.querySelectorAll('.circle').forEach((circle, idx) => {
        const stepNum = idx + 1;
        circle.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            circle.classList.add('active');
        } else if (stepNum < currentStep) {
            circle.classList.add('completed');
        }
    });

    // Atualiza butão
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

function validarPassoStepper(step) {
    // Usar a função de validação do criar_ficha.js
    if (typeof window.validarPasso === 'function') {
        return window.validarPasso(step);
    }
    return true;
}


function loadStepContent(step) {
    console.log('Carregando passo:', step);

    // Esconde todos os passos
    document.querySelectorAll('.ficha-step').forEach(stepEl => {
        stepEl.classList.remove('active');
        stepEl.style.display = 'none';
    });

    // Mostra o passo atual
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.style.display = 'block';
        console.log('Passo', step, 'exibido');
    } else {
        console.error('Passo', step, 'não encontrado');
    }
    switch(step) {
        case 4:
            break;
        case 5:
            setTimeout(() => {
                if (typeof carregarPericias === 'function') {
                    carregarPericias();
                }
            }, 50);
            break;
        case 6:
            if (typeof iniciarPassoTecnicas === 'function') {
                iniciarPassoTecnicas();
            }
            break;
        case 7:
            if (typeof calcularPontos === 'function') {
                calcularPontos();
            }
            break;
        case 8:
            if (typeof carregarPassoOito === 'function') {
                carregarPassoOito();
            }
            break;
    }

    // Disparar evento customizado
    const event = new CustomEvent('stepChanged', { detail: { step: step } });
    document.dispatchEvent(event);
}

/**
 * Finaliza e salva a ficha (chamado no passo 9)
 */
function finalizarPublicacao() {
    if (typeof salvarFicha === 'function') {
        // Verificar se todos os campos obrigatórios estão preenchidos
        const especie = document.getElementById('especie')?.value;
        const fonte = document.getElementById('fonte_poder')?.value;
        const nome = document.getElementById('nome_completo')?.value?.trim();

        if (!especie) {
            alert('⚠️ Espécie não selecionada. Volte ao passo 1.');
            goToStep(1);
            return;
        }
        if (!fonte) {
            alert('⚠️ Fonte de poder não selecionada. Volte ao passo 2.');
            goToStep(2);
            return;
        }
        if (!nome) {
            alert('⚠️ Nome do personagem não preenchido. Volte ao passo 6.');
            goToStep(6);
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