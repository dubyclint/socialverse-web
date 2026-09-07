// FILE: /server/api/support/chat.ts
// ============================================================================
// SUPPORT CHAT API - CORRECTED VERSION
// ============================================================================
// ✅ Validates user existence before creating sessions
// ✅ Validates agent existence
// ✅ Uses authenticated user (not client-provided)
// ✅ Proper error handling and logging
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'
import { getMethod } from 'h3'

interface ChatSessionRequest {
  action: 'start' | 'message' | 'end' | 'escalate'
  sessionId?: string
  agentId?: string
  sender?: string
  content?: string
}

interface ChatMessage {
  sender: string
  content: string
  timestamp: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    console.log('[Support Chat API] Processing request...')

    const method = getMethod(event)
    const supabase = await serverSupabaseClient(event)

    // ============================================================================
    // GET: Retrieve user's chat sessions
    // ============================================================================
    if (method === 'GET') {
      console.log('[Support Chat API] GET - Retrieving sessions')

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user?.id) {
        console.error('[Support Chat API] ❌ Unauthorized')
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized'
        })
      }

      const userId = user.id
      console.log('[Support Chat API] Fetching sessions for user:', userId)

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })

      if (error) {
        console.error('[Support Chat API] ❌ Fetch error:', error.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch sessions: ' + error.message
        })
      }

      console.log('[Support Chat API] ✅ Retrieved', sessions?.length || 0, 'sessions')
      return sessions || []
    }

    // ============================================================================
    // POST: Handle chat actions
    // ============================================================================
    if (method === 'POST') {
      const body = await readBody<ChatSessionRequest>(event)
      console.log('[Support Chat API] POST - Action:', body.action)

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user?.id) {
        console.error('[Support Chat API] ❌ Unauthorized')
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized'
        })
      }

      const userId = user.id

      // ========================================================================
      // ACTION: START - Create new chat session
      // ========================================================================
      if (body.action === 'start') {
        console.log('[Support Chat API] Starting new session for user:', userId)

        // Validate agent exists
        if (!body.agentId) {
          console.error('[Support Chat API] ❌ Missing agentId')
          throw createError({
            statusCode: 400,
            statusMessage: 'Agent ID is required'
          })
        }

        // ✅ VALIDATION 1: Check if user exists in user table
        console.log('[Support Chat API] Validating user existence...')
        const { data: userProfile, error: userError } = await supabase
          .from('user')
          .select('user_id, display_name, profile_completed')
          .eq('user_id', userId)
          .single()

        if (userError || !userProfile) {
          console.error('[Support Chat API] ❌ User not found:', userError?.message)
          throw createError({
            statusCode: 404,
            statusMessage: 'User profile not found'
          })
        }

        // ✅ VALIDATION 2: Check if agent exists
        console.log('[Support Chat API] Validating agent existence...')
        const { data: agent, error: agentError } = await supabase
          .from('support_agents')
          .select('agent_id, name, active')
          .eq('agent_id', body.agentId)
          .single()

        if (agentError || !agent) {
          console.error('[Support Chat API] ❌ Agent not found:', agentError?.message)
          throw createError({
            statusCode: 404,
            statusMessage: 'Support agent not found'
          })
        }

        if (!agent.active) {
          console.error('[Support Chat API] ❌ Agent is not active')
          throw createError({
            statusCode: 400,
            statusMessage: 'Selected agent is not available'
          })
        }

        // ✅ Create session with validated data
        const sessionData = {
          session_id: crypto.randomUUID(),
          user_id: userId,  // ← From authenticated user, not request body
          agent_id: body.agentId,
          started_at: new Date().toISOString(),
          status: 'open',
          messages: [],
          user_name: userProfile.display_name  // Store for reference
        }

        console.log('[Support Chat API] Creating session:', sessionData.session_id)

        const { data: session, error } = await supabase
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (error) {
          console.error('[Support Chat API] ❌ Insert error:', error.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create session: ' + error.message
          })
        }

        console.log('[Support Chat API] ✅ Session created:', session.session_id)
        return session
      }

      // ========================================================================
      // ACTION: MESSAGE - Add message to session
      // ========================================================================
      if (body.action === 'message') {
        if (!body.sessionId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Session ID is required'
          })
        }

        if (!body.content) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Message content is required'
          })
        }

        console.log('[Support Chat API] Adding message to session:', body.sessionId)

        // ✅ Verify session belongs to authenticated user
        const { data: session, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('messages, user_id, status')
          .eq('session_id', body.sessionId)
          .single()

        if (fetchError || !session) {
          console.error('[Support Chat API] ❌ Session not found:', fetchError?.message)
          throw createError({
            statusCode: 404,
            statusMessage: 'Chat session not found'
          })
        }

        // ✅ Verify user owns this session
        if (session.user_id !== userId) {
          console.error('[Support Chat API] ❌ Unauthorized - user does not own session')
          throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized to access this session'
          })
        }

        if (session.status !== 'open') {
          console.error('[Support Chat API] ❌ Session is not open')
          throw createError({
            statusCode: 400,
            statusMessage: 'Cannot add message to closed session'
          })
        }

        const messages: ChatMessage[] = [
          ...(session.messages || []),
          {
            sender: body.sender || 'user',
            content: body.content.trim(),
            timestamp: new Date().toISOString()
          }
        ]

        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ messages })
          .eq('session_id', body.sessionId)

        if (updateError) {
          console.error('[Support Chat API] ❌ Update error:', updateError.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to add message: ' + updateError.message
          })
        }

        console.log('[Support Chat API] ✅ Message added')
        return { success: true }
      }

      // ========================================================================
      // ACTION: END - Close chat session
      // ========================================================================
      if (body.action === 'end') {
        if (!body.sessionId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Session ID is required'
          })
        }

        console.log('[Support Chat API] Closing session:', body.sessionId)

        // ✅ Verify session belongs to authenticated user
        const { data: session, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('user_id')
          .eq('session_id', body.sessionId)
          .single()

        if (fetchError || !session) {
          console.error('[Support Chat API] ❌ Session not found')
          throw createError({
            statusCode: 404,
            statusMessage: 'Chat session not found'
          })
        }

        if (session.user_id !== userId) {
          console.error('[Support Chat API] ❌ Unauthorized - user does not own session')
          throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized to access this session'
          })
        }

        const { error } = await supabase
          .from('chat_sessions')
          .update({
            status: 'closed',
            ended_at: new Date().toISOString()
          })
          .eq('session_id', body.sessionId)

        if (error) {
          console.error('[Support Chat API] ❌ Update error:', error.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to close session: ' + error.message
          })
        }

        console.log('[Support Chat API] ✅ Session closed')
        return { success: true }
      }

      // ========================================================================
      // ACTION: ESCALATE - Escalate to senior agent
      // ========================================================================
      if (body.action === 'escalate') {
        if (!body.sessionId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Session ID is required'
          })
        }

        console.log('[Support Chat API] Escalating session:', body.sessionId)

        // ✅ Find available senior agent
        const { data: senior, error: agentError } = await supabase
          .from('support_agents')
          .select('agent_id, name')
          .contains('assigned_features', ['escalation'])
          .eq('active', true)
          .single()

        if (agentError || !senior) {
          console.error('[Support Chat API] ❌ No senior agent available')
          throw createError({
            statusCode: 503,
            statusMessage: 'No senior agent available for escalation'
          })
        }

        // ✅ Verify session belongs to authenticated user
        const { data: session, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('messages, user_id')
          .eq('session_id', body.sessionId)
          .single()

        if (fetchError || !session) {
          console.error('[Support Chat API] ❌ Session not found')
          throw createError({
            statusCode: 404,
            statusMessage: 'Chat session not found'
          })
        }

        if (session.user_id !== userId) {
          console.error('[Support Chat API] ❌ Unauthorized - user does not own session')
          throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized to access this session'
          })
        }

        const messages: ChatMessage[] = [
          ...(session.messages || []),
          {
            sender: 'system',
            content: `Session escalated to ${senior.name}`,
            timestamp: new Date().toISOString()
          }
        ]

        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({
            status: 'escalated',
            escalated_to: senior.agent_id,
            messages
          })
          .eq('session_id', body.sessionId)

        if (updateError) {
          console.error('[Support Chat API] ❌ Update error:', updateError.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to escalate session: ' + updateError.message
          })
        }

        console.log('[Support Chat API] ✅ Session escalated to:', senior.agent_id)
        return { success: true }
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action'
      })
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })

  } catch (error: any) {
    console.error('[Support Chat API] ❌ Error:', error.message)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to handle support chat',
      data: { details: error.message }
    })
  }
})

