<!-- FILE: /pages/pal.vue - PALs (friends) -->
<template>
  <div class="pal-container">
    <div class="page-header">
      <div>
        <h1>My PALs</h1>
        <p class="subtitle">People you know on Viorp</p>
      </div>
      <button class="btn btn-primary" @click="showSync = true">
        <Icon name="users" size="16" /> Sync contacts
      </button>
    </div>

    <div class="pal-stats">
      <div class="stat-card">
        <p class="stat-label">PALs</p>
        <h3 class="stat-value">{{ pals.length }}</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">Requests</p>
        <h3 class="stat-value">{{ incoming.length }}</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">Sent</p>
        <h3 class="stat-value">{{ outgoing.length }}</h3>
      </div>
      <div class="stat-card">
        <p class="stat-label">On app from contacts</p>
        <h3 class="stat-value">{{ onApp.length }}</h3>
      </div>
    </div>

    <div class="pal-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-button', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-else-if="loading" class="muted">Loading…</p>

    <section v-else-if="activeTab === 'My PALs'" class="pal-section">
      <input v-model="search" class="search-input" type="text" placeholder="Search your PALs" />
      <p v-if="!filteredPals.length" class="muted">
        No PALs yet. Sync your contacts or accept a request to get started.
      </p>
      <div v-else class="pal-grid">
        <article v-for="pal in filteredPals" :key="pal.id" class="pal-card">
          <UserAvatar :user-id="pal.id" :src="pal.avatar_url" :name="pal.name" :size="48" />
          <div class="pal-info">
            <NuxtLink :to="`/profile/${pal.id}`" class="pal-name">{{ pal.name }}</NuxtLink>
            <span class="pal-username">@{{ pal.username || 'user' }}</span>
            <p v-if="pal.bio" class="pal-bio">{{ pal.bio }}</p>
          </div>
          <div class="pal-actions-row">
            <button class="btn btn-secondary" @click="openChat(pal.id)">Message</button>
            <button class="btn btn-tertiary" @click="removePal(pal.id)">Remove</button>
            <button class="btn btn-danger" @click="setBlocked(pal.id, true)">Block</button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'Requests'" class="pal-section">
      <h3>Incoming</h3>
      <p v-if="!incoming.length" class="muted">No incoming requests.</p>
      <article v-for="request in incoming" :key="request.requestId" class="pal-card">
        <UserAvatar
          :user-id="request.user?.id"
          :src="request.user?.avatar_url"
          :name="request.user?.name"
          :size="44"
        />
        <div class="pal-info">
          <NuxtLink :to="`/profile/${request.user?.id}`" class="pal-name">
            {{ request.user?.name }}
          </NuxtLink>
          <span class="pal-username">@{{ request.user?.username || 'user' }}</span>
        </div>
        <div class="pal-actions-row">
          <button class="btn btn-primary" @click="respond(request.requestId, 'accept')">Accept</button>
          <button class="btn btn-tertiary" @click="respond(request.requestId, 'decline')">Decline</button>
        </div>
      </article>

      <h3>Sent</h3>
      <p v-if="!outgoing.length" class="muted">No pending sent requests.</p>
      <article v-for="request in outgoing" :key="request.requestId" class="pal-card">
        <UserAvatar
          :user-id="request.user?.id"
          :src="request.user?.avatar_url"
          :name="request.user?.name"
          :size="44"
        />
        <div class="pal-info">
          <NuxtLink :to="`/profile/${request.user?.id}`" class="pal-name">
            {{ request.user?.name }}
          </NuxtLink>
          <span class="pal-username">@{{ request.user?.username || 'user' }}</span>
        </div>
        <div class="pal-actions-row">
          <button class="btn btn-tertiary" @click="respond(request.requestId, 'cancel')">Cancel</button>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'Suggestions'" class="pal-section">
      <p v-if="!suggestions.length" class="muted">
        No suggestions yet — syncing your contacts is the fastest way to find people you know.
      </p>
      <article v-for="person in suggestions" :key="person.id" class="pal-card">
        <UserAvatar :user-id="person.id" :src="person.avatar_url" :name="person.name" :size="44" />
        <div class="pal-info">
          <NuxtLink :to="`/profile/${person.id}`" class="pal-name">{{ person.name }}</NuxtLink>
          <span class="pal-username">@{{ person.username || 'user' }}</span>
          <p class="pal-reason">{{ person.reasons.join(' · ') }}</p>
        </div>
        <div class="pal-actions-row">
          <button class="btn btn-primary" @click="sendRequest(person.id)">Add PAL</button>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'Invite'" class="pal-section">
      <p class="muted">
        Contacts saved on your phone who do not have a Viorp account yet.
      </p>
      <p v-if="!invitable.length" class="muted">Nothing to show — sync your contacts first.</p>
      <article v-for="(contact, index) in invitable" :key="`${contact.name}-${index}`" class="pal-card">
        <UserAvatar :name="contact.name" :size="44" />
        <div class="pal-info">
          <span class="pal-name">{{ contact.name }}</span>
        </div>
        <div class="pal-actions-row">
          <button class="btn btn-secondary" @click="shareInvite">Invite</button>
        </div>
      </article>
    </section>

    <section v-else class="pal-section">
      <p v-if="!blocked.length" class="muted">You have not blocked anyone.</p>
      <article v-for="person in blocked" :key="person.id" class="pal-card">
        <UserAvatar :user-id="person.id" :src="person.avatar_url" :name="person.name" :size="44" />
        <div class="pal-info">
          <span class="pal-name">{{ person.name }}</span>
          <span class="pal-username">@{{ person.username || 'user' }}</span>
        </div>
        <div class="pal-actions-row">
          <button class="btn btn-secondary" @click="setBlocked(person.id, false)">Unblock</button>
        </div>
      </article>
    </section>

    <ChatContactSyncModal
      v-if="showSync"
      @close="showSync = false"
      @synced="handleSynced"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Icon from '~/components/ui/icon.vue'
import UserAvatar from '~/components/ui/user-avatar.vue'
import ChatContactSyncModal from '~/components/chat/contact-sync-modal.vue'
import { usePals } from '~/composables/use-pals'
import { useContacts } from '~/composables/use-contacts'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const tabs = ['My PALs', 'Requests', 'Suggestions', 'Invite', 'Blocked'] as const
const activeTab = ref<typeof tabs[number]>('My PALs')
const search = ref('')
const showSync = ref(false)

const {
  pals, incoming, outgoing, suggestions, blocked, loading, error,
  loadAll, sendRequest, respond, removePal, setBlocked
} = usePals()

const { onApp, invitable, load: loadContacts } = useContacts()

const filteredPals = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return pals.value
  return pals.value.filter(pal =>
    pal.name.toLowerCase().includes(term) || (pal.username ?? '').toLowerCase().includes(term))
})

const router = useRouter()
const openChat = (userId: string): void => {
  router.push({ path: '/chat', query: { user: userId } })
}

const shareInvite = async (): Promise<void> => {
  const url = 'https://viorp.com'
  const text = 'Join me on Viorp'
  if (import.meta.client && navigator.share) {
    await navigator.share({ title: 'Viorp', text, url }).catch(() => undefined)
  } else if (import.meta.client) {
    await navigator.clipboard?.writeText(`${text}: ${url}`).catch(() => undefined)
  }
}

const handleSynced = async (): Promise<void> => {
  await Promise.all([loadContacts(), loadAll()])
}

onMounted(async () => {
  await Promise.all([loadAll(), loadContacts()])
})
</script>

<style scoped>
.pal-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.7;
}

.pal-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--bg-card, #0A0F1E);
  border: 1px solid var(--color-dark-grey, #1F2937);
  border-radius: 16px;
  padding: 12px 16px;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
}

.stat-value {
  margin: 4px 0 0;
  font-size: 20px;
}

.pal-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.tab-button {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-dark-grey, #1F2937);
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.tab-button.active {
  background: var(--accent, #6FFFD4);
  color: var(--text-on-accent, #0A0F1E);
  font-weight: 600;
}

.pal-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pal-section h3 {
  margin: 8px 0 0;
  font-size: 15px;
}

.search-input {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-dark-grey, #1F2937);
  background: var(--bg-card, #0A0F1E);
  color: inherit;
}

.pal-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pal-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-dark-grey, #1F2937);
  border-radius: 16px;
  background: var(--bg-card, #0A0F1E);
}

.pal-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pal-name {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.pal-username,
.pal-reason,
.pal-bio {
  font-size: 12px;
  opacity: 0.7;
  margin: 0;
}

.pal-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--accent, #6FFFD4);
  color: var(--text-on-accent, #0A0F1E);
}

.btn-secondary {
  background: transparent;
  color: inherit;
  border-color: var(--color-dark-grey, #1F2937);
}

.btn-tertiary {
  background: transparent;
  color: inherit;
  opacity: 0.8;
  border-color: transparent;
}

.btn-danger {
  background: transparent;
  color: var(--color-error, #FF2E88);
  border-color: transparent;
}

.muted {
  opacity: 0.7;
  font-size: 14px;
}

.error-text {
  color: var(--color-error, #FF2E88);
}
</style>
