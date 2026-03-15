# 📍 Tomar Digital

O **Tomar Digital** é uma plataforma completa com um ecossistema moderno de Backend (Node.js + MongoDB) e Frontend Mobile (React Native + Expo). Este projeto utiliza autenticação via JWT e gestão de bases de dados através de Docker.

---

## 📑 Índice
1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração do Ambiente](#-configuração-do-ambiente)
    - [Linux (Nobara/Fedora/Ubuntu)](#linux-nobara-fedora-ubuntu)
    - [Windows](#windows)
3. [Instalação e Execução](#-instalação-e-execução)
    - [Backend (API & Base de Dados)](#1-backend-api--base-de-dados)
    - [Frontend (Mobile Expo)](#2-frontend-mobile-expo)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)
5. [Resolução de Problemas (Firewall e Rede)](#-resolução-de-problemas-firewall-e-rede)

---

## 📋 Pré-requisitos

Independentemente do sistema operativo, vais precisar de:
* **Node.js** (v18 ou superior)
* **Docker & Docker Compose**
* **Git**
* **Expo Go** (instalado no teu telemóvel Android/iOS)

---

## 🛠 Configuração do Ambiente

### Linux (Nobara/Fedora/Ubuntu/Archlinux)

1. [Instalar o Docker]

# Reinicia a sessão para aplicar

-No terminal, garante que o teu utilizador tem permissões para o Docker:
```bash
sudo usermod -aG docker $USER
# Reinicia a sessão para aplicar