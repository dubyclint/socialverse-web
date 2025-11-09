const Escrow = require('../models/Escrow')
const User = require('../models/User')
const { sendPush } = require('../utils/pushEngine')

exports.releaseDealWithPush = async (req, res) => {
  const { dealId } = req.body
  const deal = await Escrow.findByIdAndUpdate(dealId, { isReleased: true })

  const seller = await User.findById(deal.sellerId)
  if (seller?.deviceToken) {
    await sendPush(seller.deviceToken, '💰 Escrow Released', 'Your trade funds have been released.')
  }

  res.status(200).json({ message: 'Escrow released with push' })
}

exports.refundDealWithPush = async (req, res) => {
  const { dealId } = req.body
  const deal = await Escrow.findByIdAndUpdate(dealId, { isRefunded: true })

  const buyer = await User.findById(deal.buyerId)
  if (buyer?.deviceToken) {
    await sendPush(buyer.deviceToken, '↩️ Escrow Refunded', 'Your trade has been refunded.')
  }

  res.status(200).json({ message: 'Escrow refunded with push' })
}


