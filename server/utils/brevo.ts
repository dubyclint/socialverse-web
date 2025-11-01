server/utils/brevo.ts
// Brevo API client for email sending
// ============================================================================

import axios from 'axios'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3'
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
const SENDER_NAME = 'SocialVerse'

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailParams {
  to: EmailRecipient[]
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: EmailRecipient
}

/**
 * Send email via Brevo API
 */
export const sendBrevoEmail = async (params: EmailParams) => {
  try {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured')
    }

    const response = await axios.post(
      `${BREVO_API_URL}/smtp/email`,
      {
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        replyTo: params.replyTo
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('[Brevo] Email sent successfully:', response.data.messageId)
    return {
      success: true,
      messageId: response.data.messageId
    }
  } catch (error: any) {
    console.error('[Brevo] Email send error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    throw error
  }
}

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
) => {
  const verificationLink = `${process.env.NUXT_PUBLIC_SITE_URL}/auth/verify-email?token=${token}`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to SocialVerse</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hi ${username},</p>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Thank you for creating your SocialVerse account. Please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        
        <p style="font-size: 12px; color: #999;">
          Or copy this link: <br/>
          <code style="background: #eee; padding: 5px; border-radius: 3px;">${verificationLink}</code>
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          This link expires in 24 hours.
        </p>
        
        <p style="font-size: 12px; color: #999;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>&copy; 2025 SocialVerse. All rights reserved.</p>
      </div>
    </div>
  `

  return sendBrevoEmail({
    to: [{ email, name: username }],
    subject: 'Verify your SocialVerse email',
    htmlContent
  })
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
) => {
  const resetLink = `${process.env.NUXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hi ${username},</p>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 12px; color: #999;">
          This link expires in 1 hour.
        </p>
        
        <p style="font-size: 12px; color: #999;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>&copy; 2025 SocialVerse. All rights reserved.</p>
      </div>
    </div>
  `

  return sendBrevoEmail({
    to: [{ email, name: username }],
    subject: 'Reset your SocialVerse password',
    htmlContent
  })
}
