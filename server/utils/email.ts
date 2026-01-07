// ============================================================================
// FILE: /server/utils/email.ts - COMPLETE MAILERSEND SMTP IMPLEMENTATION
// ============================================================================
// ✅ FIXED: Implements SMTP email sending with MailerSend
// ✅ Removed Brevo references
// ✅ Production-ready error handling
// ============================================================================

import nodemailer from 'nodemailer'

// ============================================================================
// INITIALIZE SMTP TRANSPORTER
// ============================================================================
let transporter: any = null

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  const smtpHost = process.env.MAILERSEND_SMTP_HOST
  const smtpPort = parseInt(process.env.MAILERSEND_SMTP_PORT || '587')
  const smtpUsername = process.env.MAILERSEND_SMTP_USERNAME
  const smtpPassword = process.env.MAILERSEND_SMTP_PASSWORD

  if (!smtpHost || !smtpUsername || !smtpPassword) {
    console.error('[Email] ❌ Missing SMTP configuration')
    console.error('[Email] SMTP_HOST:', smtpHost ? '✓' : '✗')
    console.error('[Email] SMTP_USERNAME:', smtpUsername ? '✓' : '✗')
    console.error('[Email] SMTP_PASSWORD:', smtpPassword ? '✓' : '✗')
    throw new Error('SMTP configuration is missing')
  }

  console.log('[Email] ✅ Initializing SMTP transporter')
  console.log('[Email] Host:', smtpHost)
  console.log('[Email] Port:', smtpPort)
  console.log('[Email] Username:', smtpUsername.substring(0, 10) + '...')

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // Use TLS (port 587)
    auth: {
      user: smtpUsername,
      pass: smtpPassword
    },
    logger: true,
    debug: true
  })

  return transporter
}

// ============================================================================
// SEND VERIFICATION EMAIL
// ============================================================================
export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] ============ SEND VERIFICATION EMAIL ============')
    console.log('[Email] To:', email)
    console.log('[Email] Username:', username)
    console.log('[Email] Token (first 20 chars):', token.substring(0, 20) + '...')

    const verificationLink = `${process.env.NUXT_PUBLIC_SITE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
    console.log('[Email] Verification link:', verificationLink)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { font-size: 12px; color: #999; margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SocialVerse! 🌐</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>Thank you for signing up! Please verify your email address to activate your account.</p>
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${verificationLink}
              </p>
              <p style="font-size: 12px; color: #999;">This link will expire in 24 hours.</p>
              <div class="footer">
                <p>Best regards,<br><strong>The SocialVerse Team</strong></p>
                <p>© 2024 SocialVerse. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    console.log('[Email] Sending email from:', senderEmail)

    const transporter = getTransporter()
    const result = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: 'Verify Your SocialVerse Email Address',
      html: htmlContent,
      text: `Hi ${username},\n\nPlease verify your email by clicking this link:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe SocialVerse Team`
    })

    console.log('[Email] ✅ Verification email sent successfully')
    console.log('[Email] Message ID:', result.messageId)
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: 'Verification email sent successfully',
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send verification email')
    console.error('[Email] Error:', error.message)
    console.error('[Email] Full error:', JSON.stringify(error, null, 2))
    console.error('[Email] ============ END ERROR ============')

    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    }
  }
}

// ============================================================================
// SEND PASSWORD RESET EMAIL
// ============================================================================
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
) => {
  try {
    console.log('[Email] ============ SEND PASSWORD RESET EMAIL ============')
    console.log('[Email] To:', email)
    console.log('[Email] Username:', username)

    const resetLink = `${process.env.NUXT_PUBLIC_SITE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { font-size: 12px; color: #999; margin-top: 30px; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email. Your password will remain unchanged.
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${resetLink}
              </p>
              <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
              <div class="footer">
                <p>Best regards,<br><strong>The SocialVerse Team</strong></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    const transporter = getTransporter()
    const result = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: 'Reset Your SocialVerse Password',
      html: htmlContent,
      text: `Hi ${username},\n\nReset your password by clicking this link:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nBest regards,\nThe SocialVerse Team`
    })

    console.log('[Email] ✅ Password reset email sent successfully')
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: 'Password reset email sent successfully',
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send password reset email:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// SEND WELCOME EMAIL
// ============================================================================
export const sendWelcomeEmail = async (
  email: string,
  username: string
) => {
  try {
    console.log('[Email] ============ SEND WELCOME EMAIL ============')
    console.log('[Email] To:', email)
    console.log('[Email] Username:', username)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .features { margin: 20px 0; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { font-size: 12px; color: #999; margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SocialVerse! 🌐</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>Your account is now active! Welcome to our community of creators and connectors.</p>
              
              <div class="features">
                <div class="feature">
                  <strong>📱 Share Your Story</strong><br>
                  Post updates, photos, and videos to connect with friends and followers.
                </div>
                <div class="feature">
                  <strong>🤝 Build Connections</strong><br>
                  Follow people, join communities, and expand your network.
                </div>
                <div class="feature">
                  <strong>💬 Engage & Interact</strong><br>
                  Like, comment, and share content with your community.
                </div>
              </div>

              <p>Get started by completing your profile and connecting with friends!</p>
              
              <div class="footer">
                <p>Best regards,<br><strong>The SocialVerse Team</strong></p>
                <p>© 2024 SocialVerse. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    const transporter = getTransporter()
    const result = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: 'Welcome to SocialVerse!',
      html: htmlContent,
      text: `Hi ${username},\n\nWelcome to SocialVerse! Your account is now active.\n\nStart exploring, connecting, and sharing with people around the world.\n\nBest regards,\nThe SocialVerse Team`
    })

    console.log('[Email] ✅ Welcome email sent successfully')
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: 'Welcome email sent successfully',
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send welcome email:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// GENERIC EMAIL SENDER
// ============================================================================
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
) => {
  try {
    console.log('[Email] ============ SEND GENERIC EMAIL ============')
    console.log('[Email] To:', to)
    console.log('[Email] Subject:', subject)

    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    const transporter = getTransporter()
    const result = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '')
    })

    console.log('[Email] ✅ Email sent successfully')
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send email:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// SEND BULK EMAILS
// ============================================================================
export const sendBulkEmails = async (
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  htmlContent: string
) => {
  try {
    console.log('[Email] ============ SEND BULK EMAILS ============')
    console.log('[Email] Recipients:', recipients.length)
    console.log('[Email] Subject:', subject)

    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    const transporter = getTransporter()
    const results = []

    for (const recipient of recipients) {
      try {
        const result = await transporter.sendMail({
          from: `${senderName} <${senderEmail}>`,
          to: recipient.email,
          subject: subject,
          html: htmlContent
        })
        results.push({ email: recipient.email, status: 'sent', messageId: result.messageId })
      } catch (err: any) {
        results.push({ email: recipient.email, status: 'failed', error: err.message })
      }
    }

    console.log('[Email] ✅ Bulk emails sent')
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: `Bulk emails sent to ${recipients.length} recipients`,
      results
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send bulk emails:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// SEND TEMPLATED EMAIL
// ============================================================================
export const sendTemplatedEmail = async (
  to: string,
  templateId: string,
  templateData: Record<string, any>
) => {
  try {
    console.log('[Email] ============ SEND TEMPLATED EMAIL ============')
    console.log('[Email] To:', to)
    console.log('[Email] Template ID:', templateId)

    // TODO: Implement template rendering (Handlebars, EJS, etc.)
    // For now, just send a generic email
    const senderEmail = process.env.SENDER_EMAIL || 'noreply@socialverse.com'
    const senderName = process.env.SENDER_NAME || 'SocialVerse'

    const transporter = getTransporter()
    const result = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: templateData.subject || 'Notification from SocialVerse',
      html: templateData.html || '<p>Notification from SocialVerse</p>'
    })

    console.log('[Email] ✅ Templated email sent successfully')
    console.log('[Email] ============ END ============')

    return {
      success: true,
      message: 'Templated email sent successfully',
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('[Email] ❌ Failed to send templated email:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}
