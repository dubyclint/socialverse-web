<template>
  <div class="post-actions-wrapper">
    <button @click="likePost(post.id)" class="action-btn" :class="post.liked_by_me ? 'text-red-500' : 'text-gray-500'">
      <Icon name="heroicons:heart" class="w-5 h-5" />
      <span>{{ post.likes_count || 0 }}</span>
    </button>

    <button @click="commentPost(post.id)" class="action-btn text-gray-500">
      <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
      <span>{{ post.comments_count || 0 }}</span>
    </button>

    <!-- Trigger the emit -->
    <button class="action-btn pew-gift-btn" @click="$emit('open-gift', post)">
      <Icon name="heroicons:gift" class="w-5 h-5" />
      <span>{{ post.gifts_count || 'Gift' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ post: any }>()
const emit = defineEmits(['open-gift'])

const { likePost, commentPost } = useSocialFeed()
</script>
