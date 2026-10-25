<!-- Staff control dashboard: metrics, review queues and every admin/manager tool, filtered by permission. -->
<template>
  <div class="control">
    <header class="top">
      <NuxtLink to="/feed" class="back"><Icon name="arrow-left" size="18" /> Feed</NuxtLink>
      <div>
        <h1>Control dashboard</h1>
        <p class="muted">Signed in as {{ staff?.role === 'admin' ? 'administrator' : 'manager' }}</p>
      </div>
    </header>

    <p v-if="loaded && !staff" class="error">You don't have staff access.</p>

    <template v-else-if="staff">
      <section v-if="can('metrics') && metrics" class="stats">
        <div v-for="s in statCards" :key="s.label" class="stat">
          <span class="value">{{ s.value }}</span>
          <span class="label">{{ s.label }}</span>
        </div>
      </section>
      <p v-else-if="metricsError" class="error">{{ metricsError }}</p>

      <section v-for="group in visibleGroups" :key="group.title" class="group">
        <h2>{{ group.title }}</h2>
        <div class="tiles">
          <NuxtLink v-for="t in group.tiles" :key="t.to" :to="t.to" class="tile">
            <Icon :name="t.icon" size="20" />
            <span class="t-title">{{ t.title }}</span>
            <span class="t-desc">{{ t.desc }}</span>
            <span v-if="t.queue && metrics && metrics.queues[t.queue] > 0" class="queue">{{ metrics.queues[t.queue] }}</span>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStaff } from '~/composables/useStaff'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })
useHead({ title: 'Control dashboard' })

interface Metrics {
  users: { total: number, new7d: number, verified: number, banned: number, onlineNow: number }
  content: { posts: number, posts24h: number, comments24h: number, messages24h: number, pages: number, liveStreams: number }
  money: { pewInWallets: number, deposits7d: number, feesEarned7d: number }
  queues: Record<'pendingAds' | 'activeAds' | 'openReports' | 'pendingBadges' | 'pendingWithdrawals', number>
}

interface Tile { to: string, icon: string, title: string, desc: string, perm: string | null, queue?: keyof Metrics['queues'] }

const { staff, loaded, load, can } = useStaff()
const metrics = ref<Metrics | null>(null)
const metricsError = ref('')

const GROUPS: { title: string, tiles: Tile[] }[] = [
  { title: 'People & trust', tiles: [
    { to: '/admin/users', icon: 'users', title: 'Roles & privileges', desc: 'Make managers and choose what each can do', perm: null },
    { to: '/admin/verified', icon: 'badge-check', title: 'Verification badges', desc: 'Approve requests, assign or remove badges', perm: 'verification', queue: 'pendingBadges' },
    { to: '/admin/compliance', icon: 'alert-triangle', title: 'Compliance', desc: 'Bans, timed bans, feature restrictions, reports', perm: 'compliance', queue: 'openReports' },
    { to: '/admin/support-agents', icon: 'headphones', title: 'Support agents', desc: 'Agent roster for support chat', perm: 'support' }
  ] },
  { title: 'Money', tiles: [
    { to: '/admin/withdrawals', icon: 'dollar-sign', title: 'Fees & withdrawals', desc: 'Fee percentages, approve or reject payouts', perm: 'fees', queue: 'pendingWithdrawals' },
    { to: '/admin/payments', icon: 'wallet', title: 'Payment providers', desc: 'Add-funds gateways and bank details', perm: 'payments' },
    { to: '/admin/p2p', icon: 'refresh-cw', title: 'P2P & escrow', desc: 'Trades, disputes and escrow releases', perm: 'p2p' },
    { to: '/admin/disputes', icon: 'alert-circle', title: 'Disputes', desc: 'Resolve trade disputes', perm: 'p2p' }
  ] },
  { title: 'Content & growth', tiles: [
    { to: '/admin/statuses', icon: 'clock', title: 'Statuses', desc: 'How long statuses stay visible', perm: 'admin' },
    { to: '/admin/announcements', icon: 'megaphone', title: 'Global announcement', desc: 'Show a notice to everyone', perm: 'announcements' },
    { to: '/admin/ads', icon: 'trending-up', title: 'Ads review & settings', desc: 'Approve ads, pricing, ad networks', perm: 'ads', queue: 'pendingAds' },
    { to: '/admin/live-access', icon: 'video', title: 'Live access', desc: 'Trial, go-live requirements, grant or remove live access', perm: 'compliance' },
    { to: '/admin/streaming', icon: 'video', title: 'Live streaming', desc: 'Active streams', perm: 'compliance' },
    { to: '/admin/chat-monitor', icon: 'message-circle', title: 'Chat monitor', desc: 'Reported chats', perm: 'compliance' }
  ] },
  { title: 'Security & system', tiles: [
    { to: '/admin/security', icon: 'shield', title: 'Security & audit log', desc: 'Every staff action, staff list', perm: 'security' },
    { to: '/admin/settings', icon: 'settings', title: 'Platform settings', desc: 'Global app configuration', perm: null },
    { to: '/terms-and-policy', icon: 'file-text', title: 'Policy & terms', desc: 'Published legal documents', perm: null }
  ] }
]

const visibleGroups = computed(() => GROUPS
  .map(g => ({ ...g, tiles: g.tiles.filter(t => (t.perm === null ? staff.value?.role === 'admin' : can(t.perm))) }))
  .filter(g => g.tiles.length))

const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
const statCards = computed(() => {
  const m = metrics.value
  if (!m) return []
  return [
    { label: 'Users', value: fmt(m.users.total) },
    { label: 'New this week', value: fmt(m.users.new7d) },
    { label: 'Online now', value: fmt(m.users.onlineNow) },
    { label: 'Verified', value: fmt(m.users.verified) },
    { label: 'Banned', value: fmt(m.users.banned) },
    { label: 'Posts (24h)', value: fmt(m.content.posts24h) },
    { label: 'Comments (24h)', value: fmt(m.content.comments24h) },
    { label: 'Messages (24h)', value: fmt(m.content.messages24h) },
    { label: 'Pages', value: fmt(m.content.pages) },
    { label: 'Live now', value: fmt(m.content.liveStreams) },
    { label: 'PEW in wallets', value: fmt(m.money.pewInWallets) },
    { label: 'Deposits (7d, PEW)', value: fmt(m.money.deposits7d) },
    { label: 'Fees earned (7d, PEW)', value: fmt(m.money.feesEarned7d) }
  ]
})

onMounted(async () => {
  await load(true)
  if (!can('metrics')) return
  try {
    metrics.value = await $fetch<Metrics>('/api/admin/metrics')
  } catch (err) {
    metricsError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Could not load metrics'
  }
})
</script>

<style scoped>
.control { max-width: 1100px; margin: 0 auto; padding: 16px; }
.top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.top h1 { margin: 0; font-size: 1.4rem; }
.back { display: inline-flex; align-items: center; gap: 4px; color: inherit; text-decoration: none; font-size: .9rem; }
.muted { color: var(--text-secondary, #6b7280); margin: 2px 0 0; font-size: .85rem; }
.error { color: #dc2626; }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; }
.stat { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; }
.stat .value { font-size: 1.3rem; font-weight: 700; }
.stat .label { font-size: .75rem; color: var(--text-secondary, #6b7280); }
.group h2 { font-size: 1rem; margin: 18px 0 8px; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.tile { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 12px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-card, #fff); color: inherit; text-decoration: none; transition: border-color .15s, transform .15s; }
.tile:hover { border-color: #7c3aed; transform: translateY(-1px); }
.tile :deep(svg) { color: #7c3aed; }
.t-title { font-weight: 600; }
.t-desc { font-size: .8rem; color: var(--text-secondary, #6b7280); }
.queue { position: absolute; top: 10px; right: 10px; background: #dc2626; color: #fff; border-radius: 999px; font-size: .7rem; padding: 2px 7px; font-weight: 700; }
</style>
