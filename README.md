# Thaolundra TTRPG - Plataforma de RPG

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

## 📖 Sobre o Projeto

Thaolundra é uma plataforma web para facilitar e registrar sessões do RPG de mesa **Thaolundra**. O sistema permite:

- 📝 Criação e gestão de fichas de personagem
- 🎲 Sistema de rolagem de atributos e poder
- 📊 Progressão de personagens com sistema de EXP
- 🎭 Sistema de mesas multijogador
- 👑 Gestão de usuários com níveis hierárquicos
- 📚 Gerenciamento de conteúdo (espécies, perícias, técnicas, itens)

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Python | 3.10+ | Linguagem principal |
| Flask | 3.0.0 | Framework web |
| Flask-Login | 0.6.3 | Autenticação |
| MySQL/MariaDB | 8.0+ | Banco de dados |
| mysql-connector-python | 8.1.0 | Conector MySQL |
| HTML5/CSS3 | - | Interface |
| JavaScript (Vanilla) | - | Interatividade |

## 🚀 Instalação e Configuração

### Pré-requisitos

- Python 3.10 ou superior
- MySQL/MariaDB instalado
- Git (opcional, para clonar)

### Passo a passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/thaolundra-ttrpg.git
cd thaolundra-ttrpg
```

2. **Crie um ambiente virtual**
```bash
python -m venv venv
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure o banco de dados**
```bash
CREATE DATABASE thaolundra_rpg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Configure a conexão**
6. 