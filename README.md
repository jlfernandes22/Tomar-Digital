<div align="center">

# 📍 Tomar Digital

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-success)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

**Uma plataforma focada na digitalização de serviços.**
<br>
*Composta por um ecossistema robusto de Backend (Node.js + MongoDB) e Frontend Mobile (React Native + Expo).*

</div>

---

## 📑 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração do Ambiente](#-configuração-do-ambiente)
   - [Instalação do Node.js (Recomendado: NVM)](#instalação-do-nodejs-recomendado-nvm)
   - [Instalação do Docker](#docker--docker-compose)
3. [Instalação do Projeto](#-instalação-do-projeto)
   - [Backend (API & Base de Dados)](#backend-api--base-de-dados)
   - [Frontend (Mobile Expo)](#frontend-mobile-expo)
4. [Execução](#-execução)
5. [Estrutura do Projeto](#-estrutura-do-projeto)
6. [Resolução de Problemas (Firewall e Rede)](#-resolução-de-problemas-firewall-e-rede)

---

## 📋 Pré-requisitos

Antes de começar, garanta que tem instalado:

* **Node.js** (v20 LTS recomendada)
* **Docker & Docker Compose**
* **Git**
* **Expo Go** (instalado no telemóvel)

**Download Expo Go:**
* 🤖 [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
* 🍏 [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

---

## 🛠 Configuração do Ambiente

### Instalação do Node.js (Recomendado: NVM)

> [!WARNING]
> A instalação direta do Node.js e *npm* através de gestores de pacotes do sistema (como `apt`, `dnf` ou `pacman`) costuma causar **erros de permissões** (exigindo `sudo` indevidamente) e graves **conflitos de versão** com o Expo. Por favor, utilize um gestor de versões.

A melhor prática na indústria para gerir o Node.js é utilizar o **NVM (Node Version Manager)**. Isto permite instalar pacotes globais sem usar `sudo` e facilita a alternância entre versões do Node.

#### Linux e macOS

1. Instale o NVM executando o script oficial no terminal:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

2. Feche e reabra o seu terminal, ou carregue as novas configurações executando:
```bash
source ~/.bashrc  # ou source ~/.zshrc se usar Zsh
```

3. Instale a versão 20 (LTS) do Node.js e ative-a:
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

Para as distribuições Linux, instale apenas o ecossistema Docker. Use os comandos consoante o seu sistema:

| Distribuição | Comando |
| :--- | :--- |
| **Fedora / Nobara** | `sudo dnf install docker docker-compose` |
| **Ubuntu / Mint / Pop!_OS** | `sudo apt install docker.io docker-compose` |
| **Arch Linux** | `sudo pacman -S docker docker-compose` |

**Configurar permissões do Docker (Linux)**

Para poder executar o Docker e os contentores sem utilizar sempre o comando `sudo`:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> [!IMPORTANT]
> É estritamente necessário **reiniciar a sessão** (logout e login) ou o computador para aplicar as novas permissões do grupo Docker com sucesso.

#### Windows e macOS

1. Instale o **[Docker Desktop](https://www.docker.com/products/docker-desktop)** acedendo ao site oficial.
2. (Windows) Certifique-se de que o **WSL2** está ativado nas definições do Docker Desktop (geralmente ativado por predefinição).

---

## 🚀 Instalação do Projeto

### Backend (API & Base de Dados)

**1. Instalar as dependências**

```bash
cd Tomar-Digital/Backend
npm install
```

**2. Criar e levantar o contentor da base de dados (MongoDB)**

```bash
docker-compose up -d
```
> [!NOTE]
> Dependendo da versão do docker, o comando poderá ser `docker compose` (sem o hífen).

**3. Configurar variáveis de ambiente**

Crie um novo ficheiro chamado `.env` na raiz da pasta `/Backend` com o seguinte conteúdo:

```env
PORT=3000
JWT_SECRET=Uma_Chave_Super_Segura_2026_@!
```

### Frontend (Mobile Expo)

**1. Instalar as dependências**

```bash
cd ../FrontEnd
npm install
```

**2. Configurar variáveis de ambiente atreladas ao seu IP**

Crie um novo ficheiro chamado `.env` na raiz da pasta `/FrontEnd`:

```env
# Substitua pelo IP local do seu computador (ex: 192.168.1.120)
EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3000"
```

> [!IMPORTANT]
> No Expo, todas as variáveis de ambiente projetadas para o Frontend têm **obrigatoriamente de começar** com o prefixo `EXPO_PUBLIC_`.

#### 🔍 Como descobrir o seu IP local (Duas opções):

**Opção A: Através do Expo (Mais fácil)**
  1. Inicie o Frontend com o comando `npx expo start -c` no terminal.
  2. Observe o texto longo logo abaixo do QR Code gerado.
  3. Verá um endereço semelhante a `exp://192.168.1.120:8081`. Copie apenas a parte do IP (neste exemplo, `192.168.1.120`) e coloque no seu ficheiro `.env`. Depois pode cancelar o processo com `Ctrl + C`.

**Opção B: Pelo Terminal do Sistema**
  * **Linux / macOS:** Execute `hostname -I` (Linux) ou `ifconfig` (macOS) no terminal.
  * **Windows:** Execute `ipconfig` no PowerShell e procure por "Endereço IPv4" na secção do seu adaptador Wi-Fi/Ethernet.

---

## ⚡ Execução

Mantenha **dois terminais distintos e em simultâneo** abertos.

**Terminal 1 — Backend**

```bash
cd BackEnd
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd FrontEnd
npx expo start -c
```

> [!TIP]
> A flag `-c` serve para limpar a *cache* do Expo. É uma excelente prática usá-la sempre que alterar o ficheiro `.env` ou atualizar o `package.json`!

### 📱 Como testar no telemóvel

1. Certifique-se de que o **PC** e o **telemóvel** estão ligados na **mesma rede Wi-Fi**.
2. Abra a aplicação **Expo Go**.
3. Leia o **QR Code** exibido no terminal do Frontend através da app.

---

## 📂 Estrutura do Projeto

### Backend

```text
Backend/
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
 ├─ package.json
 └─ .env                        # Ficheiro criado pelo utilizador
```

### Frontend

```text
FrontEnd/
 ├─ app/                        # Rotas e ecrãs dinâmicas (Expo Router)
 │   ├─ (accountCreation)/
 │   ├─ (tabs)/
 │   ├─ components/
 │   ├─ _layout.tsx
 │   ├─ globals.css
 │   └─ index.tsx
 ├─ assets/                     # Imagens e recursos estáticos
 │   └─ tabsImages/
 ├─ constants/                  
 │   ├─ api.ts                  # Exportação da variável central API_URL
 │   └─ images.ts               # Exportação estática de caminhos de imagens
 ├─ context/                    
 │   └─ AuthContext.tsx         # Gestão do estado global de Autenticação
 ├─ services/                   
 │   └─ tokenService.ts         # Serviço gerador seguro do lado do cliente
 ├─ .env                        # Ficheiro criado pelo utilizador
 └─ ...                         # Ficheiros de configuração globais (app.json etc.)
```

---

## 🛠️ Resolução de Problemas (Firewall e Rede)

Se o telemóvel não conseguir estabelecer ligação (ficar com ecrã a carregar para sempre sem resposta), a **Firewall do seu PC pode estar a bloquear as portas comunicacionais.**

> [!WARNING]
> Tenha em especial atenção que:
> * O telemóvel **NÃO** deve estar a usar Dados Móveis (4G/5G), apenas o seu Wi-Fi doméstico. A exceção é se fizer o *hotspot* a partir do seu telemóvel para o Computador.
> * É estritamente necessário que os dispositivos se encontrem a comunicar dentro da **mesma rede**.

Para abrir as portas críticas, **`3000/tcp` (Backend)** e **`8081/tcp` (Frontend Expo)**, escolha o seu Sistema Operativo:

### 🐧 Ubuntu / Pop!_OS / Debian (UFW)

Para distribuições derivadas do Debian que usam Uncomplicated Firewall (UFW), execute no terminal:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8081/tcp
sudo ufw reload
```

**Para reverter (fechar as portas):**
```bash
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 8081/tcp
sudo ufw reload
```

### 🐧 Fedora / Arch Linux / RHEL / Nobara (Firewalld)

Para sistemas baseados em Firewalld (geralmente instalados por predefinição em Fedora/RHEL), abra as portas de forma permanente:

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

**Para reverter (fechar as portas):**
```bash
sudo firewall-cmd --remove-port=3000/tcp --permanent
sudo firewall-cmd --remove-port=8081/tcp --permanent
sudo firewall-cmd --reload
```

### 🪟 Windows (Defesas e PowerShell)

No Windows, a forma mais rápida de abrir as portas é através de comandos shell. 
1. Clique no Iniciar com o Botão Direito e selecione **Windows PowerShell (Administrador)** ou **Terminal (Administrador)**.
2. Execute individualmente as seguintes linhas:

```powershell
New-NetFirewallRule -DisplayName "Expo Mobile" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NodeJS Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Para reverter (apagar as regras criadas no PowerShell):**
```powershell
Remove-NetFirewallRule -DisplayName "Expo Mobile"
Remove-NetFirewallRule -DisplayName "NodeJS Backend"
```

**(Alternativa com interface Gráfica UI):**
1. Procure e abra na barra do Iniciar o **"Windows Defender Firewall com Segurança Avançada"**.
2. Clique na aba **"Regras de Entrada (Inbound Rules)"** na esquerda e prima **"Nova Regra..."**.
3. Selecione **Porta**, avance, selecione **TCP** e digite em portas locais específicas: `3000, 8081`.
4. Deixe "Permitir a ligação" marcado e identifique a regra ao finalizar (ex: "Exceções Tomar Digital").

> [!TIP]
> **Para reverter via UI:** Procure as regras que criou na lista de "Regras de Entrada", clique com o botão direito e selecione **"Eliminar"** (*Delete*).

### 🍏 macOS

Num Mac, as restrinções de entrada estão contidas no painel de Definições. O Node.js poderá ver o seu acesso revogado lá:

1. Aceda as **Preferências/Definições do Sistema** > **Rede / Segurança e Privacidade** > Aba **Firewall**.
2. Desbloqueie as opções através do pequeno ícone de "Cadeado" ao fundo da janela (será preciso inserir palavra-passe ou TouchID).
3. Dentro do menu de Opções (Firewall Options), verifique se as ligações bloqueadas têm o `node` ou o `expo` listados.
4. Caso sim, poderá autorizá-los manualmente clicando em **"+"** ("Permitir ligações de entrada").
5. Confirme e desfrute da aplicação!

> [!TIP]
> **Para reverter:** Volte a este mesmo menu na aba Firewall, selecione a aplicação `node` ou `expo` na lista e clique no botão **"-"** para remover as permissões previamente atribuídas.

---

## ✅ Conclusão

Chegando a esta fase de encerramento e com tudo cumprido, a sua aplicação reagirá com eficácia no **Expo Go** em paralelo com o seu Back-End flexível (Node.js e Base de Dados por MongoDB).
