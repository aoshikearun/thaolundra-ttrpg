// criar_ficha.js - Inicialização, variáveis globais, navegação

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

// CATEGORIA
let categoriaSelecionada = null;
let categoriaData = null;

// ESPÉCIE
let especiesListFull = [];
let selectedSpeciesId = null;
let selectedSpeciesData = null;

// FONTE DE PODER
let selectedFonteId = null;
let selectedFonteData = null;

// ATRIBUTOS
let atributosTentativas = {1: null, 2: null, 3: null};
let atributosBonusRestantes = 0;
let atributosBonusOriginal = 0;
let maiorInitIndex = -1;
let instancias = [];
window.instancias = instancias;
let poderBonus = 0;
let poderRollAmount = 1;
let poderTentativas = {1: null, 2: null, 3: null};
let atributosConfirmados = false;
let poderAceito = false;
let aparenciaRolada = false;

// PERÍCIAS
let periciasSelecionadas = [];
let periciasPontos = {};
let armasList = [];
let lutaCallbackTemp = null;

// TÉCNICAS
let tecnicasSelecionadas = [];
let tecnicaInataSelecionada = null;
let tecnicaAvancadaSelecionada = null;
let tecnicasDisponiveis = {
    inatas: [],
    basicas: [],
    avancadas: []
};
let tecnicasAvancadasMax = 1;
let tecnicasUltimasMax = 0;
let tecnicaUltimaSelecionada = null;

// LISTAS
let especiesList = [];
let fontesList = [];
let periciasList = [];
let tecnicasList = [];

// SALVAMENTO
let fichaData = {
    categoria_id: null,
    especie: null,
    fontePoder: null,
    atributos: {
        forca: 1,
        destreza: 1,
        inteligencia: 1,
        constituicao: 1,
        poder: 1,
        aparencia: 1
    },
    pericias: [],
    tecnicas: [],
    caracteristicas: {
        qualidades: [],
        defeitos: [],
        outras: []
    },
    ocupacao: '',
    moradia: '',
    faccao_id: 0,
    aura_id: null,
    npc: false,
    nome_completo: '',
    privado: false,
    pontos: {
        pericias: 0,
        tecnicas: 0,
        forca_vital: 0,
        poder_elemental: 0
    }
};

let limitesCategorias = {
    'Combate': { max: 2, atual: 0 },
    'Ofício': { max: 2, atual: 0 },
    'Conhecimento': { max: 3, atual: 0 },
    'Vontade': { max: 1, atual: 0 },
    'Simples': { max: 999, atual: 0 },
    'Sociais': { max: 999, atual: 0 }
};

const atributoParaIndice = {
    forca: 0,
    destreza: 1,
    inteligencia: 2,
    constituicao: 3
};

// ============================================
// CLASSE ATRIBUTO
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
            if (i !== this.meuIndex) total += this.pointsCounters[i];
        }
        return total;
    }

    perderPonto() {
        if (this.nowValue > 1) {
            this.nowValue--;
            this.pointsCounters[this.meuIndex]++;
            return true;
        }
        return false;
    }

    receberPonto(origemIndex) {
        if (origemIndex >= 0 && origemIndex < 4) {
            this.nowValue++;
            this.pointsCounters[origemIndex]++;
            return true;
        }
        return false;
    }

    devolverPonto() {
        for (let i = 0; i < this.pointsCounters.length; i++) {
            if (i !== this.meuIndex && this.pointsCounters[i] > 0) {
                this.pointsCounters[i]--;
                this.nowValue--;
                return i;
            }
        }
        return -1;
    }

    consumirPontoProprio() {
        if (this.pointsCounters[this.meuIndex] > 0) {
            this.pointsCounters[this.meuIndex]--;
            return true;
        }
        return false;
    }
}

// ============================================
// NAVEGAÇÃO ENTRE PASSOS
// ============================================

function nextStep(step) {
    if (typeof goToStep === 'function') {
        goToStep(step);
    }
}

function prevStep() {
    if (typeof currentStep !== 'undefined' && currentStep > 1) {
        nextStep(currentStep - 1);
    }
}

function validarPasso(step) {
    switch(step) {
        case 1:
            if (!categoriaSelecionada) {
                alert('Selecione uma categoria de ficha antes de prosseguir.');
                return false;
            }
            return true;
        case 2:
            const especie = document.getElementById('especie')?.value;
            if (!especie || especie === '') {
                alert('Selecione uma espécie antes de prosseguir.');
                return false;
            }
            return true;
        case 3:
            const fonte = document.getElementById('fonte_poder')?.value;
            if (!fonte || fonte === '' || fonte === '0') {
                alert('Selecione uma fonte de poder antes de prosseguir.');
                return false;
            }
            return true;
        case 4:
            if (!atributosConfirmados) {
                alert('Confirme os atributos antes de prosseguir.');
                return false;
            }
            if (!poderAceito) {
                alert('Role e aceite o valor de Poder antes de prosseguir.');
                return false;
            }
            if (!aparenciaRolada) {
                alert('Role a Aparência antes de prosseguir.');
                return false;
            }
            return true;
        case 5:
            return true;
        case 6:
            return true;
        case 7:
            return true;
        case 8:
            return true;
        case 9:
            const nome = document.getElementById('nome_completo')?.value.trim();
            if (!nome) {
                alert('Digite o nome do personagem antes de publicar.');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Exportar funções globais necessárias
window.Atributo = Atributo;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.validarPasso = validarPasso;
window.escapeHtml = escapeHtml;
window.atributosConfirmados = atributosConfirmados;
window.poderAceito = poderAceito;
window.aparenciaRolada = aparenciaRolada;
window.atributoParaIndice = atributoParaIndice;
window.limitesCategorias = limitesCategorias;
window.fichaData = fichaData;
window.periciasSelecionadas = periciasSelecionadas;
window.periciasPontos = periciasPontos;
window.tecnicasSelecionadas = tecnicasSelecionadas;
window.tecnicasDisponiveis = tecnicasDisponiveis;
window.categoriaSelecionada = categoriaSelecionada;
window.categoriaData = categoriaData;
window.atributosBonusRestantes = atributosBonusRestantes;
window.poderRollAmount = poderRollAmount;
window.poderBonus = poderBonus;
window.selectedFonteId = selectedFonteId;
window.selectedFonteData = selectedFonteData;
window.selectedSpeciesId = selectedSpeciesId;
window.selectedSpeciesData = selectedSpeciesData;
window.especiesListFull = especiesListFull;
window.especiesList = especiesList;
window.fontesList = fontesList;
window.periciasList = periciasList;
window.tecnicasList = tecnicasList;