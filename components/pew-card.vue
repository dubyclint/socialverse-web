<template>
  <div class="pew-card">
    <div class="header">
      <img :src="pew.userAvatar" alt="avatar" class="avatar" />
      <span class="username">{{ pew.username }}</span>
      <span class="rank">🔥 Rank: {{ pew.rankScore }}</span>
    </div>
    <h3>{{ pew.title }}</h3>
    <p>{{ pew.content }}</p>
    <img v-if="pew.mediaUrl" :src="pew.mediaUrl" class="media" />
    <div class="actions">
      <button @click="likePew">❤️ {{ pew.likes.length }}</button>
      <button @click="comment">💬 {{ pew.comments.length }}</button>
      <button @click="giftPew">🎁 Pew</button>
    </div>
  </div>
</template>

<script setup>
defineProps(['pew'])

function likePew() {
  // Call backend API to like pew
}
function comment() {
  // Open comment modal
}
function giftPew() {
  // Trigger pew gift flow
}
</script>

<style scoped>
.pew-card {
  border: 1px solid #aaa;
  padding: 1rem;
  margin-bottom: 1rem;
}
.avatar {
  width: 40px;
  border-radius: 50%;
}
.rank {
  font-weight: bold;
  margin-left: 10px;
}
.media {
  max-width: 100%;
  margin-top: 1rem;
}
.actions button {
  margin-right: 10px;
}
</style>
