<template>
  <div class="match-card">
    <img :src="match.avatar" class="avatar" />
    <h4>{{ match.username }}</h4>
    <p class="rank">{{ match.rank }} <span v-if="match.isVerified">✔</span></p>
    <p class="score">Match Score: {{ match.matchScore }}</p>
    <p v-if="match.seenBefore" class="seen">Seen before</p>
    <ul>
      <li v-for="tag in match.reasonTags" :key="tag">{{ tag }}</li>
    </ul>
    <div class="actions">
      <button @click="accept">Accept</button>
      <button @click="skip">Skip</button>
      <button @click="message">Message</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ match: Object })

function accept() {
  fetch('/api/match/accept', {
    method: 'POST',
    body: JSON.stringify({ userId: props.match.id }),
    headers: { 'Content-Type': 'application/json' }
  })
}

function skip() {
  fetch('/api/match/skip', {
    method: 'POST',
    body: JSON.stringify({ userId: props.match.id }),
    headers: { 'Content-Type': 'application/json' }
  })
}

function message() {
  window.location.href = `/chat/${props.match.id}`
}
</script>

<style scoped>
.seen {
  font-size: 0.85rem;
  color: #888;
}
</style>
