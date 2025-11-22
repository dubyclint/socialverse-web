const PewGift = require('../models/PewGift')
const User = require('../models/User')
const { sendPush } = require('../utils/pushEngine')

exports.sendGiftWithPush = async (req, res) => {
  const { senderId, recipientId, postId, commentId, amount } = req.body

  let split = { toCommenter: 0, toPostOwner: amount }
  if (commentId) {
    split.toCommenter = amount * 0.7
    split.toPostOwner = amount * 0.3
  }

  const gift = new PewGift({ senderId, recipientId, postId, commentId, amount, split })
  await gift.save()

  const recipient = await User.findById(recipientId)
  if (recipient?.deviceToken) {
    await sendPush(recipient.deviceToken, '🎁 You received a gift!', `Someone sent you ${amount} USDC`)
  }

  res.status(201).json({ message: 'Gift sent with push', split })
}

