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
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()

    await db.user.update({
      where: { id: user.id },
      data: { verificationToken }
    })

    // Send verification email
    await sendVerificationEmail(email, verificationToken)

    return { success: true, message: 'Verification email sent' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resend verification email'
    })
  }
})
