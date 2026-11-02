import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { broadcastToStream, liveUserCard } from '~/server/utils/stream-hub'

/** Timed "top gift getter" game: whoever receives the most gift value in the window wins (ties share). */
const db = () => getServiceClient() as unknown as SupabaseClient
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export interface GameRow { id: string, stream_id: string, started_at: string, ends_at: string, duration_seconds: number, status: string, winner_ids: string[], results: unknown }

export const leaderboard = async (game: GameRow) => {
  const { data } = await db().from('gift_transactions').select('recipient_id, credit_value')
    .eq('stream_id', game.stream_id).gte('created_at', game.started_at).lte('created_at', game.ends_at)
  const totals = new Map<string, number>()
  for (const g of (data ?? []) as { recipient_id: string, credit_value: number }[]) totals.set(g.recipient_id, (totals.get(g.recipient_id) ?? 0) + Number(g.credit_value || 0))
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  return Promise.all(sorted.map(async ([id, total]) => ({ ...(await liveUserCard(id)), total: Math.round(total * 100) / 100 })))
}

export const currentGame = async (streamId: string): Promise<GameRow | null> => {
  const { data } = await db().from('stream_gift_games').select('*').eq('stream_id', streamId).order('started_at', { ascending: false }).limit(1).maybeSingle()
  return (data as GameRow | null) ?? null
}

export const finishGame = async (game: GameRow) => {
  const board = await leaderboard(game)
  const top = board[0]?.total ?? 0
  const winners = top > 0 ? board.filter(b => b.total === top) : []
  const { data } = await db().from('stream_gift_games').update({ status: 'finished', winner_ids: winners.map(w => w.id), results: board })
    .eq('id', game.id).eq('status', 'live').select('id').maybeSingle()
  if (data) broadcastToStream(game.stream_id, { type: 'game', game: { ...game, status: 'finished', winner_ids: winners.map(w => w.id) }, board, winners })
  timers.delete(game.stream_id)
  return { board, winners }
}

export const scheduleFinish = (game: GameRow) => {
  const prev = timers.get(game.stream_id)
  if (prev) clearTimeout(prev)
  const ms = Math.max(0, Date.parse(game.ends_at) - Date.now()) + 500
  timers.set(game.stream_id, setTimeout(() => { void finishGame(game) }, ms))
}

/** Lazily settles an expired game (covers server restarts) and returns game + board. */
export const gameState = async (streamId: string) => {
  const game = await currentGame(streamId)
  if (!game) return { game: null, board: [], winners: [] }
  if (game.status === 'live' && Date.parse(game.ends_at) <= Date.now()) {
    const { board, winners } = await finishGame(game)
    return { game: { ...game, status: 'finished' }, board, winners }
  }
  const board = game.status === 'live' ? await leaderboard(game) : (game.results as Awaited<ReturnType<typeof leaderboard>>)
  const winners = board.filter(b => game.winner_ids.includes(b.id))
  return { game, board, winners }
}

export const pushGameUpdate = async (streamId: string) => {
  const game = await currentGame(streamId)
  if (!game || game.status !== 'live') return
  broadcastToStream(streamId, { type: 'game', game, board: await leaderboard(game), winners: [] })
}

export const cancelLiveGame = async (streamId: string) => {
  await db().from('stream_gift_games').update({ status: 'cancelled' }).eq('stream_id', streamId).eq('status', 'live')
  const t = timers.get(streamId)
  if (t) clearTimeout(t)
  timers.delete(streamId)
}

export const startGame = async (streamId: string, userId: string, durationSeconds: number) => {
  const now = new Date()
  const { data, error } = await db().from('stream_gift_games').insert({
    stream_id: streamId, created_by: userId, duration_seconds: durationSeconds,
    started_at: now.toISOString(), ends_at: new Date(now.getTime() + durationSeconds * 1000).toISOString()
  }).select('*').single()
  if (error) throw error
  const game = data as GameRow
  scheduleFinish(game)
  broadcastToStream(streamId, { type: 'game', game, board: [], winners: [] })
  return game
}
