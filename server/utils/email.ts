// server/utils/email.ts
// Email service wrapper (unified email interface)
// ============================================================================

/**
 * Send verification email
 * TODO: Integrate with actual email service (Brevo, SendGrid, etc.)
 */
export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] Sending verification email to:', email)
    console.log('[Email] Verification token:', token)
    
    // TODO: Replace with actual email service integration
    const verificationLink = `${process.env.NUXT_PUBLIC_API_URL}/auth/verify?token=${token}`
    console.log('[Email] Verification link:', verificationLink)
    
    return {
      success: true,
      message: 'Verification email sent successfully',
      verificationLink
    }
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error)
    return {
      success: false,
      error: 'Email sending failed, but account created. User can resend later.'
    }
  }
}

/**
 * Send password reset email
 * TODO: Integrate with actual email service (Brevo, SendGrid, etc.)
 */
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] Sending password reset email to:', email)
    console.log('[Email] Reset token:', token)
    
    const resetLink = `${process.env.NUXT_PUBLIC_API_URL}/auth/reset-password?token=${token}`
    console.log('[Email] Reset link:', resetLink)
    
    return {
      success: true,
      message: 'Password reset email sent successfully',
      resetLink
    }
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error)
    throw error
  }
}

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  username: string
) => {
  try {
    console.log('[Email] Sending welcome email to:', email)
    
    return {
      success: true,
      message: 'Welcome email sent successfully'
    }
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
    return {
      success: false,
      error: 'Welcome email failed'
    }
  }
}

/**
 * Send notification email
 */
export const sendNotificationEmail = async (
  email: string,
  subject: string,
  content: string
) => {
  try {
    console.log('[Email] Sending notification email to:', email)
    console.log('[Email] Subject:', subject)
    
    return {
      success: true,
      message: 'Notification email sent successfully'
    }
  } catch (error) {
    console.error('[Email] Failed to send notification email:', error)
    return {
      success: false,
      error: 'Notification email failed'
    }
  }
}

/**
 * Generic email sender
 */
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
) => {
  try {
    console.log('[Email] Sending email to:', to)
    console.log('[Email] Subject:', subject)
    
    // TODO: Replace with actual email service integration
    // Example: Use Brevo, SendGrid, AWS SES, etc.
    
    return {
      success: true,
      message: 'Email sent successfully'
    }
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    throw error
  }
}
