<template>
  <div>
    <CreatePost />
    <h2>Latest Posts</h2>
    <PostCard v-for="post in posts" :key="post.id" :post="post" />
    <h2>Top Pew</h2>
    <PewCard v-for="pew in pews" :key="pew.id" :pew="pew" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CreatePost from '@/components/create-posts.vue'
import PostCard from '@/components/post-card.vue
import PewCard from '@/components/pew-card.vue'

const posts = ref([])
const pews = ref([])

onMounted(async () => {
  // Fetch posts and pews from backend
})
</script>
