// FILE: /server/api/diagnostic/email-config.get.ts
// ============================================================================
// EMAIL CONFIGURATION DIAGNOSTIC
// ============================================================================

export default defineEventHandler(async (event) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    recommendations: []
  }

  try {
    console.log('[Email Diagnostic] Starting email configuration check...')

    // ============================================================================
    // CHECK 1: Environment Variables
    // ============================================================================
    diagnostics.checks.env_variables = {
      status: 'checking',
      details: {}
    }

    const smtpHost = process.env.MAILERSEND_SMTP_HOST
    const smtpPort = process.env.MAILERSEND_SMTP_PORT
    const smtpUsername = process.env.MAILERSEND_SMTP_USERNAME
    const smtpPassword = process.env.MAILERSEND_SMTP_PASSWORD
    const senderEmail = process.env.SENDER_EMAIL
    const senderName = process.env.SENDER_NAME

    diagnostics.checks.env_variables.details = {
      smtp_host: smtpHost ? '✓' : '✗',
      smtp_port: smtpPort ? '✓' : '✗',
      smtp_username: smtpUsername ? '✓' : '✗',
      smtp_password: smtpPassword ? '✓' : '✗',
      sender_email: senderEmail ? '✓' : '✗',
      sender_name: senderName ? '✓' : '✗'
    }

    const allEnvSet = smtpHost && smtpPort && smtpUsername && smtpPassword && senderEmail && senderName
    diagnostics.checks.env_variables.status = allEnvSet ? 'passed' : 'failed'

    if (!allEnvSet) {
      diagnostics.recommendations.push('Set all email environment variables: MAILERSEND_SMTP_HOST, MAILERSEND_SMTP_PORT, MAILERSEND_SMTP_USERNAME, MAILERSEND_SMTP_PASSWORD, SENDER_EMAIL, SENDER_NAME')
    }

    console.log('[Email Diagnostic] Environment variables check complete')

    // ============================================================================
    // CHECK 2: SMTP Configuration
    // ============================================================================
    diagnostics.checks.smtp_config = {
      status: 'checking',
      details: {}
    }

    if (smtpHost && smtpPort && smtpUsername && smtpPassword) {
      diagnostics.checks.smtp_config.details = {
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        username: smtpUsername.substring(0, 10) + '...',
        secure: false,
        protocol: 'TLS'
      }
      diagnostics.checks.smtp_config.status = 'passed'
    } else {
      diagnostics.checks.smtp_config.status = 'failed'
      diagnostics.checks.smtp_config.details.error = 'Missing SMTP configuration'
    }

    console.log('[Email Diagnostic] SMTP configuration check complete')

    // ============================================================================
    // CHECK 3: Sender Configuration
    // ============================================================================
    diagnostics.checks.sender_config = {
      status: 'checking',
      details: {}
    }

    if (senderEmail && senderName) {
      diagnostics.checks.sender_config.details = {
        email: senderEmail,
        name: senderName,
        from_header: `${senderName} <${senderEmail}>`
      }
      diagnostics.checks.sender_config.status = 'passed'
    } else {
      diagnostics.checks.sender_config.status = 'failed'
      diagnostics.checks.sender_config.details.error = 'Missing sender configuration'
    }

    console.log('[Email Diagnostic] Sender configuration check complete')

    // ============================================================================
    // CHECK 4: Test Email Send (Optional)
    // ============================================================================
    diagnostics.checks.email_send_test = {
      status: 'skipped',
      details: {
        reason: 'Email send test requires actual SMTP connection'
      }
    }

    if (allEnvSet) {
      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || '587'),
          secure: false,
          auth: {
            user: smtpUsername,
            pass: smtpPassword
          }
        })

        // Verify connection
        const verified = await transporter.verify()
        
        if (verified) {
          diagnostics.checks.email_send_test.status = 'passed'
          diagnostics.checks.email_send_test.details = {
            message: 'SMTP connection verified successfully',
            ready_to_send: true
          }
        } else {
          diagnostics.checks.email_send_test.status = 'failed'
          diagnostics.checks.email_send_test.details = {
            error: 'SMTP connection verification failed'
          }
          diagnostics.recommendations.push('Check SMTP credentials - connection verification failed')
        }
      } catch (err: any) {
        diagnostics.checks.email_send_test.status = 'failed'
        diagnostics.checks.email_send_test.details = {
          error: err.message
        }
        diagnostics.recommendations.push(`SMTP connection error: ${err.message}`)
      }
    }

    console.log('[Email Diagnostic] Email send test complete')

    // ============================================================================
    // SUMMARY
    // ============================================================================
    const checkValues = Object.values(diagnostics.checks) as any[]
    diagnostics.summary = {
      overall_status: checkValues.every(c => c.status !== 'failed') ? 'healthy' : 'needs_attention',
      passed: checkValues.filter(c => c.status === 'passed').length,
      warnings: checkValues.filter(c => c.status === 'warning').length,
      failed: checkValues.filter(c => c.status === 'failed').length,
      skipped: checkValues.filter(c => c.status === 'skipped').length
    }

    console.log('[Email Diagnostic] Complete - Status:', diagnostics.summary.overall_status)

    return diagnostics

  } catch (error: any) {
    console.error('[Email Diagnostic] Error:', error.message)
    return {
      timestamp: diagnostics.timestamp,
      error: error.message,
      checks: diagnostics.checks
    }
  }
})
