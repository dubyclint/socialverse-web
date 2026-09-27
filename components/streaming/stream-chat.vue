<!-- ============================================================================
     FILE: /components/streaming/StreamChat.vue
     Unified High-Performance WebSocket Live Chat Gateway, Presence Architecture,
     Pewgift Donation ,wire the Pewgift micro-donation modal directly into your atomic database engine
     ============================================================================ -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  streamId: { type: String, required: true },
  streamerId: { type: String, required: true },
  maxMessages: { type: Number, default: 100 }
})

const emit = defineEmits(['message-sent', 'user-joined', 'user-left', 'ad-triggered'])
const supabase = useSupabaseClient()

// Core Reactive States
const chatContainer = ref<HTMLElement | null>(null)
const messageInput = ref('')
const messages = ref<any[]>([])
const isConnected = ref(false)
const currentUser = ref<any>(null)
const onlineUsers = ref<any[]>([])
const isSending = ref(false)
const showUserList = ref(false)
const messageFilter = ref('all')
const searchQuery = ref('')
const autoScroll = ref(true)

// Step 3.1 & 3.2 Dynamic Live Ad Overlay Visual State Matrix
const incomingAdOverlay = ref<any | null>(null)
const adCountdown = ref(0)
let adTimerInstance: NodeJS.Timeout | null = null

// Pewgift Transaction Modals
const showPewgiftModal = ref(false)
const pewgiftAmount = ref<number | null>(null)
const isSendingPewgift = ref(false)

// Real-time Presence Realignment Channels
let liveChatChannel: any = null

// Filtered chat arrays optimized for UI render timelines
const filteredMessages = computed(() => {
  let result = messages.value
  if (messageFilter.value === 'gifts') {
    result = result.filter(m => m.is_gift)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => m.text?.toLowerCase().includes(q) || m.user?.username?.toLowerCase().includes(q))
  }
  return result
})

// Sub-layer Hook: Real-Time Inbound Event Channel Binding Listener
const initializeLiveChatBroker = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  currentUser.value = user

  // Initialize unified broadcast hub connection
  liveChatChannel = supabase.channel(`stream-chat:${props.streamId}`, {
    config: { presence: { key: user.id } }
  })

  liveChatChannel
    .on('broadcast', { event: 'chat-msg' }, ({ payload }: any) => {
      appendIncomingMessageNode(payload)
    })
    .on('broadcast', { event: 'pewgift-alert' }, ({ payload }: any) => {
      appendIncomingMessageNode({
        id: payload.id,
        text: `💎 Sent a $${Number(payload.amount).toFixed(2)} Pewgift Capital Donation!`,
        is_gift: true,
        created_at: new Date().toISOString(),
        user: payload.user
      })
    })
    // STEP 3.1: Intercept incoming promotional ad triggers broadcast over network
    .on('broadcast', { event: 'inject-ad-overlay' }, ({ payload }: any) => {
      processInboundAdTriggerEvent(payload)
    })
    .on('presence', { event: 'sync' }, () => {
      const state = liveChatChannel.presenceState()
      const users: any[] = []
      Object.keys(state).forEach(id => {
        if (state[id]) users.push({ id, ...state[id][0] })
      })
      onlineUsers.value = users
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        isConnected.value = true
        await liveChatChannel.track({
          username: user.email?.split('@') || 'Anonymous Node',
          joined_at: new Date().toISOString()
        })
      }
    })
}

const appendIncomingMessageNode = (msg: any) => {
  messages.value.push(msg)
  if (messages.value.length > props.maxMessages) {
    messages.value.shift()
  }
  if (autoScroll.value) {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
}

// Intercept ad triggers and propagate downstream to viewports
const processInboundAdTriggerEvent = (adPayload: any) => {
  if (!adPayload) return
  incomingAdOverlay.value = adPayload
  adCountdown.value = adPayload.duration || 15
  emit('ad-triggered', adPayload)

  if (adTimerInstance) clearInterval(adTimerInstance)
  adTimerInstance = setInterval(() => {
    if (adCountdown.value > 1) {
      adCountdown.value--
    } else {
      clearLocalAdTimerFrame()
    }
  }, 1000)
}

const clearLocalAdTimerFrame = () => {
  incomingAdOverlay.value = null
  adCountdown.value = 0
  if (adTimerInstance) {
    clearInterval(adTimerInstance)
    adTimerInstance = null
  }
}

// Dispatches standard conversational payloads over real-time link
const sendChatMessage = async () => {
  if (!messageInput.value.trim() || isSending.value || !liveChatChannel) return
  
  try {
    isSending.value = true
    const payload = {
      id: crypto.randomUUID(),
      text: messageInput.value.trim(),
      is_gift: false,
      created_at: new Date().toISOString(),
      user: {
        id: currentUser.value?.id,
        username: currentUser.value?.email?.split('@') || 'User Node'
      }
    }

    await liveChatChannel.send({
      type: 'broadcast',
      event: 'chat-msg',
      payload
    })

    appendIncomingMessageNode(payload)
    messageInput.value = ''
  } catch (err) {
    console.error('❌ WebSocket message failed to send:', err)
  } finally {
    isSending.value = false
  }
}

// HARDENED DATABASE LAYER TRIGGER LINK: Invoke high-integrity RPC function
const executePewgiftDonation = async () => {
  if (!pewgiftAmount.value || pewgiftAmount.value <= 0 || isSendingPewgift.value) return

  try {
    isSendingPewgift.value = true

    // Fire the atomic micro-donation transaction handler compiled inside your database
    const { data: rpcSuccess, error: rpcError } = await supabase.rpc('process_live_pewgift', {
      target_streamer_id: props.streamerId,
      gift_amount: pewgiftAmount.value
    })

    if (rpcError) throw rpcError

    if (rpcSuccess) {
      // Announce the completed ledger transaction on the live chat network channel
      await liveChatChannel.send({
        type: 'broadcast',
        event: 'pewgift-alert',
        payload: {
          id: crypto.randomUUID(),
          amount: pewgiftAmount.value,
          user: {
            id: currentUser.value?.id,
            username: currentUser.value?.email?.split('@') || 'Supporter Node'
          }
        }
      })

      appendIncomingMessageNode({
        id: crypto.randomUUID(),
        text: `💎 Sent a $${pewgiftAmount.value.toFixed(2)} Pewgift Capital Donation!`,
        is_gift: true,
        created_at: new Date().toISOString(),
        user: {
          id: currentUser.value?.id,
          username: currentUser.value?.email?.split('@') || 'You'
        }
      })

      showPewgiftModal.value = false
      pewgiftAmount.value = null
      alert('💎 Pewgift authorized, verified, and settled successfully!')
    } else {
      alert('Transaction halted: Wallet validation engine returned a processing error.')
    }
  } catch (err: any) {
    console.error('❌ Pewgift Engine Core processing failed:', err)
    alert(err.message || 'Ledger validation error: Insufficient token balances available.')
  } finally {
    isSendingPewgift.value = false
  }
}

onMounted(() => {
  initializeLiveChatBroker()
})

onUnmounted(() => {
  if (adTimerInstance) clearInterval(adTimerInstance)
  if (liveChatChannel) liveChatChannel.unsubscribe()
})
</script>

<template>
  <div class="flex flex-col h-full bg-slate-950 border-l border-slate-900 overflow-hidden relative">
    
    <div class="p-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <h2 class="text-xs font-black text-white uppercase tracking-wider">Live Activity Bridge</h2>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showUserList = !showUserList" :class="['p-1.5 rounded-md text-slate-400 hover:text-white transition-colors', showUserList ? 'bg-slate-900 text-white' : '']" title="Active Rosters">
          👥 <span class="text-[10px] font-mono ml-0.5">{{ onlineUsers.length }}</span>
        </button>
      </div>
    </div>

    <div v-if="showUserList" class="bg-slate-900 border-b border-slate-800 p-3 max-h-36 overflow-y-auto custom-scrollbar text-[11px] space-y-1">
      <span class="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Connected Target Operators</span>
      <div v-for="u in onlineUsers" :key="u.id" class="flex items-center justify-between text-slate-300 font-mono py-0.5">
        <span>⚡ {{ u.username }}</span>
        <span class="text-[8px] text-slate-600">online</span>
      </div>
    </div>

    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-950/20">
      <div v-for="msg in filteredMessages" :key="msg.id" :class="['p-2.5 rounded-xl border transition-all text-xs', msg.is_gift ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse' : 'bg-slate-900/40 border-slate-900']">
        <div class="flex items-baseline justify-between mb-0.5">
          <span :class="['font-black font-sans tracking-wide', msg.is_gift ? 'text-amber-400' : 'text-indigo-400']">
            {{ msg.user?.username || 'Anonymous Node' }}
          </span>
          <span class="text-[9px] text-slate-600 font-mono">
            {{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
          </span>
        </div>
        <p :class="['leading-relaxed break-words font-medium', msg.is_gift ? 'text-amber-200 font-bold' : 'text-slate-300']">
          {{ msg.text }}
        </p>
      </div>
    </div>

    <div class="p-3 border-t border-slate-900 bg-slate-950 space-y-2">
      <form @submit.prevent="sendChatMessage" class="flex items-center gap-2">
        <button type="button" @click="showPewgiftModal = true" class="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs p-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex-shrink-0" title="Inject Capital Pewgift">
          💎
        </button>
        <input 
          v-model="messageInput" 
          type="text" 
          placeholder="Send transactional telemetry info..." 
          class="flex-1 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button type="submit" :disabled="!messageInput.trim() || isSending" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow active:scale-95 flex-shrink-0">
          Send
        </button>
      </form>
    </div>

    <div v-if="showPewgiftModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="showPewgiftModal = false">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-sm p-5 rounded-xl shadow-2xl space-y-4" @click.stop>
        <div>
          <h4 class="text-sm font-black text-white tracking-tight flex items-center gap-1.5">💎 Send Micro-Pewgift Capital Injection</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Authorizes immediate transfer from your fluid balance pool straight to this live stream host node anchor.</p>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Transfer Amount ($ USD)</label>
            <input v-model.number="pewgiftAmount" type="number" min="0.10" step="0.01" placeholder="0.00" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none font-mono" />
          </div>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button @click="showPewgiftModal = false" class="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
            <button @click="executePewgiftDonation" :disabled="!pewgiftAmount || pewgiftAmount <= 0 || isSendingPewgift" class="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition-colors shadow">
              {{ isSendingPewgift ? 'Settling Pool...' : 'Authorize Vault Payout' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
