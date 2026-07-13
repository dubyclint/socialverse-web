<template>
  <div class="profile-page">
    <div class="profile-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <template v-else-if="displayProfile">
        <div class="profile-header">
          <div class="profile-picture-section">
            <div class="profile-picture-container">
              <img
                v-if="displayProfile.avatar_url"
                :src="displayProfile.avatar_url"
                :alt="displayProfile.full_name || ''"
                class="profile-picture"
                @error="handleAvatarError"
              />
              <img v-else src="/default-avatar.svg" class="profile-picture default-avatar" />
              <button v-if="isOwnProfile" @click="showAvatarUpload = true" class="edit-avatar-btn">
                <Icon name="camera" size="16" />
              </button>
            </div>
          </div>

          <div class="profile-info">
            <h1 class="profile-name">{{ displayProfile.full_name || 'User' }}</h1>
            <p class="profile-username">@{{ displayProfile.username }}</p>
            
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-number">{{ formatNumber(displayProfile.posts_count || 0) }}</span>
                <span class="stat-label">Posts</span>
              </div>
            </div>

            <div class="profile-actions">
              <button v-if="isOwnProfile" @click="showEditProfile = true" class="btn btn-secondary">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div class="profile-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'posts'" class="posts-grid">
             <PostCard v-for="post in userPosts" :key="post.id" :post="post" />
          </div>
        </div>

        <LazyEditProfileModal v-if="showEditProfile" @close="showEditProfile = false" />
        <LazyAvatarUploadModal v-if="showAvatarUpload" @close="showAvatarUpload = false" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '~/stores/profile'
import type { Post } from '~/types/post'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const profileStore = useProfileStore()
const { profile: displayProfile, isLoading: loading } = storeToRefs(profileStore)

// Local UI state
const activeTab = ref('posts')
const isOwnProfile = ref(true) // Should be derived from authStore in production
const showEditProfile = ref(false)
const showAvatarUpload = ref(false)

// Placeholder data arrays - move these to profileStore actions when ready
const userPosts = ref<Post[]>([])

onMounted(async () => {
  await profileStore.fetchProfile()
})

const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/default-avatar.svg'
}

// Helpers
const formatNumber = (num: number) => new Intl.NumberFormat().format(num)

const tabs = [
  { id: 'posts', label: 'Posts', icon: 'file-text' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'likes', label: 'Likes', icon: 'heart' }
]
</script>


<style scoped>
.profile-page { min-height: 100vh; background: #0f172a; }
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; color: #cbd5e1; }
.spinner { width: 40px; height: 40px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.profile-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.profile-header { display: grid; grid-template-columns: auto 1fr; gap: 2rem; margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #334155; }
.profile-picture-container { position: relative; width: 150px; height: 150px; }
.profile-picture { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #3b82f6; }
.edit-avatar-btn { position: absolute; bottom: 0; right: 0; width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.profile-info { display: flex; flex-direction: column; justify-content: space-between; }
.profile-name { font-size: 2rem; font-weight: bold; color: white; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 1rem; }
.profile-username { font-size: 1.125rem; color: #94a3b8; margin-bottom: 0.5rem; }
.profile-stats { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-number { font-size: 1.5rem; font-weight: bold; color: white; }
.stat-label { font-size: 0.875rem; color: #94a3b8; }
.profile-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.btn-primary { background: #3b82f6; color: white; }
.btn-secondary { background: #475569; color: white; }
.btn-tertiary { background: #1e293b; color: #e2e8f0; border: 1px solid #475569; }
.profile-bio { margin-top: 1rem; color: #e2e8f0; line-height: 1.6; }
.profile-details { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; color: #94a3b8; }
.detail-item { display: flex; align-items: center; gap: 0.5rem; }
.detail-item a { color: #3b82f6; text-decoration: none; }
.profile-tabs { display: flex; gap: 2rem; border-bottom: 1px solid #334155; margin-bottom: 2rem; }
.tab-button { padding: 1rem 0; background: none; border: none; color: #94a3b8; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 2px solid transparent; }
.tab-button.active { color: #3b82f6; border-bottom-color: #3b82f6; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: #94a3b8; }
.empty-state h3 { font-size: 1.25rem; color: #e2e8f0; margin-top: 1rem; }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.media-item { position: relative; overflow: hidden; border-radius: 8px; cursor: pointer; aspect-ratio: 1; }
.media-thumbnail { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.media-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.3s; }
.media-item:hover .media-overlay { opacity: 1; }
</style>
