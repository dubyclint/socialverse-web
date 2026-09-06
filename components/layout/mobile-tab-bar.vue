<template>
  <nav class="mobile-tab-bar" aria-label="Primary">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab"
      :class="{ active: isActive(tab.to) }"
    >
      <Icon :name="tab.icon" size="22" />
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/feed', label: 'Feed', icon: 'home' },
  { to: '/explore', label: 'Explore', icon: 'compass' },
  { to: '/chat', label: 'Chat', icon: 'message-circle' },
  { to: '/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/profile', label: 'Profile', icon: 'user' }
]

const path = computed(() => route?.path || '/')
const isActive = (to: string) => path.value.startsWith(to)
</script>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  justify-content: space-around;
  background: #0f172a;
  border-top: 1px solid #1e293b;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.25rem;
  font-size: 0.7rem;
  color: #94a3b8;
  text-decoration: none;
}

.tab.active {
  color: #818cf8;
}
</style>
