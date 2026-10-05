import type { Server as SocketIOServer, Socket } from 'socket.io'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Everyone on a call, caller included. */
export const MAX_CALL_PARTICIPANTS = 8
const RING_TIMEOUT_MS = 45_000

interface LiveCall {
  id: string
  chatId: string
  hostId: string
  mode: 'AUDIO' | 'VIDEO'
  joined: Set<string>
  invited: Map<string, ReturnType<typeof setTimeout>>
  connected: boolean
}

interface Person {
  userId: string
  name: string
  avatar?: string
}

interface CallContext {
  io: SocketIOServer
  admin: SupabaseClient
  socket: Socket & { userId?: string }
  isMember: (chatId: string, userId: string) => Promise<boolean>
}

// Who is currently in or being rung for each call. The call_sessions row is the
// durable record; this is the live signalling state for the running server.
const liveCalls = new Map<string, LiveCall>()

const userRoom = (userId: string) => `user:${userId}`

const occupancy = (call: LiveCall) => call.joined.size + call.invited.size

const lookupPeople = async (admin: SupabaseClient, ids: string[]): Promise<Person[]> => {
  if (!ids.length) return []
  const { data } = await admin
    .from('user')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', ids)
  const rows = (data ?? []) as { user_id: string, username: string | null, display_name: string | null, avatar_url: string | null }[]
  const byId = new Map(rows.map(row => [row.user_id, row]))
  return ids.map(id => {
    const row = byId.get(id)
    return { userId: id, name: row?.display_name || row?.username || 'Someone', avatar: row?.avatar_url || undefined }
  })
}

const isOnline = async (io: SocketIOServer, userId: string) =>
  (await io.in(userRoom(userId)).fetchSockets()).length > 0

const sharesChat = async (admin: SupabaseClient, a: string, b: string) => {
  const { data } = await admin.from('chat_room_members').select('room_id').eq('user_id', a)
  const rooms = (data ?? []).map((row: { room_id: string }) => row.room_id)
  if (!rooms.length) return false
  const { data: shared } = await admin
    .from('chat_room_members')
    .select('room_id')
    .eq('user_id', b)
    .in('room_id', rooms)
    .limit(1)
  return Boolean(shared?.length)
}

const finish = async (ctx: Pick<CallContext, 'io' | 'admin'>, call: LiveCall) => {
  liveCalls.delete(call.id)
  for (const timer of call.invited.values()) clearTimeout(timer)
  const everyone = [...call.joined, ...call.invited.keys()]
  call.invited.clear()
  call.joined.clear()
  await ctx.admin
    .from('call_sessions')
    .update({ status: call.connected ? 'DISCONNECTED' : 'MISSED', ended_at: new Date().toISOString() })
    .eq('id', call.id)
  for (const userId of everyone) ctx.io.to(userRoom(userId)).emit('call:ended', { callId: call.id })
}

/** A call ends once nobody is left to talk to and nobody is still being rung. */
const settle = async (ctx: Pick<CallContext, 'io' | 'admin'>, call: LiveCall) => {
  if (call.joined.size === 0 || (call.joined.size === 1 && call.invited.size === 0)) {
    await finish(ctx, call)
  }
}

const removeParticipant = async (
  ctx: Pick<CallContext, 'io' | 'admin'>,
  call: LiveCall,
  userId: string,
  reason: 'left' | 'declined' | 'missed'
) => {
  const timer = call.invited.get(userId)
  if (timer) clearTimeout(timer)
  const wasInvited = call.invited.delete(userId)
  const wasJoined = call.joined.delete(userId)
  if (!wasInvited && !wasJoined) return

  ctx.io.to(userRoom(userId)).emit('call:ended', { callId: call.id })
  for (const other of call.joined) {
    ctx.io.to(userRoom(other)).emit('call:participant-left', { callId: call.id, userId, reason })
  }
  await settle(ctx, call)
}

const ring = async (ctx: CallContext, call: LiveCall, targets: string[], inviterId: string) => {
  const [inviter] = await lookupPeople(ctx.admin, [inviterId])
  const participants = await lookupPeople(ctx.admin, [...call.joined])
  for (const target of targets) {
    call.invited.set(target, setTimeout(() => {
      void removeParticipant(ctx, call, target, 'missed')
    }, RING_TIMEOUT_MS))
    ctx.io.to(userRoom(target)).emit('call:incoming', {
      id: call.id,
      room_id: call.chatId,
      host_id: inviterId,
      call_mode: call.mode,
      callerName: inviter?.name,
      callerAvatar: inviter?.avatar,
      participants
    })
  }
}

/**
 * Mesh audio/video calls for up to MAX_CALL_PARTICIPANTS people. SDP/ICE are
 * relayed only between people who are both on the call; whoever joins sends
 * offers to everyone already there.
 */
export const registerCallHandlers = (ctx: CallContext) => {
  const { io, admin, socket, isMember } = ctx

  socket.on('call:invite', async (data: { chatId?: string, callType?: string, targetUserIds?: string[], targetUserId?: string }, ack?: (result: unknown) => void) => {
    const userId = socket.userId
    const chatId = data?.chatId
    if (!userId || !chatId) return ack?.({ success: false, error: 'Invalid call request' })
    if (!(await isMember(chatId, userId))) return ack?.({ success: false, error: 'Not a member of this chat' })

    const { data: memberRows } = await admin.from('chat_room_members').select('user_id').eq('room_id', chatId)
    const members = ((memberRows ?? []) as { user_id: string }[]).map(row => row.user_id).filter(id => id !== userId)
    const requested = data.targetUserIds?.length ? data.targetUserIds : data.targetUserId ? [data.targetUserId] : null
    let targets = requested ? members.filter(id => requested.includes(id)) : members
    if (!targets.length) return ack?.({ success: false, error: 'Nobody to call in this chat' })

    if (targets.length > MAX_CALL_PARTICIPANTS - 1) {
      if (requested) {
        return ack?.({ success: false, error: `A call can have at most ${MAX_CALL_PARTICIPANTS} people` })
      }
      // Large groups ring the members who are online first, up to the cap.
      const online = await Promise.all(targets.map(id => isOnline(io, id)))
      targets = [...targets.filter((_, i) => online[i]), ...targets.filter((_, i) => !online[i])]
        .slice(0, MAX_CALL_PARTICIPANTS - 1)
    }

    const mode = data.callType === 'video' ? 'VIDEO' : 'AUDIO'
    const { data: row, error } = await admin
      .from('call_sessions')
      .insert({ room_id: chatId, host_id: userId, recipient_id: targets[0], call_mode: mode, status: 'RINGING' })
      .select('id')
      .single()
    if (error || !row) return ack?.({ success: false, error: 'Failed to start call' })

    const call: LiveCall = {
      id: (row as { id: string }).id,
      chatId,
      hostId: userId,
      mode,
      joined: new Set([userId]),
      invited: new Map(),
      connected: false
    }
    liveCalls.set(call.id, call)
    await ring(ctx, call, targets, userId)

    ack?.({ success: true, call: { id: call.id }, invited: await lookupPeople(admin, targets) })
  })

  socket.on('call:add', async (data: { callId?: string, userIds?: string[] }, ack?: (result: unknown) => void) => {
    const userId = socket.userId
    const call = data?.callId ? liveCalls.get(data.callId) : undefined
    if (!userId || !call || !call.joined.has(userId)) return ack?.({ success: false, error: 'Not on this call' })

    const candidates = [...new Set(data.userIds ?? [])].filter(id => id !== userId && !call.joined.has(id) && !call.invited.has(id))
    if (occupancy(call) + candidates.length > MAX_CALL_PARTICIPANTS) {
      return ack?.({ success: false, error: `A call can have at most ${MAX_CALL_PARTICIPANTS} people` })
    }

    const allowed: string[] = []
    for (const id of candidates) {
      if ((await isMember(call.chatId, id)) || (await sharesChat(admin, userId, id))) allowed.push(id)
    }
    if (!allowed.length) return ack?.({ success: false, error: 'Nobody to add' })

    await ring(ctx, call, allowed, userId)
    const added = await lookupPeople(admin, allowed)
    for (const other of call.joined) {
      if (other !== userId) io.to(userRoom(other)).emit('call:participants-invited', { callId: call.id, people: added })
    }
    ack?.({ success: true, invited: added })
  })

  socket.on('call:accept', async (data: { callId?: string }) => {
    const userId = socket.userId
    const call = data?.callId ? liveCalls.get(data.callId) : undefined
    if (!userId || !call || !call.invited.has(userId)) {
      if (userId && data?.callId) socket.emit('call:ended', { callId: data.callId })
      return
    }

    clearTimeout(call.invited.get(userId))
    call.invited.delete(userId)
    const existing = [...call.joined]
    call.joined.add(userId)

    if (!call.connected) {
      call.connected = true
      await admin
        .from('call_sessions')
        .update({ status: 'CONNECTED', started_at: new Date().toISOString() })
        .eq('id', call.id)
    }

    const [joiner] = await lookupPeople(admin, [userId])
    for (const other of existing) {
      io.to(userRoom(other)).emit('call:participant-joined', { callId: call.id, person: joiner })
    }
    socket.emit('call:accepted', { callId: call.id, participants: await lookupPeople(admin, existing) })
    // The same account may be ringing on another device.
    socket.to(userRoom(userId)).emit('call:ended', { callId: call.id })
  })

  socket.on('call:reject', async (data: { callId?: string }) => {
    const call = data?.callId ? liveCalls.get(data.callId) : undefined
    if (socket.userId && call) await removeParticipant(ctx, call, socket.userId, 'declined')
  })

  socket.on('call:end', async (data: { callId?: string }) => {
    const call = data?.callId ? liveCalls.get(data.callId) : undefined
    if (socket.userId && call) await removeParticipant(ctx, call, socket.userId, 'left')
  })

  socket.on('call:signal', (data: { callId?: string, targetUserId?: string, payloadType?: string, payload?: unknown }) => {
    const userId = socket.userId
    const call = data?.callId ? liveCalls.get(data.callId) : undefined
    if (!userId || !call || !data.payload || !call.joined.has(userId)) return

    const target = data.targetUserId ?? (call.joined.size === 2 ? [...call.joined].find(id => id !== userId) : undefined)
    if (!target || !call.joined.has(target)) return

    io.to(userRoom(target)).emit('call:signal', {
      callId: call.id,
      senderId: userId,
      payloadType: data.payloadType,
      payload: data.payload
    })
  })

  socket.on('disconnect', async () => {
    const userId = socket.userId
    if (!userId || (await isOnline(io, userId))) return
    for (const call of [...liveCalls.values()]) {
      if (call.joined.has(userId) || call.invited.has(userId)) await removeParticipant(ctx, call, userId, 'left')
    }
  })
}
