import { ethers } from 'ethers'
import EscrowDealABI from '@/abis/EscrowDeal.json'

const ESCROW_CONTRACT_ADDRESS = '0xYourEscrowDealAddress'

export async function useEscrowContract() {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, EscrowDealABI, signer)

  // ✅ Create a new deal
  async function createDeal(seller: string, amount: bigint) {
    const tx = await contract.createDeal(seller, amount)
    return await tx.wait()
  }

  // ✅ Approve a deal
  async function approveDeal(dealId: bigint) {
    const tx = await contract.approveDeal(dealId)
    return await tx.wait()
  }

  // ✅ Reject a deal
  async function rejectDeal(dealId: bigint) {
    const tx = await contract.rejectDeal(dealId)
    return await tx.wait()
  }

  // ✅ Refund a deal
  async function refundDeal(dealId: bigint) {
    const tx = await contract.refundDeal(dealId)
    return await tx.wait()
  }

  // ✅ Get pending deals
  async function getPendingDeals() {
    return await contract.getPendingDeals()
  }

  return {
    createDeal,
    approveDeal,
    rejectDeal,
    refundDeal,
    getPendingDeals
  }
}
