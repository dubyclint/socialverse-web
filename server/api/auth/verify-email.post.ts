export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification token is required'
    })
  }

  try {
    const user = await db.user.findFirst({
      where: { verificationToken: token }
    })

    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification token'
      })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    })

    return { success: true, message: 'Email verified successfully' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify email'
    })
  }
})
