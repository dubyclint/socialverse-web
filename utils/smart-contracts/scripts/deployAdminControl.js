const hre = require("hardhat")

async function main() {
  const AdminControl = await hre.ethers.getContractFactory("AdminControl")
  const adminControl = await AdminControl.deploy()
  await adminControl.deployed()

  console.log(`✅ AdminControl deployed at: ${adminControl.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
