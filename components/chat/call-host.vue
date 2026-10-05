<template>
  <div>
    <CallInterface
      v-if="call"
      :call="call"
      :local-stream="localStream"
      :participants="participants"
      :candidates="candidates"
      :is-muted="isMuted"
      :is-video-off="isVideoOff"
      @accept-call="acceptCall"
      @reject-call="rejectCall"
      @end-call="hangUp"
      @toggle-mute="toggleMute"
      @toggle-video="toggleVideo"
      @add-participants="addParticipants"
    />
    <div v-if="error" class="call-error" role="alert" @click="error = null">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebrtcCall } from '~/composables/use-webrtc-call'
import type { CallPerson } from '~/composables/use-webrtc-call'
import CallInterface from '~/components/chat/call-interface.vue'
import { useChatStore } from '~/stores/chat'

const {
  call,
  localStream,
  participants,
  isMuted,
  isVideoOff,
  error,
  acceptCall,
  addParticipants,
  rejectCall,
  hangUp,
  toggleMute,
  toggleVideo
} = useWebrtcCall()

const chatStore = useChatStore()

// Members of the call's chat first, then everyone the user has a direct chat with.
const candidates = computed<CallPerson[]>(() => {
  if (!call.value) return []
  const people = new Map<string, CallPerson>()
  for (const member of chatStore.chats.get(call.value.chatId)?.members ?? []) {
    people.set(member.userId, member)
  }
  for (const chat of chatStore.chats.values()) {
    if (chat.type === 'direct' && chat.userId && !people.has(chat.userId)) {
      people.set(chat.userId, { userId: chat.userId, name: chat.name || chat.username || 'Contact', avatar: chat.avatar })
    }
  }
  return [...people.values()]
})
</script>

<style scoped>
.call-error {
  position: fixed;
  left: 50%;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 70;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  background: #b91c1c;
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
}
</style>
