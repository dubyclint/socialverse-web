export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  try {
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If email exists, reset link sent' }
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send email with reset link
    await sendResetEmail(email, resetToken)

    return { success: true, message: 'Reset link sent to email' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process request'
    })
  }
})
