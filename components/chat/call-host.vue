<template>
  <div>
    <CallInterface
      v-if="call"
      :call="call"
      :local-stream="localStream"
      :remote-stream="remoteStream"
      :is-muted="isMuted"
      :is-video-off="isVideoOff"
      @accept-call="acceptCall"
      @reject-call="rejectCall"
      @end-call="hangUp"
      @toggle-mute="toggleMute"
      @toggle-video="toggleVideo"
    />
    <div v-if="error" class="call-error" role="alert" @click="error = null">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { useWebrtcCall } from '~/composables/use-webrtc-call'
import CallInterface from '~/components/chat/call-interface.vue'

const {
  call,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  error,
  acceptCall,
  rejectCall,
  hangUp,
  toggleMute,
  toggleVideo
} = useWebrtcCall()
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
