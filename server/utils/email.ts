server/utils/email.ts
// Email service wrapper (unified email interface)
// ============================================================================

import {
  sendBrevoEmail,
  sendVerificationEmail as sendBrevoVerificationEmail,
  sendPasswordResetEmail as sendBrevoPasswordResetEmail
} from './brevo'

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] Sending verification email to:', email)
    const result = await sendBrevoVerificationEmail(email, username, token)
    console.log('[Email] Verification email sent successfully')
    return result
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error)
    // Don't throw - log warning but allow signup to continue
    return {
      success: false,
      error: 'Email sending failed, but account created. User can resend later.'
    }
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] Sending password reset email to:', email)
    const result = await sendBrevoPasswordResetEmail(email, username, token)
    console.log('[Email] Password reset email sent successfully')
    return result
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
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to SocialVerse!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Hi ${username},</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your email has been verified and your account is now active. You can now enjoy all the features of SocialVerse!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NUXT_PUBLIC_SITE_URL}/feed" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="font-size: 12px; color: #999;">
            Happy trading and socializing!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>&copy; 2025 SocialVerse. All rights reserved.</p>
        </div>
      </div>
    `

    console.log('[Email] Sending welcome email to:', email)
    const result = await sendBrevoEmail({
      to: [{ email, name: username }],
      subject: 'Welcome to SocialVerse!',
      htmlContent
    })
    console.log('[Email] Welcome email sent successfully')
    return result
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
    // Don't throw - this is non-critical
    return {
      success: false,
      error: 'Welcome email failed to send'
    }
  }
}
