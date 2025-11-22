const User = require('../models/User')
const Post = require('../models/Post')
const MatchRequest = require('../models/MatchRequest')
const Escrow = require('../models/Escrow')

exports.verifyUser = async (req, res) => {
  const { userId, verified } = req.body
  await User.findByIdAndUpdate(userId, { isVerified: verified })
  res.status(200).json({ message: 'User verification updated' })
}

exports.getUsers = async (req, res) => {
  const users = await User.find()
  res.status(200).json(users)
}

exports.flagPost = async (req, res) => {
  const { postId } = req.body
  await Post.findByIdAndUpdate(postId, { flagged: true })
  res.status(200).json({ message: 'Post flagged' })
}

exports.getPosts = async (req, res) => {
  const posts = await Post.find()
  res.status(200).json(posts)
}

exports.getMatchRequests = async (req, res) => {
  const requests = await MatchRequest.find({ approvedByAdmin: false })
  res.status(200).json(requests)
}

exports.approveMatch = async (req, res) => {
  const { requestId, matchedUserId } = req.body
  await MatchRequest.findByIdAndUpdate(requestId, {
    matchedUserId,
    approvedByAdmin: true
  })
  res.status(200).json({ message: 'Match approved' })
}

exports.getEscrowDeals = async (req, res) => {
  const deals = await Escrow.find({ isReleased: false })
  res.status(200).json(deals)
}
