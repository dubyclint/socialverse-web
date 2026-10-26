<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-2 sm:p-4 md:p-8">
    <main class="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 md:p-8 shadow-2xl">
      <div class="mb-3 sm:mb-6 border-b border-slate-800 pb-3 sm:pb-5 flex items-center gap-3">
        <button class="text-slate-400 hover:text-white" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
        <div>
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">Settings</h1>
          <p class="text-xs text-slate-400 mt-1">Everything here saves to your account right away.</p>
        </div>
      </div>

      <div class="flex gap-1.5 border-b border-slate-800 mb-3 sm:mb-6 pb-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <button v-for="tab in tabs" :key="tab.id" :class="['px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-full whitespace-nowrap border flex-shrink-0', activeTab === tab.id ? 'tab-active' : 'tab-inactive']" @click="setTab(tab.id)">
          {{ tab.label }}
        </button>
      </div>

      <div class="space-y-2 sm:space-y-3">
        <template v-if="activeTab === 'account'">
          <NuxtLink v-for="link in accountLinks" :key="link.to" :to="link.to" class="row">
            <span class="flex items-center gap-3 min-w-0"><Icon :name="link.icon" size="18" class="text-indigo-400 flex-shrink-0" /><span class="min-w-0"><span class="block text-sm font-bold text-white">{{ link.label }}</span><span class="block text-[11px] text-slate-400 truncate">{{ link.hint }}</span></span></span>
            <Icon name="chevron-right" size="16" class="text-slate-500 flex-shrink-0" />
          </NuxtLink>
          <div class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Auto sign-out</span><span class="block text-[11px] text-slate-400">Sign out after this long without activity</span></span>
            <select :value="userSettings.general.idleLogoutMinutes" class="sel" @change="updateUserSettings('general', { idleLogoutMinutes: Number(($event.target as HTMLSelectElement).value) })">
              <option v-for="m in [15, 30, 60, 120, 480, 1440]" :key="m" :value="m">{{ m < 60 ? `${m} min` : `${m / 60} h` }}</option>
            </select>
          </div>
        </template>

        <template v-if="activeTab === 'privacy'">
          <div class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Who can see my status</span><span class="block text-[11px] text-slate-400">"Everyone" also lets suggested PALs see it</span></span>
            <select :value="userSettings.privacy.status" class="sel" @change="updateUserSettings('privacy', { status: ($event.target as HTMLSelectElement).value as 'everyone' | 'contacts' | 'nobody' })">
              <option value="everyone">Everyone</option>
              <option value="contacts">My PALs</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
          <div v-for="field in visibilityFields" :key="field.key" class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">{{ field.label }}</span><span class="block text-[11px] text-slate-400">{{ field.hint }}</span></span>
            <select :value="userSettings.privacy[field.key]" class="sel" @change="updateUserSettings('privacy', { [field.key]: ($event.target as HTMLSelectElement).value as 'everyone' | 'contacts' | 'nobody' })">
              <option value="everyone">Everyone</option>
              <option value="contacts">My PALs</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
          <label class="row cursor-pointer">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Read receipts</span><span class="block text-[11px] text-slate-400">Off: others don't see when you've read their messages, and you don't see theirs</span></span>
            <input type="checkbox" class="tog" :checked="userSettings.privacy.readReceipts" @change="updateUserSettings('privacy', { readReceipts: !userSettings.privacy.readReceipts })">
          </label>
          <label class="row cursor-pointer">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Private account</span><span class="block text-[11px] text-slate-400">Only approved followers see your posts</span></span>
            <input type="checkbox" class="tog" :checked="userSettings.privacy.isPrivateAccount" @change="updateUserSettings('privacy', { isPrivateAccount: !userSettings.privacy.isPrivateAccount })">
          </label>
          <NuxtLink to="/profile/edit" class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Profile fields &amp; online status</span><span class="block text-[11px] text-slate-400">Choose which profile details are public and whether you appear online</span></span>
            <Icon name="chevron-right" size="16" class="text-slate-500 flex-shrink-0" />
          </NuxtLink>
        </template>

        <template v-if="activeTab === 'notifications'">
          <label class="row cursor-pointer">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Notification sound</span><span class="block text-[11px] text-slate-400">Play a sound when a new notification arrives</span></span>
            <input type="checkbox" class="tog" :checked="userSettings.notifications.sound !== false" @change="updateUserSettings('notifications', { sound: userSettings.notifications.sound === false })">
          </label>
        </template>

        <template v-if="activeTab === 'media'">
          <label class="row cursor-pointer">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Highest quality uploads</span><span class="block text-[11px] text-slate-400">Off resizes photos to 1600px for faster uploads on mobile data</span></span>
            <input type="checkbox" class="tog" :checked="userSettings.storage_data.uploadQuality === 'original'" @change="updateUserSettings('storage_data', { uploadQuality: ($event.target as HTMLInputElement).checked ? 'original' : 'standard' })">
          </label>
          <NuxtLink to="/chat" class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Chat theme &amp; wallpaper</span><span class="block text-[11px] text-slate-400">Open a chat, then ⋮ → Theme &amp; background</span></span>
            <Icon name="chevron-right" size="16" class="text-slate-500 flex-shrink-0" />
          </NuxtLink>
        </template>

        <template v-if="activeTab === 'live'">
          <p v-if="liveLoading" class="text-xs text-slate-400">Checking your live access…</p>
          <p v-else-if="liveError" class="text-xs text-rose-400">{{ liveError }}</p>
          <template v-else-if="live">
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <p class="text-sm font-bold text-white">{{ liveHeadline }}</p>
              <p class="text-[11px] text-slate-400 mt-1">{{ liveDetail }}</p>
              <div class="flex gap-2 mt-3 flex-wrap">
                <NuxtLink v-if="live.canGoLive" to="/stream/broadcast" class="btn-primary">Go live</NuxtLink>
                <NuxtLink to="/stream/requirements" class="btn-secondary">Requirements</NuxtLink>
              </div>
            </div>
            <div v-if="live.mode !== 'waived' && live.mode !== 'denied'" class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <p class="text-xs font-bold text-slate-300">Progress toward permanent live access</p>
              <div v-for="p in liveProgress" :key="p.label">
                <div class="flex justify-between text-[11px] text-slate-400"><span>{{ p.label }}</span><span>{{ p.have }} / {{ p.need }}</span></div>
                <div class="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden"><div class="h-full bg-indigo-500" :style="{ width: `${Math.min(100, p.need ? (p.have / p.need) * 100 : 100)}%` }"></div></div>
              </div>
            </div>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <p class="text-xs font-bold text-slate-300">My live defaults</p>
              <label class="block text-[11px] text-slate-400">Default title
                <input v-model="streamDefaults.defaultTitle" maxlength="100" class="mt-1 w-full bg-slate-900 text-sm text-white border border-slate-700 rounded-lg px-3 py-2" @change="saveStream({ defaultTitle: streamDefaults.defaultTitle })">
              </label>
              <label class="flex items-center justify-between gap-3 text-sm text-white cursor-pointer">Allow viewers to chat
                <input type="checkbox" class="tog" :checked="streamDefaults.allowComments" @change="saveStream({ allowComments: !streamDefaults.allowComments })">
              </label>
              <label class="flex items-center justify-between gap-3 text-sm text-white cursor-pointer">Allow PEW gifts
                <input type="checkbox" class="tog" :checked="streamDefaults.allowGifts" @change="saveStream({ allowGifts: !streamDefaults.allowGifts })">
              </label>
            </div>
          </template>
        </template>

        <template v-if="activeTab === 'security'">
          <TwoFactorSettings />
          <div class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-white">Change password</span><span class="block text-[11px] text-slate-400">We email you a secure link to set a new password</span></span>
            <button class="btn-secondary flex-shrink-0" :disabled="resetSending" @click="sendPasswordReset">{{ resetSending ? 'Sending…' : 'Send link' }}</button>
          </div>
          <NuxtLink to="/settings/delete-account" class="row">
            <span class="min-w-0"><span class="block text-sm font-bold text-rose-400">Delete account</span><span class="block text-[11px] text-slate-400">Permanently remove your account</span></span>
            <Icon name="chevron-right" size="16" class="text-slate-500 flex-shrink-0" />
          </NuxtLink>
        </template>

        <p v-if="settingsError" class="text-xs text-rose-400">{{ settingsError }}</p>
        <p v-else-if="settingsSaving" class="text-xs text-slate-400">Saving…</p>
      </div>
    </main>

    <div v-if="toast.message" :class="['fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl text-xs font-bold text-white', toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600']">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserSettings } from '~/composables/use-user-settings'
import TwoFactorSettings from '~/components/settings/two-factor-settings.vue'

definePageMeta({ middleware: ['auth'], layout: 'default' })

interface LiveAccess {
  mode: 'waived' | 'qualified' | 'trial' | 'locked' | 'denied'
  canGoLive: boolean
  trialSecondsLeft: number
  progress: { accountDays: number, followers: number, pewAdded: number, pewReceived: number, activeDays: number, transactions: number }
  rules: { min_followers: number, min_account_days: number, min_pew_added: number, min_pew_received: number, min_active_days: number, min_transactions: number }
}

const tabs = [
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'media', label: 'Media & chat' },
  { id: 'live', label: 'Live' },
  { id: 'security', label: 'Security' }
]
const accountLinks = [
  { to: '/profile/edit', icon: 'user', label: 'Edit profile', hint: 'Name, photo, cover, bio and details' },
  { to: '/pages', icon: 'flag', label: 'My Pages', hint: 'Pages you run and follow' },
  { to: '/wallet', icon: 'wallet', label: 'Wallet', hint: 'PEW balance, deposits and withdrawals' },
  { to: '/ads', icon: 'megaphone', label: 'Ads Manager', hint: 'Create and track ad campaigns' },
  { to: '/verification/terms', icon: 'badge-check', label: 'Verification', hint: 'Badge fees and how to apply' }
]

const visibilityFields = [
  { key: 'lastSeen', label: 'Last seen & online', hint: 'Who sees when you were last active' },
  { key: 'profilePhoto', label: 'Profile photo', hint: 'Who can see your photo' },
  { key: 'about', label: 'About', hint: 'Who can read your bio' }
] as const

const route = useRoute()
const router = useRouter()
const validTab = (t: unknown) => tabs.some(x => x.id === t) ? String(t) : 'account'
const activeTab = ref(validTab(route.query.tab))
const setTab = (id: string) => { activeTab.value = id; router.replace({ query: { ...route.query, tab: id } }) }
const goBack = () => (window.history.length > 1 ? router.back() : navigateTo('/feed'))

const { settings: userSettings, saving: settingsSaving, error: settingsError, load: loadUserSettings, update: updateUserSettings } = useUserSettings()

const toast = ref({ message: '', type: 'success' as 'success' | 'error' })
const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message: msg, type }
  setTimeout(() => { toast.value.message = '' }, 3500)
}
const errMsg = (e: unknown, fallback: string) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback

const live = ref<LiveAccess | null>(null)
const liveLoading = ref(false)
const liveError = ref('')
const streamDefaults = reactive({ defaultTitle: '', allowComments: true, allowGifts: true })
const loadLive = async () => {
  if (live.value || liveLoading.value) return
  liveLoading.value = true
  liveError.value = ''
  try {
    const [access, prefs] = await Promise.all([
      $fetch<{ data: LiveAccess }>('/api/stream/live-access'),
      $fetch<{ data: { defaultTitle: string, allowComments: boolean, allowGifts: boolean } }>('/api/stream/settings')
    ])
    live.value = access.data
    Object.assign(streamDefaults, { defaultTitle: prefs.data.defaultTitle, allowComments: prefs.data.allowComments, allowGifts: prefs.data.allowGifts })
  } catch (e) {
    liveError.value = errMsg(e, 'Could not load your live settings')
  } finally {
    liveLoading.value = false
  }
}
const saveStream = async (patch: Partial<typeof streamDefaults>) => {
  try {
    const res = await $fetch<{ data: typeof streamDefaults }>('/api/stream/settings', { method: 'POST', body: patch })
    Object.assign(streamDefaults, { defaultTitle: res.data.defaultTitle, allowComments: res.data.allowComments, allowGifts: res.data.allowGifts })
    triggerToast('Saved')
  } catch (e) {
    triggerToast(errMsg(e, 'Could not save'), 'error')
  }
}
const liveHeadline = computed(() => ({
  waived: 'Live access granted by Viorp',
  qualified: 'You qualify to go live',
  trial: 'Free live trial',
  locked: 'Trial used up',
  denied: 'Live streaming is disabled on your account'
})[live.value?.mode ?? 'locked'])
const liveDetail = computed(() => {
  const l = live.value
  if (!l) return ''
  if (l.mode === 'trial') return `${Math.ceil(l.trialSecondsLeft / 60)} minutes of free live time left.`
  if (l.mode === 'locked') return 'Meet the requirements below to keep going live. Joining other streams is always free.'
  if (l.mode === 'denied') return 'Contact support if you think this is a mistake.'
  return 'Keep your activity up to keep your access.'
})
const liveProgress = computed(() => {
  const l = live.value
  if (!l) return []
  return [
    { label: 'Followers', have: l.progress.followers, need: l.rules.min_followers },
    { label: 'Account age (days)', have: l.progress.accountDays, need: l.rules.min_account_days },
    { label: 'PEW added', have: l.progress.pewAdded, need: l.rules.min_pew_added },
    { label: 'PEW received (alternative)', have: l.progress.pewReceived, need: l.rules.min_pew_received },
    { label: 'Active days', have: l.progress.activeDays, need: l.rules.min_active_days },
    { label: 'Transactions', have: l.progress.transactions, need: l.rules.min_transactions }
  ]
})

const resetSending = ref(false)
const sendPasswordReset = async () => {
  const email = useSupabaseUser().value?.email
  if (!email) return triggerToast('No email on this account', 'error')
  resetSending.value = true
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { email } })
    triggerToast(`Reset link sent to ${email}`)
  } catch (e) {
    triggerToast(errMsg(e, 'Could not send the link'), 'error')
  } finally {
    resetSending.value = false
  }
}

watch(activeTab, (t) => { if (t === 'live') void loadLive() }, { immediate: true })
onMounted(() => { void loadUserSettings() })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.tab-active { @apply bg-indigo-600/10 text-indigo-400 border-indigo-500/30; }
.tab-inactive { @apply text-slate-400 border-transparent hover:bg-slate-800/60; }
.row { @apply flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3; }
.row > span:first-child { @apply flex-1 min-w-0; }
.sel { max-width: 46%; }
.tog { @apply flex-shrink-0 cursor-pointer; appearance: none; -webkit-appearance: none; width: 2.25rem; height: 1.25rem; border-radius: 9999px; background: #334155; position: relative; transition: background .15s; }
.tog::after { content: ''; position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 9999px; background: #fff; transition: transform .15s; }
.tog:checked { background: #6366f1; }
.tog:checked::after { transform: translateX(1rem); }
.sel { @apply flex-shrink-0 bg-slate-900 text-xs text-white border border-slate-700 rounded-lg px-2 py-2; }
.btn-primary { @apply bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg; }
.btn-secondary { @apply bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg; }
</style>
