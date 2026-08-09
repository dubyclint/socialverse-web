// Gift records for the closed-loop credit system. Rows are written by the
// money-core `send_pewgift` function inside the same transaction that moves the
// credits, so this model is read-only apart from that call.

import { getAdminClient } from '~/server/utils/supabase-server'

export interface PewGift {
  id: string
  gift_id: string
  sender_id: string
  recipient_id: string
  credit_value: number
  stream_id: string | null
  created_at: string
}

export interface SendPewGiftInput {
  senderId: string
  recipientId: string
  giftId: string
  quantity?: number
  streamId?: string
  message?: string
}

export interface PewGiftReceipt {
  transaction_id: string
  total_cost: number
  new_sender_balance: number
}

const SELECT = 'id, gift_id, sender_id, recipient_id, credit_value, stream_id, created_at'

export class PewGiftModel {
  static async send(input: SendPewGiftInput): Promise<PewGiftReceipt> {
    const supabase = await getAdminClient()
    const { data, error } = await supabase.rpc('send_pewgift', {
      p_sender_id: input.senderId,
      p_recipient_id: input.recipientId,
      p_gift_id: input.giftId,
      p_quantity: input.quantity ?? 1,
      p_stream_id: input.streamId,
      p_context: { message: input.message ?? null }
    })

    if (error) throw error
    return data as PewGiftReceipt
  }

  static async getById(id: string): Promise<PewGift | null> {
    const supabase = await getAdminClient()
    const { data, error } = await supabase.from('gift_transactions').select(SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    return (data as PewGift) ?? null
  }

  static async getUserReceivedGifts(userId: string, limit = 50, offset = 0): Promise<PewGift[]> {
    return await listGifts('recipient_id', userId, limit, offset)
  }

  static async getUserSentGifts(userId: string, limit = 50, offset = 0): Promise<PewGift[]> {
    return await listGifts('sender_id', userId, limit, offset)
  }

  static async getUserStats(userId: string) {
    const supabase = await getAdminClient()
    const [{ data: sent, error: sentError }, { data: received, error: receivedError }] = await Promise.all([
      supabase.from('gift_transactions').select('credit_value').eq('sender_id', userId),
      supabase.from('gift_transactions').select('credit_value').eq('recipient_id', userId)
    ])

    if (sentError || receivedError) throw sentError || receivedError

    const sum = (rows: { credit_value: number }[] | null) =>
      (rows || []).reduce((total, row) => total + Number(row.credit_value || 0), 0)

    return {
      totalSent: sum(sent),
      totalReceived: sum(received),
      sentCount: sent?.length || 0,
      receivedCount: received?.length || 0
    }
  }

  /** Top receivers over the trailing window, aggregated from recorded transactions. */
  static async getLeaderboard(limit = 50, sinceDays = 30) {
    const supabase = await getAdminClient()
    const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString()

    const { data, error } = await supabase
      .from('gift_transactions')
      .select('recipient_id, credit_value')
      .gte('created_at', since)

    if (error) throw error

    const totals = new Map<string, number>()
    for (const row of data || []) {
      totals.set(row.recipient_id, (totals.get(row.recipient_id) || 0) + Number(row.credit_value))
    }

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, totalCredits], index) => ({ rank: index + 1, userId, totalCredits }))
  }
}

async function listGifts(column: 'sender_id' | 'recipient_id', userId: string, limit: number, offset: number) {
  const supabase = await getAdminClient()
  const { data, error } = await supabase
    .from('gift_transactions')
    .select(SELECT)
    .eq(column, userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []) as PewGift[]
}
