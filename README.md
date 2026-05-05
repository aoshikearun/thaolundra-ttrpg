#  Thaolundra TTRPG
### Plataforma de RPG



![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![License](https://img.shields.io/badge/License-Private-red)

# 📖 Sobre o Projeto

Thaolundra é uma plataforma web para facilitar e registrar sessões do RPG de mesa **Thaolundra**. O sistema permite:

- 📝 **Criação e gestão de fichas de personagem** - Wizard completo com 9 passos
- 🎲 **Sistema de rolagem de atributos e poder** - Rolagem de 4d10 descartando o menor
- 📊 **Progressão de personagens com sistema de EXP** - Tabelas de custo progressivo
- 🎭 **Sistema de mesas multijogador** - Janelas flutuantes arrastáveis
- 👑 **Gestão de usuários com níveis hierárquicos** - 6 níveis de permissão
- 📚 **Gerenciamento de conteúdo** - Espécies, perícias, técnicas, fontes de poder

# 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Python | 3.10+ | Linguagem principal |
| Flask | 3.0.0 | Framework web |
| Flask-Login | 0.6.3 | Autenticação de usuários |
| MySQL/MariaDB | 8.0+ | Banco de dados |
| mysql-connector-python | 8.1.0 | Conector MySQL |
| HTML5/CSS3 | - | Interface e estilos |
| JavaScript (Vanilla) | - | Interatividade e animações |
| Swiper.js | - | Carrosséis 3D |
| GSAP | - | Animações SVG |

# 🎮 Hierarquia de Usuários

| Nível | Nome | Permissões |
|:-----:|:-----:|:-----------|
| 0 | Espectador | Apenas visualização |
| 1 | Jogador | Criar fichas, jogar em mesas |
| 2 | Narrador | Gerenciar mesas, narrar sessões |
| 3 | Guardião | Aprovar fichas, validar conteúdo |
| 4 | Moderador | Gerenciar conteúdo, usuários básico |
| 5 | Administrador | Acesso total, excluir conteúdo |

# 📁 Estrutura do Projeto

Thaolundra/
├── app.py
├── database.py
├── requirements.txt
├── blueprints/
│   ├── __init__.py
│   ├── auth.py
│   ├── main_page.py
│   ├── criar_ficha.py
│   ├── view_sheet.py
│   ├── gerenciar_conteudo.py
│   ├── gerenciar_usuarios.py
│   ├── mesa.py
│   └── progressao_exp.py
├── templates/
│   ├── base.html
│   ├── main.html
│   ├── login.html
│   ├── register.html
│   ├── criar_ficha.html
│   ├── view_sheet.html
│   ├── personagens.html
│   ├── meus_personagens.html
│   ├── gerenciar_conteudo.html
│   ├── gerenciar_usuarios.html
│   ├── mesa.html
│   ├── listar_mesas.html
│   └── errors/
│       ├── 401.html
│       ├── 403.html
│       ├── 404.html
│       └── 500.html
└── static/
    ├── css/
    └── js/

# 🚀 Instalação e Configuração

## Pré-requisitos

- Python 3.10 ou superior
- MySQL/MariaDB instalado
- Git (opcional)

## Passo a passo

### 1. Clone o repositório
`git clone https://github.com/seu-usuario/thaolundra-ttrpg.git
cd thaolundra-ttrpg`

### 2. Crie um ambiente virtual
`python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows`

### 3. Instale as dependências
`pip install -r requirements.txt
`
### 4. Configure o banco de dados
`CREATE DATABASE thaolundra_rpg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`
### 5. Configure a conexão - Edite o arquivo database.py com suas credenciais:

`DB_CONFIG = {
    'host': 'localhost',
    'database': 'thaolundra_rpg',
    'user': 'seu_usuario',
    'password': 'sua_senha',
    'port': 3306
}`

6. Execute a aplicação
python app.py

7. Acesse http://localhost:8000

## 📊 Sistema de Progressão (EXP)

O sistema utiliza tabelas de custo progressivo para:

- Atributos (Força, Destreza, Inteligência, Constituição)
- Perícias (até 200+ pontos)
- Técnicas (Inatas, Básicas, Avançadas, Últimas)
- Força Vital (FV) e Poder Elemental (PE)


## 🐛 Debug e Logs

- Logs de debug: debug.log
- Modo debug ativado por padrão em desenvolvimento
- Para produção, desative debug=True em app.py

## 📄 Licença

Este projeto é privado e de uso exclusivo para o sistema Thaolundra RPG.

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do Discord do Thaolundra.