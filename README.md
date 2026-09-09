# 🐉 Thaolundra RPG

### Plataforma de RPG de Mesa

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![MariaDB](https://img.shields.io/badge/MariaDB-11.8-orange)
![License](https://img.shields.io/badge/License-Private-red)

---

## 📖 Sobre o Projeto

Thaolundra é uma plataforma web para facilitar e registrar sessões do RPG de mesa **Thaolundra**.

### Funcionalidades

- 📝 Criação e gestão de fichas de personagem
- 🎲 Sistema de rolagem de atributos com interface interativa
- 📊 Progressão de personagens com sistema de EXP
- 🎭 Sistema de mesas multijogador
- 🔐 Gestão de usuários com níveis hierárquicos (0-9)
- 📚 Gerenciamento de conteúdo (espécies, perícias, técnicas)
- 📧 Sistema de emails com Resend API
- 🎨 Temas claro/escuro com cores personalizáveis

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Python | 3.10+ | Linguagem principal |
| Flask | 3.0.0 | Framework web |
| Flask-Login | 0.6.3 | Autenticação |
| MariaDB/MySQL | 11.8+ | Banco de dados |
| mysql-connector-python | 8.1.0 | Conector MySQL |
| Resend | - | API de emails |
| HTML5/CSS3 | - | Interface |
| JavaScript (Vanilla) | - | Interatividade |
| Swiper.js | - | Carrosséis 3D |
| GSAP | - | Animações SVG |

---

## 🎮 Hierarquia de Usuários

| Nível | Nome | Permissões |
|:-----:|:-----:|:-----------|
| 0 | Espectador | Visualização apenas |
| 1 | Jogador | Criar fichas, jogar em mesas |
| 2 | Veterano | Jogador experiente |
| 3 | Parceiro | Colaborador do projeto |
| 4 | VIP | Benefícios especiais |
| 5 | Narrador | Gerenciar mesas, narrar |
| 6 | Guardião | Moderar conteúdo |
| 7 | Moderador | Gerenciar usuários |
| 8 | Desenvolvedor | Acesso ao código |
| 9 | Administrador | Controle total |

---
## 📁 Estrutura do Projeto

Thaolundra/
├── app.py
├── constants.py
├── database.py
├── email_utils.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── 📁 blueprints/
│   ├── auth.py
│   ├── criar_ficha.py
│   ├── editor_ficha.py
│   ├── especializacao.py
│   ├── gerenciar_conteudo.py
│   ├── gerenciar_usuarios.py
│   ├── main_page.py
│   ├── mesa.py
│   ├── progressao_exp.py
│   └── view_sheet.py
├── 📁 static/
│   ├── 📁 css/
│   └── 📁 js/
├── 📁 templates/
│   ├── 📁 emails/
│   ├── 📁 errors/
│   └── 📁 parts/
└── 📁 models/

---

## 🚀 Instalação

### Pré-requisitos

- Python 3.10+
- MariaDB/MySQL 11.8+

### Passo a passo

# 1. Clone o repositório
git clone https://github.com/seu-usuario/thaolundra.git
cd thaolundra

# 2. Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure o banco de dados
mysql -u root -p
CREATE DATABASE thaolundra_rpg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 5. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 6. Execute a aplicação
python app.py

Acesse: `http://localhost:8000`
---

## 📧 Sistema de Emails

Templates disponíveis:

| Template | Função |
|----------|--------|
| `password_reset.html` | Recuperação de senha |
| `invite_play.html` | Convite para jogar |
| `invite_watch.html` | Convite para assistir |
| `sessao_lembrete.html` | Lembrete de sessão |
| `mensagem_narrador.html` | Mensagem do narrador |
| `boas_vindas.html` | Boas-vindas |
| `novo_nivel.html` | Novo nível |
| `restricao.html` | Restrição de conta |

## 📊 Sistema de Progressão (EXP)

| Tipo | Custo por ponto | Máximo |
|------|----------------|--------|
| Atributos | 50-400 EXP | 45 |
| Perícias | 2-50 EXP | 450 |
| Técnicas | 5-70 EXP | 450 |
| FV/PE | 1-150 EXP | 900 |

## 🔐 Segurança

- HMAC-SHA256 para senhas
- `compare_digest()` para comparações seguras
- Tokens de recuperação
- SQL injection prevenido com placeholders
- Validação de campos com `allowed_fields`

## ⚙️ Variáveis de Ambiente (.env)

# Resend API (Emails)
RESEND_API_KEY=re_seu_token_aqui
RESEND_FROM_EMAIL=nao-responda@seu-dominio.com

# Flask
FLASK_SECRET_KEY=sua_chave_secreta_aqui

## 📦 Dependências

- Flask==3.0.0
- Flask-Login==0.6.3
- mysql-connector-python==8.1.0
- cryptography==41.0.7
- python-dotenv==1.0.0
- resend==0.8.0

## 📄 Licença

Este projeto é privado e de uso exclusivo do sistema Thaolundra RPG.

## 📞 Contato

**Email:** aoshinn@gmail.com

## 🤝 Contribuições

Se você gosta do projeto e quer ajudar a manter Thaolundra RPG vivo, qualquer doação é bem-vinda e muito apreciada. Sua contribuição ajuda a cobrir custos de servidor, desenvolvimento e novas funcionalidades.

<div align="center">
  <a href="https://pix.maisdonate.com/pix/aoshinn@gmail.com" target="_blank">
    <img src="https://i.postimg.cc/43jZf1Dj/pix.png" alt="Doar via PIX" width="200">
  </a>
  <br>
  <strong>Chave PIX:</strong> aoshinn@gmail.com
  <br><br>
  <strong>Payload PIX Copia e Cola:</strong>
  <br>
  <code>00020126390014br.gov.bcb.pix0117aoshinn@gmail.com5204000053039865802BR5920LEONARDO ALVES NAVES6008BRASILIA62190515Doação - GitHub630400F5</code>
</div>
