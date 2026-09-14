<template>
  <div class="support-page">
    <h2>📞 Contact Support</h2>

    <section>
      <h3>📋 Contact List</h3>
      <ul>
        <li v-for="c in contacts" :key="c.label">
          <strong>{{ c.label }}</strong> ({{ c.type }}) → {{ c.value }}
          <span v-if="c.region">[{{ c.region }}]</span>
        </li>
      </ul>
    </section>

    <section>
      <h3>💬 Live Chat</h3>
      <div v-for="chat in liveChats" :key="chat.label" class="chat-block">
        <div v-if="chat.method === 'widget'" v-html="chat.script"></div>

        <div v-else-if="chat.method === 'redirect'">
          <a :href="chat.url" target="_blank">{{ chat.label }}</a>
        </div>

        <div v-else-if="chat.method === 'native'">
          <button @click="openNativeChat(chat.label)">Chat with {{ chat.label }}</button>
        </div>
      </div>
    </section>

    <section v-if="isAdmin">
      <h3>🛠 Edit Support Contacts</h3>
      <form @submit.prevent="saveContacts">
        <div v-for="(c, index) in editContacts" :key="index" class="contact-edit">
          <input v-model="c.label" placeholder="Label" />
          <input v-model="c.value" placeholder="Value" />
          <select v-model="c.type">
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="other">Other</option>
          </select>
          <input v-model="c.region" placeholder="Region (optional)" />
        </div>
        <button @click="addContact">Add Contact</button>
        <button type="submit">Save All</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

interface SupportContact {
  label: string
  value: string
  type: string
  region: string
}

interface LiveChat {
  label: string
  method: string
  script?: string
  url?: string
}

const contacts = ref<SupportContact[]>([])
const editContacts = ref<SupportContact[]>([])
const liveChats = ref<LiveChat[]>([])
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.role === 'admin' || userStore.user?.role === 'manager')

async function fetchContacts() {
  contacts.value = await $fetch<SupportContact[]>('/api/admin/support')
  editContacts.value = JSON.parse(JSON.stringify(contacts.value))
}

async function fetchLiveChats() {
  liveChats.value = await $fetch<LiveChat[]>('/api/admin/live-chat')
}

function addContact() {
  editContacts.value.push({
    label: '',
    value: '',
    type: 'email',
    region: ''
  })
}

async function saveContacts() {
  await $fetch('/api/admin/support', {
    method: 'POST',
    body: editContacts.value
  })
  await fetchContacts()
}

function openNativeChat(label: string) {
  // Trigger native chat logic (e.g. open GunDB room or WebRTC call)
  console.log('Opening native chat with', label)
}

onMounted(() => {
  fetchContacts()
  fetchLiveChats()
})
</script>

<style scoped>
.support-page {
  padding: 1rem;
}
.contact-edit {
  margin-bottom: 1rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.5rem;
}
.chat-block {
  margin: 1rem 0;
}
</style>

