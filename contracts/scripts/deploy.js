const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('Deploying from:', deployer.address)
  console.log('Balance:', hre.ethers.formatEther(balance), 'POL')

  const Registry = await hre.ethers.getContractFactory('AgroTokenRegistry')
  console.log('Deploying AgroTokenRegistry...')
  const registry = await Registry.deploy(deployer.address)
  await registry.waitForDeployment()

  const address = await registry.getAddress()
  console.log('\n✅ AgroTokenRegistry deployed at:', address)
  console.log('\nAdicionar no Vercel / .env.local:')
  console.log('BLOCKCHAIN_CONTRACT_ADDRESS=' + address)
}

main().catch(err => { console.error(err); process.exit(1) })
