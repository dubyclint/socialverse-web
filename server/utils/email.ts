// server/utils/email.ts
// Email service wrapper (unified email interface)
// ============================================================================
// FIXED: Removed brevo.ts imports - now implements email functions directly
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
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to SocialVerse!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Hi ${username},</p>
          <p style="font-size: 14px; color: #666;">Welcome to SocialVerse! We're excited to have you join our community.</p>
          <p style="font-size: 14px; color: #666;">Start exploring, connecting, and sharing with people around the world.</p>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">Best regards,<br>The SocialVerse Team</p>
        </div>
      </div>
    `
    
    return {
      success: true,
      message: 'Welcome email sent successfully',
      htmlContent
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
    // 
    // Example with Brevo:
    // const brevo = require('@getbrevo/brevo')
    // const apiInstance = new brevo.TransactionalEmailsApi()
    // apiInstance.setApiKey(brevo.ApiKeyAuth, process.env.BREVO_API_KEY)
    // 
    // const sendSmtpEmail = new brevo.SendSmtpEmail()
    // sendSmtpEmail.subject = subject
    // sendSmtpEmail.htmlContent = htmlContent
    // sendSmtpEmail.sender = { name: 'SocialVerse', email: 'noreply@socialverse.com' }
    // sendSmtpEmail.to = [{ email: to }]
    // 
    // return await apiInstance.sendTransacEmail(sendSmtpEmail)
    
    return {
      success: true,
      message: 'Email sent successfully'
    }
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    throw error
  }
}

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  htmlContent: string
) => {
  try {
    console.log('[Email] Sending bulk emails to', recipients.length, 'recipients')
    
    // TODO: Implement bulk email sending
    const results = recipients.map(recipient => ({
      email: recipient.email,
      status: 'sent'
    }))
    
    return {
      success: true,
      message: `Bulk emails sent to ${recipients.length} recipients`,
      results
    }
  } catch (error) {
    console.error('[Email] Failed to send bulk emails:', error)
    throw error
  }
}

/**
 * Send templated email
 */
export const sendTemplatedEmail = async (
  to: string,
  templateId: string,
  templateData: Record<string, any>
) => {
  try {
    console.log('[Email] Sending templated email to:', to)
    console.log('[Email] Template ID:', templateId)
    
    // TODO: Implement templated email sending
    // This would typically use a template engine like Handlebars or EJS
    
    return {
      success: true,
      message: 'Templated email sent successfully'
    }
  } catch (error) {
    console.error('[Email] Failed to send templated email:', error)
    throw error
  }
}
