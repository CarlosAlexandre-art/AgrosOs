$env:ALCHEMY_API_KEY="IZYR33JGmVZjNupSp44FD"
$env:BLOCKCHAIN_DEPLOYER_KEY="0x7b7b30fc6b1870911660be5f74725ca2a18d3aeaa2d554511b4317acaa7ba547"
Set-Location "c:\Users\marco\OneDrive\Documentos\agroos\contracts"
npx hardhat run scripts/deploy.ts --network polygon
