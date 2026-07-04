<template>
  <div class="flex items-center space-x-6 py-2 border-t border-gray-100 mt-2">
    <button 
      @click="likePost(post.id)" 
      class="flex items-center space-x-1 transition-colors"
      :class="post.liked_by_me ? 'text-red-500' : 'text-gray-500 hover:text-red-500'"
    >
      <Icon name="heroicons:heart" class="w-5 h-5" />
      <span class="text-xs font-medium">{{ post.likes_count || 0 }}</span>
    </button>

    <button 
      @click="commentPost(post.id)" 
      class="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
    >
      <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
      <span class="text-xs font-medium">{{ post.comments_count || 0 }}</span>
    </button>

    <button 
      @click="handleGiftClick(post.id)"
      :disabled="isGifting[post.id]"
      class="flex items-center space-x-1 transition-colors"
      :class="isGifting[post.id] ? 'text-gray-300' : 'text-purple-600 hover:text-purple-700'"
    >
      <Icon name="heroicons:gift" class="w-5 h-5" />
      <span class="text-xs font-medium">
        {{ isGifting[post.id] ? '...' : (post.gifts_count || 'Gift') }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSocialFeed } from '~/composables/useSocialFeed'

const props = defineProps<{
  post: any
}>()

const { likePost, commentPost, sendPewGift, isGifting } = useSocialFeed()

const handleGiftClick = async (postId: string) => {
  // Preset amount of $1.00 for quick-action
  // You can expand this to open a modal for custom amounts later
  const amount = 1.00
  if (confirm(`Send a $${amount} PewGift to this creator?`)) {
    await sendPewGift(postId, amount)
  }
}
</script>
