<template>
  <div class="post-page">
    <h2>Post Detail</h2>
    <p>Post ID: {{ id }}</p>
    <!-- <PostDetail :postId="id" /> -->
    <!-- <AdSlot page="Post Detail" /> -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { useRoute } from 'vue-router';
import PostDetail from '~/components/post-detail.vue'; // Component may not exist
import AdSlot from '~/components/ad-slot.vue'; // Component may not exist

const route = useRoute();
const id = route.params.id;
</script>

<style scoped>
.post-page {
  padding: 2rem;
}
</style>


