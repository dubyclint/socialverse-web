<template>
  <PewgiftPicker
    :recipient-id="recipientId || receiverId"
    :post-id="postId"
    :comment-id="commentId"
    :stream-id="streamId"
    :chat-id="chatId"
    :target-type="targetType"
    :disabled="disabled"
    @gift-sent="(payload) => emit('gift-sent', payload)"
    @error="(reason) => emit('error', reason)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PewgiftPicker from './pewgift-picker.vue'

const props = withDefaults(
  defineProps<{
    recipientId?: string
    receiverId?: string
    postId?: string
    commentId?: string
    streamId?: string
    chatId?: string
    targetType?: 'post' | 'comment' | 'stream' | 'chat'
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{
  'gift-sent': [payload: unknown]
  error: [reason: string]
}>()

const targetType = computed<'post' | 'comment' | 'stream' | 'chat'>(() => {
  if (props.targetType) return props.targetType
  if (props.streamId) return 'stream'
  if (props.chatId) return 'chat'
  if (props.commentId) return 'comment'
  return 'post'
})
</script>
