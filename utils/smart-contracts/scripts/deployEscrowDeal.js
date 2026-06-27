const hre = require("hardhat")

async function main() {
  // Replace with actual deployed addresses
  const adminControlAddress = "0xYourAdminControlAddress"
  const tokenAddress = "0xYourERC20TokenAddress" // e.g. USDC

  const EscrowDeal = await hre.ethers.getContractFactory("EscrowDeal")
  const escrowDeal = await EscrowDeal.deploy(adminControlAddress, tokenAddress)
  await escrowDeal.deployed()

  console.log(`✅ EscrowDeal deployed at: ${escrowDeal.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
