// server/api/chat/translate.post.ts - TRANSLATE MESSAGE IN CHAT
// ==============================================================

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyAuth(event, { requireAuth: true })
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { text, targetLang, messageId, contentId } = body

    if (!text || !targetLang) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text and target language are required'
      })
    }

    // Use translation service (Google Translate, DeepL, etc.)
    // This is a placeholder - implement with your chosen service
    const translatedText = await translateText(text, targetLang)

    // Cache translation in Supabase
    const supabase = await serverSupabaseClient(event)
    
    if (messageId) {
      await supabase
        .from('message_translations')
        .insert({
          message_id: messageId,
          original_text: text,
          translated_text: translatedText,
          target_language: targetLang,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .catch(err => console.error('Cache translation error:', err))
    }

    return {
      success: true,
      data: {
        translatedText,
        sourceLang: 'auto',
        targetLang,
        messageId
      }
    }

  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
})

// Helper function to translate text
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Example using Google Translate API
    // You need to set up your translation service
    
    // For now, return placeholder
    // TODO: Implement with actual translation service
    
    // Example with Google Translate:
    // const translate = require('google-translate-api-x');
    // const result = await translate(text, { to: targetLang });
    // return result.text;

    // Placeholder implementation
    return `[Translated to ${targetLang}]: ${text}`;
  } catch (error) {
    console.error('Translation service error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Translation service unavailable'
    });
  }
}

---

// server/api/chat/gift.post.ts - SEND GIFT IN CHAT
// ==================================================

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyAuth(event, { requireAuth: true })
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { recipientId, giftId, giftAmount, message: giftMessage, messageId } = body

    if (!recipientId || !giftId || !giftAmount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recipient, gift, and amount are required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Check sender balance
    const { data: senderBalance } = await supabase
      .from('pewgift_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (!senderBalance || senderBalance.balance < giftAmount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Insufficient balance'
      })
    }

    // Create gift transaction
    const giftId_unique = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: giftTransaction, error: giftError } = await supabase
      .from('pewgift_transactions')
      .insert({
        id: giftId_unique,
        sender_id: user.id,
        recipient_id: recipientId,
        gift_id: giftId,
        amount: giftAmount,
        message: giftMessage,
        message_id: messageId,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (giftError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send gift',
        data: giftError
      })
    }

    // Deduct from sender balance
    await supabase
      .from('pewgift_balance')
      .update({
        balance: senderBalance.balance - giftAmount
      })
      .eq('user_id', user.id)

    // Add to recipient balance
    const { data: recipientBalance } = await supabase
      .from('pewgift_balance')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (recipientBalance) {
      await supabase
        .from('pewgift_balance')
        .update({
          balance: recipientBalance.balance + giftAmount
        })
        .eq('user_id', recipientId)
    } else {
      await supabase
        .from('pewgift_balance')
        .insert({
          user_id: recipientId,
          balance: giftAmount
        })
    }

    // Create notification for recipient
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'gift_received',
        title: `${user.username} sent you a gift!`,
        message: giftMessage,
        data: {
          giftId: giftId_unique,
          senderId: user.id,
          senderName: user.username,
          amount: giftAmount,
          messageId
        },
        created_at: new Date().toISOString()
      })
      .catch(err => console.error('Notification error:', err))

    return {
      success: true,
      data: {
        giftId: giftId_unique,
        recipientId,
        amount: giftAmount,
        message: giftMessage,
        timestamp: new Date().toISOString()
      },
      message: 'Gift sent successfully'
    }

  } catch (error) {
    console.error('Send gift error:', error)
    throw error
  }
})
