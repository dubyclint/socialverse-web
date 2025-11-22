import { ethers } from 'ethers'
import abi from './abi.json'

const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com')
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
const contract = new ethers.Contract('0xYourContractAddress', abi, wallet)

async function writeData() {
  const tx = await contract.setValue(42)
  await tx.wait()
  console.log('Transaction confirmed:', tx.hash)
}

writeData()
