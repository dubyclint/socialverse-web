<!-- ============================================================================
     FILE: /pages/stream/index.vue
     Unified Streaming Layout Frame - Fixed via Native Auto-Imports
     ============================================================================ -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
// FIXED: Replaced alias pathways with hard relative referencing to eliminate the double-slash compiler bugs
import StreamChat from '~/components/streaming/stream-chat.vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const supabase = useSupabaseClient()

// Active Stream Node State Trackers
const streamId = ref('global-broadcast-node-01')
const streamerId = ref('8f24bca8-22d1-44bb-ba91-370df3bc0e11') // Target streamer account identifier

// FIXED: Cleaned out hidden non-breaking space Unicode tokens from the property string layout
const streamDetails = ref({
  title: 'Live Crypto Tokenomic Architecture and P2P Escrow Audit',
  description: 'Deep-dive review of decentralized ledger systems, automated database triggers, and performance tuning for low-latency full-stack apps.',
  viewers: 1420,
  isLive: true,
  startedAt: 'Just now'
})

// Ad Injection & Visual Overlay Trigger Receivers
const activeAdOverlay = ref<any | null>(null)
const adTimer = ref(0)
let localAdInterval: NodeJS.Timeout | null = null

// Catch Broadcast Event Injections from Sub-Components
const handleAdTriggeredEvent = (adPayload: any) => {
  if (!adPayload) return
  activeAdOverlay.value = adPayload
  adTimer.value = adPayload.duration || adPayload.durationMs / 1000 || 15

  if (localAdInterval) clearInterval(localAdInterval)
  
  localAdInterval = setInterval(() => {
    if (adTimer.value > 1) {
      adTimer.value--
    } else {
      clearActiveAdFrame()
    }
  }, 1000)
}

const clearActiveAdFrame = () => {
  activeAdOverlay.value = null
  adTimer.value = 0
  if (localAdInterval) {
    clearInterval(localAdInterval)
    localAdInterval = null
  }
}

onUnmounted(() => {
  if (localAdInterval) clearInterval(localAdInterval)
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 font-sans grid grid-cols-1 xl:grid-cols-4 h-screen overflow-hidden">
    
    <div class="xl:col-span-3 flex flex-col h-full overflow-y-auto border-r border-slate-900">
      
      <div class="relative bg-black aspect-video w-full flex-shrink-0 group flex items-center justify-center border-b border-slate-900 shadow-2xl">
        
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 z-10 pointer-events-none"></div>
        <div class="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse z-20">
          <span class="text-indigo-400 text-xl">📡</span>
        </div>

        <div class="absolute top-4 left-4 z-20 flex gap-2">
          <span class="bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> Live
          </span>
          <span class="bg-slate-900/90 backdrop-blur border border-slate-800 text-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-md shadow">
            👁️ {{ streamDetails.viewers.toLocaleString() }} Watching
          </span>
        </div>

        <Transition name="fade-slide">
          <div v-if="activeAdOverlay" class="absolute bottom-16 left-4 right-4 md:left-6 md:right-auto md:w-96 bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 p-4 rounded-xl shadow-2xl z-30 flex gap-4 items-center">
            <div class="w-12 h-12 rounded-lg bg-indigo-950 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xl overflow-hidden">
              <img v-if="activeAdOverlay.bannerUrl || activeAdOverlay.banner_url" :src="activeAdOverlay.bannerUrl || activeAdOverlay.banner_url" class="w-full h-full object-cover" alt="Campaign Banner" />
              <span v-else>🚀</span>
            </div>
            <div class="flex-1 min-w-0">
              <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">Sponsored Delivery</span>
              <h4 class="text-xs font-black text-white truncate mt-1 tracking-tight">{{ activeAdOverlay.title || 'Injected Ad Network Node' }}</h4>
              <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ activeAdOverlay.adType || 'Banner Overlay' }}</p>
            </div>
            <div class="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-lg p-2 min-w-[40px]">
              <span class="text-[9px] font-mono font-bold text-indigo-400">{{ adTimer }}s</span>
              <button @click="clearActiveAdFrame" class="text-[8px] uppercase font-black text-slate-500 hover:text-slate-300 mt-0.5 transition-colors">Skip</button>
            </div>
          </div>
        </Transition>

        <div class="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="flex gap-3">
            <button class="text-white hover:text-indigo-400 text-xs font-bold transition-colors">⏸️ Pause</button>
            <button class="text-white hover:text-indigo-400 text-xs font-bold transition-colors">🔊 85%</button>
          </div>
          <span class="text-slate-400 font-mono text-[10px] tracking-wider">1080p stream ingestion running stable</span>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <div class="space-y-1">
          <h1 class="text-xl font-black text-white tracking-tight leading-snug">{{ streamDetails.title }}</h1>
          <p class="text-xs text-slate-400 leading-relaxed max-w-4xl">{{ streamDetails.description }}</p>
        </div>

        <div class="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-indigo-400">
              AV
            </div>
            <div>
              <h3 class="text-xs font-black text-white tracking-wide">SocialVerse Dev Node Anchor</h3>
              <p class="text-[10px] text-slate-500 font-mono mt-0.5">Host UID: {{ streamerId.slice(0, 18) }}...</p>
            </div>
          </div>
          <button class="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-lg transition-all shadow">
            Follow Host Channel
          </button>
        </div>
      </div>
    </div>

    <div class="xl:col-span-1 h-full flex flex-col bg-slate-950 border-t xl:border-t-0 border-slate-900">
      <StreamChat 
        :streamId="streamId" 
        :streamerId="streamerId" 
        @ad-triggered="handleAdTriggeredEvent"
      />
    </div>

  </main>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
