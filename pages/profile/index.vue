<template>
  <div class="profile-redirect">
    <div v-if="failed" class="state">
      <p>Could not open your profile.</p>
      <button type="button" class="btn" @click="open">Try again</button>
    </div>
    <div v-else class="spinner" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// The owner's profile is rendered by /profile/[id] (same page visitors see,
// with owner controls), so /profile only resolves the caller's id.
const failed = ref(false)

const open = async () => {
  failed.value = false
  try {
    const me = await $fetch<{ user_id: string } | null>('/api/profile/me')
    if (!me?.user_id) throw new Error('No profile')
    await navigateTo(`/profile/${me.user_id}`, { replace: true })
  } catch {
    failed.value = true
  }
}

onMounted(open)
</script>

<style scoped>
.profile-redirect { min-height: 60vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #cbd5e1; }
.state { text-align: center; }
.btn { margin-top: 10px; background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.45rem 1rem; cursor: pointer; }
.spinner { width: 34px; height: 34px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 999px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
