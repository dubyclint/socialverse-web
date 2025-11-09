<template>
  <div class="post-page">
    <h2>Post Detail</h2>
    <p>Post ID: {{ id }}</p>
    <!-- <PostDetail :postId="id" /> -->
    <!-- <AdSlot page="Post Detail" /> -->
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
// import PostDetail from '~/components/PostDetail.vue'; // Component may not exist
// import AdSlot from '~/components/AdSlot.vue'; // Component may not exist

const route = useRoute();
const id = route.params.id;
</script>

<style scoped>
.post-page {
  padding: 2rem;
}
</style>


