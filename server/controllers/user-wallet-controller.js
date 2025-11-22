const UserWallet = require('../models/UserWallet')

exports.getWallet = async (req, res) => {
  const { userId } = req.query
  const wallet = await UserWallet.findOne({ userId })
  res.status(200).json(wallet)
}

