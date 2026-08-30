<template>
  <div class="monetization">
    <div class="monetization-header">
      <h1 class="page-title">💰 Monetization</h1>
      <p class="page-description">Every way to earn, spend and secure value on SocialVerse</p>
    </div>

    <div class="monetization-grid">
      <NuxtLink v-for="item in surfaces" :key="item.to" :to="item.to" class="monetization-card">
        <span class="card-icon">{{ item.emoji }}</span>
        <span class="card-body">
          <span class="card-title">{{ item.title }}</span>
          <span class="card-description">{{ item.description }}</span>
        </span>
        <Icon name="chevron-right" size="18" class="card-chevron" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

useHead({ title: 'Monetization' })

const surfaces: Array<{ to: string; emoji: string; title: string; description: string }> = [
  { to: '/wallet', emoji: '👛', title: 'Wallet', description: 'Balances, deposits and withdrawals' },
  { to: '/pewgift', emoji: '🎁', title: 'PewGift', description: 'Send and receive gifts on posts, chats and streams' },
  { to: '/ads', emoji: '🎯', title: 'Ad Center', description: 'Create and monitor advertising campaigns' },
  { to: '/p2p', emoji: '📈', title: 'P2P Trading', description: 'Trade directly with other users' },
  { to: '/escrow', emoji: '🔒', title: 'Escrow', description: 'Secure transactions and dispute resolution' },
  { to: '/stream', emoji: '📺', title: 'Live Streaming', description: 'Earn from gifts and stream ads' }
]
</script>

<style scoped>
.monetization {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.monetization-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 4px;
}

.page-description {
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.monetization-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.monetization-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.monetization-card:hover {
  border-color: var(--primary-color, #6366f1);
  transform: translateY(-1px);
}

.card-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-weight: 700;
}

.card-description {
  font-size: 0.85rem;
  color: var(--text-secondary, #6b7280);
}

.card-chevron {
  color: var(--text-secondary, #9ca3af);
  flex-shrink: 0;
}
</style>
