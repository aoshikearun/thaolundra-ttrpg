// theme.js - Sistema de Temas
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.primaryHue = localStorage.getItem('primaryHue') || 35;
        this.init();
    }

    init() {
        this.applyTheme();
        this.applyPrimaryColor();
        this.createControls();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    applyPrimaryColor() {
        document.documentElement.style.setProperty('--primary-hue', this.primaryHue);
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        this.updateToggleButton();
    }

    setPrimaryColor(hue) {
        this.primaryHue = hue;
        localStorage.setItem('primaryHue', hue);
        this.applyPrimaryColor();
    }

    createControls() {
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;

        if (document.querySelector('.theme-controls')) return;

        const container = document.createElement('div');
        container.className = 'theme-controls';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        this.updateToggleButton(toggleBtn);
        toggleBtn.onclick = () => this.toggleTheme();

        const colorWrapper = document.createElement('div');
        colorWrapper.className = 'color-picker-wrapper';
        colorWrapper.innerHTML = `
            <i class="fas fa-palette"></i>
            <input type="range" min="0" max="360" value="${this.primaryHue}" class="color-picker-input" title="Cor de destaque">
            <span>Cor Principal</span>
        `;

        const colorInput = colorWrapper.querySelector('.color-picker-input');
        colorInput.addEventListener('input', (e) => this.setPrimaryColor(e.target.value));

        container.appendChild(toggleBtn);
        container.appendChild(colorWrapper);
        headerRight.appendChild(container);
    }

    updateToggleButton(btn = null) {
        const toggle = btn || document.querySelector('.theme-toggle');
        if (toggle) {
            const isDark = this.theme === 'dark';
            toggle.innerHTML = isDark
                ? '<i class="fas fa-sun"></i> <span>Modo Claro</span>'
                : '<i class="fas fa-moon"></i> <span>Modo Escuro</span>';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}