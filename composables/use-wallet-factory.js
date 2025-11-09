import { ethers } from 'ethers'
import WalletFactoryABI from '@/abis/WalletFactory.json'

const contractAddress = '0xYourWalletFactoryAddress'

export function useWalletFactory() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, WalletFactoryABI, signer)

  async function createWallet(userAddress) {
    const tx = await contract.createWallet(userAddress)
    await tx.wait()
  }

  async function getBalance(userAddress, token) {
    const balance = await contract.getBalance(userAddress, token)
    return ethers.utils.formatUnits(balance, 18)
  }

  return { createWallet, getBalance }
}
