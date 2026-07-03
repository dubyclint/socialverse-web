<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

definePageMeta({ middleware: ['auth'], layout: 'default' })

const authStore = useAuthStore()
const profileStore = useProfileStore()

const activeTab = ref('account')
const isSaving = ref(false)
const showStreamKey = ref(false)
const toast = ref({ message: '', type: 'success' as 'success' | 'error' })

const profileForm = ref({ username: '', fullName: '', bio: '' })
const streamConfig = ref({ title: '', quality: '1080p', streamKey: '' })

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message: msg, type }
  setTimeout(() => { toast.value.message = '' }, 4000)
}

const loadData = async () => {
  await profileStore.fetchProfile()
  if (profileStore.profile) {
    profileForm.value = { 
      username: profileStore.profile.username, 
      fullName: profileStore.profile.full_name, 
      bio: profileStore.profile.bio 
    }
    streamConfig.value = { 
      title: profileStore.profile.default_stream_title, 
      quality: profileStore.profile.stream_quality || '1080p', 
      streamKey: profileStore.profile.stream_key || '' 
    }
  }
}

const saveSettings = async (type: 'profile' | 'stream') => {
  isSaving.value = true
  try {
    if (type === 'profile') await profileStore.updateProfile(profileForm.value)
    else await profileStore.updateStreamConfig(streamConfig.value)
    triggerToast('Settings synchronized successfully.')
  } catch (e: any) { triggerToast(e.message, 'error') }
  finally { isSaving.value = false }
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
    <main class="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
      
      <div class="mb-8 border-b border-slate-800 pb-6">
        <h1 class="text-3xl font-black tracking-tight text-white">Workspace Configs</h1>
        <p class="text-xs text-slate-400 mt-1">Configure your identity and broadcasting endpoints.</p>
      </div>

      <!-- Tab System -->
      <div class="flex gap-2 border-b border-slate-800 mb-6 pb-2 overflow-x-auto no-scrollbar">
        <button v-for="tab in ['account', 'stream', 'security']" :key="tab" 
          @click="activeTab = tab"
          :class="['px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all border', activeTab === tab ? 'tab-active' : 'tab-inactive']">
          {{ tab }}
        </button>
      </div>

      <!-- Content Matrix -->
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Account Tab -->
        <div v-if="activeTab === 'account'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] uppercase font-bold text-slate-400">Username</label>
              <input v-model="profileForm.username" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] uppercase font-bold text-slate-400">Display Name</label>
              <input v-model="profileForm.fullName" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3" />
            </div>
          </div>
          <button @click="saveSettings('profile')" :disabled="isSaving" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl">Save Changes</button>
        </div>

        <!-- Stream Tab -->
        <div v-if="activeTab === 'stream'" class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] uppercase font-bold text-slate-400">Stream Title</label>
            <input v-model="streamConfig.title" class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-3" />
          </div>
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label class="text-[9px] uppercase font-bold text-slate-500">Encryption Key</label>
            <div class="flex gap-2 mt-2">
              <input :type="showStreamKey ? 'text' : 'password'" v-model="streamConfig.streamKey" readonly class="flex-1 bg-slate-900 text-xs text-indigo-400 border border-slate-800 rounded-lg px-3 py-2 font-mono" />
              <button @click="showStreamKey = !showStreamKey" class="bg-slate-800 text-[11px] font-bold px-3 rounded-lg hover:bg-slate-700">Reveal</button>
            </div>
          </div>
          <button @click="saveSettings('stream')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl">Save Stream</button>
        </div>
      </div>
    </main>

    <!-- Toast Notification -->
    <div v-if="toast.message" :class="['fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl text-xs font-bold text-white', toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600']">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.tab-active { @apply bg-indigo-600/10 text-indigo-400 border-indigo-500/30; }
.tab-inactive { @apply text-slate-400 border-transparent hover:bg-slate-800/60; }
.animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
</style>
