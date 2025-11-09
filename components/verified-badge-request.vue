<template>
  <div class="badge-request">
    <h3>Request Verified Badge</h3>
    <form @submit.prevent="submitRequest">
      <input v-model="form.name" placeholder="Full Name" required />
      <input type="file" @change="handleFile" required />
      <input v-model="form.socialLink" placeholder="Social Proof (optional)" />
      <button type="submit">Submit</button>
    </form>
    <p v-if="status">Status: {{ status }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const form = ref({ name: '', socialLink: '', file: null })
const status = ref('')

function handleFile(e) {
  form.value.file = e.target.files[0]
}

async function submitRequest() {
  const body = new FormData()
  body.append('name', form.value.name)
  body.append('socialLink', form.value.socialLink)
  body.append('file', form.value.file)

  const res = await fetch('/api/verified/request', { method: 'POST', body })
  const data = await res.json()
  status.value = data.status
}

onMounted(async () => {
  const res = await fetch('/api/verified/status')
  const data = await res.json()
  status.value = data.status
})
</script>
