import EscrowDealABI from '@/abis/escrow-deal.json'

const ESCROW_CONTRACT_ADDRESS = '0xYourEscrowDealAddress'

// Lazy load ethers
let ethers: any = null;

async function getEthers() {
  if (!ethers) {
    const module = await import('ethers');
    ethers = module.ethers;
  }
  return ethers;
}

export async function useEscrowContract() {
  const ethersLib = await getEthers();
  
  const provider = new ethersLib.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethersLib.Contract(ESCROW_CONTRACT_ADDRESS, EscrowDealABI, signer)

  // ✅ Create a new deal
  async function createDeal(seller: string, amount: bigint) {
    const tx = await contract.createDeal(seller, amount)
    await tx.wait()
    return tx
  }

  // ✅ Confirm delivery
  async function confirmDelivery(dealId: bigint) {
    const tx = await contract.confirmDelivery(dealId)
    await tx.wait()
    return tx
  }

  // ✅ Refund deal
  async function refund(dealId: bigint) {
    const tx = await contract.refund(dealId)
    await tx.wait()
    return tx
  }

  // ✅ Get deal details
  async function getDeal(dealId: bigint) {
    return await contract.deals(dealId)
  }

  return {
    createDeal,
    confirmDelivery,
    refund,
    getDeal,
    contract
  }
}

