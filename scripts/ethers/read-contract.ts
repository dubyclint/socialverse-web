import { ethers } from 'ethers'
import abi from './abi.json'

const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com')
const contract = new ethers.Contract('0xYourContractAddress', abi, provider)

async function readData() {
  const value = await (contract as any).getValue()
  console.log('Value:', value)
}

readData()
