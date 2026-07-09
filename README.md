<div align="center">

# 📍 Tomar Digital

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React Native Paper](https://img.shields.io/badge/RN_Paper-MD3-1FB6E5?logo=materialdesign&logoColor=white)

**Plataforma civic-tech de digitalização de serviços para o concelho de Tomar**
<br>
_Ecossistema de Backend (Node.js + Express 5 + MongoDB) e Frontend Mobile (React Native + Expo Router + NativeWind)_

[🔧 Instalação](#-instalação-do-projeto) · [⚡ Execução](#-execução) · [📡 API](#-referência-completa-da-api) · [🛡️ Permissões](#-permissões-por-role) · [📋 TODO](#-todo-list)

</div>

---

## 📑 Índice

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Funcionalidades](#-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Pré-requisitos](#-pré-requisitos)
5. [Configuração do Ambiente](#-configuração-do-ambiente)
6. [Instalação do Projeto](#-instalação-do-projeto)
7. [Execução](#-execução)
8. [Estrutura do Projeto](#-estrutura-do-projeto)
9. [Referência Completa da API](#-referência-completa-da-api)
10. [Permissões por Role](#-permissões-por-role)
11. [Fluxos da Plataforma](#-fluxos-da-plataforma)
12. [Sistema de Temas](#-sistema-de-temas)
13. [Internacionalização](#-internacionalização-i18n)
14. [CI/CD e Deploy](#-cicd-e-deploy)
15. [Resolução de Problemas](#-resolução-de-problemas-firewall-e-rede)
16. [TODO List](#-todo-list)

---

## 🧭 Sobre o Projeto

O **Tomar Digital** é uma plataforma civic-tech que conecta **Cidadãos**, **Comerciantes** e a **Câmara Municipal** de Tomar num ciclo económico local digital. A plataforma fomenta o comércio local através de um sistema de gamificação baseado na leitura de faturas fiscais portuguesas (QR Code AT), onde os cidadãos acumulam pontos por cada compra que realizam nos negócios aderentes. Paralelamente, a Câmara Municipal pode criar campanhas temáticas com prémios (Packs) resgatáveis por pontos, incentivando a participação cívica e o turismo local.

### Como funciona

- **Cidadao (Cidadão)** — Explora negócios no mapa, escaneia QR Codes de faturas para acumular pontos, compra pacotes de campanhas com pontos, consulta campanhas ativas e levanta prémios presencialmente na Câmara. Pode candidatar-se a Comerciante submetendo documentação.
- **Comerciante (Merchant)** — Regista os seus negócios com logótipo e galeria de imagens, adere a campanhas da Câmara e acompanha os seus estabelecimentos.
- **Camara (Câmara Municipal)** — Aprova negócios e candidaturas de comerciantes, cria campanhas com packs de prémios, supervisiona candidaturas a campanhas, valida presencialmente vouchers de prémios e consulta dashboards analíticos com exportação para PDF/Excel.

---

## ✨ Funcionalidades

### Cidadao (Cidadão)

- 🗺️ Explorar negócios num mapa interativo com marcadores por categoria e clustering
- 🔍 Pesquisar e filtrar negócios por categoria
- ⭐ Guardar e gerir favoritos com atualizações otimistas
- 📱 Escanear QR Codes de faturas fiscais (AT) via câmara do telemóvel
- 🏆 Acumular pontos por cada euro gasto em negócios locais (1 ponto = 1 €)
- 🎯 Consultar campanhas ativas e comprar pacotes com pontos
- 📋 Ver histórico de compras (carteira de vouchers) com filtros por estado
- 👤 Editar perfil com upload de avatar
- 📝 Candidatar-se a Comerciante com documento PDF
- 🔐 Recuperar palavra-passe esquecida via email
- 🗑️ Apagar a sua própria conta (com confirmação por palavra-passe)

### Comerciante (Comerciante)

- 🏪 Registar negócios com logótipo, galeria de imagens (até 10), CAE e localização no mapa
- 📋 Acompanhar os seus negócios aprovados
- 🎯 Adere a campanhas da Câmara Municipal com indicação de estado (Participando/Pendente/Rejeitado/Não participando)
- 👤 Editar perfil com avatar e NIF

### Câmara (Câmara Municipal)

- ✅ Aprovar ou rejeitar registos pendentes de negócios
- 👔 Validar candidaturas de comerciantes com visualização de PDF
- 🏅 Criar e editar campanhas com logótipo, panfleto, packs de prémios e CAES
- 📋 Aprovar ou rejeitar adesões de negócios a campanhas
- ✏️ Editar pacotes (adicionar stock, corrigir descrição) com proteção de preço após compras
- 🗑️ Apagar campanhas (com proteção se houver compras associadas)
- 📱 Validar presencialmente vouchers de prémios (código de levantamento)
- 📈 Dashboard analítico com gráficos (categorias, cidades, países)
- 📄 Exportar estatísticas para PDF ou Excel (6 folhas: Resumo, Categorias, Cidades PT, Resto do Mundo, Campanhas, Pacotes)
- 🗑️ Apagar negócios (com limpeza de ficheiros do servidor)

### Funcionalidades Transversais

- 🔐 Autenticação JWT com verificação de email e recuperação de palavra-passe
- 🛡️ Rate limiting (100 req/15min global, 5 req/min em autenticação e ações sensíveis)
- 📖 API documentada com Swagger UI (`/api-docs`) — 46 endpoints
- 🗺️ Mapa interativo com estilo escuro/claro customizado e clustering de marcadores
- 📱 Processamento de imagens com Sharp (conversão para WebP, compressão)
- 🌍 Internacionalização PT/EN com deteção automática do idioma do sistema
- 🎨 Sistema de temas com 3 paletas locais × 2 modos (Claro/Escuro) + modo Automático
- ♿ Acessibilidade com labels e hints em todos os elementos interativos
- 🔄 Pull-to-refresh em todos os ecrãs de lista
- 🖼️ Pipeline de imagens: Multer (upload) → Sharp (WebP + resize) → Filesystem

---

## 🧱 Stack Tecnológica

| Camada              | Tecnologia                  | Versão                        |
| ------------------- | --------------------------- | ----------------------------- |
| **Frontend**        | React Native                | 0.81.5                        |
|                     | Expo SDK                    | ~54                           |
|                     | Expo Router                 | ~6.0                          |
|                     | TypeScript                  | ~5.9                          |
|                     | NativeWind (Tailwind)       | ^4.2                          |
|                     | React Native Paper          | ^5.15 (MD3)                   |
| **Mapas**           | react-native-maps           | ^1.20                         |
|                     | react-native-clusterer      | ^5.0                          |
|                     | expo-location               | ~19.0                         |
| **QR/Câmera**       | expo-camera                 | ~17.0                         |
|                     | expo-image-picker           | ~17.0                         |
| **Gráficos**        | react-native-chart-kit      | ^6.12                         |
|                     | react-native-gifted-charts  | ^1.4                          |
| **Exportação**      | expo-print                  | ~15.0                         |
|                     | xlsx                        | ^0.18                         |
| **i18n**            | i18next                     | ^26.3                         |
|                     | react-i18next               | ^17.0                         |
| **Backend**         | Express                     | ^5.2                          |
|                     | Mongoose (ODM)              | ^9.6                          |
|                     | JWT (jsonwebtoken)          | ^9.0                          |
|                     | bcrypt                      | ^6.0                          |
|                     | Multer (upload)             | ^2.1                          |
|                     | Sharp (imagens)             | ^0.34                         |
|                     | Nodemailer (email)          | ^8.0                          |
|                     | Azure Document Intelligence | ^5.1                          |
|                     | express-rate-limit          | ^8.5                          |
|                     | swagger-ui-express          | ^5.0                          |
| **Base de Dados**   | MongoDB                     | 7.0 (via Docker, replica set) |
| **CI/CD**           | GitHub Actions              | —                             |
|                     | Azure Web Apps              | West Europe                   |
|                     | EAS Build (APK)             | —                             |
| **Containerização** | Docker Compose              | 3.8                           |

---

## 📋 Pré-requisitos

| Ferramenta                  | Versão                | Propósito                                                                 |
| :-------------------------- | :-------------------- | :------------------------------------------------------------------------ |
| **Node.js**                 | v20 LTS (recomendado) | Runtime JavaScript (Backend e Frontend)                                   |
| **Docker & Docker Compose** | Latest                | Contentor MongoDB 7.0 (replica set)                                       |
| **Git**                     | Latest                | Controlo de versões                                                       |
| **EAS CLI**                 | Latest                | Compilar o dev client (a app usa Nitro Modules, incompatível com Expo Go) |

> [!NOTE]
> O CI/CD do Azure usa Node 22.x para o backend; o CI do EAS usa Node 20.x. Localmente, recomenda-se Node 20 LTS para compatibilidade com o Expo SDK 54.

**Build do Development Client (obrigatório):**

> [!WARNING]
> A app **não funciona com Expo Go** porque usa `react-native-nitro-modules`, `react-native-maps`, `react-native-clusterer`, `react-native-reanimated` e `react-native-webview` — todos módulos nativos que exigem um _development build_ personalizado. O `expo-dev-client` já está nas dependências.

```bash
# 1. Instalar o EAS CLI (uma vez por máquina)
npm install -g eas-cli

# 2. Fazer login no Expo account
eas login

# 3. Compilar o dev client para Android (APK de desenvolvimento)
cd FrontEnd
eas build --profile development --platform android

# 4. Instalar o APK resultante no telemóvel (link gerado pelo EAS)
```

O perfil `development` está definido em `eas.json` (`developmentClient: true`, `distribution: "internal"`). O APK de desenvolvimento inclui o `expo-dev-client`, que substitui o Expo Go e suporta todos os módulos nativos do projeto.

---

## 🛠 Configuração do Ambiente

### Instalação do Node.js (Recomendado: NVM)

> [!WARNING]
> A instalação direta do Node.js via gestores de pacotes do sistema (`apt`, `dnf`, `pacman`) costuma causar **erros de permissões** e **conflitos de versão** com o Expo. Utilize sempre um gestor de versões.

#### Linux e macOS

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # ou source ~/.zshrc
nvm install 20
nvm use 20
```

#### Windows

Descarregue o **[nvm-windows](https://github.com/coreybutler/nvm-windows/releases)** e execute:

```powershell
nvm install 20.11.1
nvm use 20.11.1
```

### Docker & Docker Compose

| Distribuição                 | Comando                                     |
| :--------------------------- | :------------------------------------------ |
| **Fedora / Nobara**          | `sudo dnf install docker docker-compose`    |
| **Ubuntu / Mint / Pop!\_OS** | `sudo apt install docker.io docker-compose` |
| **Arch Linux**               | `sudo pacman -S docker docker-compose`      |

**Configurar permissões (Linux):**

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> [!IMPORTANT]
> Reinicie a sessão (logout/login) para aplicar as permissões do grupo Docker.

**Windows e macOS:** Instale o **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (WSL2 no Windows).

---

## 🚀 Instalação do Projeto

### Backend (API & Base de Dados)

**1. Instalar dependências**

```bash
cd Tomar-Digital/BackEnd
npm install
```

**2. Levantar o contentor MongoDB (replica set)**

```bash
docker-compose up -d
```

> [!IMPORTANT]
> O MongoDB corre como **single-node replica set** (`--replSet rs0`) — necessário para suportar multi-document transactions (usadas pelo endpoint `/apagarConta` e `/packs/comprar`). O healthcheck executa `rs.initiate()` automaticamente no primeiro boot. Aguarde ~10 segundos após `docker-compose up -d` para o replica set eleger-se como primary.

**3. Configurar variáveis de ambiente**

Crie um ficheiro `.env` na raiz de `/BackEnd`:

```env
# Porta do servidor (fallback: 8080)
PORT=3000

# Ligação MongoDB (fallback: mongodb://localhost:27017/tomar_db)
MONGO_URI=mongodb://localhost:27017/tomar_db

# Chave secreta JWT (use uma string aleatória forte em produção)
JWT_SECRET=Uma_Chave_Super_Segura_2026_@!

# Email (Gmail SMTP via Nodemailer)
# O remetente está hardcoded: tomardigitalsuporte@gmail.com
GOOGLE_APP_PASSWORD=sua_app_password_gmail

# Azure Document Intelligence (validação OCR de faturas)
AZURE_VISION_ENDPOINT=https://seu-recurso.cognitiveservices.azure.com/
AZURE_VISION_KEY=sua_chave_azure
```

> [!WARNING]
> Em produção, utilize uma chave JWT forte e aleatória (≥32 caracteres). Nunca submeta o `.env` para controlo de versões.

### Frontend (Mobile Expo)

**1. Instalar dependências**

```bash
cd ../FrontEnd
npm install
```

**2. Configurar variáveis de ambiente**

Crie um ficheiro `.env` na raiz de `/FrontEnd`:

```env
# IP local do PC (ex: 192.168.1.120)
EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3000"

# Chave da API do Google Maps (obrigatória para o mapa)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="sua_chave_google_maps"
```

> [!IMPORTANT]
> No Expo, todas as variáveis de ambiente do Frontend têm de começar com o prefixo `EXPO_PUBLIC_`.

#### 🔍 Como descobrir o seu IP local

**Opção A: Através do Expo**

1. Execute `npx expo start -c`
2. Leia o IP no endereço `exp://192.168.1.120:8081` abaixo do QR Code
3. Cancele com `Ctrl + C`

**Opção B: Pelo Terminal**

- **Linux:** `hostname -I`
- **macOS:** `ifconfig`
- **Windows:** `ipconfig` → "Endereço IPv4"

---

## ⚡ Execução

Mantenha **dois terminais** abertos em simultâneo.

**Terminal 1 — Backend**

```bash
cd BackEnd
npm run dev
```

> Servidor em `http://localhost:3000`, ligação MongoDB em `MONGO_URI`, Swagger em `/api-docs`.

**Terminal 2 — Frontend**

```bash
cd FrontEnd
npx expo start -c
```

> [!TIP]
> A flag `-c` limpa a cache do Expo. Use-a sempre que alterar o `.env` ou o `package.json`.

### 📱 Como testar no telemóvel

1. PC e telemóvel na **mesma rede Wi-Fi**
2. Abra a app **Tomar+Digital (dev build)** — compilada via `eas build --profile development`
3. Leia o **QR Code** exibido no terminal do Frontend

---

## 📂 Estrutura do Projeto

### Backend

```text
BackEnd/
 ├─ middleware/
 │   └─ auth.js                    # Verificação JWT + autorização por roles
 ├─ models/                        # Schemas Mongoose (10 modelos)
 │   ├─ Business.js                # Negócios (CAE, logo, galeria, campanhas, status)
 │   ├─ Cae.js                     # Códigos CAE (classificação de atividades)
 │   ├─ Campaign.js                # Campanhas (packs embutidos, CAES, estados)
 │   ├─ CitiesAndCountries.js      # Validação de cidades no registo
 │   ├─ Favorite.js                # Favoritos dos utilizadores
 │   ├─ Invoice.js                 # Faturas (ATCUD + hash, índice único)
 │   ├─ Packs.js                   # Sub-schema de prémios (pointsCost, stock)
 │   ├─ PedidosComerciante.js      # Candidaturas de comerciante (PDF)
 │   ├─ Redemption.js              # Compras de pacotes (voucher com pickupCode)
 │   └─ User.js                    # Utilizadores (email, role, Points, NIF, Avatar)
 ├─ utils/
 │   └─ emailService.js            # Emails HTML com imagem embutida (CID)
 ├─ EmailImages/                   # Imagens usadas nos emails
 ├─ csvFiles/                      # CAES e cidades para o seed.js
 ├─ docker-compose.yml             # MongoDB 7.0 replica set (porta 27017)
 ├─ seed.js                        # Seeder para dados de demonstração
 ├─ index.js                       # Ponto de entrada — 46 rotas + Swagger
 ├─ package.json                   # Dependências (ESM)
 └─ .env                           # Ficheiro criado pelo utilizador
```

### Frontend

```text
FrontEnd/
 ├─ app/                           # Rotas e ecrãs (Expo Router)
 │   ├─ (accountCreation)/         # Fluxo de autenticação
 │   │   ├─ Login.tsx              # Login
 │   │   ├─ Register.tsx           # Registo
 │   │   ├─ Validate.tsx           # Verificação de email (6 dígitos)
 │   │   ├─ RecoverPassword.tsx    # Pedido de recuperação
 │   │   └─ NewPassword.tsx        # Definir nova palavra-passe
 │   ├─ (tabs)/                    # Navegação principal (RBAC por role)
 │   │   ├─ Home.tsx               # Mapa interativo
 │   │   ├─ Saved.tsx              # Favoritos
 │   │   ├─ Profile.tsx            # Perfil (envolvente do ProfileMenu)
 │   │   ├─ MunicipalIndex.tsx     # Painel da Câmara (camara)
 │   │   ├─ DashboardTab.tsx       # Dashboard (camara)
 │   │   ├─ CampaignIndex.tsx      # Painel de campanhas (camara)
 │   │   ├─ CampaignMerchant.tsx   # Campanhas com estado (comerciante)
 │   │   ├─ CampaignJoin.tsx       # Campanhas para cidadão
 │   │   ├─ BusinessMine.tsx       # Meus negócios (comerciante)
 │   │   └─ BusinessAdd.tsx        # Registar negócio (comerciante)
 │   ├─ components/                # 22 componentes reutilizáveis
 │   │   ├─ ScanScreen.tsx         # Scanner QR de faturas
 │   │   ├─ DeleteAccountDialog.tsx# Confirmação de apagar conta
 │   │   ├─ CampaignDetails.tsx    # Detalhes de campanha (role-aware)
 │   │   ├─ CampaignList.tsx       # Lista de campanhas (camara)
 │   │   ├─ CampaignCreate.tsx     # Criar campanha (camara)
 │   │   ├─ CampaignCandidates.tsx # Aprovar adesões a campanhas
 │   │   ├─ MyPurchases.tsx        # Carteira de vouchers (cidadão)
 │   │   ├─ ValidatePack.tsx       # Validar vouchers (camara)
 │   │   ├─ Dashboard.tsx          # Gráficos + exportação PDF/Excel
 │   │   ├─ Map.tsx                # Google Maps com clustering
 │   │   ├─ BusinessDetails.tsx    # Detalhes de negócio (hero banner)
 │   │   └─ ...                    # (ver lista completa no código)
 │   ├─ _layout.tsx                # Root: AuthProvider → ThemeProvider → Stack
 │   ├─ index.tsx                  # Gate de rota (verifica sessão em SecureStore)
 │   └─ globals.css                # Imports Tailwind CSS
 ├─ context/
 │   ├─ AuthContext.tsx            # Sessão (expo-secure-store, chave 'user_data')
 │   ├─ ThemeContext.tsx           # Tema (AsyncStorage, 3 paletas × 2 modos)
 │   └─ LoadingContext.tsx         # Estado global de loading (QrCodeFAB)
 ├─ constants/
 │   ├─ themes.js                  # 6 temas MD3 (3 paletas × claro/escuro)
 │   ├─ DarkMapStyle.tsx           # Estilo escuro + claro do Google Maps
 │   ├─ api.ts                     # API_URL = EXPO_PUBLIC_API_URL
 │   ├─ images.ts                  # Mapa de assets
 │   ├─ curiosities.js             # 10 curiosidades sobre Tomar
 │   ├─ excelUtils.ts              # Gerador de relatórios Excel
 │   └─ html/DashboardPdf.js       # Template HTML para PDF
 ├─ utils/                         # delay, getAddress, imagePicker, locationUtils, textValidation
 ├─ locales/                       # pt.json, en.json
 ├─ app.config.js                  # Config Expo (pacote Android, plugins, permissões)
 ├─ eas.json                       # Perfis EAS (dev, preview APK, produção)
 ├─ i18n.ts                        # Config i18next
 ├─ tailwind.config.js             # NativeWind v4
 ├─ tsconfig.json                  # TypeScript strict + path alias @/*
 └─ .env                           # Ficheiro criado pelo utilizador
```

---

## 📡 Referência Completa da API

> Documentação interativa (Swagger UI) em `/api-docs` quando o servidor está a correr. **46 endpoints** no total.

### Autenticação & Conta

|  Método  | Endpoint             |   Auth   | Rate Limit | Descrição                                                          |
| :------: | :------------------- | :------: | :--------: | :----------------------------------------------------------------- |
|  `POST`  | `/registar`          |    ❌    |   Strict   | Registar + envio de código de verificação por email                |
|  `POST`  | `/verificar-codigo`  |    ❌    |   Strict   | Verificar código de 6 dígitos                                      |
|  `POST`  | `/iniciarSessao`     |    ❌    |   Strict   | Login → JWT (1 dia) + dados do utilizador                          |
|  `POST`  | `/recuperarPassword` |    ❌    |   Strict   | Pedir código de recuperação (15 min, anti-enumeration)             |
|  `POST`  | `/alterarPassword`   |    ❌    |   Strict   | Redefinir palavra-passe com código de recuperação                  |
| `DELETE` | `/apagarConta`       | ✅ Todos |   Strict   | Apagar conta (verifica palavra-passe, cascade delete transacional) |

### Utilizadores

| Método | Endpoint               |    Auth     | Descrição                                                 |
| :----: | :--------------------- | :---------: | :-------------------------------------------------------- |
| `GET`  | `/utilizadores`        | ✅ `camara` | Listar todos os utilizadores (exclui passwords e códigos) |
| `GET`  | `/utilizador/:id`      | ✅ `camara` | Proprietários de negócios pendentes                       |
| `POST` | `/editarUser/:id`      |  ✅ Todos   | Editar perfil (nome, cidade, NIF, avatar via multipart)   |
| `POST` | `/aceitarTermosFatura` |  ✅ Todos   | Aceitar/revogar termos de processamento de faturas        |

### Negócios

|  Método  | Endpoint                 |            Auth            | Descrição                                                  |
| :------: | :----------------------- | :------------------------: | :--------------------------------------------------------- |
|  `POST`  | `/registarNegocio`       | ✅ `comerciante`, `camara` | Registar negócio (logo + galeria até 10, CAE, localização) |
|  `GET`   | `/negocios`              |             ❌             | Listar negócios aprovados                                  |
|  `GET`   | `/negocios/:id`          |             ❌             | Obter negócio por ID (com campanhas)                       |
|  `GET`   | `/meusNegocios`          |      ✅ `comerciante`      | Negócios do comerciante autenticado                        |
|  `GET`   | `/negociosCae`           |      ✅ `comerciante`      | Negócios por código CAE                                    |
|  `GET`   | `/business/pendentes`    |        ✅ `camara`         | Listar negócios pendentes                                  |
|  `POST`  | `/business/aprovar/:id`  |        ✅ `camara`         | Aprovar negócio pendente                                   |
| `DELETE` | `/business/rejeitar/:id` |        ✅ `camara`         | Rejeitar negócio pendente                                  |
| `DELETE` | `/apagarNegocio/:id`     |        ✅ `camara`         | Eliminar negócio + ficheiros do servidor                   |

### Favoritos

| Método | Endpoint                 |   Auth   | Descrição                                            |
| :----: | :----------------------- | :------: | :--------------------------------------------------- |
| `POST` | `/guardarFavorito`       | ✅ Todos | Adicionar aos favoritos (userId do JWT)              |
| `POST` | `/retirarFavorito`       | ✅ Todos | Remover dos favorutos (userId do JWT)                |
| `GET`  | `/meusFavoritos/:userId` | ✅ Todos | Listar favoritos (próprios ou camara para auditoria) |

### Faturas & Gamificação

| Método | Endpoint       |   Auth   | Descrição                                                                     |
| :----: | :------------- | :------: | :---------------------------------------------------------------------------- |
| `POST` | `/lerFatura`   | ✅ Todos | Ler QR Code de fatura AT → OCR Azure → validar NIF → atribuir pontos (1 pt/€) |
| `GET`  | `/faturas`     | ✅ Todos | Listar histórico de faturas do utilizador (paginado)                          |
| `GET`  | `/faturas/:id` | ✅ Todos | Obter fatura por ID (própria ou camara para auditoria)                        |

### Campanhas

|  Método  | Endpoint                             |       Auth       | Descrição                                                      |
| :------: | :----------------------------------- | :--------------: | :------------------------------------------------------------- |
|  `POST`  | `/criarCampanha`                     |   ✅ `camara`    | Criar campanha (logo, panfleto, packs, CAES, datas)            |
|  `GET`   | `/listaCampanhas`                    |        ❌        | Listar todas as campanhas                                      |
|  `GET`   | `/campanhas/:id`                     |        ❌        | Obter campanha por ID com packs                                |
|  `PUT`   | `/editarCampanha/:id`                |   ✅ `camara`    | Editar campanha (título, descrição, normas, data de expiração) |
| `DELETE` | `/apagarCampanha/:id`                |   ✅ `camara`    | Apagar campanha (bloqueado se houver compras)                  |
|  `GET`   | `/campanhas/comerciante-disponiveis` | ✅ `comerciante` | Campanhas disponíveis para o CAE do comerciante                |
|  `GET`   | `/campanhas/comerciante-com-status`  | ✅ `comerciante` | Campanhas com estado de participação                           |
|  `POST`  | `/campanhas/aderir`                  | ✅ `comerciante` | Comerciante candidata um negócio a uma campanha                |
|  `GET`   | `/candidaturasCampanha`              |   ✅ `camara`    | Candidaturas pendentes a campanhas                             |
|  `POST`  | `/decidirAdesaoCampanha`             |   ✅ `camara`    | Aprovar/rejeitar adesão a campanha                             |

### Packs (dentro de Campanhas)

| Método  | Endpoint                     |    Auth     | Descrição                                                                       |
| :-----: | :--------------------------- | :---------: | :------------------------------------------------------------------------------ |
| `PATCH` | `/campanhas/:cid/packs/:pid` | ✅ `camara` | Editar pack (adicionar stock, corrigir descrição; preço bloqueado após compras) |

### Candidaturas de Comerciante

|  Método  | Endpoint                         |     Auth     | Descrição                                       |
| :------: | :------------------------------- | :----------: | :---------------------------------------------- |
|  `POST`  | `/pedidoComerciante`             | ✅ `cidadao` | Submeter candidatura com PDF                    |
|  `GET`   | `/obter/PedidosComerciante`      | ✅ `camara`  | Listar candidaturas                             |
|  `POST`  | `/aprovar/PedidoComerciante/:id` | ✅ `camara`  | Aprovar → upgrade de role + eliminar PDF (RGPD) |
| `DELETE` | `/apagarPedidoComerciante/:id`   | ✅ `camara`  | Rejeitar candidatura + eliminar PDF             |

### Compra de Pacotes & Vouchers

| Método | Endpoint                       |    Auth     | Rate Limit | Descrição                                                      |
| :----: | :----------------------------- | :---------: | :--------: | :------------------------------------------------------------- |
| `POST` | `/packs/comprar`               |  ✅ Todos   |   Strict   | Comprar pacote com pontos (transação atómica, gera pickupCode) |
| `GET`  | `/packs/minhas-compras`        |  ✅ Todos   |   Global   | Listar compras do utilizador (com filtro `?status=`)           |
| `GET`  | `/packs/:id`                   |  ✅ Todos   |   Global   | Obter compra por ID (própria ou camara para auditoria)         |
| `POST` | `/packs/validar`               | ✅ `camara` |   Strict   | Validar pickupCode e marcar como entregue (atómico)            |
| `GET`  | `/packs/campanha/:id/negocios` |     ❌      |   Global   | Listar negócios participantes numa campanha                    |

### Dashboard

| Método | Endpoint     |    Auth     | Descrição                                            |
| :----: | :----------- | :---------: | :--------------------------------------------------- |
| `GET`  | `/dashboard` | ✅ `camara` | Estatísticas agregadas (categorias, cidades, países) |

> [!NOTE]
> Autenticação via `Authorization: Bearer <token_jwt>`. Ficheiros estáticos servidos em `/uploads`. Swagger UI em `/api-docs`.

---

## 🛡️ Permissões por Role

| Funcionalidade                       | Cidadao | Comerciante | Câmara |
| :----------------------------------- | :-----: | :---------: | :----: |
| Explorar mapa de negócios            |   ✅    |     ✅      |   ✅   |
| Pesquisar e filtrar negócios         |   ✅    |     ✅      |   ✅   |
| Guardar favoritos                    |   ✅    |     ✅      |   ✅   |
| Editar perfil e avatar               |   ✅    |     ✅      |   ✅   |
| Escanear faturas (pontos)            |   ✅    |     ✅      |   ✅   |
| Ver histórico de faturas             |   ✅    |     ✅      |   ✅   |
| Consultar campanhas                  |   ✅    |     ✅      |   ✅   |
| Comprar pacotes com pontos           |   ✅    |     ✅      |   ✅   |
| Ver carteira de vouchers             |   ✅    |     ✅      |   ✅   |
| Registar negócio                     |   ❌    |     ✅      |   ✅   |
| Ver os seus negócios                 |   ❌    |     ✅      |   ❌   |
| Adere a campanhas                    |   ❌    |     ✅      |   ❌   |
| Criar/editar/apagar campanhas        |   ❌    |     ❌      |   ✅   |
| Editar packs (stock, descrição)      |   ❌    |     ❌      |   ✅   |
| Aprovar/rejeitar negócios            |   ❌    |     ❌      |   ✅   |
| Aprovar/rejeitar comerciantes        |   ❌    |     ❌      |   ✅   |
| Aprovar/rejeitar adesões a campanhas |   ❌    |     ❌      |   ✅   |
| Validar vouchers presencialmente     |   ❌    |     ❌      |   ✅   |
| Dashboard + exportação               |   ❌    |     ❌      |   ✅   |
| Candidatar-se a comerciante          |   ✅    |     ❌      |   ❌   |

### Categorias de Negócio

| Categoria              | Ícone no Mapa | Descrição                         |
| :--------------------- | :-----------: | :-------------------------------- |
| 🏛️ Património & Museus |     Banco     | Monumentos, conventos, museus     |
| 🍽️ Restauração         |   Talheres    | Restaurantes e casas de refeições |
| ☕ Cafés & Pastelarias |     Café      | Cafés, pastelarias e padarias     |
| 🏨 Alojamento          |     Cama      | Hotéis, pensões e turismo rural   |
| 🛍️ Comércio Local      |     Saco      | Lojas e comércio tradicional      |
| 🌿 Lazer & Natureza    |    Árvore     | Atividades ao ar livre            |
| 🔧 Serviços            |     Pasta     | Serviços profissionais e pessoais |

---

## 🔄 Fluxos da Plataforma

### 📱 Leitura de Faturas e Pontos

1. O **Cidadão** escaneia o QR Code da fatura (câmara do telemóvel)
2. Fotografa o recibo físico
3. Submete os dados para `POST /lerFatura`
4. O backend faz **parser dos campos AT (A–S)**, valida via **Azure Document Intelligence OCR**, verifica matematicamente o **NIF**, previne duplicados (índice único `{ATCUD, hash}`) e impõe um **limite diário de 20 faturas**
5. Pontos atribuídos: **1 ponto por euro** (`Math.trunc(amount)`)
6. O cidadão pode ver o seu histórico em `GET /faturas`

### 🏅 Sistema de Campanhas e Compra de Pacotes

1. A **Câmara** cria campanhas com logo, panfleto, packs de prémios e CAES (`POST /criarCampanha`)
2. A **Câmara** pode editar a campanha (`PUT /editarCampanha/:id`) e os packs (`PATCH /campanhas/:cid/packs/:pid`)
3. O **Comerciante** vê campanhas disponíveis com estado de participação (`GET /campanhas/comerciante-com-status`)
4. O **Comerciante** candidata um negócio a uma campanha (`POST /campanhas/aderir`)
5. A **Câmara** aprova/rejeita a adesão (`POST /decidirAdesaoCampanha`)
6. O **Cidadão** vê campanhas ativas e os pacotes disponíveis
7. O **Cidadão** compra um pacote (`POST /packs/comprar`) — transação atómica decrementa stock, deduz pontos, gera pickupCode
8. O **Cidadão** vê o voucher na carteira (`GET /packs/minhas-compras`) com filtros (Ativo/Entregue/Expirado)
9. O **Cidadão** desloca-se à Câmara → o funcionário valida o pickupCode (`POST /packs/validar`) → voucher passa a "entregue"

### 📋 Candidatura a Comerciante

1. O **Cidadão** preenche o formulário e anexa um PDF comprovativo
2. A **Câmara** visualiza o PDF na app e aprova ou rejeita
3. Se aprovado, o role do utilizador passa de `cidadao` para `comerciante`
4. O PDF é eliminado do servidor (conformidade RGPD)

---

## 🎨 Sistema de Temas

O Tomar Digital apresenta um sistema de temas inspirado na identidade cultural de Tomar, com **3 paletas** × **2 modos** (Claro/Escuro), mais o modo **Automático** (segue o sistema):

| Paleta         | Inspiração                               | Cor Primária (Claro) | Cor Primária (Escuro) |
| :------------- | :--------------------------------------- | :------------------: | :-------------------: |
| **Convento**   | Convento de Cristo (Ouro Templário)      |      `#914c00`       |       `#ffb77f`       |
| **Mata**       | Mata dos Sete Montes (Natureza)          |      `#476500`       |       `#a1d494`       |
| **Tabuleiros** | Festa dos Tabuleiros (Vermelho Festival) |      `#8f000d`       |       `#ffb4ac`       |

Todos os temas seguem a especificação **Material Design 3** (MD3). As cores são acedidas via `useAppTheme()` — não existem cores hardcoded nos ecrãs (exceto `CustomSnackBar` para semáforos universais). Ver `ColorScheme.txt` para as regras completas de design.

---

## 🌍 Internacionalização (i18n)

A aplicação suporta **Português** e **Inglês** com deteção automática do idioma do sistema:

- Deteção via `expo-localization` (PT se o sistema estiver em PT, EN caso contrário)
- O utilizador pode alternar manualmente nas Preferências ou no botão de idioma nos ecrãs de autenticação
- A seleção é persistida em **AsyncStorage** (chave `@app_language`)
- Todas as chaves usam `defaultValue` como fallback

---

## 🚀 CI/CD e Deploy

### Backend — Azure Web Apps

- **Workflow:** `.github/workflows/develop_tomar-rg.yml`
- **Trigger:** Push para `develop`
- **Plataforma:** Azure Web Apps (West Europe), app `tomar-rg`
- **Node:** 22.x
- **URL de produção:** `https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net`
- **Seeder:** O `seed.js` executa no CI antes do deploy (popula a BD de produção)

### Frontend — EAS Build

- **Workflow:** `.github/workflows/eas-build.yml`
- **Trigger:** Push para `main` ou `develop`
- **Perfil:** `preview` (gera **APK**, não AAB)
- **Node:** 20.x
- **Pacote Android:** `com.jlfernandes.TomarDigital`
- **EAS Project ID:** `39bcf77c-f4b7-45dc-bb23-3db18bdc0b2d`

---

## 🛠️ Resolução de Problemas (Firewall e Rede)

Se o telemóvel não conseguir estabelecer ligação, a **Firewall do PC pode estar a bloquear as portas** `3000/tcp` (Backend) e `8081/tcp` (Frontend Expo).

> [!WARNING]
> O telemóvel não deve usar Dados Móveis (4G/5G), apenas Wi-Fi. Ambos os dispositivos têm de estar na **mesma rede**.

### 🐧 Ubuntu / Debian (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8081/tcp
sudo ufw reload
```

### 🐧 Fedora / Arch / RHEL (Firewalld)

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

### 🪟 Windows (PowerShell como Admin)

```powershell
New-NetFirewallRule -DisplayName "Expo Mobile" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NodeJS Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 🍏 macOS

**Definições do Sistema** > **Rede** > **Firewall** → autorizar `node` e `expo` nas ligações de entrada.

---

## 📋 TODO List

Itens identificados para desenvolvimento futuro, ordenados por prioridade:

### Alta Prioridade

- [ ] **Editar negócio** (`PUT /editarNegocio/:id`) — O endpoint existe como TODO vazio no `index.js` mas não tem implementação. O comerciante não pode editar o nome, descrição, galeria ou localização do seu negócio após o registo.
- [ ] **Ecrã de histórico de faturas** — O endpoint `GET /faturas` existe no backend mas não há ecrã no frontend. Criar um ecrã de histórico acessível a partir do perfil.
- [ ] **Validar NIF no frontend** — O `CustomTextInput` tem `isNIF` mas a validação de checksum não foi ligada em todos os formulários (ex: `BusinessAdd` não valida o NIF do negócio).
- [ ] **Notificações push** — Implementar notificações para: campanhas novas ativas, negócio aprovado/rejeitado, candidatura a comerciante aprovada, voucher prestes a expirar.

### Média Prioridade

- [ ] **Cancelar voucher** (`POST /packs/cancelar/:id`) — Permitir cancelar um voucher ativo e devolver os pontos (com transação atómica que restaura `currentStock` e `user.Points`).
- [ ] **Arquivar campanha** (soft delete) — Em vez de apagar, adicionar um estado `arquivada` para preservar o histórico.
- [ ] **Dashboard de redemptions** (`GET /dashboard/redemptions`) — Analytics de compras de pacotes: packs mais populares, taxa de levantamento, stock burn rate.
- [ ] **Paginação nos negócios** — O endpoint `/negocios` retorna todos de uma vez. Adicionar `?page=` e `?limit=` como no `/faturas`.
- [ ] **Pesquisa fuzzy no mapa** — A pesquisa atual é exata. Implementar pesquisa fuzzy para tolerar erros de digitação.
- [ ] **Horários de funcionamento** — Adicionar campo `horarios` ao modelo `Business` e exibir no `BusinessDetails`.
- [ ] **Fotos do negócio em ecrã completo** — No `BusinessDetails`, a galeria de fotos deveria abrir em fullscreen ao tocar.

### Baixa Prioridade / Tech Debt

- [ ] **Migrar POST-as-update para PUT/PATCH** — Endpoints como `/editarUser/:id`, `/retirarFavorito`, `/business/aprovar/:id` usam POST em vez de PUT/PATCH/DELETE. Migrar para verbos REST idiomáticos.
- [ ] **Padronizar nomes de rotas** — Misto de Português (`/negocios`) e Inglês (`/business/aprovar`). Padronizar num único idioma.
- [ ] **Separar `index.js` em controllers** — O ficheiro tem 3900+ linhas com 46 rotas. Extrair para `controllers/` e `routes/` para maintainability.
- [ ] **Testes automatizados** — Não existem testes unitários, de integração ou E2E. Adicionar Jest + Supertest para backend; Jest + React Native Testing Library para frontend.
- [ ] **Corrigir `app.config.js` `scheme: 'movies'`** — Placeholder leftover que deveria ser `'tomardigital'`.
- [ ] **Remover `tesseract.js`** — Importado mas não usado (Azure Document Intelligence é usado em vez disso).
- [ ] **Remover `@react-native-async-storage/async-storage` do backend** — Dependência de RN no `package.json` do backend (provável erro).
- [ ] **Rate limiting por utilizador** — O rate limiting atual é por IP. Adicionar rate limiting por utilizador (JWT) para endpoints sensíveis.
- [ ] **Refresh tokens** — O JWT atual expira em 1 dia sem renovação. Implementar refresh tokens para sessões mais longas.
- [ ] **Logging estruturado** — Substituir `console.log/error` por um logger estruturado (Winston/Pino) com níveis e rotação de ficheiros.
