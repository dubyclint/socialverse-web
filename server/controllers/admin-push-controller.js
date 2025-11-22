const MatchRequest = require('../models/MatchRequest')
const Post = require('../models/Post')
const Escrow = require('../models/Escrow')
const User = require('../models/User')
const { sendPush } = require('../utils/pushEngine')

// ✅ Match Approved
exports.pushMatchApproved = async (req, res) => {
  const { requestId, matchedUserId } = req.body
  const match = await MatchRequest.findByIdAndUpdate(requestId, {
    matchedUserId,
    approvedByAdmin: true
  })

  const user = await User.findById(match.userId)
  if (user?.deviceToken) {
    await sendPush(user.deviceToken, '✅ Match Approved', 'Your pal request has been approved!')
  }

  res.status(200).json({ message: 'Match approved with push' })
}

// ✅ Post Flagged
exports.pushPostFlagged = async (req, res) => {
  const { postId } = req.body
  const post = await Post.findByIdAndUpdate(postId, { flagged: true })

  const owner = await User.findById(post.userId)
  if (owner?.deviceToken) {
    await sendPush(owner.deviceToken, '⚠️ Post Flagged', 'Your post has been flagged by an admin.')
  }

  res.status(200).json({ message: 'Post flagged with push' })
}

// ✅ Escrow Released
exports.pushEscrowReleased = async (req, res) => {
  const { dealId } = req.body
  const deal = await Escrow.findByIdAndUpdate(dealId, { isReleased: true })

  const seller = await User.findById(deal.sellerId)
  if (seller?.deviceToken) {
    await sendPush(seller.deviceToken, '💰 Escrow Released', 'Your trade funds have been released.')
  }

  res.status(200).json({ message: 'Escrow released with push' })
}

// ✅ Escrow Refunded
exports.pushEscrowRefunded = async (req, res) => {
  const { dealId } = req.body
  const deal = await Escrow.findByIdAndUpdate(dealId, { isRefunded: true })

  const buyer = await User.findById(deal.buyerId)
  if (buyer?.deviceToken) {
    await sendPush(buyer.deviceToken, '↩️ Escrow Refunded', 'Your trade has been refunded.')
  }

  res.status(200).json({ message: 'Escrow refunded with push' })
}
