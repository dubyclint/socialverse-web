// services/notification.ts
import { api } from '~/lib/api'

export const notificationService = {
  // Mapping your schema columns: recipient_id, event_type, message_text
  async send(payload: { recipient_id: string, event_type: string, message_text: string, source_id?: string }) {
    return await api('/notifications', { 
      method: 'POST', 
      body: payload 
    })
  },
  
  async getMyNotifications() {
    return await api('/notifications')
  },
  
  async markAsRead(id: string) {
    return await api(`/notifications/${id}`, { 
      method: 'PATCH', 
      body: { is_read: true } 
    })
  }
}
