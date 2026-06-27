<!-- ============================================================================
     FILE: /pages/settings.vue
     Unified Workspace Settings, Streaming Ingest Keys & Security Overrides
     ============================================================================ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const authStore = useAuthStore()
const { logout } = useAuth()
const supabase = useSupabaseClient()

// Layout Navigation Controls
const activeTab = ref('account')
const isSaving = ref(false)
const showStreamKey = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const settingsTabs = [
  { id: 'account', label: '👤 Account Profile' },
  { id: 'stream', label: '📡 Stream Presets & Keys' },
  { id: 'security', label: '🔐 Authentication & Security' },
  { id: 'notifications', label: '🔔 Alert Logs' }
]

// Bound Consolidated State Nodes
const profileForm = ref({
  username: '',
  fullName: '',
  bio: '',
  avatarUrl: ''
})

const streamConfig = ref({
  title: '',
  description: '',
  quality: '1080p',
  streamKey: 'live_sk_7394hzx8104859bc029481ad3'
})

const securityForm = ref({
  newPassword: '',
  confirmPassword: ''
})

const notificationSettings = ref({
  emailNotifications: true,
  streamAlerts: true
})

// Utilities
const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => { toastMessage.value = '' }, 4000)
}

// FIX: Added real-time clipboard copying mechanism
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    triggerToast(`${label} copied to clipboard successfully!`, 'success')
  } catch (err) {
    triggerToast('Failed to copy text. Check your browser permissions.', 'error')
  }
}

// Fetch Identity Attributes on Setup Mounting
const loadSettingsContext = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    profileForm.value.username = user.email?.split('@')[0] || 'active_node'
    profileForm.value.avatarUrl = user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'

    // Pull database metadata configs
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      profileForm.value.fullName = profile.full_name || ''
      profileForm.value.bio = profile.bio || ''
      streamConfig.value.title = profile.default_stream_title || ''
      streamConfig.value.quality = profile.stream_quality || '1080p'
      if (profile.stream_key) {
        streamConfig.value.streamKey = profile.stream_key
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to pull workspace credentials:', err)
  }
}

// FIX: Form submission connected handling straight to Supabase
const saveAccountProfile = async () => {
  isSaving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').upsert({
      id: user?.id,
      username: profileForm.value.username,
      full_name: profileForm.value.fullName,
      bio: profileForm.value.bio,
      updated_at: new Date().toISOString()
    })
    if (error) throw error
    triggerToast('Profile metadata table synchronized successfully.')
  } catch (err: any) {
    triggerToast(err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// FIX: Stream configuration updating specific profiles schema fields
const saveStreamConfiguration = async () => {
  isSaving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      default_stream_title: streamConfig.value.title,
      stream_quality: streamConfig.value.quality
    }).eq('id', user?.id)
    
    if (error) throw error
    triggerToast('Streaming credentials and resolution ingest routes modified.')
  } catch (err: any) {
    triggerToast(err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// FIX: Validation loop verifying strict matching length criteria 
const updatePasswordConfig = async () => {
  if (securityForm.value.newPassword.length < 8) {
    triggerToast('Password security risk. Passphrase must be at least 8 characters.', 'error')
    return
  }
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    triggerToast('Verification string mismatch. Confirm your new password entry.', 'error')
    return
  }
  isSaving.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: securityForm.value.newPassword })
    if (error) throw error
    triggerToast('Security encryption token patched.')
    securityForm.value.newPassword = ''
    securityForm.value.confirmPassword = ''
  } catch (err: any) {
    triggerToast(err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// FIX: Sync newly rotated hashes straight to backend configurations
const regenerateStreamKey = async () => {
  const newKey = `live_sk_${crypto.randomUUID().replace(/-/g, '')}`
  isSaving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      stream_key: newKey
    }).eq('id', user?.id)

    if (error) throw error
    streamConfig.value.streamKey = newKey
    triggerToast('Inbound stream routing hash rotated on network nodes.', 'success')
  } catch (err: any) {
    triggerToast(err.message, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettingsContext()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
    <main class="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
      
      <!-- Top Workspace Description -->
      <div class="mb-8 border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-white">Workspace Configs</h1>
          <p class="text-xs text-slate-400 mt-1">Configure profile discovery endpoints, manage stream encoding pipelines, and rotate secure API tokens.</p>
        </div>
        <button @click="navigateTo('/stream')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shrink-0">
          📱 Back to Live Console
        </button>
      </div>

      <!-- Tab Selection System Bar -->
      <div class="flex gap-2 border-b border-slate-800 mb-6 pb-2 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in settingsTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all border', activeTab === tab.id ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' : 'text-slate-400 border-transparent hover:bg-slate-800/60']"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- CONTENT BLOCKS GENERATION MATRIX -->
      <div class="space-y-6">
        
        <!-- Tab A: Core Identity Profiling -->
        <div v-if="activeTab === 'account'" class="space-y-4 animate-fadeIn">
          <div class="flex items-center gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
            <img :src="profileForm.avatarUrl" class="w-14 h-14 rounded-full border-2 border-indigo-500 object-cover" />
            <div>
              <p class="text-xs font-bold text-slate-400 font-mono">@{{ profileForm.username }}</p>
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Verified Stream Ingest Client Node</span>
            </div>
          </div>

          <form @submit.prevent="saveAccountProfile" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">User Identifier</label>
                <input v-model="profileForm.username" type="text" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700 font-mono" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Display Identity String</label>
                <input v-model="profileForm.fullName" type="text" placeholder="Add full account profile name" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Public Channel Bio</label>
              <textarea v-model="profileForm.bio" rows="3" placeholder="Compose layout details about your broadcast channel..." class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700 resize-none leading-relaxed"></textarea>
            </div>
            <div class="flex justify-end pt-2 border-t border-slate-800/60">
              <button type="submit" :disabled="isSaving" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all">Save Changes</button>
            </div>
          </form>
        </div>

        <!-- Tab B: Stream Preset Matrix & Hardware Keys -->
        <div v-if="activeTab === 'stream'" class="space-y-6 animate-fadeIn">
          <form @submit.prevent="saveStreamConfiguration" class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Default Broadcasting Broadcast Title</label>
              <input v-model="streamConfig.title" type="text" placeholder="Configure dynamic ingest broadcast title..." class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Target Media Server Quality Presets</label>
              <select v-model="streamConfig.quality" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700 font-mono">
                <option value="1080p">1080p WebRTC Master Channel @ 60fps</option>
                <option value="720p">720p Standard Compressing Route @ 30fps</option>
                <option value="4k">2160p Ultra-HD High Fidelity Data Grid</option>
              </select>
            </div>

            <!-- ENCODER RTMP IDENTIFIER KEY DISPLAY BLOCK -->
            <div class="bg-slate-950 p-5 border border-slate-800 rounded-xl space-y-3">
              <div>
                <h3 class="text-xs font-black text-white">Stream Security Credentials</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Use these parameters inside external encoding matrices like OBS Studio or vMix.</p>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">RTMP Server Target Connection Endpoint</label>
                <div class="flex gap-2">
                  <input type="text" readonly value="rtmp://ingest.socialverse.com/live2" class="flex-1 bg-slate-900/80 text-xs text-slate-400 border border-slate-800/80 rounded-lg px-3 py-2 focus:outline-none font-mono select-all" />
                  <button type="button" @click="copyToClipboard('rtmp://ingest.socialverse.com/live2', 'Server Ingest URL')" class="bg-slate-800 border border-slate-700 text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-slate-700 transition-all">
                    📋 Copy
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">Private Encryption Key Token Pass</label>
                <div class="flex gap-2">
                  <input :type="showStreamKey ? 'text' : 'password'" readonly v-model="streamConfig.streamKey" class="flex-1 bg-slate-900/80 text-xs text-indigo-400 border border-slate-800/80 rounded-lg px-3 py-2 focus:outline-none font-mono" />
                  <button type="button" @click="showStreamKey = !showStreamKey" class="bg-slate-800 border border-slate-700 text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-slate-700 transition-all w-16">
                    {{ showStreamKey ? 'Hide' : 'Reveal' }}
                  </button>
                  <button type="button" @click="copyToClipboard(streamConfig.streamKey, 'Stream Ingest Key')" class="bg-slate-800 border border-slate-700 text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-slate-700 transition-all">
                    📋 Copy
                  </button>
                  <button type="button" @click="regenerateStreamKey" :disabled="isSaving" class="bg-rose-950 text-rose-400 border border-rose-900/40 text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-rose-900/40 transition-all">
                    Rotate Key
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-800/60">
              <button type="submit" :disabled="isSaving" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all">Save Stream Matrix</button>
            </div>
          </form>
        </div>

        <!-- Tab C: System Access Authorization Security -->
        <div v-if="activeTab === 'security'" class="space-y-4 animate-fadeIn">
          <form @submit.prevent="updatePasswordConfig" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Target New Password String</label>
                <input v-model="securityForm.newPassword" type="password" placeholder="••••••••" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Confirm Target Password Pass</label>
                <input v-model="securityForm.confirmPassword" type="password" placeholder="••••••••" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-700" />
              </div>
            </div>
            <div class="flex justify-end pt-2 border-t border-slate-800/60">
              <button type="submit" :disabled="isSaving || !securityForm.newPassword" class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all">Update Encryption Keys</button>
            </div>
          </form>
        </div>

        <!-- Tab D: Notification Subscribing Channels -->
        <div v-if="activeTab === 'notifications'" class="space-y-4 animate-fadeIn">
          <div class="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <label class="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none">
              <input v-model="notificationSettings.emailNotifications" type="checkbox" class="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4" />
              <div>
                <span class="block font-bold text-white">System Logs Forwarding</span>
                <span class="block text-[11px] text-slate-500 mt-0.5">Route transaction validation proofs and security patch reports to account email.</span>
              </div>
            </label>
            <label class="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none border-t border-slate-900 pt-4">
              <input v-model="notificationSettings.streamAlerts" type="checkbox" class="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4" />
              <div>
                <span class="block font-bold text-white">Interactive Broadcast Triggers</span>
                <span class="block text-[11px] text-slate-500 mt-0.5">Emit real-time layout changes instantly on user asset donations.</span>
              </div>
            </label>
          </div>
        </div>

      </div>
    </main>

    <!-- Global Layout Toast Banner Alert -->
    <div v-if="toastMessage" :class="['fixed bottom-5 right-5 z-50 border p-4 rounded-xl shadow-2xl text-xs font-semibold text-white transition-all duration-300 flex items-center gap-3 max-w-sm', toastType === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-emerald-600 border-emerald-500']">
      <span>{{ toastType === 'error' ? '⚠️' : '✅' }}</span>
      <p>{{ toastMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}
</style>
