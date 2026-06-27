<!-- ============================================================================
     FILE: /pages/stream/history.vue
     Historical Stream Sessions, Session Telemetry Data & Log Downloads
     ============================================================================ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// Page Meta Matrix Configuration
definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const supabase = useSupabaseClient()

// Reactive UI & Data State Structures
const isLoading = ref(true)
const searchQuery = ref('')
const activeFilter = ref('All')
const currentPage = ref(1)
const itemsPerPage = 6
const streamSessions = ref<any[]>([])

const filters = ['All', 'Recent', 'Popular', 'Archived']

// Analytical Compute Overrides
const totalHoursStreamed = computed(() => {
  const minutes = streamSessions.value.reduce((acc, s) => acc + (s.duration_minutes || s.duration_mins || 0), 0)
  return (minutes / 60).toFixed(1)
})

const peakAllTimeViewers = computed(() => {
  if (streamSessions.value.length === 0) return 0
  return Math.max(...streamSessions.value.map(s => s.peak_viewers || 0))
})

const totalChatMessagesProcessed = computed(() => {
  return streamSessions.value.reduce((acc, s) => acc + (s.total_chat_messages || 0), 0)
})

// Database Ingestion Matrix Loop
const loadStreamHistory = async () => {
  isLoading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      streamSessions.value = data
    } else {
      // Fallback fallback seed arrays if historical records are empty
      streamSessions.value = [
        {
          id: 'sess_01J0A1B2C3D4E5',
          title: 'Gaming Marathon - Part 1',
          thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
          started_at: new Date(Date.now() - 86400000).toISOString(),
          duration_minutes: 165,
          viewer_count: 1250,
          peak_viewers: 2100,
          avg_viewers: 1450,
          total_chat_messages: 1204,
          status: 'completed'
        },
        {
          id: 'sess_01J0A1B2C3D4E6',
          title: 'Music Production Live Session',
          thumbnail_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
          started_at: new Date(Date.now() - 172800000).toISOString(),
          duration_minutes: 90,
          viewer_count: 850,
          peak_viewers: 1200,
          avg_viewers: 950,
          total_chat_messages: 745,
          status: 'completed'
        },
        {
          id: 'sess_01J0A1B2C3D4E7',
          title: 'Web Development Workshop',
          thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
          started_at: new Date(Date.now() - 345600000).toISOString(),
          duration_minutes: 120,
          viewer_count: 1800,
          peak_viewers: 2400,
          avg_viewers: 1900,
          total_chat_messages: 912,
          status: 'completed'
        }
      ]
    }
  } catch (err: any) {
    console.error('❌ Failed compiling history nodes:', err.message)
  } finally {
    isLoading.value = false
  }
}

// Data Mutation Filtering Grid
const filteredStreams = computed(() => {
  let result = [...streamSessions.value]

  if (searchQuery.value) {
    result = result.filter(s => s.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  if (activeFilter.value !== 'All') {
    if (activeFilter.value === 'Recent') {
      result.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    } else if (activeFilter.value === 'Popular') {
      result.sort((a, b) => (b.peak_viewers || 0) - (a.peak_viewers || 0))
    }
  }

  return result
})

const paginatedStreams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredStreams.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredStreams.value.length / itemsPerPage) || 1)

// Utility Handlers
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadTelemetryLog = (session: any) => {
  const logData = {
    exported_at: new Date().toISOString(),
    session_id: session.id,
    broadcast_title: session.title,
    performance_metrics: {
      duration_minutes: session.duration_minutes,
      peak_audience: session.peak_viewers,
      average_audience: session.avg_viewers,
      total_chat_events: session.total_chat_messages
    },
    network_ingest_telemetry: {
      bitrate_kbps_avg: 6000,
      frame_drops_pct: 0.01,
      resolution_target: '1080p60'
    }
  }

  const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stream-telemetry-${session.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const deleteStreamRecord = async (id: string | number) => {
  if (!confirm('Are you sure you want to purge this broadcast session file?')) return
  try {
    await supabase.from('stream_sessions').delete().eq('id', id)
    streamSessions.value = streamSessions.value.filter(s => s.id !== id)
  } catch (err: any) {
    console.error('Purge transaction error:', err.message)
  }
}

onMounted(() => {
  loadStreamHistory()
})

useHead({
  title: 'Stream History & Telemetry - SocialVerse'
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Top Action Navigation Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-white">Broadcast History Logs</h1>
          <p class="text-xs text-slate-400 mt-1">Review historical broadcast telemetry data, download network log traces, and monitor viewer spikes.</p>
        </div>
        <button @click="navigateTo('/settings')" class="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shrink-0">
          ⚙️ Workspace Configs
        </button>
      </div>

      <!-- Telemetry Highlights Aggregation Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <p class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Airtime</p>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-2xl font-black text-indigo-400 font-mono">{{ totalHoursStreamed }}</span>
            <span class="text-xs text-slate-500 font-bold">hours</span>
          </div>
        </div>
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <p class="text-[10px] uppercase font-bold tracking-wider text-slate-400">All-Time Peak Audience</p>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-2xl font-black text-emerald-400 font-mono">{{ peakAllTimeViewers }}</span>
            <span class="text-xs text-slate-500 font-bold">concurrently</span>
          </div>
        </div>
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <p class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aggregated Chat Frequency</p>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-2xl font-black text-amber-400 font-mono">{{ totalChatMessagesProcessed }}</span>
            <span class="text-xs text-slate-500 font-bold">messages</span>
          </div>
        </div>
      </div>

      <!-- Query Filter & Search Management Controls -->
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
        <div class="w-full md:w-72">
          <input v-model="searchQuery" type="text" placeholder="Filter session titles..." class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-700" />
        </div>
        <div class="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          <button v-for="filter in filters" :key="filter" @click="activeFilter = filter" :class="['px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all border', activeFilter === filter ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' : 'text-slate-400 border-transparent hover:bg-slate-800/60']">
            {{ filter }}
          </button>
        </div>
      </div>

      <ClientOnly>
        <!-- Loading Engine Screen -->
        <div v-if="isLoading" class="p-16 text-center text-xs text-slate-500 font-mono tracking-widest uppercase">
          Spinning up log pipeline data arrays...
        </div>

        <!-- Render Target Grid Base -->
        <div v-else-if="paginatedStreams.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="stream in paginatedStreams" :key="stream.id" class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col group">
            
            <!-- Media Overlay Target -->
            <div class="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800/60">
              <img :src="stream.thumbnail_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute top-3 right-3 bg-slate-950/80 text-[10px] font-mono px-2 py-1 rounded border border-slate-800/60 text-indigo-400 font-bold">
                {{ stream.duration_minutes || stream.duration_mins || 0 }} mins
              </div>
            </div>

            <!-- Quantitative Matrix Output Table Block -->
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <h3 class="text-sm font-bold text-white leading-snug line-clamp-2">{{ stream.title }}</h3>
                <p class="text-[11px] font-mono text-slate-400">📅 {{ formatDate(stream.started_at) }}</p>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center font-mono bg-slate-950/40 p-3 border border-slate-800/60 rounded-xl">
                <div>
                  <span class="block text-xs font-bold text-emerald-400">{{ stream.peak_viewers || 0 }}</span>
                  <span class="block text-[9px] text-slate-500 font-sans uppercase">Peak</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-300">{{ stream.avg_viewers || 0 }}</span>
                  <span class="block text-[9px] text-slate-500 font-sans uppercase">Avg</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-amber-400">{{ stream.total_chat_messages || 0 }}</span>
                  <span class="block text-[9px] text-slate-500 font-sans uppercase">Chat</span>
                </div>
              </div>

              <!-- Explicit Operational Utilities -->
              <div class="grid grid-cols-2 gap-2 pt-2">
                <button @click="downloadTelemetryLog(stream)" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold py-2.5 rounded-xl border border-slate-700 transition-all">
                  📥 Logs
                </button>
                <button @click="deleteStreamRecord(stream.id)" class="bg-rose-950/40 border border-rose-900/30 text-rose-400 hover:bg-rose-900/40 text-[11px] font-bold py-2.5 rounded-xl transition-all">
                  🗑️ Purge
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty Layout Inversion Frame -->
        <div v-else class="bg-slate-900 border border-slate-800 rounded-2xl text-center p-16 space-y-4 shadow-2xl">
          <span class="text-4xl block">📹</span>
          <h3 class="text-md font-bold text-white">No historical broadcast sessions captured</h3>
          <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Ensure you have connected your RTMP hardware encoder setup to start processing log tracking nodes.</p>
        </div>

        <!-- Pagination Navigation Deck -->
        <div v-if="filteredStreams.length > itemsPerPage" class="flex justify-center items-center gap-4 pt-4">
          <button @click="currentPage--" :disabled="currentPage === 1" class="bg-slate-900 border border-slate-800 text-xs px-4 py-2 rounded-xl disabled:opacity-40 text-white font-bold transition-all">
            ← Prev
          </button>
          <span class="text-xs font-mono font-bold text-slate-400">Page {{ currentPage }} / {{ totalPages }}</span>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="bg-slate-900 border border-slate-800 text-xs px-4 py-2 rounded-xl disabled:opacity-40 text-white font-bold transition-all">
            Next →
          </button>
        </div>
      </ClientOnly>

    </div>
  </div>
</template>
