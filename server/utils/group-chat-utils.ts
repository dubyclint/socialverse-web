// server/utils/group-chat-utils.ts
import { supabase } from './auth-utils'

export const groupChatOperations = {
  async createGroup(userId: string, data: any) {
    try {
      const { name, description } = data
      
      const { data: group, error } = await supabase
        .from('group_chats')
        .insert({
          name,
          description,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return group
    } catch (error) {
      console.error('[GroupChat] Create error:', error)
      throw error
    }
  },

  async addMember(groupId: string, memberId: string) {
    try {
      const { data: member, error } = await supabase
        .from('group_chat_members')
        .insert({
          group_id: groupId,
          user_id: memberId,
          joined_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return member
    } catch (error) {
      console.error('[GroupChat] Add member error:', error)
      throw error
    }
  },

  async removeMember(groupId: string, memberId: string) {
    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('[GroupChat] Remove member error:', error)
      throw error
    }
  },

  async getGroup(groupId: string) {
    try {
      const { data: group, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) throw error
      return group
    } catch (error) {
      console.error('[GroupChat] Get group error:', error)
      throw error
    }
  },

  async listGroups(userId: string) {
    try {
      const { data: groups, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('created_by', userId)

      if (error) throw error
      return groups
    } catch (error) {
      console.error('[GroupChat] List groups error:', error)
      throw error
    }
  }
}
