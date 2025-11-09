const { ethers } = require("ethers")
const EscrowDealABI = require("../../client/abis/EscrowDeal.json")

// Replace with your deployed contract address
const ESCROW_CONTRACT_ADDRESS = "0xYourEscrowDealAddress"

// Connect to provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, EscrowDealABI, signer)

// ✅ Create a new escrow deal
exports.createDeal = async (req, res) => {
  const { seller, amount } = req.body

  try {
    const tx = await escrowContract.createDeal(seller, amount)
    await tx.wait()
    res.status(200).json({ message: "Deal created", txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ✅ Release escrow to seller
exports.releaseDeal = async (req, res) => {
  const { dealId } = req.body

  try {
    const tx = await escrowContract.releaseDeal(dealId)
    await tx.wait()
    res.status(200).json({ message: "Deal released", txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ✅ Refund escrow to buyer
exports.refundDeal = async (req, res) => {
  const { dealId } = req.body

  try {
    const tx = await escrowContract.refundDeal(dealId)
    await tx.wait()
    res.status(200).json({ message: "Deal refunded", txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ✅ Read deal info
exports.getDeal = async (req, res) => {
  const { dealId } = req.query

  try {
    const deal = await escrowContract.getDeal(dealId)
    res.status(200).json({
      buyer: deal[0],
      seller: deal[1],
      amount: deal[2].toString(),
      status: deal[3]
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
