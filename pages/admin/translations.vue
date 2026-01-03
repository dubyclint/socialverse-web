<template>
  <div class="admin-translations">
    <h2>🌐 Translation Manager</h2>

    <form @submit.prevent="saveTranslation" class="translation-form">
      <input v-model="entry.key" placeholder="Key (e.g. support.title)" />
      <select v-model="entry.language">
        <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
      </select>
      <input v-model="entry.value" placeholder="Translated text" />
      <button type="submit">Save</button>
    </form>

    <div class="filter-bar">
      <input v-model="filter.key" placeholder="Filter by key" />
      <select v-model="filter.language">
        <option value="">All Languages</option>
        <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
      </select>
    </div>

    <h3>📋 Current Translations</h3>
    <ul>
      <li v-for="t in filteredTranslations" :key="t.key + t.language">
        <strong>{{ t.language }}</strong> → <code>{{ t.key }}</code> = {{ t.value }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
 definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})   
  
import { ref, computed, onMounted } from 'vue'

const entry = ref({ key: '', language: 'en', value: '' })
const translations = ref([])
const languages = ['en', 'fr', 'ha', 'zh', 'pt', 'de', 'hi']
const filter = ref({ key: '', language: '' })

async function fetchTranslations() {
  const res = await fetch('/api/admin/translations?lang=' + (filter.value.language || 'en'))
  translations.value = await res.json()
}

async function saveTranslation() {
  await fetch('/api/admin/translations', {
    method: 'POST',
    body: JSON.stringify(entry.value),
    headers: { 'Content-Type': 'application/json' }
  })
  entry.value = { key: '', language: 'en', value: '' }
  fetchTranslations()
}

const filteredTranslations = computed(() => {
  return translations.value.filter(t => {
    const matchKey = filter.value.key ? t.key.includes(filter.value.key) : true
    const matchLang = filter.value.language ? t.language === filter.value.language : true
    return matchKey && matchLang
  })
})

onMounted(fetchTranslations)
</script>

<style scoped>
.admin-translations {
  padding: 1rem;
}
.translation-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.filter-bar {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 0.5rem;
}
code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
</style>
