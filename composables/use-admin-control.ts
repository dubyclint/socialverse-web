// composables/use-admin-control.ts
import { ethers } from 'ethers'
import type { Contract, ContractTransactionResponse } from 'ethers'
import AdminControlABI from '@/abis/admin-control.json'

interface AdminControlFees {
  swapLow: number
  swapHigh: number
  giftFee: number
}

interface AdminControlReturn {
  contract: Contract | null
  getFees: () => Promise<AdminControlFees>
  updateFees: (low: number, high: number, gift: number) => Promise<void>
  pauseContract: () => Promise<void>
  unpauseContract: () => Promise<void>
  withdrawFees: () => Promise<void>
}

const contractAddress = '0xYourAdminControlAddress'

export function useAdminControl(): AdminControlReturn {
  const provider = new ethers.BrowserProvider(window.ethereum)
  let contract: Contract | null = null

  async function getContract(): Promise<Contract> {
    if (contract) return contract
    const signer = await provider.getSigner()
    contract = new ethers.Contract(contractAddress, AdminControlABI, signer)
    return contract
  }

  async function getFees(): Promise<AdminControlFees> {
    const c = await getContract()
    const fees = await (c as any).getFees() as [number, number, number]
    return {
      swapLow: Number(fees[0]),
      swapHigh: Number(fees[1]),
      giftFee: Number(fees[2])
    }
  }

  async function updateFees(low: number, high: number, gift: number): Promise<void> {
    const c = await getContract()
    const tx = await (c as any).updateFees(low, high, gift) as ContractTransactionResponse
    await tx.wait!()
  }

  async function pauseContract(): Promise<void> {
    const c = await getContract()
    const tx = await (c as any).pause() as ContractTransactionResponse
    await tx.wait!()
  }

  async function unpauseContract(): Promise<void> {
    const c = await getContract()
    const tx = await (c as any).unpause() as ContractTransactionResponse
    await tx.wait!()
  }

  async function withdrawFees(): Promise<void> {
    const c = await getContract()
    const tx = await (c as any).withdrawFees() as ContractTransactionResponse
    await tx.wait!()
  }

  return {
    contract: null,
    getFees,
    updateFees,
    pauseContract,
    unpauseContract,
    withdrawFees
  }
}
