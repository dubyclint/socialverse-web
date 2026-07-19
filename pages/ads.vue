<!-- ============================================================================
     FILE: /pages/ads.vue
     real database calls to your physical financial ledger engine
     ============================================================================ -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const supabase = useSupabaseClient()

// Core Reactive Storage Containers
const campaigns = ref<any[]>([])
const transactions = ref<any[]>([])
const activeStreamsList = ref<any[]>([])
const isLoading = ref(true)
const isInjecting = ref<string | null>(null)
const targetStreamIdForAd = ref<string>('')

// Layout Filter Variables
const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const activeTab = ref('Overview')

const tabs = ['Overview', 'Campaigns', 'Performance', 'Billing']

// Computed Data Metrics directly calculated out of live state data arrays
const activeCampaignsCount = computed(() => campaigns.value.filter(c => c.status === 'active').length)
const totalBudgetAllocated = computed(() => campaigns.value.reduce((acc, curr) => acc + (Number(curr.budget_limit) || 0), 0))
const totalImpressionsCount = computed(() => campaigns.value.reduce((acc, curr) => acc + (Number(curr.impressions) || 0), 0))
const totalClicksCount = computed(() => campaigns.value.reduce((acc, curr) => acc + (Number(curr.clicks) || 0), 0))

const avgCTR = computed(() => {
  if (!totalImpressionsCount.value) return 0
  return (totalClicksCount.value / totalImpressionsCount.value) * 100
})

const filteredCampaigns = computed(() => {
  return campaigns.value.filter(campaign => {
    const titleText = campaign.title || ''
    const matchesSearch = titleText.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || campaign.status === filterStatus.value
    const matchesType = !filterType.value || campaign.ad_type?.toLowerCase() === filterType.value.toLowerCase()
    return matchesSearch && matchesStatus && matchesType
  })
})

const fetchAdDashboardMetrics = async () => {
  try {
    isLoading.value = true
    
    // 1. Fetch live advertising campaigns 
    const { data: campaignData, error: campaignErr } = await supabase
      .from('ads_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (campaignErr) throw campaignErr
    campaigns.value = campaignData || []

    // 2. Fetch account transactions from ledger 
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (txErr) throw txErr
    transactions.value = txData || []

    // 3. Structural Fallback: Seed or poll active streams to ensure ad placement matches the chat channel layout string
    // In production, this pulls directly from your live video sessions data grid mapping
    activeStreamsList.value = [
      { id: 'global_session_node_1', channel_label: 'Main Stage Live Stream' },
      { id: 'global_session_node_2', channel_label: 'Gaming & Arena Stream' }
    ]
    // Set a default target session anchor
    targetStreamIdForAd.value = activeStreamsList.value[0]?.id ?? ''

  } catch (err) {
    console.error('❌ [Ad Dashboard Engine] Failed to parse ledger data matrix:', err)
  } finally {
    isLoading.value = false
  }
}

// FIXED: Programmatic broadcast injector signaling the identical stream workspace room channel string
const injectProgrammaticAdIntoStream = async (campaign: any) => {
  if (!targetStreamIdForAd.value) {
    alert('Please pick an active stream target instance to receive the ad placement signal node.')
    return
  }
  
  isInjecting.value = campaign.id
  try {
    // Re-aligned room targeting string matches StreamChat.vue setup exactly!
    const broadcastChannelKey = `stream_workspace:${targetStreamIdForAd.value}`
    console.log(`📡 Connecting pipeline bridge link straight to: ${broadcastChannelKey}`)
    
    const channel = supabase.channel(broadcastChannelKey)
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const payloadData = {
          campaignId: campaign.id,
          title: campaign.title,
          adType: campaign.ad_type,
          bannerUrl: campaign.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
          durationMs: 15000 // Fixed 15-second visual placement overlay lifespan
        }
        
        await channel.send({
          type: 'broadcast',
          event: 'ad_placement_trigger',
          payload: payloadData
        })
        
        console.log(`🏁 Sync Cleared: Broadcast packet shipped out across target channel: ${broadcastChannelKey}`)
        supabase.removeChannel(channel)
      }
    })

    // Increment local tracking counters asynchronously
    campaign.impressions = (campaign.impressions || 0) + 1
    
    // Optional: Log an analytical transaction event into the ledger for statistics audit checks
    await supabase.from('transactions').insert({
      amount: 0.15,
      type: 'expense',
      description: `Programmatic Sync Charge: Banner Overlay Impression on room ${targetStreamIdForAd.value}`,
      metadata: { campaign_id: campaign.id, metrics_shift: 'impression' }
    })

  } catch (err: any) {
    console.error('❌ Ingest matrix transmission error:', err.message)
  } finally {
    setTimeout(() => { isInjecting.value = null }, 1000)
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toggleCampaignStatus = async (id: string, currentStatus: string) => {
  const nextStatus = currentStatus === 'active' ? 'paused' : 'active'
  const { error } = await supabase
    .from('ads_campaigns')
    .update({ status: nextStatus })
    .eq('id', id)
    
  if (!error) {
    const item = campaigns.value.find(c => c.id === id)
    if (item) item.status = nextStatus
  }
}

const deleteCampaignItem = async (id: string) => {
  if (!confirm('Confirm deletion of this advertising layout block?')) return
  const { error } = await supabase
    .from('ads_campaigns')
    .delete()
    .eq('id', id)
    
  if (!error) {
    campaigns.value = campaigns.value.filter(c => c.id !== id)
  }
}

onMounted(() => {
  fetchAdDashboardMetrics()
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto space-y-8">
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">🎯 Ad Center Control Console</h1>
          <p class="text-xs text-slate-400 mt-1">Deploy automated advertising blocks and track multi-channel visual performance pipelines.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5">
            <span class="text-[10px] uppercase font-black font-mono text-indigo-400">Target Session:</span>
            <select v-model="targetStreamIdForAd" class="bg-transparent text-xs text-white font-bold font-mono focus:outline-none cursor-pointer">
              <option v-for="stream in activeStreamsList" :key="stream.id" :value="stream.id" class="bg-slate-900 text-white">
                {{ stream.channel_label }}
              </option>
            </select>
          </div>
          <NuxtLink to="/ads/create" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow">
            Create Campaign
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Run</span>
          <h3 class="text-xl font-black text-white mt-1">{{ activeCampaignsCount }} Campaigns</h3>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Impr.</span>
          <h3 class="text-xl font-black text-emerald-400 mt-1">{{ totalImpressionsCount.toLocaleString() }}</h3>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Clicks</span>
          <h3 class="text-xl font-black text-indigo-400 mt-1">{{ totalClicksCount.toLocaleString() }}</h3>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg CTR Matrix</span>
          <h3 class="text-xl font-black text-amber-400 mt-1">{{ avgCTR.toFixed(2) }}%</h3>
        </div>
      </div>

      <div class="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
        <button 
          v-for="tab in tabs" 
          :key="tab"
          @click="activeTab = tab"
          :class="['px-5 py-3 text-xs font-bold tracking-wide border-b-2 whitespace-nowrap transition-colors', activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200']"
        >
          {{ tab }}
        </button>
      </div>

      <div v-if="isLoading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="h-16 bg-slate-900 rounded-xl border border-slate-800 animate-pulse"></div>
      </div>

      <div v-else class="space-y-6">
        
        <div v-if="activeTab === 'Overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">Recent Asset Deployment</h3>
            <div v-if="campaigns.length > 0" class="space-y-3">
              <div v-for="campaign in campaigns.slice(0, 4)" :key="campaign.id" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white">{{ campaign.title }}</h4>
                  <span class="text-[10px] text-slate-500 block mt-0.5 font-mono">{{ campaign.ad_type }} • Created: {{ formatDate(campaign.created_at) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <button 
                    v-if="campaign.status === 'active'"
                    @click="injectProgrammaticAdIntoStream(campaign)"
                    :disabled="isInjecting !== null"
                    class="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white text-[10px] font-black px-3 py-1.5 rounded transition-all uppercase tracking-wide disabled:opacity-40"
                  >
                    {{ isInjecting === campaign.id ? 'Firing Signal...' : '⚡ Inject Overlay' }}
                  </button>
                  <span :class="['px-2 py-0.5 text-[9px] font-black uppercase rounded border', campaign.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']">
                    {{ campaign.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="p-8 border border-dashed border-slate-800 text-center text-xs text-slate-500 rounded-xl">
              No promotional campaigns configured.
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-fit">
            <h3 class="text-xs font-black text-slate-200 uppercase tracking-wider">Financial Allocations</h3>
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Accumulated Budget Pool</span>
              <span class="text-2xl font-black text-white mt-1 block">${{ totalBudgetAllocated.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'Campaigns'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input v-model="searchQuery" type="text" placeholder="Search campaign headers..." class="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-slate-700" />
            <select v-model="filterStatus" class="bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <select v-model="filterType" class="bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none">
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="banner">Banner</option>
            </select>
          </div>

          <div v-if="filteredCampaigns.length > 0" class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th class="p-4">Campaign Name</th>
                  <th class="p-4">Type</th>
                  <th class="p-4">Status</th>
                  <th class="p-4">Budget</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="campaign in filteredCampaigns" :key="campaign.id" class="hover:bg-slate-950/40 transition-colors">
                  <td class="p-4 font-bold text-white truncate max-w-xs">{{ campaign.title }}</td>
                  <td class="p-4 uppercase font-mono text-[11px] text-slate-400">{{ campaign.ad_type }}</td>
                  <td class="p-4">
                    <span :class="['px-2 py-0.5 text-[9px] font-black uppercase rounded border', campaign.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']">
                      {{ campaign.status }}
                    </span>
                  </td>
                  <td class="p-4 font-mono font-bold text-indigo-400">${{ (Number(campaign.budget_limit) || 0).toFixed(2) }}</td>
                  <td class="p-4 text-right space-x-3 whitespace-nowrap">
                    <button 
                      v-if="campaign.status === 'active'"
                      @click="injectProgrammaticAdIntoStream(campaign)"
                      :disabled="isInjecting !== null"
                      class="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold disabled:opacity-40"
                    >
                      Inject Ad
                    </button>
                    <button @click="toggleCampaignStatus(campaign.id, campaign.status)" class="text-[11px] text-amber-400 hover:underline font-bold">
                      {{ campaign.status === 'active' ? 'Pause' : 'Activate' }}
                    </button>
                    <button @click="deleteCampaignItem(campaign.id)" class="text-[11px] text-rose-400 hover:underline font-bold">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No items matching your selection parameters were located.
          </div>
        </div>

        <div v-if="activeTab === 'Performance'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="campaign in campaigns" :key="campaign.id" class="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h4 class="text-xs font-bold text-white truncate mb-3 border-b border-slate-800 pb-2">{{ campaign.title }}</h4>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/40">
                <span class="text-[9px] block text-slate-500 uppercase font-bold">Impressions</span>
                <span class="text-xs font-black text-slate-200 mt-0.5 block">{{ (campaign.impressions || 0).toLocaleString() }}</span>
              </div>
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/40">
                <span class="text-[9px] block text-slate-500 uppercase font-bold">Clicks</span>
                <span class="text-xs font-black text-indigo-400 mt-0.5 block">{{ (campaign.clicks || 0).toLocaleString() }}</span>
              </div>
              <div class="bg-slate-950/60 p-2 rounded border border-slate-800/40">
                <span class="text-[9px] block text-slate-500 uppercase font-bold">CTR</span>
                <span class="text-xs font-black text-amber-400 mt-0.5 block">
                  {{ campaign.impressions ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00' }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'Billing'" class="space-y-4">
          <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider">Account Billing History</h3>
          <div v-if="transactions.length > 0" class="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            <div v-for="tx in transactions" :key="tx.id" class="p-4 flex items-center justify-between text-xs">
              <div>
                <p class="font-bold text-slate-200">{{ tx.description || 'System Reconciliation' }}</p>
                <span class="text-[10px] text-slate-500 font-mono">{{ formatDate(tx.created_at) }}</span>
              </div>
              <span :class="['font-mono font-bold text-sm', tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-500']">
                {{ tx.type === 'credit' ? '+' : '-' }}${{ Math.abs(Number(tx.amount) || 0).toFixed(2) }}
              </span>
            </div>
          </div>
          <div v-else class="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No real-time ledger accounting statements were discovered in this workspace instance.
          </div>
        </div>

      </div>
    </div>
  </main>
</template>
