# 🥗 BreakApp — Aplicativo de Dieta, Saúde e Nutrição

BreakApp é uma aplicação web voltada para o acompanhamento nutricional e gerenciamento de refeições diárias, permitindo que o usuário registre alimentos consumidos, acompanhe peso, meta corporal, ingestão de água e distribuição de macronutrientes — tudo de forma prática e visual.

Desenvolvido por: Antonio Sousa, Fernando Batista, Gustavo Taschetti, Lucas Pereira, Pedro Sousa e Vinícius Castro

---

## 🚀 Tecnologias Utilizadas

| Camada         | Tecnologia                              |
| -------------- | --------------------------------------- |
| Backend        | Node.js, Java/Spring (quando aplicável) |
| Frontend       | HTML, CSS, JavaScript                   |
| Execução       | Docker & Docker Compose                 |
| Banco de Dados | MySQL/MariaDB via container             |

---

## 📦 Pré-requisitos

### Certifique-se de ter instalado:

| Requisito         | Observação                                         |
| ----------------- | -------------------------------------------------- |
| 🐳 Docker         | Necessário e atualizado para iniciar os containers |
| 📦 Docker Compose | Já incluído nas versões recentes do Docker Desktop |

Para verificar se o Docker está pronto:

```bash
docker --version
docker compose version
```

Se ambos responderem corretamente, você pode continuar.

---

## 🛠️ Como executar o projeto

### 1. Baixe o projeto

Faça o download/clonagem e certifique-se que o diretório principal se chama **BreakApp**.

```bash
git clone <url-do-repositorio>
cd BreakApp
```

### 2. Inicie os containers

Dentro da pasta do projeto execute:

```bash
docker compose up
```

Isso irá:

✔ Baixar as imagens necessárias
✔ Criar os containers backend + frontend + banco de dados
✔ Iniciar a aplicação automaticamente

---

## 🧭 Fluxo de Uso da Aplicação

### 🔹 1. Landing Page

Ao iniciar o sistema você verá a tela inicial (landing page).
Nela você pode:

➡ Criar uma nova conta
➡ Fazer login (se já possuir cadastro)

---

### 🔹 2. Cadastro

No formulário, o usuário deve preencher:

✔ Nome
✔ Email
✔ Senha
✔ Altura
✔ Peso
✔ Idade
✔ Sexo

Após concluir, faça login para acessar o sistema.

---

### 🔹 3. Homepage

Após entrar no sistema, o usuário terá acesso ao painel principal com indicadores e navegação para as funções.

#### 🔥 Registrar alimentação

1. Clique no ícone de **alimentos**
2. Pesquise pelo alimento desejado
3. Selecione-o na lista sugerida
4. Informe **quantidade** e **categoria** (Café da manhã / Almoço / Jantar)
5. Salve a refeição

Também é possível visualizar detalhes clicando no card do alimento registrado.

---

### 🔹 4. Tela de Dieta

No menu dieta é possível:

| Função                  | Descrição                                |
| ----------------------- | ---------------------------------------- |
| Foto de perfil          | Enviar/alterar imagem do usuário         |
| Meta de peso            | Definir objetivo e acompanhar progresso  |
| Refeições por categoria | Ver todos os alimentos consumidos no dia |
| Dados pessoais          | Peso, altura, IMC, TMB                   |

---

### 🔹 5. Voltar para a Home

Na página inicial você poderá visualizar:

📊 Percentual de evolução rumo à meta
🥑 Balanço de macronutrientes ingeridos
💧 Registro de água consumida (ml)

O usuário consegue registrar água e acompanhar sua distribuição nutricional em tempo real.