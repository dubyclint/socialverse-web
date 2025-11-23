// composables/use-admin-control.ts
import { ethers } from 'ethers'
import type { Contract, ContractTransactionResponse } from 'ethers'
import AdminControlABI from '@/abis/admin-control.json'

interface AdminControlFees {
  low: number
  high: number
  gift: number
}

interface AdminControlReturn {
  contract: Contract
  updateFees: (low: number, high: number, gift: number) => Promise<void>
  pauseContract: () => Promise<void>
  unpauseContract: () => Promise<void>
  withdrawFees: () => Promise<void>
}

const contractAddress = '0xYourAdminControlAddress'

export function useAdminControl(): AdminControlReturn {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, AdminControlABI, signer)

  async function updateFees(low: number, high: number, gift: number): Promise<void> {
    const tx = await contract.updateFees(low, high, gift) as ContractTransactionResponse
    await tx.wait()
  }

  async function pauseContract(): Promise<void> {
    const tx = await contract.pause() as ContractTransactionResponse
    await tx.wait()
  }

  async function unpauseContract(): Promise<void> {
    const tx = await contract.unpause() as ContractTransactionResponse
    await tx.wait()
  }

  async function withdrawFees(): Promise<void> {
    const tx = await contract.withdrawFees() as ContractTransactionResponse
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
