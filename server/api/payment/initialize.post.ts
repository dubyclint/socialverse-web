// ============================================================================
// FILE: /server/api/payment/initialize.post.ts
// Multi-Gateway Unified Payment Initialization Endpoint
// ============================================================================

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { gateway, amount, email, currency = 'USD' } = body

  if (!gateway || !amount || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: gateway, amount, or email'
    })
  }

  // Configured Keys
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_878fff9952f8f0ab21299f87b76034acb8c5e8ff'
  const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-sandbox-key-placeholder'
  const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || 'NOWPAYMENTS_API_KEY_PLACEHOLDER'

  const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000'
  const callbackUrl = `${origin}/wallet?deposit=success`

  try {
    // ------------------------------------------------------------------------
    // 1. Paystack Integration (Forced to NGN)
    // ------------------------------------------------------------------------
    if (gateway === 'paystack') {
      // Paystack merchant doesn't support USD. Convert USD to NGN using a baseline rate.
      const EXCHANGE_RATE = 1600; // Modify this to your preferred platform USD-to-NGN rate
      const amountInNGN = currency === 'USD' ? amount * EXCHANGE_RATE : amount;
      const amountInKobo = Math.round(amountInNGN * 100);

      const response = await $fetch<{ status: boolean; data: { authorization_url: string; reference: string } }>(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: {
            email,
            amount: amountInKobo,
            currency: 'NGN', // Explicitly fixed to Naira to resolve merchant error
            callback_url: callbackUrl
          }
        }
      )

      if (!response.status || !response.data?.authorization_url) {
        throw new Error('Paystack transaction initialization failed.')
      }

      return {
        success: true,
        checkoutUrl: response.data.authorization_url,
        reference: response.data.reference
      }
    }

    // ------------------------------------------------------------------------
    // 2. Flutterwave Integration
    // ------------------------------------------------------------------------
    if (gateway === 'flutterwave') {
      const tx_ref = `tx-flw-${Date.now()}`
      const response = await $fetch<{ status: string; data: { link: string } }>(
        'https://api.flutterwave.com/v3/payments',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: {
            tx_ref,
            amount,
            currency,
            redirect_url: callbackUrl,
            customer: { email },
            customizations: {
              title: 'Wallet Account Funding',
              description: 'Deposit funds into user wallet'
            }
          }
        }
      )

      if (response.status !== 'success' || !response.data?.link) {
        throw new Error('Flutterwave payment link creation failed.')
      }

      return {
        success: true,
        checkoutUrl: response.data.link,
        reference: tx_ref
      }
    }

    // ------------------------------------------------------------------------
    // 3. NowPayments Integration
    // ------------------------------------------------------------------------
    if (gateway === 'nowpayments') {
      const response = await $fetch<{ invoice_url: string; id: string }>(
        'https://api.nowpayments.io/v1/invoice',
        {
          method: 'POST',
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: {
            price_amount: amount,
            price_currency: currency.toLowerCase(),
            order_id: `now-${Date.now()}`,
            order_description: 'Wallet funding deposit',
            ipn_callback_url: `${origin}/api/payment/webhook/nowpayments`,
            success_url: callbackUrl,
            cancel_url: `${origin}/add-funds`
          }
        }
      )

      if (!response.invoice_url) {
        throw new Error('NowPayments invoice creation failed.')
      }

      return {
        success: true,
        checkoutUrl: response.invoice_url,
        reference: response.id
      }
    }

    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported payment gateway: ${gateway}`
    })

  } catch (error: any) {
    console.error(`[Payment Initialization Error - ${gateway}]:`, error?.data || error?.message)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.data?.message || error?.message || 'Payment initialization failed.'
    })
  }
})
