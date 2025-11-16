// FILE: /server/routes/escrow.ts - FIXED
// ============================================================================

import { EscrowTradeModel } from '~/server/models/escrow-trade'
import { AuditLogModel } from '~/server/models/audit-log'
import { supabase } from '~/server/utils/database'

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
      return await handleGetEscrow(event)
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
    console.error('[Escrow] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Escrow operation failed'
    })
  }
})

async function handleGetEscrow(event: any) {
  const { tradeId } = getQuery(event)
  
  if (!tradeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tradeId parameter'
    })
  }

  const { data, error } = await supabase
    .from('escrow_trades')
    .select('*')
    .eq('trade_id', tradeId)
    .single()

  if (error) throw error
  return data
}

async function handleCreateEscrow(event: any) {
  const body = await readBody<EscrowCreateRequest>(event)
  const { buyerId, sellerId, amount, token, tradeId } = body

  if (!buyerId || !sellerId || !amount || !token || !tradeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }
  const { data, error } = await supabase
    .from('escrow_trades')
    .insert([{
      buyer_id: buyerId,
      seller_id: sellerId,
      amount,
      token,
      trade_id: tradeId,
      status: 'pending',
      created_at: new Date().toISOString()
    }])
    .select()

  if (error) throw error
  return data
}

async function handleUpdateEscrow(event: any) {
  const body = await readBody<EscrowActionRequest>(event)
  const { tradeId, action, reason } = body

  if (!tradeId || !action) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: tradeId, action'
    })
}

const { data, error } = await supabase
    .from('escrow_trades')
    .update({
      status: action === 'release' ? 'released' : 'refunded',
      reason,
      updated_at: new Date().toISOString()
    })
    .eq('trade_id', tradeId)
    .select()

  if (error) throw error
  return data
}
