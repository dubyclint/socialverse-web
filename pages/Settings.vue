<template>
  <div class="settings-panel" :class="{ compact: isMobile }">
    <h2>⚙️ Settings Panel</h2>

    <section>
      <h3>🌍 Language Preference</h3>
      <select v-model="userSettings.language" @change="saveUserSetting('language', userSettings.language)">
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="ha">Hausa</option>
        <option value="zh">中文</option>
      </select>
    </section>

    <section>
      <h3>🔔 Notifications</h3>
      <label>
        <input type="checkbox" v-model="userSettings.notifications.email"
               @change="saveUserSetting('notifications.email', userSettings.notifications.email)" />
        Email Alerts
      </label>
      <label>
        <input type="checkbox" v-model="userSettings.notifications.sms"
               @change="saveUserSetting('notifications.sms', userSettings.notifications.sms)" />
        SMS Alerts
      </label>
    </section>

    <section v-if="isAdmin">
      <h3>🛠 Global Settings</h3>
      <div v-for="(value, key) in globalSettings" :key="key" class="global-setting">
        <label>{{ key }}</label>
        <input :value="value" @change="saveGlobalSetting(key, $event.target.value)" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { isMobile } from '@/composables/useDevice'

const userSettings = ref({
  language: 'en',
  notifications: {
    email: true,
    sms: false
  }
})

const globalSettings = ref({})
const isAdmin = true // Replace with actual role check
const userId = 'user123' // Replace with actual user ID

async function fetchSettings() {
  const userRes = await fetch(`/api/settings?scope=user`, {
    headers: { 'x-user-id': userId }
  })
  const userData = await userRes.json()
  userData.forEach(s => {
    if (s.key.includes('.')) {
      const [group, sub] = s.key.split('.')
      userSettings.value[group][sub] = s.value
    } else {
      userSettings.value[s.key] = s.value
    }
  })

  if (isAdmin) {
    const globalRes = await fetch('/api/settings?scope=global')
    const globalData = await globalRes.json()
    globalData.forEach(s => {
      globalSettings.value[s.key] = s.value
    })
  }
}

async function saveUserSetting(key, value) {
  await fetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ scope: 'user', key, value }),
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    }
  })
}

async function saveGlobalSetting(key, value) {
  await fetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ scope: 'global', key, value, adminId: 'admin123' }),
    headers: { 'Content-Type': 'application/json' }
  })
}

onMounted(fetchSettings)
</script>

<style scoped>
.settings-panel {
  padding: 1.5rem;
  max-width: 600px;
  margin: auto;
}
.compact {
  padding: 1rem;
}
section {
  margin-bottom: 2rem;
}
.global-setting {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
select, input[type="text"], input[type="checkbox"] {
  font-size: 1rem;
  padding: 0.5rem;
  margin-top: 0.25rem;
}
</style>
