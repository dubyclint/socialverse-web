import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { CheckoutRequest, CheckoutResult, PaymentGateway, PaymentProviderRow } from './types'

const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND'])

/** Paystack prices in the currency subunit. */
function toSubunit(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100)
}

const paystack: PaymentGateway = {
  code: 'paystack',
  async createCheckout(_provider: PaymentProviderRow, request: CheckoutRequest): Promise<CheckoutResult> {
    const secret = useRuntimeConfig().paystackSecretKey
    if (!secret) throw createError({ statusCode: 503, statusMessage: 'Paystack is not configured' })

    const response = await $fetch<{
      status: boolean
      message: string
      data?: { authorization_url: string, reference: string }
    }>('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      body: {
        email: request.email,
        amount: String(toSubunit(request.amount, request.currency)),
        currency: request.currency,
        reference: request.depositId,
        callback_url: request.callbackUrl,
        metadata: { deposit_id: request.depositId, user_id: request.userId }
      }
    })

    if (!response.status || !response.data) {
      throw createError({ statusCode: 502, statusMessage: response.message || 'Paystack rejected the payment' })
    }

    return {
      checkoutUrl: response.data.authorization_url,
      instructions: null,
      externalRef: response.data.reference
    }
  }
}

const flutterwave: PaymentGateway = {
  code: 'flutterwave',
  async createCheckout(provider: PaymentProviderRow, request: CheckoutRequest): Promise<CheckoutResult> {
    const config = provider.config as {
      payment_links?: string[]
      bank_slots?: { currency: string, bank_name: string, account_name: string, account_number: string }[]
    }
    const secret = useRuntimeConfig().flutterwaveSecretKey

    // Without API keys the admin can still run Flutterwave on custom payment
    // links plus manual bank transfer, which is how the account is set up today.
    if (!secret) {
      const link = config.payment_links?.[0]
      if (link) {
        return { checkoutUrl: link, instructions: null, externalRef: request.depositId }
      }

      const bank = config.bank_slots?.find(slot => slot.currency === request.currency)
      if (bank) {
        return {
          checkoutUrl: null,
          instructions: `Transfer ${request.amount} ${request.currency} to ${bank.bank_name} — ${bank.account_name}, ${bank.account_number}, and use ${request.depositId.slice(0, 8)} as the narration.`,
          externalRef: request.depositId
        }
      }

      throw createError({ statusCode: 503, statusMessage: 'Flutterwave is not configured' })
    }

    const response = await $fetch<{ status: string, message: string, data?: { link: string } }>(
      'https://api.flutterwave.com/v3/payments',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
        body: {
          tx_ref: request.depositId,
          amount: String(request.amount),
          currency: request.currency,
          redirect_url: request.callbackUrl,
          customer: { email: request.email },
          customizations: { title: 'Viorp wallet top-up' },
          meta: { deposit_id: request.depositId, user_id: request.userId }
        }
      }
    )

    if (response.status !== 'success' || !response.data?.link) {
      throw createError({ statusCode: 502, statusMessage: response.message || 'Flutterwave rejected the payment' })
    }

    return { checkoutUrl: response.data.link, instructions: null, externalRef: request.depositId }
  }
}

const nowpayments: PaymentGateway = {
  code: 'nowpayments',
  async createCheckout(_provider: PaymentProviderRow, request: CheckoutRequest): Promise<CheckoutResult> {
    const apiKey = useRuntimeConfig().nowpaymentsApiKey
    if (!apiKey) throw createError({ statusCode: 503, statusMessage: 'Crypto payments are not configured' })

    const response = await $fetch<{ id: string, invoice_url: string }>(
      'https://api.nowpayments.io/v1/invoice',
      {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: {
          price_amount: request.amount,
          price_currency: request.currency.toLowerCase(),
          order_id: request.depositId,
          order_description: 'Viorp wallet top-up',
          ipn_callback_url: request.ipnUrl,
          success_url: request.callbackUrl,
          cancel_url: request.callbackUrl
        }
      }
    )

    if (!response?.invoice_url) {
      throw createError({ statusCode: 502, statusMessage: 'Crypto provider did not return an invoice' })
    }

    return { checkoutUrl: response.invoice_url, instructions: null, externalRef: String(response.id) }
  }
}

/** Manual routes (P2P, support agent, bank transfer) have no hosted checkout. */
const manual: PaymentGateway = {
  code: 'manual',
  async createCheckout(provider: PaymentProviderRow, request: CheckoutRequest): Promise<CheckoutResult> {
    const config = provider.config as { checkout_url?: string, instructions?: string }
    return {
      checkoutUrl: config.checkout_url ?? null,
      instructions: config.instructions ?? null,
      externalRef: request.depositId
    }
  }
}

const gateways: Record<string, PaymentGateway> = {
  paystack,
  flutterwave,
  nowpayments
}

export function resolveGateway(code: string): PaymentGateway {
  return gateways[code] ?? manual
}
