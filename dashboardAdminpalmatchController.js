exports.approveMatch = async (req, res) => {
  const { requestId, matchedUserId } = req.body
  const match = await MatchRequest.findByIdAndUpdate(requestId, {
    matchedUserId,
    approvedByAdmin: true
  })

  const user = await User.findById(match.userId)
  if (user?.deviceToken) {
    await sendPush(user.deviceToken, '✅ Match Approved', 'Your pal request has been approved!')
  }

  res.status(200).json({ message: 'Match approved' })
}
