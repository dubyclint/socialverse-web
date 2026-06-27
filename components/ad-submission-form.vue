<template>
  <form @submit.prevent="submitAd">
    <h3>Create an Ad</h3>

    <label>Ad Type</label>
    <select v-model="ad.type" @change="adjustFields">
      <option value="image">Image</option>
      <option value="video">Video</option>
      <option value="text">Text</option>
      <option value="audio">Audio</option>
    </select>

    <div v-if="ad.type === 'image'">
      <input type="file" accept="image/*" @change="validateImage" />
      <input v-model="ad.altText" placeholder="Alt text" />
    </div>

    <div v-if="ad.type === 'video'">
      <input type="file" accept="video/mp4,video/mov" @change="validateVideo" />
      <input v-model="ad.duration" placeholder="Duration (sec)" type="number" />
    </div>

    <div v-if="ad.type === 'text'">
      <input v-model="ad.headline" placeholder="Headline" />
      <textarea v-model="ad.description" placeholder="Description"></textarea>
      <input v-model="ad.cta" placeholder="Call to Action" />
    </div>

    <div v-if="ad.type === 'audio'">
      <input type="file" accept="audio/mp3,audio/wav" @change="validateAudio" />
    </div>

    <label>Target Location</label>
    <select v-model="ad.location">
      <option value="Nigeria">Nigeria</option>
      <option value="Kenya">Kenya</option>
      <option value="UK">UK</option>
    </select>

    <label>Budget (USDT)</label>
    <input v-model.number="ad.budget" type="number" />

    <button type="submit">Submit Ad</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
const ad = ref({ type: 'image', location: 'Nigeria', budget: 10 })

function adjustFields() {
  ad.value.altText = ''
  ad.value.duration = ''
  ad.value.headline = ''
  ad.value.description = ''
  ad.value.cta = ''
}

function validateImage(e) {
  const file = e.target.files[0]
  if (file.size > 2 * 1024 * 1024) alert('Max size 2MB')
}

function validateVideo(e) {
  const file = e.target.files[0]
  if (file.size > 10 * 1024 * 1024) alert('Max size 10MB')
}

function validateAudio(e) {
  const file = e.target.files[0]
  if (file.size > 5 * 1024 * 1024) alert('Max size 5MB')
}

async function submitAd() {
  await fetch('/api/ads/submit', {
    method: 'POST',
    body: JSON.stringify(ad.value),
    headers: { 'Content-Type': 'application/json' }
  })
}
</script>
