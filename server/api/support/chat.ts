import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);

    if (method === 'POST') {
      const body = await readBody(event);

      if (body.action === 'start') {
        const sessionData = {
          session_id: crypto.randomUUID(),
          user_id: body.userId,
          agent_id: body.agentId,
          started_at: new Date().toISOString(),
          status: 'open',
          messages: []
        };

        const { data: session, error } = await supabase
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single();
          
        if (error) throw error;
        return session;
      }

      if (body.action === 'message') {
        // Get current session
        const { data: session, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('messages')
          .eq('session_id', body.sessionId)
          .single();
          
        if (fetchError) throw fetchError;

        const messages = [...(session.messages || []), {
          sender: body.sender,
          content: body.content,
          timestamp: new Date().toISOString()
        }];

        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({ messages })
          .eq('session_id', body.sessionId);
          
        if (updateError) throw updateError;
        return { success: true };
      }

      if (body.action === 'end') {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            status: 'closed', 
            ended_at: new Date().toISOString() 
          })
          .eq('session_id', body.sessionId);
          
        if (error) throw error;
        return { success: true };
      }

      if (body.action === 'escalate') {
        const { data: senior, error: agentError } = await supabase
          .from('support_agents')
          .select('*')
          .contains('assigned_features', ['escalation'])
          .eq('active', true)
          .single();
          
        if (agentError) throw agentError;

        // Get current session
        const { data: session, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('messages')
          .eq('session_id', body.sessionId)
          .single();
          
        if (fetchError) throw fetchError;

        const messages = [...(session.messages || []), {
          sender: 'system',
          content: `Session escalated to ${senior.name}`,
          timestamp: new Date().toISOString()
        }];

        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({
            status: 'escalated',
            escalated_to: senior.agent_id,
            messages
          })
          .eq('session_id', body.sessionId);
          
        if (updateError) throw updateError;
        return { success: true };
      }
    }

    if (method === 'GET') {
      const { userId } = getQuery(event);
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
        
      if (error) throw error;
      return sessions || [];
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to handle support chat'
    });
  }
});

