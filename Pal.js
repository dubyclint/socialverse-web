// Pal.js - Supabase PostgreSQL Model
import { supabase } from './utils/supabase.js';

export class Pal {
  static async create(palData) {
    const { data, error } = await supabase
      .from('pals')
      .insert([{
        requester_id: palData.requesterId,
        addressee_id: palData.addresseeId,
        status: palData.status || 'pending'
      }])
      .select(`
        *,
        requester:requester_id(username, avatar_url),
        addressee:addressee_id(username, avatar_url)
      `);

    if (error) throw error;
    return data[0];
  }

  static async getById(palId) {
    const { data, error } = await supabase
      .from('pals')
      .select(`
        *,
        requester:requester_id(username, avatar_url),
        addressee:addressee_id(username, avatar_url)
      `)
      .eq('id', palId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getPalsByUser(userId) {
    const { data, error } = await supabase
      .from('pals')
      .select(`
        *,
        requester:requester_id(username, avatar_url),
        addressee:addressee_id(username, avatar_url)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateStatus(palId, status) {
    const { data, error } = await supabase
      .from('pals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', palId)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async delete(palId) {
    const { error } = await supabase
      .from('pals')
      .delete()
      .eq('id', palId);

    if (error) throw error;
    return true;
  }
}
