<!-- ============================================================================
FILE: /components/monetization/StreamAdOverlay.vue
============================================================================ -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface AdCampaign {
  id: string
  title: string
  ad_type: 'video' | 'banner'
  media_url: string
  destination_url: string
  duration_seconds: number
  is_skippable: boolean
  skip_offset_seconds: number
}

const props = defineProps<{
  streamId: string
}>()

const emit = defineEmits(['adStarted', 'adCompleted', 'adSkipped'])

const supabase = useSupabaseClient()
const currentAd = ref<AdCampaign | null>(null)
const isActive = ref(false)
const timeRemaining = ref(0)
const canSkip = ref(false)
const countdownTimer = ref<NodeJS.Timeout | null>(null)

// Queries real-time inventory from your active database instance
const fetchEligibleAdCampaign = async () => {
  try {
    const { data, error } = await supabase
      .from('ads_campaigns')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    
    if (data) {
      currentAd.value = {
        id: data.id,
        title: data.title || 'Sponsored Showcase',
        ad_type: data.ad_type || 'video',
        media_url: data.media_url,
        destination_url: data.destination_url || 'https://socialverse.com',
        duration_seconds: data.duration_seconds || 15,
        is_skippable: data.is_skippable ?? true,
        skip_offset_seconds: data.skip_offset_seconds || 5
      }
      triggerAdLifecycle()
    }
  } catch (err) {
    console.error('❌ [Ad Engine] Failed to parse target campaign row:', err)
  }
}

const triggerAdLifecycle = () => {
  if (!currentAd.value) return
  
  isActive.value = true
  timeRemaining.value = currentAd.value.duration_seconds
  canSkip.value = !currentAd.value.is_skippable
  emit('adStarted', currentAd.value.id)

  countdownTimer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
      
      if (currentAd.value?.is_skippable && !canSkip.value) {
        const elapsed = currentAd.value.duration_seconds - timeRemaining.value
        if (elapsed >= currentAd.value.skip_offset_seconds) {
          canSkip.value = true
        }
      }
    } else {
      completeAdLifecycle()
    }
  }, 1000)
}

const trackAdInteraction = async () => {
  if (!currentAd.value) return
  
  window.open(currentAd.value.destination_url, '_blank')
  
  const { error } = await supabase
    .from('ad_interactions')
    .insert({
      ad_id: currentAd.value.id,
      interaction_type: 'click',
      metadata: { source: 'stream_player_overlay', stream_id: props.streamId }
    })
    
  if (error) console.error('❌ Failed to push interaction metrics:', error)
}

const skipAd = () => {
  if (!canSkip.value) return
  cleanupTimer()
  isActive.value = false
  emit('adSkipped', currentAd.value?.id)
  currentAd.value = null
}

const completeAdLifecycle = () => {
  cleanupTimer()
  isActive.value = false
  emit('adCompleted', currentAd.value?.id)
  currentAd.value = null
}

const cleanupTimer = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

onMounted(() => {
  setTimeout(() => {
    fetchEligibleAdCampaign()
  }, 8000)
})

onUnmounted(() => {
  cleanupTimer()
})
</script>

<template>
  <div 
    v-if="isActive && currentAd" 
    class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 transition-all"
    :class="[currentAd.ad_type === 'banner' ? 'h-20 bottom-4 top-auto max-w-xl mx-auto rounded-xl border border-slate-800' : 'w-full h-full']"
  >
    <!-- Immersive Video Ad Playback Context -->
    <template v-if="currentAd.ad_type === 'video'">
      <video 
        class="w-full h-full object-contain cursor-pointer"
        :src="currentAd.media_url"
        autoplay
        playsinline
        @click="trackAdInteraction"
      ></video>
      
      <div class="absolute top-4 left-4 flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-md backdrop-blur-md border border-slate-800">
        <span class="text-[10px] font-black tracking-widest text-amber-400 uppercase">SPONSORED</span>
        <span class="text-xs text-slate-300">Remaining: {{ timeRemaining }}s</span>
      </div>
    </template>

    <!-- Lower-Third Horizontal Sticky Banner Variant -->
    <template v-else>
      <div 
        class="w-full h-full flex items-center justify-between px-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white cursor-pointer rounded-xl"
        @click="trackAdInteraction"
      >
        <div class="flex items-center space-x-3">
          <div class="bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.5 rounded shadow">AD</div>
          <div class="max-w-sm">
            <h4 class="text-xs font-bold truncate">{{ currentAd.title }}</h4>
            <p class="text-[11px] text-slate-400 truncate">Explore high-conversion offers across our active network hubs.</p>
          </div>
        </div>
        <div class="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/40">
          Closes in {{ timeRemaining }}s
        </div>
      </div>
    </template>

    <!-- Action Bar Controls -->
    <div v-if="currentAd.ad_type === 'video'" class="absolute bottom-4 right-4 flex items-center space-x-2">
      <button 
        @click.stop="trackAdInteraction"
        class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wider uppercase px-4 py-2.5 rounded-lg shadow-xl border border-indigo-400/20 transition-colors"
      >
        Visit Site
      </button>
      
      <button 
        @click.stop="skipAd"
        :disabled="!canSkip"
        :class="[
          'text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg shadow-xl border transition-all flex items-center space-x-1',
          canSkip 
            ? 'bg-white text-black border-white hover:bg-gray-100 cursor-pointer' 
            : 'bg-black/50 text-slate-500 border-slate-800/80 cursor-not-allowed backdrop-blur-md'
        ]"
      >
        <span>Skip Ad</span>
        <span v-if="!canSkip" class="text-[10px] text-slate-600">({{ timeRemaining - (currentAd.duration_seconds - currentAd.skip_offset_seconds) }}s)</span>
      </button>
    </div>
  </div>
</template>
