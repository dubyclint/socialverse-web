import { EscrowTradeModel } from '~/server/models/EscrowTrade'
import { AuditLogModel } from '~/server/models/AuditLog'
import { supabase } from '~/server/db'

interface EscrowCreateRequest {
  buyerId: string
  sellerId: string
  amount: number
  token: string
  tradeId: string
}

interface EscrowActionRequest {
  tradeId: string
  action: 'release' | 'refund'
  reason?: string
}

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method

    if (method === 'GET') {
      return await handleGetEscrows(event)
    } else if (method === 'POST') {
      return await handleCreateEscrow(event)
    } else if (method === 'PUT') {
      return await handleUpdateEscrow(event)
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }
  } catch (error: any) {
    console.error('Escrow route error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})

async function handleGetEscrows(event: any) {
  const query = getQuery(event)
  const { status, buyerId, sellerId, limit = 50, offset = 0 } = query

  let supabaseQuery = supabase.from('escrow_trades').select('*', { count: 'exact' })

  if (status) {
    if (status === 'pending') {
      supabaseQuery = supabaseQuery.eq('is_released', false).eq('is_refunded', false)
    } else if (status === 'released') {
      supabaseQuery = supabaseQuery.eq('is_released', true)
    } else if (status === 'refunded') {
      supabaseQuery = supabaseQuery.eq('is_refunded', true)
    }
  }

  if (buyerId) {
    supabaseQuery = supabaseQuery.eq('buyer_id', buyerId)
  }

  if (sellerId) {
    supabaseQuery = supabaseQuery.eq('seller_id', sellerId)
  }

  const { data: trades, error, count } = await supabaseQuery
    .order('timestamp', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch escrow trades'
    })
  }

  return {
    trades: trades || [],
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset)
  }
}

async function handleCreateEscrow(event: any) {
  const body = await readBody<EscrowCreateRequest>(event)

  if (!body.buyerId || !body.sellerId || !body.amount || !body.token || !body.tradeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: buyerId, sellerId, amount, token, tradeId'
    })
  }

  if (body.amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Amount must be greater than 0'
    })
  }

  try {
    const trade = await EscrowTradeModel.create({
      buyerId: body.buyerId,
      sellerId: body.sellerId,
      amount: body.amount,
      token: body.token,
      tradeId: body.tradeId,
      isReleased: false,
      isRefunded: false
    })

    // Log audit trail
    await AuditLogModel.create({
      type: 'ESCROW_CREATED',
      userId: body.buyerId,
      feature: 'escrow',
      result: 'ALLOWED',
      context: {
        tradeId: body.tradeId,
        amount: body.amount,
        token: body.token,
        sellerId: body.sellerId
      },
      policies: []
    })

    return {
      success: true,
      trade,
      message: 'Escrow trade created successfully'
    }
  } catch (error: any) {
    console.error('Create escrow error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create escrow trade'
    })
  }
}

async function handleUpdateEscrow(event: any) {
  const body = await readBody<EscrowActionRequest>(event)

  if (!body.tradeId || !body.action) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: tradeId, action'
    })
  }

  if (!['release', 'refund'].includes(body.action)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid action. Must be "release" or "refund"'
    })
  }

  try {
    let trade

    if (body.action === 'release') {
      trade = await EscrowTradeModel.releaseFunds(body.tradeId)

      // Log audit trail
      await AuditLogModel.create({
        type: 'ESCROW_RELEASED',
        userId: trade.seller_id,
        feature: 'escrow',
        result: 'ALLOWED',
        context: {
          tradeId: body.tradeId,
          amount: trade.amount,
          reason: body.reason
        },
        policies: []
      })
    } else if (body.action === 'refund') {
      trade = await EscrowTradeModel.refundFunds(body.tradeId)

      // Log audit trail
      await AuditLogModel.create({
        type: 'ESCROW_REFUNDED',
        userId: trade.buyer_id,
        feature: 'escrow',
        result: 'ALLOWED',
        context: {
          tradeId: body.tradeId,
          amount: trade.amount,
          reason: body.reason
        },
        policies: []
      })
    }

    return {
      success: true,
      trade,
      message: `Escrow ${body.action}ed successfully`
    }
  } catch (error: any) {
    console.error('Update escrow error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to ${body.action} escrow`
    })
  }
}
