import { serverSupabaseClient } from '#supabase/server';
import { requireAdmin } from '~/server/utils/token-validator';
import { logAdminAction } from '~/server/utils/admin-logger';
import { sendPush } from '~/push-engine';
import type { H3Event } from 'h3';

export class AdminController {
  
  /**
   * Helper to initialize Supabase and authorize admin in one step
   */
  private static async getAdminClient(event: H3Event) {
    await requireAdmin(event);
    return serverSupabaseClient(event);
  }

  static async getDashboardStats(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { data, error } = await client.rpc('get_admin_stats');
    if (error) throw error;
    return { success: true, data };
  }

  static async getUsers(event: H3Event) {
    const client = await this.getAdminClient(event);
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 50;
    const offset = parseInt(query.offset as string) || 0;

    const { data: users, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, data: users || [] };
  }

  static async banUser(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { userId, reason } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: user, error } = await client
      .from('users')
      .update({ is_banned: true, ban_reason: reason })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'user_ban', userId, 'user', { reason });
    if (user?.device_token) {
      await sendPush(user.device_token, '⛔ Account Banned', `Reason: ${reason}`);
    }
    return { success: true, data: user };
  }

  static async unbanUser(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { userId } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: user, error } = await client
      .from('users')
      .update({ is_banned: false, ban_reason: null })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'user_unban', userId, 'user');
    if (user?.device_token) {
      await sendPush(user.device_token, '✅ Account Restored', 'Your account has been restored.');
    }
    return { success: true, data: user };
  }

  static async verifyUser(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { userId, verified } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: user, error } = await client
      .from('users')
      .update({ is_verified: verified })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, verified ? 'user_verify' : 'user_unverify', userId, 'user');
    return { success: true, data: user };
  }

  static async getPosts(event: H3Event) {
    const client = await this.getAdminClient(event);
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 50;
    const flaggedOnly = query.flagged === 'true';

    let q = client.from('posts').select('*');
    if (flaggedOnly) q = q.eq('flagged', true);

    const { data: posts, error } = await q
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data: posts || [] };
  }

  static async flagPost(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { postId, reason } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: post, error } = await client
      .from('posts')
      .update({ flagged: true, flag_reason: reason })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'post_flag', postId, 'post', { reason });
    return { success: true, data: post };
  }

  static async deletePost(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { postId, reason } = await readBody(event);
    const adminId = event.context.user.id;

    const { error } = await client
      .from('posts')
      .delete()
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'post_delete', postId, 'post', { reason });
    return { success: true, message: 'Post deleted' };
  }

  static async getMatchRequests(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { data: requests, error } = await client
      .from('match_requests')
      .select('*')
      .eq('approved_by_admin', false);

    if (error) throw error;
    return { success: true, data: requests || [] };
  }

  static async approveMatch(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { requestId, matchedUserId } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: request, error } = await client
      .from('match_requests')
      .update({ approved_by_admin: true, matched_user_id: matchedUserId })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'match_approve', requestId, 'match_request');
    return { success: true, data: request };
  }

  static async getPendingEscrows(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { data: escrows, error } = await client
      .from('escrow_trades')
      .select('*')
      .eq('status', 'disputed');

    if (error) throw error;
    return { success: true, data: escrows || [] };
  }

  static async releaseEscrow(event: H3Event) {
    const client = await this.getAdminClient(event);
    const { escrowId } = await readBody(event);
    const adminId = event.context.user.id;

    const { data: escrow, error } = await client
      .from('escrow_trades')
      .update({ status: 'released', is_released: true })
      .eq('id', escrowId)
      .select()
      .single();

    if (error) throw error;
    await logAdminAction(adminId, 'escrow_release', escrowId, 'escrow');
    return { success: true, data: escrow };
  }
}
