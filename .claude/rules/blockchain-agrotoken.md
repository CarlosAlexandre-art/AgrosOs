---
description: Regras para AgroToken — smart contracts Polygon, Hardhat, deploy
paths:
  - "contracts/**"
  - "src/app/api/tokens/**"
  - "src/app/api/blockchain/**"
  - "src/lib/blockchain*"
  - "src/lib/web3*"
---

# AgroToken — Blockchain Polygon

## Smart Contract
- Contrato: `AgroTokenRegistry.sol` (ERC-1155)
- Localização: `contracts/contracts/AgroTokenRegistry.sol`
- Deploy script: `contracts/scripts/deploy.ts`
- Rede mainnet: Polygon (chainId 137)
- Rede testnet: Amoy (chainId 80002)

## Regras Absolutas
- NUNCA fazer deploy na mainnet sem confirmação explícita
- Sempre testar na testnet Amoy antes da mainnet
- Smart contracts são IMUTÁVEIS após deploy — revisar com cuidado
- `BLOCKCHAIN_DEPLOYER_KEY` — chave privada da carteira, nunca expor

## Variáveis de Ambiente Necessárias
- `ALCHEMY_API_KEY` — acesso à rede Polygon
- `BLOCKCHAIN_DEPLOYER_KEY` — chave privada do deployer (com POL)
- `POLYGONSCAN_API_KEY` — verificação do contrato no explorer
- `BLOCKCHAIN_CONTRACT_ADDRESS` — endereço após deploy (adicionar no Vercel)

## Fase Atual
MVP usa banco de dados (Prisma) para registrar tokens.
Blockchain real (Polygon mainnet) está sendo preparada — aguardando POL via Transak.

## Após Deploy
1. Copiar endereço do contrato
2. Adicionar `BLOCKCHAIN_CONTRACT_ADDRESS` no Vercel
3. Verificar contrato: `npx hardhat verify --network polygon <address> <admin>`
4. Registrar endereço na memória do projeto
