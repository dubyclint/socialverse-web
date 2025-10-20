import { ethers } from 'ethers'
import EscrowDealABI from '@/abis/EscrowDeal.json'

const ESCROW_CONTRACT_ADDRESS = '0xYourEscrowDealAddress'

export function useEscrowContract() {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, EscrowDealABI, signer)

  // ✅ Create a new deal
  async function createDeal(seller: string, amount: bigint) {
    const tx = await contract.createDeal(seller, amount)
    await tx.wait()
    return tx.hash
  }

  // ✅ Release deal
  async function releaseDeal(dealId: number) {
    const tx = await contract.releaseDeal(dealId)
    await tx.wait()
    return tx.hash
  }

  // ✅ Refund deal
  async function refundDeal(dealId: number) {
    const tx = await contract.refundDeal(dealId)
    await tx.wait()
    return tx.hash
  }

  // ✅ Get deal info
  async function getDeal(dealId: number) {
    const deal = await contract.getDeal(dealId)
    return {
      buyer: deal[0],
      seller: deal[1],
      amount: deal[2].toString(),
      status: Number(deal[3])
    }
  }

  return {
    createDeal,
    releaseDeal,
    refundDeal,
    getDeal
  }
}
