<template>
  <div class="pages-home">
    <h1>Your Pages</h1>
    <p class="muted">You've created {{ context.createdCount }} of {{ context.cap }} Pages. Pages you were invited to manage don't count.</p>

    <div class="list">
      <NuxtLink v-for="page in context.managedPages" :key="page.id" :to="`/pages/${page.handle}`" class="row">
        <img :src="page.avatar_url || '/default-avatar.svg'" alt="" class="avatar" />
        <span class="info"><strong>{{ page.name }}</strong><small>@{{ page.handle }} · {{ page.role.toLowerCase() }}</small></span>
        <button type="button" class="btn small" @click.prevent="context.switchToPage(page.id)">
          {{ context.activeActor?.id === page.id ? 'Active' : 'Act as' }}
        </button>
      </NuxtLink>
      <p v-if="!context.managedPages.length" class="muted">No Pages yet.</p>
    </div>

    <form v-if="context.createdCount < context.cap" class="card" @submit.prevent="create">
      <h2>Create a Page</h2>
      <input v-model.trim="form.name" placeholder="Page name" maxlength="80" required />
      <input v-model.trim="form.handle" placeholder="handle (e.g. viorp_news)" maxlength="30" required />
      <input v-model.trim="form.category" placeholder="Category (optional)" maxlength="60" />
      <textarea v-model.trim="form.bio" placeholder="About this Page (optional)" maxlength="500" rows="3" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn" :disabled="saving">{{ saving ? 'Creating…' : 'Create Page' }}</button>
    </form>
    <p v-else class="muted">You've reached the 5-Page limit.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useContextStore } from '~/stores/context'

definePageMeta({ middleware: ['auth'] })

const context = useContextStore()
const form = reactive({ name: '', handle: '', category: '', bio: '' })
const saving = ref(false)
const error = ref('')

const create = async () => {
  saving.value = true
  error.value = ''
  try {
    const res = await $fetch<{ page: { handle: string } }>('/api/pages', { method: 'POST', body: { ...form } })
    await context.refreshPages()
    await navigateTo(`/pages/${res.page.handle}`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err.data?.statusMessage || err.statusMessage || 'Could not create Page'
  } finally {
    saving.value = false
  }
}

onMounted(() => { context.refreshPages().catch(() => {}) })
</script>

<style scoped>
.pages-home { max-width: 640px; margin: 0 auto; padding: 20px 16px 80px; color: #e2e8f0; }
h1 { font-size: 1.5rem; font-weight: 800; }
h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.muted { color: #94a3b8; font-size: 0.9rem; margin: 6px 0 14px; }
.list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.row { display: flex; align-items: center; gap: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 10px 12px; color: inherit; text-decoration: none; }
.avatar { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.info small { color: #94a3b8; }
.card { display: flex; flex-direction: column; gap: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
input, textarea { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 10px 12px; }
.btn { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.55rem 1.1rem; font-weight: 600; cursor: pointer; }
.btn.small { padding: 0.35rem 0.8rem; font-size: 0.8rem; flex-shrink: 0; }
.btn:disabled { opacity: .6; }
.error { color: #f87171; font-size: 0.85rem; }
</style>
