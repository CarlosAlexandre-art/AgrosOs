import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying from:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MATIC')

  const Registry = await ethers.getContractFactory('AgroTokenRegistry')

  // O admin (deployer) recebe todos os roles inicialmente.
  // Após deploy, transferir DEFAULT_ADMIN_ROLE para a Gnosis Safe multisig.
  const registry = await Registry.deploy(deployer.address)
  await registry.waitForDeployment()

  const address = await registry.getAddress()
  console.log('\n✅ AgroTokenRegistry deployed at:', address)
  console.log('\nAdicionar no Vercel / .env.local:')
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS=${address}`)
  console.log('\nVerificar no PolygonScan:')
  console.log(`npx hardhat verify --network polygon ${address} ${deployer.address}`)
}

main().catch(err => { console.error(err); process.exit(1) })
