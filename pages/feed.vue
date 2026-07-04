<!-- ============================================================================
     FILE: /pages/feed.vue [PART 1 - STANDARDIZED CORE TEMPLATE]
     ============================================================================ -->
<template>
  <div class="feed-page">
    <header class="feed-header">
      <div class="header-top">
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-btn" aria-label="Toggle menu">
            <Icon name="menu" size="20" />
          </button>
          <NuxtLink to="/feed" class="logo">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>
        <nav class="header-center">
          <NuxtLink to="/feed" class="nav-icon" :class="{ active: route.path === '/feed' }" aria-label="Feed">
            <Icon name="home" size="24" /> <span class="nav-label">Feed</span>
          </NuxtLink>
          <NuxtLink to="/status" class="nav-icon" :class="{ active: route.path === '/status' }" aria-label="Statuses Ecosystem">
            <Icon name="layers" size="24" /> <span class="nav-label">Status</span>
          </NuxtLink>
          <NuxtLink to="/posts/create" class="nav-icon" :class="{ active: route.path === '/posts/create' }" aria-label="Create Post">
            <Icon name="plus-square" size="24" /> <span class="nav-label">Post</span>
          </NuxtLink>
          <NuxtLink to="/stream" class="nav-icon" :class="{ active: route.path === '/stream' }" aria-label="Live Stream">
            <Icon name="radio" size="24" /> <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>
          <NuxtLink to="/wallet" class="nav-icon" :class="{ active: route.path === '/wallet' }" aria-label="Wallet">
            <Icon name="wallet" size="24" /> <span class="nav-label">Wallet</span>
          </NuxtLink>
        </nav>
        <div class="header-right">
          <div class="user-avatar-wrapper">
            <img :src="userAvatar" :alt="userName" class="user-avatar" @click="goToProfilePage()" :style="{ cursor: currentUser?.id ? 'pointer' : 'default' }" />
            <span class="status-indicator" :class="userStatus"></span>
          </div>
        </div>
      </div>
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
      <aside :class="['sidebar', { open: sidebarOpen }]">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="close-btn" @click="toggleSidebar"><Icon name="lucide:x" size="20" /></button>
        </div>
        <nav class="sidebar-nav">
          <div v-if="!currentUser?.id" class="sidebar-item disabled-info" title="Not authenticated">
            <Icon name="user" size="18" /> <span>Profile</span> <span class="warning-badge">!</span>
          </div>
          <button v-else class="sidebar-item" @click="goToProfilePage()" title="Go to your profile">
            <Icon name="user" size="18" /> <span>Profile</span>
          </button>
          <NuxtLink to="/status" class="sidebar-item" @click="toggleSidebar"><Icon name="layers" size="18" /> <span>Statuses</span></NuxtLink>
          <NuxtLink to="/chat" class="sidebar-item" @click="toggleSidebar"><Icon name="message-circle" size="18" /> <span>Chat</span><span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span></NuxtLink>
          <NuxtLink to="/notifications" class="sidebar-item" @click="toggleSidebar"><Icon name="bell" size="18" /> <span>Notifications</span><span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span></NuxtLink>
          <NuxtLink to="/inbox" class="sidebar-item" @click="toggleSidebar"><Icon name="inbox" size="18" /> <span>Inbox</span><span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span></NuxtLink>
          <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar"><Icon name="compass" size="18" /> <span>Explore</span></NuxtLink>
          <div class="sidebar-divider"></div>
          <NuxtLink to="/p2p" class="sidebar-item" @click="toggleSidebar"><Icon name="trending-up" size="18" /> <span>P2P Trading</span></NuxtLink>
          <NuxtLink to="/escrow" class="sidebar-item" @click="toggleSidebar"><Icon name="shield" size="18" /> <span>Escrow</span></NuxtLink>
          <NuxtLink to="/monetization" class="sidebar-item" @click="toggleSidebar"><Icon name="dollar-sign" size="18" /> <span>Monetization</span></NuxtLink>
          <NuxtLink to="/ads" class="sidebar-item" @click="toggleSidebar"><Icon name="megaphone" size="18" /> <span>Ads</span></NuxtLink>
          <div class="sidebar-divider"></div>
          <NuxtLink to="/support-chat" class="sidebar-item" @click="toggleSidebar"><Icon name="headphones" size="18" /> <span>Agent Support</span></NuxtLink>
          <NuxtLink to="/terms-and-policy" class="sidebar-item" @click="toggleSidebar"><Icon name="file-text" size="18" /> <span>Policy & T&Cs</span></NuxtLink>
          <NuxtLink to="/settings" class="sidebar-item" @click="toggleSidebar"><Icon name="settings" size="18" /> <span>Settings</span></NuxtLink>
          <div class="sidebar-divider"></div>
          <button class="sidebar-item logout-btn" @click="handleLogout"><Icon name="log-out" size="18" /> <span>Logout</span></button>
        </nav>
      </aside>
    </header>

    <main class="feed-main-wrapper">
      <ClientOnly>
        <aside class="feed-sidebar-left">
          <div v-if="profileLoading" class="profile-card loading">
            <div class="skeleton-avatar"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div>
          </div>
          <div v-else-if="profileError" class="profile-card error">
            <Icon name="alert-circle" size="32" /><p>Failed to load profile</p>
            <button @click="retryProfileLoad" class="btn-retry"><Icon name="refresh-cw" size="14" /> Retry</button>
          </div>
          <div v-else-if="currentUser?.id" class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar-wrapper">
                <img :src="userAvatar" :alt="userName" class="profile-avatar" @click="goToProfilePage()" :style="{ cursor: 'pointer' }" />
                <span :class="['status-indicator', userStatus]"></span>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ userName }}</h3>
                <p class="profile-username">@{{ userUsername || 'loading...' }}</p>
              </div>
            </div>
            <div class="profile-stats">
              <div class="stat" @click="goToFollowers"><span class="stat-value">{{ userFollowers }}</span><span class="stat-label">Followers</span></div>
              <div class="stat" @click="goToFollowing"><span class="stat-value">{{ userFollowing }}</span><span class="stat-label">Following</span></div>
              <div class="stat" @click="goToUserPosts"><span class="stat-value">{{ userPosts }}</span><span class="stat-label">Posts</span></div>
            </div>
            <div class="profile-actions">
              <button class="btn-edit-profile" @click="goToSettingsProfile"><Icon name="settings" size="16" /> Profile Settings</button>
              <button class="btn-share-profile" @click="shareProfile"><Icon name="share-2" size="16" /></button>
            </div>
            <div class="quick-stats">
              <div class="quick-stat"><span class="label">Wallet Balance</span><span class="value">{{ walletBalance }}</span></div>
              <div class="quick-stat"><span class="label">Verification</span><span :class="['value', isVerified ? 'verified' : 'pending']">{{ isVerified ? '✓ Verified' : '⏳ Pending' }}</span></div>
            </div>
          </div>
        </aside>
      </ClientOnly>

       <section class="feed-content">
        <div class="feed-tabs">
          <button v-for="tab in feedTabs" :key="tab.id" :class="['feed-tab', { active: activeTab === tab.id }]" @click="activeTab = tab.id; refreshFeed()">
            <Icon :name="tab.icon" size="18" /> <span>{{ tab.label }}</span>
          </button>
        </div>

        <ClientOnly>
          <div class="status-tray-container">
            <div class="status-tray-header"><span class="tray-title">Active Statuses</span><NuxtLink to="/status" class="tray-action-link"><Icon name="plus" size="14" /> Create Status</NuxtLink></div>
            <div v-if="statusLoading" class="status-tray-loading"><div class="spinner-mini"></div></div>
            <div v-else class="status-horizontal-scroll">
              <div class="status-node creator-node" @click="navigateTo('/status')">
                <div class="node-avatar-wrapper"><img :src="userAvatar" alt="Your avatar" class="node-avatar self" /><div class="plus-badge"><Icon name="plus" size="12" /></div></div>
                <span class="node-label">Your Status</span>
              </div>
              <div v-for="statusItem in fetchedStatuses" :key="statusItem.id" class="status-node item-node" @click="triggerStatusViewer(statusItem)" :style="{ borderColor: statusItem.colors?.background || '#3b82f6' }">
                <div class="node-avatar-wrapper">
                  <img :src="statusItem.author?.avatar_url || '/default-avatar.svg'" :alt="statusItem.author?.full_name" class="node-avatar" />
                  <div class="type-indicator-badge" v-if="statusItem.media_type !== 'text'"><Icon :name="statusItem.media_type === 'image' ? 'image' : 'video'" size="10" /></div>
                </div>
                <span class="node-label">{{ statusItem.author?.username || 'User' }}</span>
              </div>
            </div>
          </div>
        </ClientOnly>

        <ClientOnly>
          <div class="create-post-section">
            <div class="create-post-header">
              <img :src="userAvatar" :alt="userName" class="create-post-avatar" />
              <div class="create-post-input-wrapper"><input type="text" placeholder="What's on your mind?" class="create-post-input" @click="goToCreatePost" readonly /></div>
            </div>
            <div class="create-post-actions">
              <button class="action-btn" @click="goToCreatePost" title="Add Photo"><Icon name="image" size="18" /> <span class="action-label">Photo</span></button>
              <button class="action-btn" @click="goToCreatePost" title="Add Video"><Icon name="video" size="18" /> <span class="action-label">Video</span></button>
              <button class="action-btn" @click="goToCreatePost" title="Add Feeling"><Icon name="smile" size="18" /> <span class="action-label">Feeling</span></button>
              <button class="action-btn" @click="goToCreatePost" title="Add Poll"><Icon name="bar-chart-2" size="18" /> <span class="action-label">Poll</span></button>
            </div>
          </div>
        </ClientOnly>

        <ClientOnly>
          <EmailVerificationBanner :isVerified="authStore.isEmailVerified" :email="authStore.userEmail" @send-verification="handleVerificationSent" @dismiss="handleBannerDismissed" @verified="handleEmailVerified" />
          <div v-if="postsLoading && posts.length === 0" class="loading-state"><div class="spinner"></div><p>Loading posts...</p></div>
          <div v-else-if="posts.length > 0" class="posts-list">
            <article v-for="post in posts" :key="post.id" class="feed-post" :class="{ 'has-media': post.media && post.media.length > 0 }">
              <div class="post-header">
                <img :src="post.author?.avatar_url || '/default-avatar.svg'" :alt="post.author?.full_name" class="post-avatar" @click="goToUserProfile(post.author?.username, post.author?.id)" :style="{ cursor: post.author?.id ? 'pointer' : 'default' }" :title="post.author?.id ? 'View profile' : 'Profile unavailable'" />
                <div class="post-author-info">
                  <div class="author-name-row"><h4 class="post-author-name">{{ post.author?.full_name }}</h4><span v-if="post.author?.verified" class="verified-badge" title="Verified"><Icon name="check-circle" size="14" /></span></div>
                  <p class="post-author-username">@{{ post.author?.username }}</p>
                  <span class="post-timestamp">
                    <UseTimeAgo v-slot="{ timeAgo }" :time="post.created_at">{{ timeAgo }}</UseTimeAgo>
                  </span>
                </div>
                <button class="post-menu-btn" @click="togglePostMenu(post.id)" title="More options"><Icon name="more-vertical" size="20" /></button>
                <div v-if="activePostMenu === post.id" class="post-menu">
                  <button class="menu-item" @click="reportPost(post.id)"><Icon name="flag" size="16" /> Report Post</button>
                  <button v-if="post.author?.id === currentUser?.id" class="menu-item" @click="deletePost(post.id)"><Icon name="trash-2" size="16" /> Delete Post</button>
                  <button class="menu-item" @click="copyPostLink(post.id)"><Icon name="link" size="16" /> Copy Link</button>
                </div>
              </div>
              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                <div v-if="post.media && post.media.length > 0" class="post-media-gallery">
                  <img v-for="(media, index) in post.media" :key="index" :src="media" :alt="`Post media ${index + 1}`" class="post-image" @click="openMediaViewer(media)" />
                </div>
                <div v-if="post.hashtags && post.hashtags.length > 0" class="post-hashtags">
                  <NuxtLink v-for="tag in post.hashtags" :key="tag" :to="`/explore?tag=${tag}`" class="hashtag">#{{ tag }}</NuxtLink>
                </div>
              </div>
              <!-- INTEGRATED COMPONENT -->
              <PostInteractionToolbar :post="post" />
            </article>
            <div v-if="hasMorePosts" class="load-more">
              <button v-if="!loadingMore" @click="loadMorePosts" class="btn-load-more">Load More Posts</button>
              <div v-else class="loading-more"><div class="spinner-small"></div> <span>Loading...</span></div>
            </div>
          </div>
          <div v-else class="no-posts">
            <Icon name="inbox" size="48" /><h3>No posts yet</h3><p>Start following people to see their posts!</p>
            <div class="no-posts-actions"><NuxtLink to="/explore" class="btn-explore"><Icon name="compass" size="18" /> Explore People</NuxtLink><button @click="goToCreatePost" class="btn-create"><Icon name="plus-square" size="18" /> Create Post</button></div>
          </div>
        </ClientOnly>

            <aside class="feed-sidebar-right">
          <div class="search-card">
            <div class="search-wrapper"><Icon name="search" size="18" class="search-icon" /><input v-model="searchQuery" type="text" placeholder="Search posts, people..." class="search-input" @keyup.enter="performSearch" /></div>
          </div>
          <div class="recommendations-card">
            <div class="card-header"><h3 class="card-title">Suggested For You</h3><button class="refresh-btn" @click="refreshSuggestedUsers" title="Refresh"><Icon name="refresh-cw" size="16" /></button></div>
            <div v-if="suggestedUsersLoading" class="loading-small"><div class="spinner-small"></div></div>
            <div v-else-if="suggestedUsers.length > 0" class="recommendations-list">
              <div v-for="user in suggestedUsers" :key="user.id" class="recommendation-item">
                <img :src="user.avatar_url || '/default-avatar.svg'" :alt="user.full_name" class="rec-avatar" @click="goToUserProfile(user.username, user.id)" :style="{ cursor: user.id ? 'pointer' : 'default' }" />
                <div class="rec-info"><h4 class="rec-name">{{ user.full_name }}</h4><p class="rec-username">@{{ user.username }}</p></div>
                <button :class="['btn-follow', { following: user.following }]" @click="followUser(user.id)">{{ user.following ? 'Following' : 'Follow' }}</button>
              </div>
            </div>
          </div>
          <div class="trending-card">
            <div class="card-header"><h3 class="card-title">Trending Now</h3><button class="refresh-btn" @click="refreshTrending" title="Refresh"><Icon name="refresh-cw" size="16" /></button></div>
            <div v-if="trendingLoading" class="loading-small"><div class="spinner-small"></div></div>
            <div v-else-if="trendingTopics.length > 0" class="trending-list">
              <NuxtLink v-for="trend in trendingTopics" :key="trend.id" :to="`/explore?tag=${trend.title}`" class="trending-item">
                <div class="trend-info"><p class="trend-category">{{ trend.category }}</p><h4 class="trend-title">{{ trend.title }}</h4><p class="trend-count">{{ trend.count }} posts</p></div>
              </NuxtLink>
            </div>
          </div>
        </aside>
      </main>

      <ClientOnly>
        <div v-if="activeSelectedStatus" class="status-lightbox-modal" @click.self="closeStatusViewer">
          <div class="lightbox-content" :style="{ backgroundColor: activeSelectedStatus.colors?.background || '#000', color: activeSelectedStatus.colors?.text || '#fff' }">
            <div class="lightbox-top-meta">
              <div class="meta-left"><img :src="activeSelectedStatus.author?.avatar_url || '/default-avatar.svg'" class="lightbox-author-avatar" /><div><h5>{{ activeSelectedStatus.author?.full_name }}</h5><span>@{{ activeSelectedStatus.author?.username }}</span></div></div>
              <button class="lightbox-close-btn" @click="closeStatusViewer"><Icon name="x" size="20" /></button>
            </div>
            <div class="lightbox-main-body">
              <p v-if="activeSelectedStatus.content" class="lightbox-text-content">{{ activeSelectedStatus.content }}</p>
              <div v-if="activeSelectedStatus.media_url" class="lightbox-media-attachment">
                <img v-if="activeSelectedStatus.media_type === 'image'" :src="activeSelectedStatus.media_url" class="lightbox-img" />
                <video v-else-if="activeSelectedStatus.media_type === 'video'" :src="activeSelectedStatus.media_url" controls autoplay class="lightbox-video"></video>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, navigateTo } from '#app';
import { useSocialFeed } from '~/composables/useSocialFeed';
import { UseTimeAgo } from '@vueuse/components';
import PostInteractionToolbar from '~/components/posts/PostInteractionToolbar.vue';
import EmailVerificationBanner from '~/components/EmailVerificationBanner.vue';

// --- Initialize Unified Social Feed ---
const socialFeed = useSocialFeed();
const { 
  posts, postsLoading, hasMorePosts, loadingMore, 
  loadMorePosts, refreshFeed, initPipeline, 
  userName, userAvatar, userUsername, userStatus, walletBalance, isVerified,
  fetchedStatuses, statusLoading, triggerStatusViewer, activeSelectedStatus,
  suggestedUsers, suggestedUsersLoading, refreshSuggestedUsers, followUser,
  trendingTopics, trendingLoading, refreshTrending,
  sidebarOpen, toggleSidebar, handleLogout, currentUser, 
  unreadMessages, unreadNotifications, authStore,
  profileLoading, profileError, retryProfileLoad, userFollowers, 
  userFollowing, userPosts, goToFollowers, goToFollowing, 
  goToUserPosts, isLiveStreaming
} = socialFeed;

// --- Local UI State ---
const route = useRoute();
const activeTab = ref('for-you'); 
const searchQuery = ref('');
const activePostMenu = ref(null);

// --- Navigation & Action Handlers ---
const goToCreatePost = () => navigateTo('/posts/create');
const goToProfilePage = () => navigateTo(`/profile/${userUsername.value}`);
const goToUserProfile = (username, id) => id ? navigateTo(`/profile/${username}`) : null;
const goToSettingsProfile = () => navigateTo('/settings/profile');
const closeStatusViewer = () => activeSelectedStatus.value = null;

const togglePostMenu = (id) => { activePostMenu.value = activePostMenu.value === id ? null : id; };

const copyPostLink = (id) => {
  navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
  activePostMenu.value = null;
};

const performSearch = () => {
  if (searchQuery.value) navigateTo(`/search?q=${searchQuery.value}`);
};

const shareProfile = () => {
  const url = `${window.location.origin}/profile/${userUsername.value}`;
  navigator.clipboard.writeText(url);
  alert('Profile link copied!');
};

// --- Legacy Banner/Post Handlers ---
const handleVerificationSent = () => { /* Logic from authStore */ };
const handleBannerDismissed = () => { /* Logic from authStore */ };
const handleEmailVerified = () => { /* Logic from authStore */ };

const deletePost = async (id) => { /* Logic to call socialFeed delete method */ };
const reportPost = (id) => { /* Logic to open report modal */ };
const openMediaViewer = (media) => { /* Logic to open lightbox */ };
const viewPostLikes = (id) => { /* Navigation to Likes page */ };
const viewPostComments = (id) => { /* Navigation to Comments */ };
const viewPostShares = (id) => { /* Navigation to Shares */ };
const likePost = (id) => { /* Managed by PostInteractionToolbar */ };
const commentPost = (id) => { /* Trigger comment modal */ };
const sharePost = (id) => { /* Trigger share sheet */ };
const savePost = (id) => { /* Trigger bookmark logic */ };

// --- Lifecycle ---
onMounted(async () => {
  await initPipeline();
});
</script>

<style>
/* ============================================================================
   GLOBAL & LAYOUT ARCHITECTURE
   ============================================================================ */
.feed-page { min-height: 100vh; background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

.feed-main-wrapper {
  max-width: 1280px; margin: 0 auto; display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  gap: 1.5rem; padding: 1.5rem 1rem; align-items: start;
}

/* ============================================================================
   HEADER & NAVIGATION
   ============================================================================ */
.feed-header { position: sticky; top: 0; z-index: 50; background-color: #1e293b; border-bottom: 1px solid #334155; }
.header-top { display: flex; align-items: center; justify-content: space-between; height: 4rem; max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
.header-left, .header-center, .header-right { display: flex; align-items: center; }
.menu-btn { background: none; border: none; color: #94a3b8; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s; }
.menu-btn:hover { color: #f8fafc; background-color: #334155; }
.nav-icon { display: flex; flex-direction: column; align-items: center; padding: 0.5rem 1rem; color: #94a3b8; border-radius: 0.5rem; transition: all 0.2s; text-decoration: none; }
.nav-icon.active { color: #3b82f6; background-color: rgba(59, 130, 246, 0.1); }

/* ============================================================================
   SIDEBAR & DRAWER SYSTEM
   ============================================================================ */
.sidebar-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 100; }
.sidebar { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background-color: #1e293b; z-index: 101; transform: translateX(-100%); transition: transform 0.3s ease; }
.sidebar.open { transform: translateX(0); }
.feed-sidebar-left { position: sticky; top: 5rem; display: flex; flex-direction: column; gap: 1rem; }

/* ============================================================================
   COMPONENT CARDS (Standardized)
   ============================================================================ */
.profile-card, .feed-post, .create-post-section, .recommendations-card, .trending-card {
  background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.25rem;
}

.feed-content { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.post-media-gallery { border-radius: 0.5rem; overflow: hidden; border: 1px solid #334155; background-color: #0f172a; margin-top: 0.75rem; }
.post-image { width: 100%; display: block; object-fit: cover; }

/* ============================================================================
   TOOLBAR & INTERACTION RECONCILIATION
   ============================================================================ */
.feed-post { display: flex; flex-direction: column; gap: 0.75rem; }

/* The toolbar wrapper inside your component should use this class */
.post-actions-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #334155;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
}

.action-btn:hover:not(:disabled) {
  background-color: #334155;
  color: #f8fafc;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PewGift Specific Styling */
.pew-gift-btn { color: #f59e0b; }
.pew-gift-btn:hover:not(:disabled) { background-color: rgba(245, 158, 11, 0.1); }

/* ============================================================================
   RESPONSIVE BREAKPOINTS
   ============================================================================ */
@media (max-width: 1200px) {
  .feed-main-wrapper { grid-template-columns: 240px minmax(0, 1fr); }
  .feed-sidebar-right { display: none; }
}

@media (max-width: 768px) {
  .feed-main-wrapper { grid-template-columns: 1fr; padding: 1rem 0.5rem; }
  .feed-sidebar-left, .header-center { display: none; }
}
</style>
