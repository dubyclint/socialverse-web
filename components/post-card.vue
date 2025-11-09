<template>
  <div class="post-card">
    <div class="header">
      <img :src="post.userAvatar" alt="avatar" class="avatar" />
      <span class="username">{{ post.username }}</span>
      <span v-if="post.isVerified" class="badge">✔️</span>
    </div>
    <p>{{ post.content }}</p>
    <img v-if="post.mediaUrl" :src="post.mediaUrl" class="media" />
    <div class="actions">
      <button @click="likePost">❤️ {{ post.likes.length }}</button>
      <button @click="comment">💬 {{ post.comments.length }}</button>
      <button @click="share">🔗</button>
      <button @click="giftPew">🎁 Pew</button>
    </div>
  </div>
</template>

<script setup>
defineProps(['post'])

function likePost() {
  // Call backend API to like post
}
function comment() {
  // Open comment modal
}
function share() {
  // Share logic
}
function giftPew() {
  // Trigger pew gift flow
}
</script>

<style scoped>
.post-card {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
}
.avatar {
  width: 40px;
  border-radius: 50%;
}
.badge {
  color: green;
  margin-left: 5px;
}
.media {
  max-width: 100%;
  margin-top: 1rem;
}
.actions button {
  margin-right: 10px;
}
</style>
