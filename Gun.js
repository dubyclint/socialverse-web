// Gun.js data structure for messages
const gunMessageSchema = {
  // Message node: ~@messageId
  messageId: {
    id: 'unique_message_id',
    conversationId: 'conversation_uuid',
    senderId: 'sender_uuid',
    content: 'encrypted_message_content',
    timestamp: 1234567890,
    type: 'text|image|video|audio|file',
    replyTo: 'parent_message_id',
    editedAt: 1234567890,
    // Encrypted with conversation key
  },
  
  // Conversation node: ~@conversationId
  conversationId: {
    participants: ['user1_id', 'user2_id'],
    lastMessage: 'message_id',
    lastActivity: 1234567890,
    // Each participant has their own encrypted copy
  }
}
