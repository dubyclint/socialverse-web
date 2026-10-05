<template>
  <div class="call-interface" v-if="call">
    <div class="call-overlay">
      <div class="call-content">
        <div class="call-header">
          <div class="call-info">
            <div v-if="!isGroupCall" class="caller-avatar">
              <img :src="call.peerAvatar || '/default-avatar.svg'" :alt="call.peerName" />
            </div>
            <div class="caller-details">
              <div class="caller-name">{{ headline }}</div>
              <div class="call-status">{{ getCallStatus() }}</div>
            </div>
          </div>

          <div class="call-timer" v-if="call.isActive">
            {{ formatCallDuration(callDuration) }}
          </div>
        </div>

        <div v-if="call.callType === 'video'" class="video-grid" :data-count="Math.min(participants.length + 1, 8)">
          <div v-for="person in participants" :key="person.userId" class="video-tile">
            <video
              v-if="person.stream"
              :ref="el => bindMedia(el, person.stream)"
              autoplay
              playsinline
            ></video>
            <img v-else :src="person.avatar || '/default-avatar.svg'" alt="" class="tile-avatar" />
            <span class="tile-name">{{ person.name }}<template v-if="person.state === 'ringing'"> · ringing</template></span>
          </div>
          <div class="video-tile self-tile">
            <video :ref="el => bindMedia(el, localStream ?? null)" autoplay playsinline muted></video>
            <span class="tile-name">You</span>
          </div>
        </div>

        <div v-else class="audio-visualization">
          <audio
            v-for="person in participants"
            :key="person.userId"
            :ref="el => bindMedia(el, person.stream)"
            autoplay
          ></audio>
          <div v-if="isGroupCall" class="audio-roster">
            <div v-for="person in participants" :key="person.userId" class="roster-person" :class="{ ringing: person.state === 'ringing' }">
              <img :src="person.avatar || '/default-avatar.svg'" alt="" />
              <span>{{ person.name }}</span>
            </div>
          </div>
          <div v-else class="audio-waves">
            <div
              v-for="n in 5"
              :key="n"
              class="wave-bar"
              :class="{ active: isAudioActive }"
              :style="{ animationDelay: (n * 0.1) + 's' }"
            ></div>
          </div>
        </div>

        <div v-if="showPicker" class="add-picker" role="dialog" aria-label="Add people to the call">
          <p class="add-picker-title">Add people ({{ participants.length + 1 }}/{{ maxParticipants }})</p>
          <p v-if="!availableCandidates.length" class="add-picker-empty">No one else to add.</p>
          <label v-for="person in availableCandidates" :key="person.userId" class="add-picker-row">
            <input
              v-model="picked"
              type="checkbox"
              :value="person.userId"
              :disabled="!picked.includes(person.userId) && participants.length + 1 + picked.length >= maxParticipants"
            >
            <img :src="person.avatar || '/default-avatar.svg'" alt="" />
            <span>{{ person.name }}</span>
          </label>
          <div class="add-picker-actions">
            <button type="button" @click="closePicker">Cancel</button>
            <button type="button" :disabled="!picked.length" @click="submitPicker">Ring {{ picked.length || '' }}</button>
          </div>
        </div>

        <div class="call-controls">
          <button
            class="control-btn mute-btn"
            :class="{ active: isMuted }"
            @click="$emit('toggleMute')"
          >
            <Icon :name="isMuted ? 'mic-off' : 'mic'" />
          </button>

          <button
            v-if="call.callType === 'video'"
            class="control-btn video-btn"
            :class="{ active: isVideoOff }"
            @click="$emit('toggleVideo')"
          >
            <Icon :name="isVideoOff ? 'video-off' : 'video'" />
          </button>

          <button
            v-if="call.isActive || !call.isIncoming"
            class="control-btn add-btn"
            title="Add people"
            :disabled="participants.length + 1 >= maxParticipants"
            @click="showPicker = true"
          >
            <Icon name="users" />
          </button>

          <button
            class="control-btn end-btn"
            @click="$emit('endCall')"
          >
            <Icon name="phone-off" />
          </button>
        </div>

        <div class="incoming-actions" v-if="call.isIncoming && !call.isActive">
          <button class="action-btn decline-btn" @click="$emit('rejectCall')">
            <Icon name="phone-off" />
          </button>
          <button class="action-btn accept-btn" @click="$emit('acceptCall')">
            <Icon name="phone" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import Icon from '@/components/ui/icon.vue'
import { MAX_CALL_PARTICIPANTS } from '~/composables/use-webrtc-call'
import type { ActiveCall, CallParticipant, CallPerson } from '~/composables/use-webrtc-call'

const props = defineProps<{
  call: ActiveCall | null
  localStream?: MediaStream | null
  participants: CallParticipant[]
  /** People who can be added to the call. */
  candidates?: CallPerson[]
  isMuted?: boolean
  isVideoOff?: boolean
}>()

const emit = defineEmits<{
  endCall: []
  acceptCall: []
  rejectCall: []
  toggleMute: []
  toggleVideo: []
  addParticipants: [userIds: string[]]
}>()

const maxParticipants = MAX_CALL_PARTICIPANTS
const callDuration = ref(0)
const isAudioActive = ref(false)
const callTimer = ref<ReturnType<typeof setInterval> | null>(null)
const audioTimer = ref<ReturnType<typeof setInterval> | null>(null)
const showPicker = ref(false)
const picked = ref<string[]>([])

const isGroupCall = computed(() => props.participants.length > 1)
const headline = computed(() => {
  if (!isGroupCall.value) return props.call?.peerName || props.participants[0]?.name || 'Unknown'
  const names = props.participants.map(p => p.name)
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ')
})

const availableCandidates = computed(() => {
  const present = new Set(props.participants.map(p => p.userId))
  return (props.candidates ?? []).filter(person => !present.has(person.userId))
})

const bindMedia = (el: Element | ComponentPublicInstance | null, stream: MediaStream | null) => {
  if (!(el instanceof HTMLMediaElement)) return
  if (el.srcObject !== stream) el.srcObject = stream
}

const closePicker = () => {
  showPicker.value = false
  picked.value = []
}

const submitPicker = () => {
  emit('addParticipants', [...picked.value])
  closePicker()
}

watch(
  () => props.call?.isActive,
  active => {
    if (active) startCallTimer()
    else stopCallTimer()
  }
)

const getCallStatus = () => {
  if (!props.call) return ''
  if (props.call.isIncoming && !props.call.isActive) {
    return isGroupCall.value ? `${props.call.peerName || 'Someone'} is calling the group…` : 'Incoming call...'
  }
  if (props.call.isActive) {
    const connected = props.participants.filter(p => p.state === 'connected').length
    return isGroupCall.value ? `${connected + 1} on the call` : 'Connected'
  }
  return 'Calling...'
}

const formatCallDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const startCallTimer = () => {
  if (callTimer.value) return
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

onMounted(() => {
  if (props.call?.isActive) startCallTimer()

  audioTimer.value = setInterval(() => {
    isAudioActive.value = Boolean(props.call?.isActive)
  }, 500)
})

onUnmounted(() => {
  stopCallTimer()
  if (audioTimer.value) clearInterval(audioTimer.value)
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

.video-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  margin: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  grid-auto-rows: minmax(120px, 1fr);
  min-height: 0;
}
.video-grid[data-count="2"] { grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .video-grid[data-count="2"] { grid-template-columns: 1fr 1fr; }
}
.video-tile {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-tile video { width: 100%; height: 100%; object-fit: cover; }
.self-tile video { transform: scaleX(-1); }
.tile-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
.tile-name {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  font-size: 12px;
}
.audio-roster {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  max-width: 520px;
}
.roster-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 88px;
  font-size: 12px;
  text-align: center;
}
.roster-person img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255, 255, 255, 0.4); }
.roster-person.ringing { opacity: 0.55; }
.add-picker {
  position: absolute;
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 32px));
  max-height: 50vh;
  overflow-y: auto;
  padding: 12px;
  border-radius: 14px;
  background: #0f172a;
  color: #fff;
  z-index: 2;
}
.add-picker-title { font-weight: 600; margin: 0 0 8px; }
.add-picker-empty { opacity: 0.7; font-size: 13px; }
.add-picker-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 14px; }
.add-picker-row input { width: auto; min-height: 0; }
.add-picker-row img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.add-picker-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.add-picker-actions button {
  padding: 6px 12px;
  border-radius: 8px;
  border: 0;
  background: #334155;
  color: #fff;
  cursor: pointer;
}
.add-picker-actions button:last-child { background: #4f46e5; }
.add-picker-actions button:disabled { opacity: 0.5; cursor: default; }
.control-btn:disabled { opacity: 0.4; cursor: default; }
</style>
