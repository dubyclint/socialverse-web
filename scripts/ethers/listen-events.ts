import { ethers } from 'ethers'
import abi from './abi.json'

const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com')
const contract = new ethers.Contract('0xYourContractAddress', abi, provider)

contract.on('ValueChanged', (newValue, event) => {
  console.log('New value:', newValue)
  console.log('Event:', event)
})
