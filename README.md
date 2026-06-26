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
*Ecossistema de Backend (Node.js + Express 5 + MongoDB) e Frontend Mobile (React Native + Expo Router + NativeWind)*

[🔧 Instalação](#-instalação-do-projeto) · [⚡ Execução](#-execução) · [📡 API](#-referência-da-api) · [🛡️ Permissões](#-permissões-por-role)

</div>

---

## 📑 Índice

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Funcionalidades](#-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Pré-requisitos](#-pré-requisitos)
5. [Configuração do Ambiente](#-configuração-do-ambiente)
   - [Instalação do Node.js (Recomendado: NVM)](#instalação-do-nodejs-recomendado-nvm)
   - [Instalação do Docker](#docker--docker-compose)
6. [Instalação do Projeto](#-instalação-do-projeto)
   - [Backend (API & Base de Dados)](#backend-api--base-de-dados)
   - [Frontend (Mobile Expo)](#frontend-mobile-expo)
7. [Execução](#-execução)
8. [Estrutura do Projeto](#-estrutura-do-projeto)
9. [Referência da API](#-referência-da-api)
10. [Permissões por Role](#-permissões-por-role)
11. [Fluxos da Plataforma](#-fluxos-da-plataforma)
    - [Leitura de Faturas e Pontos](#-leitura-de-faturas-e-pontos)
    - [Sistema de Campanhas](#-sistema-de-campanhas)
    - [Candidatura a Comerciante](#-candidatura-a-comerciante)
12. [Sistema de Temas](#-sistema-de-temas)
13. [Internacionalização](#-internacionalização-i18n)
14. [CI/CD e Deploy](#-cicd-e-deploy)
15. [Resolução de Problemas (Firewall e Rede)](#-resolução-de-problemas-firewall-e-rede)

---

## 🧭 Sobre o Projeto

O **Tomar Digital** é uma plataforma civic-tech que conecta **Cidadãos**, **Comerciantes** e a **Câmara Municipal** de Tomar num ciclo económico local digital. A plataforma fomenta o comércio local através de um sistema de gamificação baseado na leitura de faturas fiscais portuguesas (QR Code AT), onde os cidadãos acumulam pontos por cada compra que realizam nos negócios aderentes. Paralelamente, a Câmara Municipal pode criar campanhas temáticas com prémios (Packs) resgatáveis por pontos, incentivando a participação cívica e o turismo local.

### Como funciona

- **Cidadao (Cidadão)** — Explora negócios no mapa, escaneia QR Codes de faturas para acumular pontos, consulta campanhas ativas e resgata prémios. Pode candidatar-se a Comerciante submetendo documentação.
- **Comerciante (Merchant)** — Regista os seus negócios com logótipo e galeria de imagens, adere a campanhas da Câmara e acompanha os seus estabelecimentos.
- **Camara (Câmara Municipal)** — Aprova negócios e candidaturas de comerciantes, cria campanhas com packs de prémios, supervisiona candidaturas a campanhas e consulta dashboards analíticos com exportação para PDF/Excel.

---

## ✨ Funcionalidades

### Cidadao (Cidadão)
- 🗺️ Explorar negócios num mapa interativo com marcadores por categoria e clustering
- 🔍 Pesquisar e filtrar negócios por categoria
- ⭐ Guardar e gerir favoritos com atualizações otimistas
- 📱 Escanear QR Codes de faturas fiscais (AT) via câmara do telemóvel
- 🏆 Acumular pontos por cada euro gasto em negócios locais
- 🎯 Consultar campanhas ativas e prémios disponíveis
- 👤 Editar perfil com upload de avatar
- 📝 Candidatar-se a Comerciante com documento PDF

### Comerciante (Comerciante)
- 🏪 Registar negócios com logótipo, galeria de imagens, CAE e localização no mapa
- 📋 Acompanhar os seus negócios aprovados
- 🎯 Adere a campanhas da Câmara Municipal
- 👤 Editar perfil com avatar e NIF

### Câmara (Câmara Municipal)
- ✅ Aprovar ou rejeitar registos pendentes de negócios
- 👔 Validar candidaturas de comerciantes com visualização de PDF
- 🏅 Criar campanhas com logótipo, panfleto, packs de prémios e CAES
- 📋 Aprovar ou rejeitar adesões de negócios a campanhas
- 📈 Dashboard analítico com gráficos (categorias, cidades, países)
- 📄 Exportar estatísticas para PDF ou Excel (4 folhas)
- 🗑️ Apagar negócios (com limpeza de ficheiros do servidor)

### Funcionalidades Transversais
- 🔐 Autenticação JWT com verificação de email e controlo de acesso por roles
- 🛡️ Rate limiting (100 req/15min global, 5 req/min em autenticação)
- 📖 API documentada com Swagger UI (`/api-docs`)
- 🗺️ Mapa interativo com estilo escuro customizado e clustering de marcadores
- 📱 Processamento de imagens com Sharp (conversão para WebP, compressão)
- 🌍 Internacionalização PT/EN com deteção automática do idioma do sistema
- 🎨 Sistema de temas com 3 paletas locais × 3 modos (Claro/Escuro/Automático)
- ♿ Acessibilidade com labels e hints em todos os elementos interativos
- 🖼️ Pipeline de imagens: Multer (upload) → Sharp (WebP + resize) → Filesystem

---

## 🧱 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React Native | 0.81.5 |
| | Expo SDK | ~54 |
| | Expo Router | ~6.0 |
| | TypeScript | ~5.9 |
| | NativeWind (Tailwind) | ^4.2 |
| | React Native Paper | ^5.15 (MD3) |
| **Mapas** | react-native-maps | ^1.20 |
| | react-native-clusterer | ^5.0 |
| | expo-location | ~19.0 |
| **QR/Câmera** | expo-camera | ~17.0 |
| | react-native-qrcode-svg | ^6.3 |
| **Gráficos** | react-native-chart-kit | ^6.12 |
| | react-native-gifted-charts | ^1.4 |
| **i18n** | i18next | ^26.3 |
| | react-i18next | ^17.0 |
| **Backend** | Express | ^5.2 |
| | Mongoose (ODM) | ^9.6 |
| | JWT (jsonwebtoken) | ^9.0 |
| | bcrypt | ^6.0 |
| | Multer (upload) | ^2.1 |
| | Sharp (imagens) | ^0.34 |
| | Nodemailer (email) | ^8.0 |
| | Azure Document Intelligence | ^5.1 |
| | express-rate-limit | ^8.5 |
| | swagger-ui-express | ^5.0 |
| **Base de Dados** | MongoDB | 7.0 (via Docker) |
| **CI/CD** | GitHub Actions | — |
| | Azure Web Apps | West Europe |
| | EAS Build (APK) | — |
| **Containerização** | Docker Compose | 3.8 |

---

## 📋 Pré-requisitos

Antes de começar, garanta que tem instalado:

| Ferramenta | Versão | Propósito |
|:---|:---|:---|
| **Node.js** | v20 LTS | Runtime JavaScript (Backend e Frontend) |
| **Docker & Docker Compose** | Latest | Contentor da base de dados MongoDB 7.0 |
| **Git** | Latest | Controlo de versões |
| **Expo Go** | Latest | Testar a app no telemóvel |

**Download Expo Go:**
- 🤖 [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
- 🍏 [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

---

## 🛠 Configuração do Ambiente

### Instalação do Node.js (Recomendado: NVM)

> [!WARNING]
> A instalação direta do Node.js e *npm* através de gestores de pacotes do sistema (como `apt`, `dnf` ou `pacman`) costuma causar **erros de permissões** (exigindo `sudo` indevidamente) e graves **conflitos de versão** com o Expo. Utilize sempre um gestor de versões.

A melhor prática na indústria para gerir o Node.js é utilizar o **NVM (Node Version Manager)**. Isto permite instalar pacotes globais sem `sudo` e alternar facilmente entre versões do Node.

#### Linux e macOS

1. Instale o NVM executando o script oficial no terminal:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

2. Feche e reabra o seu terminal, ou carregue as novas configurações:
```bash
source ~/.bashrc   # ou source ~/.zshrc se usar Zsh
```

3. Instale e ative a versão 20 (LTS) do Node.js:
```bash
nvm install 20
nvm use 20
```

#### Windows

1. Descarregue a versão mais recente do **[nvm-windows](https://github.com/coreybutler/nvm-windows/releases)** (procure o ficheiro `nvm-setup.exe`).
2. Siga o assistente de instalação normal.
3. Abra um **novo** terminal (PowerShell ou Command Prompt) como Administrador e execute:
```powershell
nvm install 20.11.1
nvm use 20.11.1
```

---

### Docker & Docker Compose

#### Linux (Fedora / Ubuntu / Arch Linux)

Instale o ecossistema Docker conforme a sua distribuição:

| Distribuição | Comando |
|:---|:---|
| **Fedora / Nobara** | `sudo dnf install docker docker-compose` |
| **Ubuntu / Mint / Pop!\_OS** | `sudo apt install docker.io docker-compose` |
| **Arch Linux** | `sudo pacman -S docker docker-compose` |

**Configurar permissões do Docker (Linux)**

Para executar o Docker sem utilizar sempre `sudo`:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> [!IMPORTANT]
> É estritamente necessário **reiniciar a sessão** (logout e login) ou o computador para aplicar as novas permissões do grupo Docker.

#### Windows e macOS

1. Instale o **[Docker Desktop](https://www.docker.com/products/docker-desktop)** a partir do site oficial.
2. (Windows) Certifique-se de que o **WSL2** está ativado nas definições do Docker Desktop (geralmente ativado por predefinição).

---

## 🚀 Instalação do Projeto

### Backend (API & Base de Dados)

**1. Instalar as dependências**

```bash
cd Tomar-Digital/BackEnd
npm install
```

**2. Levantar o contentor da base de dados (MongoDB 7.0)**

```bash
docker-compose up -d
```

> [!NOTE]
> Dependendo da versão do Docker, o comando poderá ser `docker compose` (sem o hífen).

**3. Configurar variáveis de ambiente**

Crie um ficheiro `.env` na raiz da pasta `/BackEnd` com o seguinte conteúdo:

```env
PORT=3000
JWT_SECRET=Uma_Chave_Super_Segura_2026_@!

# Email (Nodemailer — Gmail SMTP)
MAIL_USER=seu_email@gmail.com
MAIL_PASS=sua_app_password

# Azure Document Intelligence (para validação OCR de faturas)
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://seu-recurso.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=sua_chave_azure
```

> [!WARNING]
> Em ambiente de produção, utilize sempre uma chave JWT secreta forte e aleatória com pelo menos 32 caracteres. Nunca partilhe este ficheiro nem o submeta para controlo de versões.

### Frontend (Mobile Expo)

**1. Instalar as dependências**

```bash
cd ../FrontEnd
npm install
```

**2. Configurar variáveis de ambiente**

Crie um ficheiro `.env` na raiz da pasta `/FrontEnd`:

```env
# Substitua pelo IP local do seu computador (ex: 192.168.1.120)
EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3000"

# Chave da API do Google Maps (obrigatória para o mapa)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="sua_chave_google_maps"
```

> [!IMPORTANT]
> No Expo, todas as variáveis de ambiente projetadas para o Frontend têm **obrigatoriamente de começar** com o prefixo `EXPO_PUBLIC_`. Variáveis sem este prefixo não estarão disponíveis no lado do cliente.

#### 🔍 Como descobrir o seu IP local

**Opção A: Através do Expo (Mais fácil)**
1. Inicie o Frontend com `npx expo start -c` no terminal.
2. Observe o texto abaixo do QR Code gerado.
3. Verá um endereço semelhante a `exp://192.168.1.120:8081`. Copie apenas o IP (neste exemplo, `192.168.1.120`) e coloque no `.env`. Depois pode cancelar com `Ctrl + C`.

**Opção B: Pelo Terminal do Sistema**
- **Linux / macOS:** Execute `hostname -I` (Linux) ou `ifconfig` (macOS).
- **Windows:** Execute `ipconfig` no PowerShell e procure por "Endereço IPv4" na secção do adaptador Wi-Fi/Ethernet.

---

## ⚡ Execução

Mantenha **dois terminais distintos e em simultâneo** abertos.

**Terminal 1 — Backend**

```bash
cd BackEnd
npm run dev
```

> O servidor arranca em `http://localhost:3000`, liga-se ao MongoDB em `mongodb://localhost:27017/tomar_db`, e disponibiliza a documentação Swagger em `/api-docs`.

**Terminal 2 — Frontend**

```bash
cd FrontEnd
npx expo start -c
```

> [!TIP]
> A flag `-c` limpa a *cache* do Expo. Use-a sempre que alterar o ficheiro `.env` ou atualizar o `package.json`.

### 📱 Como testar no telemóvel

1. Certifique-se de que o **PC** e o **telemóvel** estão ligados na **mesma rede Wi-Fi**.
2. Abra a aplicação **Expo Go**.
3. Leia o **QR Code** exibido no terminal do Frontend através da app.

---

## 📂 Estrutura do Projeto

### Backend

```text
BackEnd/
 ├─ middleware/
 │   └─ auth.js                    # Verificação JWT + autorização por roles
 ├─ models/                        # Schemas Mongoose (MongoDB ODM)
 │   ├─ Business.js                # Negócios (CAE, logo, galeria, campanhas, status)
 │   ├─ Cae.js                     # Códigos CAE (classificação de atividades)
 │   ├─ Campaign.js                # Campanhas (packs embutidos, CAES, estados)
 │   ├─ CitiesAndCountries.js      # Validação de cidades no registo
 │   ├─ Favorite.js                # Favoritos dos utilizadores
 │   ├─ Invoice.js                 # Faturas lidas (ATCUD + hash, índice único)
 │   ├─ Packs.js                   # Sub-schema de prémios (pointsCost, stock)
 │   ├─ PedidosComerciante.js      # Candidaturas de comerciante (PDF)
 │   └─ User.js                    # Utilizadores (email, role, Points, NIF, Avatar)
 ├─ docker-compose.yml             # Contentor MongoDB 7.0 (porta 27017)
 ├─ index.js                       # Ponto de entrada — todas as rotas da API + Swagger
 ├─ package.json                   # Dependências e scripts (ESM)
 └─ .env                           # Ficheiro criado pelo utilizador
```

### Frontend

```text
FrontEnd/
 ├─ app/                           # Rotas e ecrãs (Expo Router — file-based)
 │   ├─ (accountCreation)/         # Fluxo de autenticação
 │   │   ├─ _layout.tsx            # Tabs de Login / Registo
 │   │   ├─ Login.tsx              # Ecrã de login (com toggle de password)
 │   │   ├─ Register.tsx           # Ecrã de registo
 │   │   └─ Validate.tsx           # Verificação de email (código de 6 dígitos)
 │   ├─ (tabs)/                    # Navegação principal (visibilidade por role)
 │   │   ├─ _layout.tsx            # Configuração das tabs + QrCodeFAB global
 │   │   ├─ Home.tsx               # Mapa interativo com clustering
 │   │   ├─ Saved.tsx              # Favoritos guardados + curiosidades
 │   │   ├─ BusinessAdd.tsx        # Registar negócio (comerciante)
 │   │   ├─ BusinessMine.tsx       # Meus negócios (comerciante)
 │   │   ├─ CampaignJoin.tsx       # Adere a campanhas (comerciante)
 │   │   ├─ CampaignCreate.tsx     # Criar campanha (câmara)
 │   │   ├─ MunicipalIndex.tsx     # Painel de gestão (câmara)
 │   │   ├─ DashboardTab.tsx       # Dashboard analítico (câmara)
 │   │   ├─ ScanScreen.tsx         # Scanner QR de faturas (com permissões)
 │   │   └─ Profile.tsx            # Perfil do utilizador
 │   ├─ components/                # Componentes reutilizáveis e ecrãs auxiliares
 │   │   ├─ AppAbout.tsx           # Acerca da app (missão, RGPD, créditos)
 │   │   ├─ BusinessCandidates.tsx # Aprovar/rejeitar negócios pendentes
 │   │   ├─ BusinessDetails.tsx    # Detalhes do negócio (galeria, mapa, campanhas)
 │   │   ├─ BusinessList.tsx       # Item de lista de negócio
 │   │   ├─ CampaignCandidates.tsx # Aprovar/rejeitar adesões a campanhas
 │   │   ├─ CampaignDetails.tsx    # Detalhes + fluxo de adesão a campanha
 │   │   ├─ CustomButton.tsx       # Botão temático com loading e acessibilidade
 │   │   ├─ CustomChip.tsx         # Chip temático
 │   │   ├─ CustomDialog.tsx       # Dialog temático (alertas/confirmar)
 │   │   ├─ CustomMarker.tsx       # Marcador de mapa por categoria
 │   │   ├─ CustomSnackBar.tsx     # Snackbar semântico (sucesso/erro/aviso)
 │   │   ├─ CustomTextInput.tsx    # Input com validação, toggle password e strip de invisíveis
 │   │   ├─ Dashboard.tsx          # Gráficos + exportação PDF/Excel
 │   │   ├─ LanguageSwitcher.tsx   # Alternância PT/EN
 │   │   ├─ LoadingScreen.tsx      # Ecrã de carregamento com curiosidades
 │   │   ├─ Map.tsx                # Google Maps com clustering e estilo escuro
 │   │   ├─ MerchantForm.tsx       # Formulário de candidatura a comerciante
 │   │   ├─ MerchantsCandidates.tsx# Aprovar/rejeitar comerciantes (com PDF viewer)
 │   │   ├─ Preferences.tsx        # Definições (tema + idioma)
 │   │   ├─ ProfileEdit.tsx        # Editar perfil (nome, cidade, NIF, avatar)
 │   │   ├─ ProfileMenu.tsx        # Menu do perfil (avatar, pontos, opções)
 │   │   ├─ QrCodeFAB.tsx          # Botão flutuante global para scanner QR
 │   │   ├─ Tabicon.tsx            # Ícone de tab (focused/unfocused)
 │   │   ├─ Terms.tsx              # Termos e condições
 │   │   └─ ThemeSelector.tsx      # Seleção de modo + paleta
 │   ├─ _layout.tsx                # Root: AuthProvider → ThemeProvider → LoadingProvider → SafeArea → Stack
 │   ├─ globals.css                # Imports Tailwind CSS
 │   └─ index.tsx                  # Entry point — verificação de token
 ├─ assets/
 │   ├─ backgroundImages/          # Fundos de ecrã (login, registo)
 │   ├─ CampaignIcons/             # Ícones de campanha
 │   ├─ Logos/                     # Logótipo Tomar Digital
 │   ├─ Markers/                   # 8 ícones de categorias para o mapa
 │   ├─ otherIcons/                # Ícones auxiliares (editar, email, etc.)
 │   └─ tabsImages/                # 15 ícones PNG/SVG para a tab bar
 ├─ constants/
 │   ├─ html/
 │   │   └─ DashboardPdf.js        # Template HTML para exportação PDF
 │   ├─ Interfaces/                # TypeScript interfaces (Negocio, Pack, Map)
 │   ├─ api.ts                     # API_URL a partir de env var
 │   ├─ curiosities.js             # 10 curiosidades sobre Tomar (i18n keys)
 │   ├─ DarkMapStyle.tsx           # Estilo escuro customizado para Google Maps
 │   ├─ excelUtils.ts              # Gerador de relatórios Excel (4 folhas)
 │   ├─ images.ts                  # 26 referências a imagens organizadas
 │   ├─ MapFocous.tsx              # Animação de câmara para localização
 │   └─ themes.js                  # 6 temas MD3 completos (3 paletas × 2 modos)
 ├─ context/
 │   ├─ AuthContext.tsx            # Estado global de autenticação (SecureStore)
 │   ├─ LoadingContext.tsx         # Estado global de loading (loadingQR para FAB)
 │   └─ ThemeContext.tsx           # Estado do tema (AsyncStorage, 3 paletas × 3 modos)
 ├─ services/
 │   └─ tokenService.ts            # CRUD de tokens (SecureStore)
 ├─ utils/
 │   ├─ delay.ts                   # Utilitário de espera assíncrona
 │   ├─ getAddress.ts              # Geocodificação reversa (expo-location)
 │   ├─ imagePicker.ts             # Seletor de imagens (expo-image-picker)
 │   ├─ locationUtils.ts           # Distância entre coordenadas (Haversine)
 │   └─ textValidation.ts          # Validação de texto (strip invisíveis, isValidText)
 ├─ app.config.js                  # Configuração Expo (pacote Android, permissões, plugins)
 ├─ eas.json                       # Perfis EAS Build (dev, preview APK, produção)
 ├─ i18n.ts                        # Configuração i18next (PT/EN, deteção automática)
 ├─ tailwind.config.js             # NativeWind v4 preset
 ├─ tsconfig.json                  # TypeScript strict mode + path alias @/*
 └─ .env                           # Ficheiro criado pelo utilizador
```

---

## 📡 Referência da API

> A documentação interativa (Swagger UI) está disponível em `/api-docs` quando o servidor está a correr.

### Autenticação & Utilizadores

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/registar` | ❌ | Registar utilizador + envio de código de verificação por email |
| `POST` | `/verificar-codigo` | ❌ | Verificar código de 6 dígitos enviado por email |
| `POST` | `/iniciarSessao` | ❌ | Login — retorna JWT (1 dia) + dados do utilizador |
| `POST` | `/aceitarTermosFatura` | ✅ Todos | Aceitar/revogar termos e condições de faturas |
| `GET` | `/utilizadores` | ❌ | Listar todos os utilizadores |
| `GET` | `/utilizador/:id` | ✅ `camara` | Obter proprietários de negócios pendentes |
| `POST` | `/editarUser/:id` | ✅ Todos | Editar perfil (nome, cidade, NIF, avatar) |

### Negócios

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/registarNegocio` | ✅ `comerciante`, `camara` | Registar negócio (logo + galeria até 10 imgs, CAE, localização) |
| `GET` | `/negocios` | ❌ | Listar negócios aprovados |
| `GET` | `/negocios/:id` | ❌ | Obter negócio por ID (com campanhas populadas) |
| `DELETE` | `/apagarNegocio/:id` | ✅ `camara` | Eliminar negócio + ficheiros do servidor |
| `GET` | `/meusNegocios` | ✅ `comerciante` | Listar negócios do comerciante autenticado |
| `GET` | `/negociosCae` | ✅ `comerciante` | Listar negócios por código CAE |
| `POST` | `/business/aprovar/:id` | ✅ `camara` | Aprovar negócio pendente |
| `DELETE` | `/business/rejeitar/:id` | ✅ `camara` | Rejeitar (eliminar) negócio pendente |
| `GET` | `/business/pendentes` | ✅ `camara` | Listar negócios pendentes de aprovação |

### Favoritos

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/guardarFavorito` | ❌ | Adicionar negócio aos favoritos |
| `POST` | `/retirarFavorito` | ❌ | Remover negócio dos favoritos |
| `GET` | `/meusFavoritos/:userId` | ❌ | Listar favoritos de um utilizador |

### Faturas & Gamificação

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/lerFatura` | ✅ Todos | Ler QR Code de fatura AT → validar OCR → atribuir pontos (1 pt/€) |

### Campanhas

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/criarCampanha` | ✅ `camara` | Criar campanha (logo, panfleto, packs, CAES, datas) |
| `GET` | `/listaCampanhas` | ❌ | Listar todas as campanhas |
| `POST` | `/campanhas/aderir` | ✅ `comerciante` | Comerciante candidata um negócio a uma campanha |
| `GET` | `/campanhas/comerciante-disponiveis` | ✅ `comerciante` | Campanhas disponíveis para o CAE do comerciante |
| `GET` | `/candidaturasCampanha` | ✅ `camara` | Listar candidaturas pendentes a campanhas |
| `POST` | `/decidirAdesaoCampanha` | ✅ `camara` | Aprovar ou rejeitar adesão a campanha |

### Candidaturas de Comerciante

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/pedidoComerciante` | ✅ `cidadao` | Submeter candidatura com documento PDF |
| `GET` | `/obter/PedidosComerciante` | ✅ `camara` | Listar todas as candidaturas |
| `POST` | `/aprovar/PedidoComerciante/:id` | ✅ `camara` | Aprovar → upgrade de role para comerciante |
| `DELETE` | `/apagarPedidoComerciante/:id` | ✅ `camara` | Rejeitar candidatura + eliminar PDF (RGPD) |

### Imagens & Dashboard

| Método | Endpoint | Auth | Descrição |
|:------:|:---------|:----:|:----------|
| `POST` | `/uploadImage` | ❌ | Upload de imagem → Sharp (WebP 800px, 80%) |
| `GET` | `/mostrarImagem/:id` | ❌ | Obter imagem por ID |
| `GET` | `/dashboard` | ✅ `camara` | Estatísticas agregadas (categorias, cidades, países) |

> [!NOTE]
> O cabeçalho de autenticação utiliza o formato `Authorization: Bearer <token_jwt>`. As rotas de autenticação (`/registar`, `/iniciarSessao`, `/verificar-codigo`) estão sujeitas a rate limiting mais restrito (5 req/min).

---

## 🛡️ Permissões por Role

A aplicação define três roles com acesso diferenciado:

| Funcionalidade | Cidadao | Comerciante | Câmara |
|:---------------|:-------:|:-----------:|:------:|
| Explorar mapa de negócios | ✅ | ✅ | ✅ |
| Pesquisar e filtrar negócios | ✅ | ✅ | ✅ |
| Guardar favoritos | ✅ | ✅ | ✅ |
| Editar perfil e avatar | ✅ | ✅ | ✅ |
| Escanear faturas (pontos) | ✅ | ✅ | ✅ |
| Consultar campanhas | ✅ | ✅ | ✅ |
| Registar negócio | ❌ | ✅ | ✅ |
| Ver os seus negócios | ❌ | ✅ | ❌ |
| Adere a campanhas | ❌ | ✅ | ❌ |
| Criar campanhas | ❌ | ❌ | ✅ |
| Aprovar/rejeitar negócios | ❌ | ❌ | ✅ |
| Aprovar/rejeitar comerciantes | ❌ | ❌ | ✅ |
| Aprovar/rejeitar adesões a campanhas | ❌ | ❌ | ✅ |
| Dashboard + exportação | ❌ | ❌ | ✅ |
| Candidatar-se a comerciante | ✅ | ❌ | ❌ |

### Categorias de Negócio

Os negócios em Tomar organizam-se nas seguintes categorias, cada uma com um ícone dedicado no mapa:

| Categoria | Ícone no Mapa | Descrição |
|:---------|:---:|:----------|
| 🏛️ Património & Museus | Banco | Monumentos, conventos, museus e sítios históricos |
| 🍽️ Restauração | Talheres | Restaurantes e casas de refeições |
| ☕ Cafés & Pastelarias | Café | Cafés, pastelarias e padarias |
| 🏨 Alojamento | Cama | Hotéis, pensões e turismo rural |
| 🛍️ Comércio Local | Saco | Lojas e comércio tradicional |
| 🌿 Lazer & Natureza | Árvore | Atividades ao ar livre e espaços verdes |
| 🔧 Serviços | Pasta | Serviços profissionais e pessoais |

---

## 🔄 Fluxos da Plataforma

### 📱 Leitura de Faturas e Pontos

O motor de gamificação da plataforma permite aos cidadãos acumularem pontos ao escanear QR Codes de faturas fiscais portuguesas:

```
┌──────────────┐                        ┌──────────────┐
│    CIDADÃO   │                        │   BACKEND    │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │  1. Escaneia QR Code da fatura        │
       │     (câmara do telemóvel)             │
       │                                       │
       │  2. Fotografa o recibo fisicamente    │
       │                                       │
       │  3. Submete dados para /lerFatura     │
       │  ───────────────────────────────────► │
       │                                       │  4. Parser dos campos AT (A–S)
       │                                       │     Validação OCR (Azure)
       │                                       │     Verificação matemática do NIF
       │                                       │     Verificação ATCUD
       │                                       │     Prevenção de duplicados
       │                                       │     Limite diário: 20 faturas
       │                                       │
       │  5. Pontos atribuídos (1 ponto/€)     │
       │  ◄─────────────────────────────────── │
       │                                       │
       ▼                                       ▼
```

**Detalhes técnicos:**
- O QR Code fiscal português contém os campos A–S conforme especificação da Autoridade Tributária
- A validação OCR é feita com **Azure Document Intelligence** para confirmar a autenticidade do documento
- O índice único composto `{ATCUD, hash}` no modelo Invoice impede o scan duplicado da mesma fatura
- Apenas documentos do tipo FT (Fatura), FS (Fatura Simplificada) e FR (Fatura Recibo) são aceites
- O NIF é validado matematicamente (algoritmo de checksum português)

### 🏅 Sistema de Campanhas

A Câmara Municipal cria campanhas temáticas com packs de prémios para incentivar a participação cívica:

```
┌──────────────┐     ┌──────────────┐       ┌──────────────┐
│    CÂMARA    │     │ COMERCIANTE  │       │    CIDADÃO   │
└──────┬───────┘     └──────┬───────┘       └──────┬───────┘
       │                    │                      │
  1. Cria campanha     ──►  │                      │
 (logo, CAES, packs)        │                      │
       │                    │                      │
       │              2. Vê campanhas disponíveis  │
       │                 (filtradas por CAE)       │
       │                     │                     │
       │              3. Seleciona negócio         │
       │                 e candidata-se            │
       │                    │                      │
       │                    │                      │
  4. Aprova/rejeita         │                      │
     a adesão               │                      │
       │              ◄─────│                      │
       │                    │                      │
       │             5. Negócio aparece            │
       │                na campanha ativa          │
       │                    │                      │
       │                    │   6. Vê campanhas    │
       │                    │      e prémios       │
       │                    │    ◄─────────────────│
       │                    │                      │
       │                    │    7. Resgata packs  │
       │                    │       com pontos     │
       │                    │    ─────────────────►│
       ▼                    ▼                      ▼
```

**Estados de uma campanha:**
- **Agendada** — `DataInicio` no futuro
- **Ativa** — entre `DataInicio` e `DataExpiracao`
- **Expirada** — após `DataExpiracao`

### 📋 Candidatura a Comerciante

Os cidadãos que pretendam tornar-se comerciantes na plataforma podem candidatar-se:

1. O **Cidadao** preenche o formulário e anexa um documento PDF comprovativo
2. O PDF é enviado para o servidor e armazenado
3. A **Câmara** visualiza o PDF na app e aprova ou rejeita
4. Se aprovado, o role do utilizador é atualizado de `cidadao` para `comerciante`
5. O PDF é eliminado do servidor (conformidade RGPD)

---

## 🎨 Sistema de Temas

O Tomar Digital apresenta um sistema de temas inspirado na identidade cultural de Tomar, com **3 paletas** × **3 modos** = 9 combinações:

| Paleta | Inspiração | Cor Primária (Claro) | Cor Primária (Escuro) |
|:-------|:-----------|:--------------------:|:---------------------:|
| **Convento** | Convento de Cristo (Ouro Templário) | `#914c00` | `#ffb77f` |
| **Mata** | Mata dos Sete Montes (Natureza) | `#476500` | `#a1d494` |
| **Tabuleiros** | Festa dos Tabuleiros (Vermelho Festival) | `#8f000d` | `#ffb4ac` |

**Modos disponíveis:** Claro · Escuro · Automático (segue o sistema)

Todos os temas seguem a especificação **Material Design 3** (MD3) com 50+ tokens de cor, `roundness: 8` e elevação tonal (sem sombras pesadas). As cores são acedidas exclusivamente via `useAppTheme()` — não existem cores hardcoded nos ecrãs.

---

## 🌍 Internacionalização (i18n)

A aplicação suporta **Português** e **Inglês** com deteção automática do idioma do sistema:

- O idioma é detetado automaticamente via `expo-localization` (PT se o sistema estiver em PT, EN caso contrário)
- O utilizador pode alternar manualmente nas Preferências ou no botão de idioma nos ecrãs de autenticação
- A seleção é persistida em `AsyncStore`
- Todas as chaves de tradução utilizam `defaultValue` como fallback

---

## 🚀 CI/CD e Deploy

### Backend — Azure Web Apps

O deploy do backend é feito automaticamente via **GitHub Actions** quando há push para a branch `develop`:

- **Workflow:** `.github/workflows/develop_tomar-rg.yml`
- **Plataforma:** Azure Web Apps (West Europe)
- **URL de produção:** `https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net`
- **Autenticação:** Azure OIDC com segredos no GitHub

### Frontend — EAS Build

O build do APK Android é feito via **Expo Application Services (EAS)**:

- **Workflow:** `.github/workflows/eas-build.yml`
- **Trigger:** Push para `main` ou `develop`
- **Perfil:** `preview` (gera APK, não AAB)
- **Node:** 20.x

---

## 🛠️ Resolução de Problemas (Firewall e Rede)

Se o telemóvel não conseguir estabelecer ligação (ecrã a carregar sem resposta), a **Firewall do PC pode estar a bloquear as portas comunicacionais.**

> [!WARNING]
> - O telemóvel **NÃO** deve usar Dados Móveis (4G/5G), apenas Wi-Fi doméstico. A exceção é se fizer *hotspot* a partir do telemóvel para o PC.
> - Ambos os dispositivos têm de estar na **mesma rede**.

Para abrir as portas **`3000/tcp`** (Backend) e **`8081/tcp`** (Frontend Expo), escolha o seu Sistema Operativo:

### 🐧 Ubuntu / Pop!\_OS / Debian (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8081/tcp
sudo ufw reload
```

**Para reverter:**
```bash
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 8081/tcp
sudo ufw reload
```

### 🐧 Fedora / Arch Linux / RHEL / Nobara (Firewalld)

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

**Para reverter:**
```bash
sudo firewall-cmd --remove-port=3000/tcp --permanent
sudo firewall-cmd --remove-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

### 🪟 Windows (PowerShell)

1. Abra o **PowerShell como Administrador** (Botão Direito no Iniciar → Windows PowerShell (Admin)).
2. Execute:

```powershell
New-NetFirewallRule -DisplayName "Expo Mobile" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NodeJS Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Para reverter:**
```powershell
Remove-NetFirewallRule -DisplayName "Expo Mobile"
Remove-NetFirewallRule -DisplayName "NodeJS Backend"
```

**(Alternativa com Interface Gráfica):**
1. Abra **"Windows Defender Firewall com Segurança Avançada"**.
2. Clique em **"Regras de Entrada"** → **"Nova Regra..."**.
3. Selecione **Porta** → **TCP** → portas: `3000, 8081`.
4. Deixe "Permitir a ligação" marcado e identifique a regra (ex: "Exceções Tomar Digital").

### 🍏 macOS

1. Aceda a **Definições do Sistema** > **Rede** > **Firewall**.
2. Desbloqueie as opções (ícone de cadeado — requer palavra-passe ou TouchID).
3. Nas **Opções do Firewall**, verifique se `node` ou `expo` estão listados como bloqueados.
4. Clique em **"+"** para autorizar ligações de entrada.
5. Confirme as alterações.

**Para reverter:** Selecione a aplicação na lista e clique em **"-"** para remover as permissões.
