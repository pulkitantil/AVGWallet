# AGILAVETRI Wallet

A modern multi-chain non-custodial crypto wallet built using Next.js, TypeScript, ethers.js, Ankr RPC and Alchemy.

---

## 🚀 Features

### ✅ Multi-Chain Support

Currently supported chains:

* Ethereum
* BNB Smart Chain
* Polygon
* Base
* Solana
* Bitcoin

---

## ✨ Current Functionalities

### 🔐 Wallet Management

* Create new wallet
* Import wallet using recovery phrase
* Import wallet using private key
* Export recovery phrase
* Export private keys
* Multi-network account generation

### 💸 Transactions

* Send crypto transactions
* Real BNB Mainnet transaction tested
* Gas estimation support
* Network-based transaction handling

### 🪙 Token Support

* Custom token import
* ERC20 metadata fetching
* Token balance fetching
* Multi-network token handling

### 🌐 Blockchain Infrastructure

* Ankr RPC integration for EVM chains
* Alchemy RPC integration for Solana
* Real blockchain interaction using ethers.js

### 🎨 UI / UX

* Modern navy blue Web3 theme
* Glassmorphism-inspired cards
* Responsive mobile-friendly UI
* Smooth animations and transitions

---

## 🛠️ Tech Stack

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* React

### Blockchain

* ethers.js
* Solana Web3.js
* BIP39
* tiny-secp256k1

### RPC Providers

* Ankr
* Alchemy

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_ANKR_API_KEY=your_ankr_api_key
NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY=your_alchemy_api_key
```

---

## 📦 Installation

```bash
npm install
```

---

## ▶️ Run Development Server

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

## 🧠 Architecture Overview

This project is a:

> Multi-chain non-custodial crypto wallet

The wallet does not create its own blockchain.
Instead, it interacts with existing blockchains using RPC providers.

### Current Architecture

* Local wallet storage using browser localStorage
* RPC-based blockchain communication
* Real blockchain transaction support
* Multi-network account generation
* Token metadata fetching through smart contracts

---

## 🔒 Security Notes

### Current State

* Wallet data stored in localStorage
* Recovery phrase export supported
* Private key export supported

### Planned Improvements

* AES encryption for wallet credentials
* Secure vault architecture
* Multi-wallet support
* Password-protected wallet access
* Enhanced key management

---

## 📌 Planned Features

* Multi-wallet support
* WalletConnect integration
* NFT support
* Swap functionality
* Transaction history APIs
* Browser extension version
* Portfolio tracking
* Push notifications
* QR payments
* dApp browser

---

## 🧪 Current Status

### Successfully Tested

✅ Real BNB Mainnet transaction

✅ Blockchain RPC integration

✅ Wallet creation/import

✅ Custom token handling

✅ Transaction signing

✅ Multi-chain balance fetching

---

## 📁 Project Structure

```bash
app/
components/
services/
config/
types/
utils/
public/
```

---

## 👨‍💻 Developer

Built and customized by Pulkit Antil.

---

## ⚠️ Disclaimer

This project is currently intended for learning, experimentation and development purposes.
Do not use it to store large amounts of real crypto funds until production-grade security is implemented.
