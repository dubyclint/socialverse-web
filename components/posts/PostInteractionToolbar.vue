<template>
  <!-- Updated with post-actions-wrapper class -->
  <div class="post-actions-wrapper">
    
    <button 
      @click="likePost(post.id)" 
      class="action-btn"
      :class="post.liked_by_me ? 'text-red-500' : 'text-gray-500'"
    >
      <Icon name="heroicons:heart" class="w-5 h-5" />
      <span class="text-xs font-medium">{{ post.likes_count || 0 }}</span>
    </button>

    <button 
      @click="commentPost(post.id)" 
      class="action-btn text-gray-500"
    >
      <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
      <span class="text-xs font-medium">{{ post.comments_count || 0 }}</span>
    </button>

    <button 
      @click="handleGiftClick(post.id)"
      :disabled="isGifting[post.id]"
      class="action-btn pew-gift-btn"
    >
      <Icon name="heroicons:gift" class="w-5 h-5" />
      <span class="text-xs font-medium">
        {{ isGifting[post.id] ? 'Sending...' : (post.gifts_count || 'Gift') }}
      </span>
    </button>
    
  </div>
</template>

<script setup lang="ts">
import { useSocialFeed } from '~/composables/useSocialFeed'

const props = defineProps<{
  post: any
}>()

// These are now correctly self-contained in the component
const { likePost, commentPost, sendPewGift, isGifting } = useSocialFeed()

const handleGiftClick = async (postId: string) => {
  const amount = 1.00
  // Note: Using window.confirm is fine for MVP, 
  // but ensure it doesn't block the UI thread too aggressively.
  if (confirm(`Send a $${amount} PewGift to this creator?`)) {
    await sendPewGift(postId, amount)
  }
}
</script>
