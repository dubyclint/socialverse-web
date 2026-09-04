import { getAdminClient } from '~/server/utils/supabase-server'

export interface SendGiftInput {
  giftId: string
  quantity?: number
  streamId?: string
  message?: string
}

export const giftOperations = {
  /** Prices and moves the credits inside the money-core function; never client-priced. */
  async sendGift(senderId: string, recipientId: string, giftData: SendGiftInput) {
    const supabase = await getAdminClient()
    const { data, error } = await supabase.rpc('send_pewgift', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_gift_id: giftData.giftId,
      p_quantity: giftData.quantity ?? 1,
      p_stream_id: giftData.streamId,
      p_context: { message: giftData.message ?? null }
    })

    if (error) throw error
    return data
  },

  async getGiftHistory(userId: string) {
    const supabase = await getAdminClient()
    const { data, error } = await supabase
      .from('gift_transactions')
      .select('id, gift_id, sender_id, recipient_id, credit_value, stream_id, created_at')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getGiftStats(userId: string) {
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
}
