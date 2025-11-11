<template>
  <div class="admin/post">
    <h3>Flagged Posts</h3>
    <ul>
      <li v-for="post in post" :key="post._id">
        {{ post.content }}
        <button @click="flag(post._id)">Flag</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const posts = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/admin/posts')
  posts.value = await res.json()
})

async function flag(postId) {
  await fetch('http://localhost:3000/api/admin/flag-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId })
  })
}
</script>

<style scoped>
.admin-posts {
  border: 1px solid #aaa;
  padding: 1rem;
}
</style>
