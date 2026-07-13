<div align="center">

# 🏛️ Tomar Digital

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React Native Paper](https://img.shields.io/badge/RN_Paper-MD3-1FB6E5?logo=materialdesign&logoColor=white)
[![Email Support](https://img.shields.io/badge/📧_Suporte-tomardigitalsuporte@gmail.com-blue)](mailto:tomardigitalsuporte@gmail.com)

**Plataforma civic-tech de gamificação do comércio local para o concelho de Tomar**

*Conecta Cidadãos, Comerciantes e a Câmara Municipal num ciclo económico digital*

[🚀 Quick Start](#-quick-start) · [📖 Documentação](#-sobre-o-projeto) · [📡 API](#-referência-da-api) · [📋 Roadmap](#-roadmap--todo)

</div>

---

## 📑 Índice

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [O Ciclo de Gamificação](#-o-ciclo-de-gamificação)
3. [Funcionalidades por Role](#-funcionalidades-por-role)
4. [Stack Tecnológica](#-stack-tecnológica)
5. [Arquitetura do Sistema](#-arquitetura-do-sistema)
6. [Estrutura do Projeto](#-estrutura-do-projeto)
7. [Quick Start](#-quick-start)
8. [Configuração Detalhada](#-configuração-detalhada)
9. [Referência da API](#-referência-da-api)
10. [Fluxos da Plataforma](#-fluxos-da-plataforma)
11. [Sistema de Temas](#-sistema-de-temas)
12. [Internacionalização (i18n)](#-internacionalização-i18n)
13. [Segurança](#-segurança)
14. [CI/CD e Deploy](#-cicd-e-deploy)
15. [Resolução de Problemas](#-resolução-de-problemas)
16. [Roadmap & TODO](#-roadmap--todo)
17. [Como Obter Ajuda](#-como-obter-ajuda)
18. [Licença](#-licença)
19. [Agradecimentos](#-agradecimentos)

---

## 🌟 Sobre o Projeto

O **Tomar Digital** é uma plataforma civic-tech que digitaliza e gamifica o sistema de incentivos ao comércio local do concelho de Tomar. Desenvolvida em colaboração com o IPT (Instituto Politécnico de Tomar) e a Softinsa, a plataforma substitui os fluxos físicos de vouchers por um ambiente digital seguro, criando um ciclo económico local onde:

- **Cidadãos** acumulam pontos ao fotografar faturas de compras em negócios aderentes
- **Comerciantes** registam os seus negócios e aderem a campanhas temáticas da Câmara
- **Câmara Municipal** cria campanhas com prémios, valida vouchers presencialmente e acompanha o impacto económico através de um dashboard analítico

### Porquê Tomar?

Tomar tem uma tradição forte de campanhas de incentivo ao comércio local (ex: "Tomar Natal é no Comércio Local"), mas estas iniciativas assentavam em processos manuais — folhas de Excel, vouchers em papel, validação presencial no Posto de Turismo. O Tomar Digital elimina esta fricção mantendo o espírito comunitário, ao mesmo tempo que introduz uma camada de Business Intelligence crucial para o planeamento estratégico da cidade.

### O que torna esta plataforma única?

| Diferenciador | Descrição |
|---|---|
| 🎯 **Gamificação completa** | Não é apenas um diretório — é um ciclo transacional: fatura → pontos → pacote → voucher → levantamento |
| 🔒 **Segurança transacional** | Transações atómicas MongoDB, códigos de levantamento únicos, validação presencial com audit log |
| 📊 **Business Intelligence nativo** | Dashboard com analytics por campanha, exportação para PDF/Excel, KPIs de gamificação em tempo real |
| ♿ **Acessibilidade WCAG 2.1** | Material Design 3 com suporte a leitores de ecrã, contraste ajustável, 3 temas × 2 modos |
| 🏛️ **Identidade cultural** | Paletas inspiradas no Convento de Cristo, Mata dos Sete Montes e Festa dos Tabuleiros |
| 🇵🇹 **Conformidade fiscal portuguesa** | Leitura de QR Codes AT (Autoridade Tributária), validação de ATCUD e NIF |

---

## 🔄 O Ciclo de Gamificação

O coração da plataforma é um ciclo económico fechado que cria valor para todos os intervenientes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE GAMIFICAÇÃO                         │
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐│
│  │ CIDADÃO  │     │ COMÉRCIO │     │  PONTOS  │     │ CAMPANHA ││
│  │  compra  │───▶│  local   │───▶│ (1€=1pt) │───▶│   PACK   ││
│  │ no local │     │ aderente │     │          │     │  (prémio)││
│  └──────────┘     └──────────┘     └──────────┘     └───┬──────┘│
│                                                         │       │
│                 ┌──────────┐     ┌──────────┐      ┌────▼─────┐ │
│                 │ VOUCHER  │     │ CÓDIGO   │      │  PONTOS  │ │
│                 │ entregue │◀───│ TD-YYYY  │ ◀───│  GASTOS  │ │
│                 │ na Câmara│     │ XXXXXXXX │      │          │ │
│                 └──────────┘     └──────────┘      └──────────┘ │
│                        │                                        │
│                        ▼                                        │
│                   ┌──────────┐                                  │
│                   │ DASHBOARD│  ← Câmara acompanha impacto      │
│                   │  (BI)    │     económico em tempo real      │
│                   └──────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Como funciona, passo a passo:

1. **📷 Scan da fatura** — O cidadão fotografa o QR Code da fatura num negócio aderente. O Azure Document Intelligence extrai os campos fiscais (ATCUD, NIF, valor, data).
2. **🏆 Atribuição de pontos** — O backend valida o NIF, previne duplicados (índice único `{ATCUD, hash}`), e atribui pontos (1 ponto por euro, `Math.trunc(amount)`).
3. **🎯 Campanha ativa** — A Câmara cria campanhas temáticas com pacotes de prémios (ex: "Voucher 10€ no Comércio", "Jantar para 2"). Cada pacote tem stock, custo em pontos e limite por utilizador.
4. **🛒 Compra do pacote** — O cidadão gasta pontos para comprar um pacote. A operação é **atómica** (transação MongoDB): decrementa stock, deduz pontos, gera um `pickupCode` único.
5. **📋 Carteira de vouchers** — O cidadão vê os seus vouchers na app, com estado (ativo/entregue/expirado) e o código de levantamento.
6. **✅ Levantamento presencial** — O cidadão desloca-se à Câmara, apresenta o código. Um funcionário valida-o na app (transição atómica `ativo → entregue`), e o prémio é entregue.
7. **📊 Dashboard** — A Câmara acompanha tudo em tempo real: dinheiro gasto por campanha, negócios aderentes, pacotes vendidos, vouchers entregues/ativos/expirados, pontos em circulação.

---

## ✨ Funcionalidades por Role

### 👤 Cidadão (Cidadao)

| Funcionalidade | Descrição |
|---|---|
| 🗺️ Mapa interativo | Explorar negócios com marcadores por categoria, clustering e filtro por proximidade (250m) |
| 📷 Scan de faturas | Fotografar QR Code AT → OCR Azure → validar NIF → ganhar pontos (1pt/€) |
| ⭐ Favoritos | Guardar e gerir negócios favoritos com atualizações otimistas |
| 🎯 Campanhas | Consultar campanhas ativas e comprar pacotes com pontos |
| 📋 Carteira de vouchers | Histórico de compras com filtros (ativo/entregue/expirado) e código de levantamento |
| 👤 Perfil | Editar perfil com upload de avatar, gerir NIF |
| 🔐 Recuperar password | Fluxo completo via email (código de 6 dígitos, válido 15 min) |
| 🗑️ Apagar conta | Eliminar conta com confirmação por password (cascade delete transacional) |
| 📝 Candidatar a comerciante | Submeter candidatura com documento PDF |

### 🏪 Comerciante (Comerciante)

| Funcionalidade | Descrição |
|---|---|
| 🏪 Registar negócio | Logo, galeria (até 10 fotos), CAE, localização no mapa, morada (manual ou via mapa) |
| 📋 Meus negócios | Acompanhar negócios aprovados |
| 🎯 Hub de campanhas | Duas funcionalidades: "Ver Campanhas" (comprar packs) e "Aderir a Campanhas" (gerir participação) |
| 📊 Estado de participação | Badges: Participando / Pendente / Rejeitado / Não participando |
| 🛒 Comprar pacotes | O comerciante também pode comprar pacotes com os seus pontos |

### 🏛️ Câmara Municipal (Camara)

| Funcionalidade | Descrição |
|---|---|
| ✅ Aprovar negócios | Validar ou rejeitar registos pendentes |
| 👔 Aprovar comerciantes | Validar candidaturas com visualização de PDF (RGPD: PDF eliminado após aprovação) |
| 🏅 Gerir campanhas | Criar, editar e apagar campanhas (com proteção se houver compras) |
| ✏️ Editar packs | Adicionar stock, corrigir descrição (preço bloqueado após compras) |
| 📋 Aprovar adesões | Aprovar/rejeitar participação de negócios em campanhas |
| 📱 Validar vouchers | Validação presencial de códigos de levantamento (transição atómica) |
| 📈 Dashboard analítico | Gráficos + analytics por campanha + KPIs de gamificação |
| 📄 Exportação | PDF e Excel (6 folhas: Resumo, Categorias, Cidades PT, Resto do Mundo, Campanhas, Pacotes) |

### 🔧 Funcionalidades Transversais

- 🔐 **JWT** com expiração de 1 dia + verificação de email + recuperação de password
- 🛡️ **Rate limiting**: 100 req/15min global, 5 req/min em autenticação e ações sensíveis
- 📖 **Swagger UI** com 46 endpoints documentados em `/api-docs`
- 🎨 **3 temas** (Convento/Mata/Tabuleiros) × 2 modos (Claro/Escuro) + Automático
- 🌍 **i18n PT/EN** com 718 chaves de tradução em cada idioma
- ♿ **Acessibilidade** com labels e hints em todos os elementos interativos
- 🔄 **Pull-to-refresh** em todos os ecrãs de lista
- 🖼️ **Pipeline de imagens**: Multer → Sharp (WebP + resize) → Filesystem

---

## 🧱 Stack Tecnológica

### Backend

| Tecnologia | Versão | Propósito |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20+ | Runtime JavaScript |
| [Express](https://expressjs.com/) | 5.2 | Framework HTTP (ESM) |
| [MongoDB](https://www.mongodb.com/) | 7.0 | Base de dados NoSQL (replica set para transações) |
| [Mongoose](https://mongoosejs.com/) | 9.6 | ODM com schemas tipados |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | Autenticação stateless JWT |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 6.0 | Hashing de passwords |
| [multer](https://github.com/expressjs/multer) | 2.1 | Upload de ficheiros (multipart/form-data) |
| [sharp](https://sharp.pixelplumbing.com/) | 0.34 | Processamento de imagens (WebP, resize) |
| [nodemailer](https://nodemailer.com/) | 8.0 | Envio de emails (Gmail SMTP) |
| [@azure/ai-form-recognizer](https://www.npmjs.com/package/@azure/ai-form-recognizer) | 5.1 | OCR de faturas portuguesas (QR Code AT) |
| [express-rate-limit](https://github.com/nfriedly/express-rate-limit) | 8.5 | Proteção contra brute-force e DDoS |
| [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) + [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) | 6.2 / 5.0 | Documentação interativa da API |
| [Docker Compose](https://docs.docker.com/compose/) | 3.8 | Contentorização do MongoDB |

### Frontend

| Tecnologia | Versão | Propósito |
|---|---|---|
| [React Native](https://reactnative.dev/) | 0.81.5 | Framework mobile multiplataforma |
| [Expo SDK](https://expo.dev/) | 54 | Plataforma e toolchain |
| [Expo Router](https://docs.expo.dev/router/introduction/) | 6.0 | Navegação baseada em ficheiros |
| [React Native Paper](https://reactnativepaper.com/) | 5.15 | Componentes Material Design 3 |
| [NativeWind](https://www.nativewindcss.com/) | 4.2 | Tailwind CSS para React Native |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Tipagem estática |
| [react-native-maps](https://github.com/react-native-maps/react-native-maps) | 1.20 | Mapa interativo (Google Maps) |
| [react-native-clusterer](https://github.com/MaciejWiatr/react-native-clusterer) | 5.0 | Clustering de marcadores no mapa |
| [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) | 26.3 / 17.0 | Internacionalização |
| [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) | 15.0 | Armazenamento seguro de JWT |
| [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) | 17.0 | Scan de QR Codes |
| [xlsx](https://www.npmjs.com/package/xlsx) | 0.18 | Exportação para Excel |

### Decisões técnicas e racional

| Decisão | Porquê? |
|---|---|
| **MongoDB + replica set** (mesmo local) | Suporta transações multi-documento (necessário para `/apagarConta` cascade delete e `/packs/comprar` stock decrement). Um single-node replica set não tem downside em desenvolvimento e espelha a configuração de produção (Azure/Atlas). |
| **Express 5** em vez de Express 4 | Suporte nativo para `async/await` sem try-catch wrappers, melhor gestão de erros, ESM nativo. |
| **Azure Document Intelligence** em vez de Tesseract.js | Tesseract não conseguia identificar corretamente os campos das faturas portuguesas. O Azure DI tem maior precisão em documentos estruturados e suporta o formato QR Code AT nativamente. |
| **Expo dev client** em vez de Expo Go | A app usa `react-native-nitro-modules`, `react-native-maps`, e `react-native-clusterer` — módulos nativos incompatíveis com Expo Go. O `expo-dev-client` está nas dependências e permite um dev build personalizado. |
| **React Native Paper (MD3)** | Acessibilidade out-of-the-box (crítico para uma app civic que serve toda a população), suporte a leitores de ecrã, contraste dinâmico. |
| **3 paletas de temas culturais** | Cria ligação emocional com a cidade — Convento de Cristo (castanho/ouro), Mata dos Sete Montes (verde), Festa dos Tabuleiros (vermelho). |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Mobile)                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Expo Router │  │ AuthContext │  │   ThemeContext      │  │
│  │ (tabs/stack)│  │ (JWT store) │  │ (3 paletas × 2 mod) │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
│         │                 │                                 │
│  ┌──────▼─────────────────▼──────────────────────────────┐  │
│  │  useApiFetch() (centralized fetch)                    │  │
│  │  • Auto-adds Authorization: Bearer <token>            │  │
│  │  • Auto-logout on 401 (expired token)                 │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS (JSON / multipart)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVIDOR (Azure Web Apps)              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Express 5 (ESM)                   │   │
│  │        ┌──────────┐  ┌────────────────────┐          │   │
│  │        │ Rate     │  │   authorize(RBAC)  │          │   │
│  │        │ Limiter  │  │   JWT verification │          │   │
│  │        └──────────┘  └─────────┬──────────┘          │   │
│  │                                │                     │   │
│  │  ┌─────────────────────────────▼──────────────────┐  │   │
│  │  │              46 REST Endpoints                 │  │   │
│  │  │  Auth • Users • Businesses • Favorites         │  │   │
│  │  │  Invoices • Campaigns • Packs • Dashboard      │  │   │
│  │  └─────────────────────┬──────────────────────────┘  │   │
│  └────────────────────────┼─────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────┐  ┌────▼────┐  ┌────────────────────┐    │
│  │  Azure Doc     │  │ Multer  │  │  Nodemailer        │    │
│  │  Intelligence  │  │ + Sharp │  │  (Gmail SMTP)      │    │
│  │  (OCR faturas) │  │ (WebP)  │  │ (verificação email)│    │
│  └────────────────┘  └─────────┘  └────────────────────┘    │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DADOS (MongoDB 7.0 Replica Set)        │
│                                                             │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  User  │ │ Business │ │ Campaign │ │    Redemption    │  │
│  │        │ │          │ │ (packs)  │ │ (voucher wallet) │  │
│  └────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Invoice │ │ Favorite │ │PedidosCo.│ │  10 modelos total│  │
│  └────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura do Projeto

### Backend

```text
BackEnd/
├── middleware/
│   └── auth.js                    # Verificação JWT + autorização por roles
├── models/                        # Schemas Mongoose (10 modelos)
│   ├── User.js                    # Utilizadores (email, role, Points, NIF, Avatar)
│   ├── Business.js                # Negócios (CAE, logo, galeria, campanhas, status)
│   ├── Campaign.js                # Campanhas (packs embutidos, CAES, estados)
│   ├── Redemption.js              # Compras de pacotes (voucher com pickupCode)
│   ├── Invoice.js                 # Faturas (ATCUD + hash, índice único)
│   ├── Favorite.js                # Favoritos dos utilizadores
│   ├── PedidosComerciante.js      # Candidaturas de comerciante (PDF)
│   ├── Cae.js                     # Códigos CAE (classificação de atividades)
│   ├── CitiesAndCountries.js      # Validação de cidades no registo
│   └── Packs.js                   # Sub-schema de prémios (pointsCost, stock)
├── utils/
│   └── emailService.js            # Emails HTML com imagem embutida (CID)
├── EmailImages/                   # Imagens usadas nos emails
├── csvFiles/                      # CAES e cidades para o seed.js
├── docker-compose.yml             # MongoDB 7.0 replica set (porta 27017)
├── seed.js                        # Seeder para dados de demonstração
├── index.js                       # Ponto de entrada — 46 rotas + Swagger (3986 linhas)
├── package.json                   # Dependências (ESM)
└── .env                           # Variáveis de ambiente (criado pelo utilizador)
```

### Frontend

```text
FrontEnd/
├── app/                           # Rotas e ecrãs (Expo Router)
│   ├── (accountCreation)/         # Fluxo de autenticação
│   │   ├── Login.tsx              # Login
│   │   ├── Register.tsx           # Registo
│   │   ├── Validate.tsx           # Verificação de email (6 dígitos)
│   │   ├── RecoverPassword.tsx    # Pedido de recuperação
│   │   └── NewPassword.tsx        # Definir nova palavra-passe
│   ├── (tabs)/                    # Navegação principal (RBAC por role)
│   │   ├── Home.tsx               # Mapa interativo + carousel de proximidade
│   │   ├── Saved.tsx              # Favoritos
│   │   ├── Profile.tsx            # Perfil (envolvente do ProfileMenu)
│   │   ├── MunicipalIndex.tsx     # Painel da Câmara (camara)
│   │   ├── DashboardTab.tsx       # Dashboard (camara)
│   │   ├── CampaignIndex.tsx      # Hub de campanhas (camara)
│   │   ├── CampaignMerchant.tsx   # Hub de campanhas (comerciante)
│   │   ├── CampaignJoin.tsx       # Campanhas para cidadão
│   │   ├── BusinessMine.tsx       # Meus negócios (comerciante)
│   │   └── BusinessAdd.tsx        # Registar negócio (comerciante)
│   ├── components/                # 22 componentes reutilizáveis
│   │   ├── ScanScreen.tsx         # Scanner QR de faturas
│   │   ├── CampaignDetails.tsx    # Detalhes de campanha (role-aware)
│   │   ├── Dashboard.tsx          # Gráficos + exportação PDF/Excel
│   │   ├── Map.tsx                # Google Maps com clustering
│   │   └── ...                    # (ver lista completa no código)
│   ├── _layout.tsx                # Root: AuthProvider → ThemeProvider → Stack
│   └── index.tsx                  # Gate de rota (verifica sessão + expiração JWT)
├── context/
│   ├── AuthContext.tsx            # Sessão (expo-secure-store, chave 'user_data')
│   ├── ThemeContext.tsx           # Tema (AsyncStorage, 3 paletas × 2 modos)
│   └── LoadingContext.tsx         # Estado global de loading (QrCodeFAB)
├── constants/
│   ├── themes.js                  # 6 temas MD3 (3 paletas × claro/escuro)
│   ├── DarkMapStyle.tsx           # Estilo escuro + claro do Google Maps
│   ├── api.ts                     # API_URL = EXPO_PUBLIC_API_URL
│   └── images.ts                  # Mapa de assets
├── utils/
│   ├── apiFetch.ts                # Hook fetch centralizado (auto-logout em 401)
│   ├── jwt.ts                     # Decodificação JWT + verificação de expiração
│   ├── textValidation.ts          # Validação de NIF e outros campos
│   └── excelUtils.ts              # Gerador de relatórios Excel (6 folhas)
├── locales/
│   ├── pt.json                    # 718 chaves de tradução (Português)
│   └── en.json                    # 718 chaves de tradução (Inglês)
├── app.config.js                  # Configuração Expo
├── eas.json                       # Perfis EAS (dev, preview APK, produção)
├── tsconfig.json                  # TypeScript strict + path alias @/*
└── package.json
```

---

## 🚀 Quick Start

> **Objetivo:** ir de clone a app a correr em **menos de 15 minutos**.

### Pré-requisitos

| Ferramenta | Versão | Instalação |
|---|---|---|
| Node.js | v20 LTS | `nvm install 20 && nvm use 20` |
| Docker + Docker Compose | Latest | [docs.docker.com](https://docs.docker.com/get-docker/) |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Passos rápidos

```bash
# 1. Clonar o repositório
git clone https://github.com/jlfernandes22/Tomar-Digital.git
cd Tomar-Digital

# 2. Iniciar MongoDB (replica set para transações)
cd BackEnd
docker compose up -d
# Aguardar ~10s pelo healthcheck iniciar o replica set

# 3. Instalar dependências do backend
npm install

# 4. Configurar variáveis de ambiente
cp .env.example .env  # ← ver secção de Configuração Detalhada para preencher
# Editar .env com: JWT_SECRET, GOOGLE_APP_PASSWORD, AZURE_KEY, AZURE_ENDPOINT

# 5. Popular a base de dados com dados de demonstração
npm run seed
# Contas demo: admin@tomar.pt, cidadao@tomar.pt, comerciante@tomar.pt,
#              turista@tomar.pt, camara@tomar.pt (password: 123456)

# 6. Iniciar o backend (Terminal 1)
npm run dev
# Servidor em http://localhost:8080, Swagger em /api-docs

# 7. Instalar e configurar o frontend (Terminal 2)
cd ../FrontEnd
npm install

# 8. Configurar o .env do frontend
cp .env.example .env
# Editar .env com: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

# 9. Compilar o dev client (obrigatório — a app usa Nitro Modules)
eas login
eas build --profile development --platform android
# Instalar o APK resultante no telemóvel

# 10. Iniciar o Metro bundler
npx expo start -c
# Ler o QR Code com a app dev build (NÃO Expo Go)
```

> ⚠️ **Importante:** A app **não funciona com Expo Go** porque usa `react-native-nitro-modules`, `react-native-maps` e `react-native-clusterer`. É obrigatório compilar um development build via EAS.

---

## ⚙️ Configuração Detalhada

### Backend `.env`

```bash
# Porta do servidor (fallback: 8080)
PORT=8080

# Ligação MongoDB (fallback: mongodb://localhost:27017/tomar_db)
MONGO_URI=mongodb://localhost:27017/tomar_db

# Chave secreta JWT (use uma string aleatória forte em produção, ≥32 caracteres)
JWT_SECRET=Uma_Chave_Super_Segura_2026_@!

# Email (Gmail SMTP via Nodemailer)
GOOGLE_APP_PASSWORD=sua_app_password_gmail
# O remetente está hardcoded: tomardigitalsuporte@gmail.com

# Azure Document Intelligence (validação OCR de faturas)
AZURE_ENDPOINT=https://seu-recurso.cognitiveservices.azure.com/
AZURE_KEY=sua_chave_azure
```

### Frontend `.env`

```bash
# IP local do PC (ex: 192.168.1.120)
EXPO_PUBLIC_API_URL=http://192.168.1.120:8080

# Chave da API do Google Maps (obrigatória para o mapa)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_google_maps
```

### Como obter as credenciais

<details>
<summary>🔑 Google Maps API Key</summary>

1. Aceder a [Google Cloud Console](https://console.cloud.google.com/)
2. Criar um novo projeto (ou selecionar um existente)
3. Ativar a **Maps SDK for Android** e **Maps SDK for iOS**
4. Ir a **Credentials** → **Create Credentials** → **API Key**
5. Restringir a chave ao pacote Android: `com.jlfernandes.TomarDigital`
6. Copiar a chave para `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

</details>

<details>
<summary>🤖 Azure Document Intelligence</summary>

1. Aceder ao [Azure Portal](https://portal.azure.com/)
2. Criar um recurso **Document Intelligence** (ou Form Recognizer)
3. Selecionar o tier **F0** (free, 500 páginas/mês) ou **S0** (pay-as-you-go)
4. Copiar **Endpoint** e **Key 1** para `AZURE_ENDPOINT` e `AZURE_KEY`

</details>

<details>
<summary>📧 Gmail App Password</summary>

1. Aceder a [Google Account Security](https://myaccount.google.com/security)
2. Ativar **Verificação de 2 passos** (obrigatório)
3. Ir a **App Passwords** → gerar uma password para "Mail"
4. Copiar a password de 16 caracteres para `GOOGLE_APP_PASSWORD`

</details>

---

## 📡 Referência da API

> Documentação interativa (Swagger UI) disponível em **`/api-docs`** quando o servidor está a correr. **46 endpoints** no total.

### Autenticação

A autenticação é feita via JWT (Bearer token). O token expira em **1 dia**. Inclua o header `Authorization: Bearer <token>` em todos os pedidos autenticados.

```bash
# Exemplo de login
curl -X POST http://localhost:8080/iniciarSessao \
  -H "Content-Type: application/json" \
  -d '{"email": "cidadao@tomar.pt", "password": "123456"}'

# Resposta: { "token": "...", "userId": "...", "user": { ... } }
```

### Endpoints por categoria

| Categoria | Endpoints | Auth |
|---|---|---|
| **Autenticação & Conta** | `/registar`, `/verificar-codigo`, `/iniciarSessao`, `/recuperarPassword`, `/alterarPassword`, `/apagarConta` | Públicos + Strict rate limit |
| **Utilizadores** | `/utilizadores`, `/utilizador/:id`, `/editarUser/:id`, `/aceitarTermosFatura` | ✅ Camara / Todos |
| **Negócios** | `/registarNegocio`, `/negocios`, `/negocios/:id`, `/meusNegocios`, `/negociosCae`, `/business/*` | Mix |
| **Favoritos** | `/guardarFavorito`, `/retirarFavorito`, `/meusFavoritos/:userId` | ✅ Todos |
| **Faturas & Gamificação** | `/lerFatura`, `/faturas`, `/faturas/:id` | ✅ Todos |
| **Campanhas** | `/criarCampanha`, `/listaCampanhas`, `/campanhas/:id`, `/editarCampanha/:id`, `/apagarCampanha/:id`, `/campanhas/aderir`, `/candidaturasCampanha`, `/decidirAdesaoCampanha` | Mix |
| **Packs & Vouchers** | `/packs/comprar`, `/packs/minhas-compras`, `/packs/:id`, `/packs/validar`, `/packs/campanha/:id/negocios`, `/campanhas/:cid/packs/:pid` | Mix |
| **Dashboard** | `/dashboard` | ✅ Camara |
| **Comerciantes** | `/pedidoComerciante`, `/obter/PedidosComerciante`, `/aprovar/PedidoComerciante/:id`, `/apagarPedidoComerciante/:id` | Mix |

### Tabela completa de endpoints

<details>
<summary>📋 Ver todos os 46 endpoints</summary>

#### Autenticação & Conta

| Método | Endpoint | Auth | Rate Limit | Descrição |
|:---:|:---|:---:|:---:|:---|
| `POST` | `/registar` | ❌ | Strict | Registar + envio de código de verificação por email |
| `POST` | `/verificar-codigo` | ❌ | Strict | Verificar código de 6 dígitos |
| `POST` | `/iniciarSessao` | ❌ | Strict | Login → JWT (1 dia) + dados do utilizador |
| `POST` | `/recuperarPassword` | ❌ | Strict | Pedir código de recuperação (15 min, anti-enumeration) |
| `POST` | `/alterarPassword` | ❌ | Strict | Redefinir palavra-passe com código de recuperação |
| `DELETE` | `/apagarConta` | ✅ Todos | Strict | Apagar conta (verifica password, cascade delete transacional) |

#### Utilizadores

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `GET` | `/utilizadores` | ✅ `camara` | Listar todos os utilizadores (exclui passwords e códigos) |
| `GET` | `/utilizador/:id` | ✅ `camara` | Proprietários de negócios pendentes |
| `POST` | `/editarUser/:id` | ✅ Todos | Editar perfil (nome, cidade, NIF, avatar via multipart) |
| `POST` | `/aceitarTermosFatura` | ✅ Todos | Aceitar/revogar termos de processamento de faturas |

#### Negócios

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `POST` | `/registarNegocio` | ✅ `comerciante`, `camara` | Registar negócio (logo + galeria até 10, CAE, localização) |
| `GET` | `/negocios` | ❌ | Listar negócios aprovados |
| `GET` | `/negocios/:id` | ❌ | Obter negócio por ID (com campanhas) |
| `GET` | `/meusNegocios` | ✅ `comerciante` | Negócios do comerciante autenticado |
| `GET` | `/negociosCae` | ✅ `comerciante` | Negócios por código CAE |
| `GET` | `/business/pendentes` | ✅ `camara` | Listar negócios pendentes |
| `POST` | `/business/aprovar/:id` | ✅ `camara` | Aprovar negócio pendente |
| `DELETE` | `/business/rejeitar/:id` | ✅ `camara` | Rejeitar negócio pendente |
| `DELETE` | `/apagarNegocio/:id` | ✅ `camara` | Eliminar negócio + ficheiros do servidor |

#### Favoritos

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `POST` | `/guardarFavorito` | ✅ Todos | Adicionar aos favoritos (userId do JWT) |
| `POST` | `/retirarFavorito` | ✅ Todos | Remover dos favoritos (userId do JWT) |
| `GET` | `/meusFavoritos/:userId` | ✅ Todos | Listar favoritos (próprios ou camara para auditoria) |

#### Faturas & Gamificação

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `POST` | `/lerFatura` | ✅ Todos | Ler QR Code de fatura AT → OCR Azure → validar NIF → atribuir pontos (1 pt/€) |
| `GET` | `/faturas` | ✅ Todos | Listar histórico de faturas do utilizador (paginado) |
| `GET` | `/faturas/:id` | ✅ Todos | Obter fatura por ID (própria ou camara para auditoria) |

#### Campanhas

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `POST` | `/criarCampanha` | ✅ `camara` | Criar campanha (logo, panfleto, packs, CAES, datas) |
| `GET` | `/listaCampanhas` | ❌ | Listar todas as campanhas |
| `GET` | `/campanhas/:id` | ❌ | Obter campanha por ID com packs |
| `PUT` | `/editarCampanha/:id` | ✅ `camara` | Editar campanha (título, descrição, normas, data de expiração) |
| `DELETE` | `/apagarCampanha/:id` | ✅ `camara` | Apagar campanha (bloqueado se houver compras) |
| `GET` | `/campanhas/comerciante-disponiveis` | ✅ `comerciante` | Campanhas disponíveis para o CAE do comerciante |
| `GET` | `/campanhas/comerciante-com-status` | ✅ `comerciante` | Campanhas com estado de participação |
| `POST` | `/campanhas/aderir` | ✅ `comerciante` | Comerciante candidata um negócio a uma campanha |
| `GET` | `/candidaturasCampanha` | ✅ `camara` | Candidaturas pendentes a campanhas |
| `POST` | `/decidirAdesaoCampanha` | ✅ `camara` | Aprovar/rejeitar adesão a campanha |

#### Packs & Vouchers

| Método | Endpoint | Auth | Rate Limit | Descrição |
|:---:|:---|:---:|:---:|:---|
| `POST` | `/packs/comprar` | ✅ Todos | Strict | Comprar pacote com pontos (transação atómica, gera pickupCode) |
| `GET` | `/packs/minhas-compras` | ✅ Todos | Global | Listar compras do utilizador (com filtro `?status=`) |
| `GET` | `/packs/:id` | ✅ Todos | Global | Obter compra por ID (própria ou camara para auditoria) |
| `POST` | `/packs/validar` | ✅ `camara` | Strict | Validar pickupCode e marcar como entregue (atómico) |
| `GET` | `/packs/campanha/:id/negocios` | ❌ | Global | Listar negócios participantes numa campanha |
| `PATCH` | `/campanhas/:cid/packs/:pid` | ✅ `camara` | — | Editar pack (adicionar stock, corrigir descrição; preço bloqueado após compras) |

#### Candidaturas de Comerciante

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `POST` | `/pedidoComerciante` | ✅ `cidadao` | Submeter candidatura com PDF |
| `GET` | `/obter/PedidosComerciante` | ✅ `camara` | Listar candidaturas |
| `POST` | `/aprovar/PedidoComerciante/:id` | ✅ `camara` | Aprovar → upgrade de role + eliminar PDF (RGPD) |
| `DELETE` | `/apagarPedidoComerciante/:id` | ✅ `camara` | Rejeitar candidatura + eliminar PDF |

#### Dashboard

| Método | Endpoint | Auth | Descrição |
|:---:|:---|:---:|:---|
| `GET` | `/dashboard` | ✅ `camara` | Estatísticas agregadas + analytics por campanha + KPIs de gamificação |

</details>

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

A aplicação oferece **3 paletas de cores** inspiradas na identidade cultural de Tomar, cada uma combinável com **3 modos** (Claro, Escuro, Automático):

| Paleta | Inspiração | Cor Primária | Uso |
|---|---|---|---|
| 🏛️ **Convento** | Convento de Cristo | Castanho/Ouro Templário | Tema padrão — solidez e tradição |
| 🌳 **Mata** | Mata dos Sete Montes | Verde musgo | Frescura e sustentabilidade |
| 🎉 **Tabuleiros** | Festa dos Tabuleiros | Vermelho festival | Alegria e celebração |

Cada paleta define um conjunto completo de cores MD3 (Material Design 3) que se adaptam automaticamente ao modo claro/escuro, incluindo cores específicas para:
- `primary` / `onPrimary` — botões e elementos de destaque
- `secondaryContainer` / `onSecondaryContainer` — cartões e superfícies secundárias
- `surface` / `onSurface` — fundos e texto
- `error` / `errorContainer` — estados de erro
- `outline` / `outlineVariant` — bordas e divisores

O tema do mapa (`react-native-maps`) também reage à paleta e ao modo, com estilos personalizados para modo claro e escuro.

---

## 🌍 Internacionalização (i18n)

A aplicação suporta **Português (pt)** e **Inglês (en)** com deteção automática do idioma do sistema. As traduções estão em `FrontEnd/locales/`:

- `pt.json` — 718 chaves
- `en.json` — 718 chaves

### Como adicionar um novo idioma

1. Copiar `pt.json` para `{codigo}.json` (ex: `es.json`)
2. Traduzir todas as 718 chaves
3. Adicionar o idioma em `FrontEnd/i18n.ts`
4. Adicionar a opção no componente `LanguageSwitcher`

O sistema usa `i18next` + `react-i18next` com a função `t('chave.subchave')` para traduzir texto em qualquer componente.

---

## 🔒 Segurança

### Camadas de Proteção

| Camada | Implementação |
|---|---|
| **Autenticação** | JWT com expiração de 1 dia, verificação de email obrigatória |
| **Autorização (RBAC)** | Middleware `authorize(roles)` em 36 dos 46 endpoints |
| **Rate Limiting** | Global: 500 req/15min/IP · Strict: 100 req/min em login, registo, compra de packs, validação de vouchers |
| **Password Hashing** | `bcrypt` com salt factor 10 |
| **File Upload** | Multer (limite 20MB) → Sharp (resize + WebP) → validação de tipo |
| **Input Validation** | NIF (checksum), ATCUD (formato), email (normalização lowercase+trim) |
| **RGPD** | PDFs de candidatura eliminados após aprovação · Audit logs com hash SHA-256 de PII |
| **CORS** | Configurado para bloquear domínios não autorizados |
| **Environment Variables** | `dotenv` isola credenciais do código-fonte |
| **Token Storage** | `expo-secure-store` (iOS Keychain / Android EncryptedSharedPreferences) |

### Auto-Logout em Token Expirado

O frontend implementa verificação de expiração do JWT em três níveis:

1. **`app/index.tsx`** — ao lançar a app, verifica se o token guardado expirou antes de navegar para Home
2. **`context/AuthContext.tsx`** — ao restaurar a sessão, verifica a expiração e limpa sessões expiradas
3. **`utils/apiFetch.ts`** — em cada chamada à API, se o backend retornar 401, chama `logout()` automaticamente

Isto garante que um utilizador com token expirado é sempre redirecionado para o login, em vez de ficar preso a ver mensagens de erro.

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

### Perfis EAS (`eas.json`)

| Perfil | Distribuição | Uso |
|---|---|---|
| `development` | Internal | Dev build com `expo-dev-client` (substitui Expo Go) |
| `preview` | Internal | APK para testadores |
| `production` | Store | AAB para Play Store |

---

## 🐛 Resolução de Problemas

### O MongoDB não inicia

```bash
# Verificar se o contentor está a correr
docker ps | grep tomar_mongo

# Ver logs do MongoDB
docker logs tomar_mongo

# Reiniciar o contentor
docker compose down
docker compose up -d

# Verificar o estado do replica set
docker exec -it tomar_mongo mongosh --eval "rs.status()"
```

### Erro "Token inválido ou expirado"

O JWT expira após 1 dia. Se estiver a testar localmente:
1. Fazer login novamente (`POST /iniciarSessao`)
2. Ou alterar temporariamente `expiresIn: "1d"` para `expiresIn: "7d"` no backend

O frontend faz auto-logout quando deteta 401, pelo que o utilizador é redirecionado para o login automaticamente.

### O mapa não aparece

1. Verificar que `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada no `.env` do frontend
2. Verificar que a API Key tem as APIs **Maps SDK for Android** e **Maps SDK for iOS** ativadas no Google Cloud Console
3. Verificar que a API Key está restrita ao pacote correto: `com.jlfernandes.TomarDigital`

### O OCR não funciona (Azure)

1. Verificar que `AZURE_ENDPOINT` e `AZURE_KEY` estão corretos no `.env` do backend
2. Verificar que o recurso Azure Document Intelligence está ativo no Azure Portal
3. Verificar o tier (F0 = 500 páginas/mês grátis; S0 = pay-as-you-go)
4. Verificar os logs do backend para erros de autenticação Azure

### Erro "ECONNREFUSED" no frontend

1. Verificar que o backend está a correr (`npm run dev` no BackEnd)
2. Verificar que `EXPO_PUBLIC_API_URL` tem o IP correto do PC (não `localhost`)
3. Verificar que o telemóvel e o PC estão na **mesma rede Wi-Fi**
4. Verificar a firewall do PC — permitir ligações na porta 8080

### Expo Go não funciona

A app **não é compatível com Expo Go** porque usa módulos nativos (`react-native-nitro-modules`, `react-native-maps`, `react-native-clusterer`). É obrigatório compilar um development build:

```bash
cd FrontEnd
eas build --profile development --platform android
# Instalar o APK resultante no telemóvel
```

### Emails não chegam (Nodemailer)

1. Verificar que `GOOGLE_APP_PASSWORD` está correto (não é a password normal do Gmail)
2. Verificar que a verificação de 2 passos está ativa na conta Google
3. Verificar a pasta de spam do destinatário
4. Verificar os logs do backend para erros de SMTP

---

## 📋 Roadmap & TODO

### Alta Prioridade

- [ ] **Separar `index.js` em controllers** — O ficheiro tem 3900+ linhas com 46 rotas. Extrair para `controllers/` e `routes/`.
- [ ] **Ecrã de histórico de faturas** — O endpoint `GET /faturas` existe mas não há ecrã no frontend.
- [ ] **Notificações push** — Campanhas novas, negócio aprovado/rejeitado, voucher prestes a expirar.
- [ ] **Testes automatizados** — Jest + Supertest para backend; Jest + React Native Testing Library para frontend.

### Média Prioridade

- [ ] **Cancelar voucher** (`POST /packs/cancelar/:id`) — Devolver pontos ao cancelar voucher ativo.
- [ ] **Arquivar campanha** (soft delete) — Estado `arquivada` em vez de apagar.
- [ ] **Dashboard de redemptions** — Analytics de compras de pacotes: packs populares, taxa de levantamento.
- [ ] **Paginação nos negócios** — `/negocios` retorna todos; adicionar `?page=` e `?limit=`.
- [ ] **Horários de funcionamento** — Campo `horarios` no modelo `Business`.
- [ ] **Fotos em ecrã completo** — Galeria do `BusinessDetails` em fullscreen.

### Baixa Prioridade / Tech Debt

- [ ] **Migrar POST-as-update para PUT/PATCH** — Endpoints como `/editarUser/:id` usam POST.
- [ ] **Padronizar nomes de rotas** — Misto de Português (`/negocios`) e Inglês (`/business/aprovar`).
- [ ] **Substituir `console.log`** por logger estruturado (`pino` ou `winston`).
- [ ] **Rate limiting por utilizador** — Atual é por IP; adicionar rate limiting por JWT.
- [ ] **Refresh tokens** — JWT atual expira em 1 dia sem renovação.

---

## 🆘 Como Obter Ajuda

Precisas de ajuda com o Tomar Digital? Estamos aqui para ajudar!

### 📧 Contacto

**Email de suporte:** [tomardigitalsuporte@gmail.com](mailto:tomardigitalsuporte@gmail.com)

### Que tipos de questões podes enviar?

| Tipo | Exemplos |
|---|---|
| 🐛 **Bugs** | Erros na app, comportamentos inesperados, crashes |
| 📱 **Onboarding** | Dificuldades em configurar o ambiente, problemas com Docker/EAS |
| ✨ **Feature requests** | Sugestões de novas funcionalidades ou melhorias |
| 📖 **Documentação** | Erros ou lacunas na documentação |
| 🔐 **Segurança** | Reportar vulnerabilidades (por favor, não abras issue público) |

### Notas importantes

> ⚠️ Este é um **projeto académico/cívico** e o suporte é prestado numa base de **best-effort** (melhor esforço). Não há SLA garantido nem equipa de suporte 24/7.
>
> Antes de enviar um email, por favor:
> 1. Verifica a secção [🐛 Resolução de Problemas](#-resolução-de-problemas) — a tua questão pode já estar respondida
> 2. Verifica os [issues abertos](https://github.com/jlfernandes22/Tomar-Digital/issues) — alguém pode já ter reportado o mesmo problema
> 3. Inclui o máximo de contexto possível: versão da app, dispositivo, passos para reproduzir, screenshots

### Reportar bugs de forma eficaz

Para nos ajudar a resolver bugs mais rapidamente, inclui no email:

```
Dispositivo: [ex: Samsung Galaxy S22, Android 14]
Versão da app: [ex: 1.0.0]
Conta utilizada: [ex: cidadao@tomar.pt — não envies a password!]
Passos para reproduzir:
1. ...
2. ...
3. ...
Comportamento esperado: ...
Comportamento atual: ...
Screenshots: [anexa se aplicável]
```

---

## 📄 Licença

Este projeto não tem atualmente uma licença definida. Para uso académico, contactar os desenvolvedores.

---

## 🙏 Agradecimentos

- **IPT — Instituto Politécnico de Tomar** (ESTT — Escola Superior de Tecnologia de Tomar)
- **Softinsa**
- **Professor Luís Oliveira** (Orientador)
- **Câmara Municipal de Tomar** — Pelas informações sobre a campanha "Tomar Natal é no Comércio Local"
- **Comunidade open-source** — React Native, Expo, MongoDB, Express, e todas as bibliotecas usadas

---

<div align="center">

**Desenvolvedores:** Ângela Sebastião · José Fernandes

**Repositório:** [github.com/jlfernandes22/Tomar-Digital](https://github.com/jlfernandes22/Tomar-Digital)

**Produção:** [tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net](https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net)

</div>
