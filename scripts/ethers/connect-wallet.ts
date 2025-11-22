import { ethers } from 'ethers'

const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com')
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

console.log('Wallet address:', wallet.address)
