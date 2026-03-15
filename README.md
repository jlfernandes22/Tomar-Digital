# 📍 Tomar Digital

O **Tomar Digital** é uma plataforma focada na digitalização de serviços, composta por um ecossistema robusto de **Backend (Node.js + MongoDB)** e **Frontend Mobile (React Native + Expo)**.

---

## 📑 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração do Ambiente](#-configuração-do-ambiente)
   - [Linux](#linux-fedora--ubuntu--arch-linux)
   - [Windows](#windows)
3. [Instalação](#-instalação)
   - [BackEnd](#backend-api--base-de-dados)
   - [FrontEnd](#frontend-mobile-expo)
4. [Execução](#-execução)
5. [Estrutura do Projeto](#-estrutura-do-projeto)
6. [Resolução de Problemas](#-resolução-de-problemas-firewall-e-rede)

---

## 📋 Pré-requisitos

Antes de começar, garanta que tem instalado:

- **Node.js** (v18 ou superior)
- **Docker & Docker Compose**
- **Git**
- **Expo Go** (instalado no telemóvel)

**Download Expo Go:**
- 🤖 [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
- 🍏 [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

---

## 🛠 Configuração do Ambiente

### Linux (Fedora / Ubuntu / Arch Linux)

**1. Instalar dependências**

| Distribuição | Comando |
| :--- | :--- |
| **Fedora / Nobara** | `sudo dnf install docker docker-compose nodejs npm` |
| **Ubuntu / Mint**   | `sudo apt install docker.io docker-compose nodejs npm` |
| **Arch Linux**      | `sudo pacman -S docker docker-compose nodejs npm` |

**2. Configurar permissões do Docker**

Para executar o Docker sem `sudo`:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> ⚠️ **Nota:** É necessário reiniciar a sessão (logout e login) para aplicar as novas permissões.

### Windows

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop).
2. Instale o [Node.js](https://nodejs.org/) (versão LTS).
3. Certifique-se de que o **WSL2** está ativado nas definições do Docker Desktop.

---

## 🚀 Instalação

### Backend (API & Base de Dados)

1. **Instalar dependências**

   ```bash
   cd Tomar-Digital/Backend
   npm install
   ```

2. **Subir o contentor da base de dados**

   ```bash
   docker compose up -d
   ```

3. **Configurar variáveis de ambiente**  
   Crie um ficheiro `.env` na raiz da pasta `/backend` com o seguinte conteúdo:

   ```env
   PORT=3000
   JWT_SECRET=Uma_Chave_Super_Segura_2026_@!
   ```

### FrontEnd (Mobile Expo)

1. **Instalar dependências**

   ```bash
   cd ../FrontEnd
   npm install
   ```

2. **Configurar variáveis de ambiente**  
   Crie um ficheiro `.env` na raiz da pasta `/FrontEnd`:

   ```env
   # Substitua pelo IP local do seu PC (exemplo: 192.168.1.120)
   EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3000"
   ```

   > **Nota:** No Expo, variáveis de ambiente para o FrontEnd devem começar com `EXPO_PUBLIC_`.

**Como descobrir o seu IP local:**

- **Linux:** Execute `hostname -I` no terminal.
- **Windows:** Execute `ipconfig` no PowerShell e procure por **IPv4 Address**.

---

## ⚡ Execução

Mantenha dois terminais abertos.

**Terminal 1 — BackEnd**

```bash
cd BackEnd
npm run dev
```

**Terminal 2 — FrontEnd**

```bash
cd FrontEnd
npx expo start -c
```

### 📱 Como testar no telemóvel

1. Certifique-se de que o **PC** e o **telemóvel** estão na mesma rede Wi-Fi.
2. Abra o aplicativo **Expo Go**.
3. Leia o **QR Code** exibido no terminal do FrontEnd.

---

## 📂 Estrutura do Projeto

### Backend

```
backend/
 ├─ middleware/
 │   └─ auth.js                 # Autorização e verificação de tokens JWT
 ├─ models/                     # Schemas do MongoDB (Mongoose)
 │   ├─ Business.js
 │   ├─ Favorite.js
 │   ├─ Transaction.js
 │   └─ User.js
 ├─ docker-compose.yml          # Configuração do contentor MongoDB
 ├─ index.js                    # Ponto de entrada da API
 ├─ package-lock.json
 └─ package.json
```

### FrontEnd

```
FrontEnd/
 ├─ app/                        # Rotas e ecrãs (Expo Router)
 │   ├─ (accountCreation)/
 │   ├─ (tabs)/
 │   ├─ components/
 │   ├─ _layout.tsx
 │   ├─ globals.css
 │   └─ index.tsx
 ├─ assets/                     # Imagens e recursos estáticos
 │   └─ tabsImages/
 ├─ constants/                  
 │   ├─ api.ts                  # Configuração de endpoints
 │   └─ images.ts               # Exportação de caminhos de imagens
 ├─ context/                    
 │   └─ AuthContext.tsx         # Gestão de estado global de autenticação
 ├─ services/                   
 │   └─ tokenService.ts         # Serviço de gestão do JWT
 └─ ...                         # Ficheiros de configuração (app.json, tailwind, etc.)
```

---

## 🛠 Resolução de Problemas (Firewall e Rede)

Se o telemóvel não conseguir ligar ao servidor ou ficar preso no carregamento:

### Firewall no Linux (Nobara / Fedora)

Abra as portas necessárias no `firewalld`:

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

### Verificar a Rede

- O telemóvel **não** deve estar a usar dados móveis (4G/5G), a menos que esteja a fazer hotspot diretamente para o PC.
- O telemóvel e o PC **devem** estar ligados à **mesma rede Wi-Fi**.

---

## ✅ Conclusão

  - Se todos os passos foram seguidos corretamente, a aplicação abrirá no **Expo Go** e comunicará sem problemas com o backend **Node.js + MongoDB**.
