<!-- components/chat/CallInterface.vue -->
<template>
  <div class="call-interface" v-if="call">
    <div class="call-overlay">
      <div class="call-content">
        <!-- Call Header -->
        <div class="call-header">
          <div class="call-info">
            <div class="caller-avatar">
              <img :src="call.caller?.avatar || '/default-avatar.png'" :alt="call.caller?.username" />
            </div>
            <div class="caller-details">
              <div class="caller-name">{{ call.caller?.username }}</div>
              <div class="call-status">{{ getCallStatus() }}</div>
            </div>
          </div>
          
          <div class="call-timer" v-if="call.isActive">
            {{ formatCallDuration(callDuration) }}
          </div>
        </div>

        <!-- Video Container -->
        <div class="video-container" v-if="call.callType === 'video'">
          <video ref="remoteVideo" class="remote-video" autoplay></video>
          <video ref="localVideo" class="local-video" autoplay muted></video>
        </div>

        <!-- Audio Visualization -->
        <div class="audio-visualization" v-else>
          <div class="audio-waves">
            <div 
              v-for="n in 5" 
              :key="n"
              class="wave-bar"
              :class="{ active: isAudioActive }"
              :style="{ animationDelay: (n * 0.1) + 's' }"
            ></div>
          </div>
        </div>

        <!-- Call Controls -->
        <div class="call-controls">
          <button 
            class="control-btn mute-btn"
            :class="{ active: call.isMuted }"
            @click="$emit('toggleMute')"
          >
            <Icon :name="call.isMuted ? 'mic-off' : 'mic'" />
          </button>

          <button 
            v-if="call.callType === 'video'"
            class="control-btn video-btn"
            :class="{ active: !call.isVideoEnabled }"
            @click="$emit('toggleVideo')"
          >
            <Icon :name="call.isVideoEnabled ? 'video' : 'video-off'" />
          </button>

          <button class="control-btn speaker-btn">
            <Icon name="volume-2" />
          </button>

          <button 
            class="control-btn end-btn"
            @click="$emit('endCall')"
          >
            <Icon name="phone-off" />
          </button>
        </div>

        <!-- Incoming Call Actions -->
        <div class="incoming-actions" v-if="call.isIncoming && !call.isActive">
          <button class="action-btn decline-btn" @click="$emit('endCall')">
            <Icon name="phone-off" />
          </button>
          <button class="action-btn accept-btn" @click="acceptCall">
            <Icon name="phone" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Icon from '@/components/ui/Icon.vue'

// Props
const props = defineProps({
  call: Object
})

// Emits
const emit = defineEmits(['endCall', 'toggleMute', 'toggleVideo'])

// Reactive data
const callDuration = ref(0)
const isAudioActive = ref(false)
const callTimer = ref(null)

// Refs
const remoteVideo = ref(null)
const localVideo = ref(null)

// Computed
const getCallStatus = () => {
  if (!props.call) return ''
  
  if (props.call.isIncoming && !props.call.isActive) {
    return 'Incoming call...'
  } else if (props.call.isActive) {
    return 'Connected'
  } else {
    return 'Calling...'
  }
}

// Methods
const formatCallDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const acceptCall = () => {
  // Handle call acceptance
  console.log('Accept call')
  startCallTimer()
}

const startCallTimer = () => {
  callTimer.value = setInterval(() => {
    callDuration.value++
  }, 1000)
}

const stopCallTimer = () => {
  if (callTimer.value) {
    clearInterval(callTimer.value)
    callTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  if (props.call?.isActive) {
    startCallTimer()
  }
  
  // Simulate audio activity
  setInterval(() => {
    isAudioActive.value = Math.random() > 0.5
  }, 500)
})

onUnmounted(() => {
  stopCallTimer()
})
</script>

<style scoped>
.call-interface {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.call-overlay {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1976d2, #1565c0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}

.call-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 20px 20px;
}

.call-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.caller-avatar {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.caller-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.caller-details {
  text-align: center;
}

.caller-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.call-status {
  font-size: 16px;
  opacity: 0.8;
}

.call-timer {
  font-size: 18px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
}

.video-container {
  flex: 1;
  position: relative;
  margin: 20px;
  border-radius: 16px;
  overflow: hidden;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: rgba(0, 0, 0, 0.3);
}

.local-video {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.audio-visualization {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.audio-waves {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-bar {
  width: 4px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.wave-bar.active {
  background: white;
  animation: wave 1s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 20px; }
  50% { height: 40px; }
}

.call-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.control-btn.active {
  background: rgba(244, 67, 54, 0.8);
}

.control-btn svg {
  width: 24px;
  height: 24px;
}

.end-btn {
  background: #f44336;
}

.end-btn:hover {
  background: #d32f2f;
}

.incoming-actions {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 40px 60px;
}

.action-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
}

.action-btn svg {
  width: 32px;
  height: 32px;
}

.decline-btn {
  background: #f44336;
}

.decline-btn:hover {
  background: #d32f2f;
  transform: scale(1.05);
}

.accept-btn {
  background: #4caf50;
}

.accept-btn:hover {
  background: #388e3c;
  transform: scale(1.05);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .call-header {
    padding: 20px 16px 16px;
  }
  
  .caller-avatar {
    width: 100px;
    height: 100px;
  }
  
  .caller-name {
    font-size: 20px;
  }
  
  .call-status {
    font-size: 14px;
  }
  
  .local-video {
    width: 100px;
    height: 130px;
    top: 16px;
    right: 16px;
  }
  
  .call-controls {
    gap: 16px;
    padding: 30px 16px;
  }
  
  .control-btn {
    width: 50px;
    height: 50px;
  }
  
  .control-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .incoming-actions {
    padding: 30px 40px;
  }
  
  .action-btn {
    width: 70px;
    height: 70px;
  }
  
  .action-btn svg {
    width: 28px;
    height: 28px;
  }
}
</style>
