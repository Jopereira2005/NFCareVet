# NFCareVet — Sistema Clínico Veterinário com Identificação NFC

Sistema web hospitalar desenvolvido para clínicas e hospitais veterinários, com suporte nativo à **Web NFC API** para identificação rápida de pacientes internados via coleiras/tags NFC, prontuário eletrônico à beira-leito (*bedside*), aprazamento de prescrições e autenticação por crachá aproximado.

> Repositório dedicado ao projeto de **UPX (Usina de Projetos Experimentais)** do 6º semestre de **Engenharia da Computação — FACENS**.

---

## Sumário

- [Visão Geral e Funcionalidades](#-visão-geral-e-funcionalidades)
- [Arquitetura do Monorepo](#-arquitetura-do-monorepo)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Perfis de Acesso e Credenciais de Demonstração](#-perfis-de-acesso-e-credenciais-de-demonstração)
- [Como Executar Localmente (Desenvolvimento)](#-como-executar-localmente-desenvolvimento)
- [Execução com Docker](#-execução-com-docker)
- [Deploy em Produção e CI/CD](#-deploy-em-produção-e-cicd)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)

---

## Visão Geral e Funcionalidades

- **Autenticação Híbrida (E-mail/Senha + Crachá NFC)**:
  - Login tradicional com JWT e opção *"Lembrar de mim"* (`localStorage` vs `sessionStorage`).
  - Login rápido por aproximação de crachá NFC (ou simulação em navegadores desktop).
- **Leitor NFC e Identificação à Beira-Leito (*Bedside*)**:
  - **Modo Consulta**: Aproximação da coleira NFC abre imediatamente o resumo e o prontuário do paciente internado.
  - **Modo Vínculo**: Permite associar uma tag livre a um paciente ou liberar uma coleira em uso.
  - **Rota Direta NDEF (`/bedside/:identifier`)**: Tags gravadas com registro NDEF URL abrem o prontuário automaticamente ao encostar o smartphone Android na coleira, mesmo com o navegador fechado.
- **Gestão de Inventário de Tags NFC (`/tags` — exclusivo para `ADMIN`)**:
  - Cadastro de novas coleiras via leitura física do UID hexadecimal (Web NFC) ou simulação.
  - Gravação física da URL NDEF (`/bedside/:publicCode`) no chip da tag via `NDEFReader.write()`.
  - Controle de status (**Disponível**, **Em Uso**, **Inativa**), vínculo direto com pacientes, inativação/reativação e exclusão.
- **Prontuário Eletrônico e Internação Hospitalar**:
  - Admissão de pacientes em baias/leitos com controle de ocupação em tempo real.
  - Prescrição médica e criação de tarefas clínicas (medicações, sinais vitais, procedimentos e exames).
  - Checagem à beira-leito (*Bedside Check*) com baixa automática no agendamento e linha do tempo clínica auditável.
- **Painel de Plantão e Histórico Operacional**:
  - Indicadores em tempo real de ocupação de leitos, uso de tags NFC, tarefas pendentes do turno e histórico de eventos clínicos filtrável.

---

## Arquitetura do Monorepo

O projeto utiliza **NPM Workspaces** para compartilhar tipagens, contratos e validações entre o backend e o frontend:

```text
NFCareVet/
├── packages/
│   └── common/              # (@nfcarevet/common) Enums, interfaces e contratos compartilhados
├── src/
│   ├── backend/             # API RESTful em NestJS + Prisma ORM + PostgreSQL + Swagger
│   ├── frontend/            # Aplicação principal em React 19 + TypeScript + Vite + SCSS Modules
│   └── frontend-teste/      # Interface auxiliar de bancada para homologação de endpoints
├── .github/workflows/
│   └── ci-cd.yml            # Pipeline GitHub Actions (Lint, Build e Deploy automatizado via SSH)
├── docker-compose.yml       # Ambiente Docker completo para desenvolvimento/homologação local
└── docker-compose.prod.yml  # Ambiente Docker otimizado para produção (loopback + Nginx host)
```

---

## Tecnologias Utilizadas

### Frontend (`src/frontend`)
- **React 19** + **TypeScript** + **Vite 8**
- **React Router v7** (Data Routers, Code Splitting com `lazyPage`, Loaders com Prefetch e Guards de Rota)
- **TanStack React Query v5** (Cache assíncrono, invalidação automática e sincronização de estado servidor)
- **Zustand** (Gerenciamento de sessão persistente, estado do sensor Web NFC e sistema de Toasts)
- **React Hook Form** + **Zod** (Formulários tipados e validação declarativa)
- **SCSS Modules** (Arquitetura de estilos modular com variáveis, *mixins* e responsividade *mobile-first*)
- **Web NFC API** (`NDEFReader` para leitura de serial UID e gravação de registros NDEF URL)

### Backend (`src/backend`)
- **NestJS 11** + **TypeScript**
- **Prisma ORM** + **PostgreSQL 16**
- **Passport JWT** + **bcryptjs** + Guards globais (`JwtAuthGuard`, `RolesGuard`)
- **class-validator** + **class-transformer** (Validação e sanitização de DTOs)
- **Swagger / OpenAPI** (Documentação interativa dos endpoints)

---

## Perfis de Acesso e Credenciais de Demonstração

Após rodar o *seed* do banco de dados (`npm run db:seed`), os seguintes usuários estarão disponíveis:

| Perfil | Nome | E-mail | Senha | Crachá NFC (`badgeUid`) | Permissões Principais |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | Dra. Camila Andrade | `admin@nfcarevet.com` | `admin123` | `BADGE001` (`BA:DG:E0:01`) | Acesso total + **Gestão de Inventário de Tags (`/tags`)** e Usuários |
| **`VET`** | Dra. Madalena Silva | `madalena@nfcarevet.com` | `vet12345` | `BADGE002` | Prontuários, internações, prescrições, checagem à beira-leito e leitor NFC |
| **`VET`** | Dr. Marcos Paxe | `paxe@nfcarevet.com` | `vet12345` | `BADGE004` | Prontuários, internações, prescrições, checagem à beira-leito e leitor NFC |
| **`REC`** | Carlos Recepção | `recepcao@nfcarevet.com` | `rec12345` | `BADGE003` | Cadastro de tutores/pacientes, consultas e apoio operacional |

> **Nota sobre Simulação NFC no Desktop**: Em navegadores sem suporte à Web NFC API (como no computador), os botões de leitura ativam automaticamente o **modo de simulação** (usando o crachá `BA:DG:E0:01` no login e tags de demonstração no leitor). Em dispositivos **Android com Google Chrome (HTTPS)**, a leitura e a gravação física de tags NFC funcionam nativamente.

---

## Como Executar Localmente (Desenvolvimento)

### Pré-requisitos
- **Node.js** `>= 22.x` e **npm**
- **Docker** e **Docker Compose** (para subir o banco PostgreSQL rapidamente)

### Passo a passo

1. **Instale as dependências do monorepo e compile o pacote compartilhado**:
   ```bash
   npm install
   npm run build:common
   ```

2. **Configure as variáveis de ambiente**:
   - Crie `src/backend/.env` (baseado em `src/backend/.env.example`):
     ```env
     DATABASE_URL="postgresql://nfcarevet:nfcarevet123@localhost:5432/nfcarevet_db?schema=public"
     PORT=3000
     JWT_SECRET="sua_chave_secreta_jwt_aqui"
     JWT_EXPIRES_IN="1d"
     FRONTEND_URL="http://localhost:5173"
     ```
   - Crie `src/frontend/.env.local` (baseado em `src/frontend/.env.example`):
     ```env
     VITE_API_URL=http://localhost:3000
     ```

3. **Suba o banco de dados PostgreSQL via Docker**:
   ```bash
   npm run db:up
   ```

4. **Execute as migrações do Prisma e popule o banco com dados de demonstração (*seed*)**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Inicie o backend e o frontend em terminais separados**:
   ```bash
   # Terminal 1 — Backend (http://localhost:3000)
   npm run dev:backend

   # Terminal 2 — Frontend (http://localhost:5173)
   npm run dev:frontend
   ```

---

## Execução com Docker

Para subir toda a pilha (**PostgreSQL + Backend + Frontend com Nginx**) em containers:

```bash
# Sobe todos os serviços em background
npm run docker:up

# Para encerrar os containers
npm run docker:down
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api/docs`

---

## Deploy em Produção e CI/CD

### Deploy em Produção (`docker-compose.prod.yml`)
1. Copie o arquivo `.env.prod.example` para `.env.prod` na raiz do servidor e preencha os valores seguros (`POSTGRES_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`).
2. Suba a stack de produção:
   ```bash
   npm run docker:prod:up
   ```
   O container `nfcarevet_frontend` escuta em `127.0.0.1:8085` (fazendo proxy interno de `/api/` para o container `nfcarevet_backend:3000`), pronto para receber tráfego HTTPS via Nginx/Certbot no host.

### Pipeline CI/CD (GitHub Actions)
O workflow [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) é executado automaticamente a cada `push` ou `pull_request` na branch `main`:
1. **Job `ci` (Lint & Build)**:
   - Compila `@nfcarevet/common`, gera o Prisma Client, valida o linter (`oxlint`) do frontend e executa o build de produção do frontend e do backend.
2. **Job `deploy` (Deploy Automatizado via SSH)**:
   - Em *pushes* na `main`, conecta-se à VM de produção via SSH, sincroniza a versão mais recente do repositório e reconstrói os containers de produção (`docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`).
   - Requer os *Repository Secrets* configurados no GitHub: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (e opcionalmente `SSH_PORT` e `DEPLOY_PATH`).

---

## Documentação da API (Swagger)

Com o backend em execução, acesse a documentação interativa OpenAPI/Swagger em:

```text
http://localhost:3000/api/docs
```

---

## Scripts Disponíveis na Raiz

| Comando | Descrição |
| :--- | :--- |
| `npm run build:common` | Compila o pacote compartilhado `@nfcarevet/common` |
| `npm run build` | Compila todos os workspaces do monorepo |
| `npm run dev:backend` | Inicia o servidor NestJS em modo *watch* (`http://localhost:3000`) |
| `npm run dev:frontend` | Inicia o servidor Vite do frontend (`http://localhost:5173`) |
| `npm run db:up` / `npm run db:down` | Inicia / para o container do PostgreSQL local |
| `npm run db:migrate` | Executa as migrações do Prisma no banco de dados |
| `npm run db:seed` | Popula o banco com usuários, baias, pacientes, tags NFC e prescrições |
| `npm run db:studio` | Abre o Prisma Studio para inspeção visual do banco |
| `npm run docker:up` / `npm run docker:down` | Sobe / derruba todos os containers do ambiente local |
| `npm run docker:prod:up` / `npm run docker:prod:down` | Sobe / derruba a stack Docker de produção |
