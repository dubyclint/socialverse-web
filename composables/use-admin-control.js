import { ethers } from 'ethers'
import AdminControlABI from '@/abis/admin-control.json'

const contractAddress = '0xYourAdminControlAddress'

export function useAdminControl() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, AdminControlABI, signer)

  async function updateFees(low, high, gift) {
    const tx = await contract.updateFees(low, high, gift)
    await tx.wait()
  }

  async function pauseContract() {
    const tx = await contract.pause()
    await tx.wait()
  }

  async function unpauseContract() {
    const tx = await contract.unpause()
    await tx.wait()
  }

  async function withdrawFees() {
    const tx = await contract.withdrawFees()
    await tx.wait()
  }

  return {
    contract,
    updateFees,
    pauseContract,
    unpauseContract,
    withdrawFees
  }
}
