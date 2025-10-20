import { ethers } from 'ethers'
import AdminControlABI from '@/abis/AdminControl.json'

const contractAddress = '0xYourAdminControlAddress'

export function useAdminControl() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, AdminControlABI, signer)

  async function updateFees(low, high, gift) {
    const tx = await contract.updateFees(low, high, gift)
    await tx.wait()
  }

  async function getFees() {
    const [swapLow, swapHigh, giftFee] = await contract.getFees()
    return { swapLow, swapHigh, giftFee }
  }

  return { updateFees, getFees }
}
