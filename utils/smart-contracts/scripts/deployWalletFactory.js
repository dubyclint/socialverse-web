const hre = require("hardhat")

async function main() {
  const WalletFactory = await hre.ethers.getContractFactory("WalletFactory")
  const walletFactory = await WalletFactory.deploy()
  await walletFactory.deployed()

  console.log(`✅ WalletFactory deployed at: ${walletFactory.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
