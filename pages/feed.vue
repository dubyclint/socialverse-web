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
          <NuxtLink 
            to="/feed" 
            class="nav-icon" 
            :class="{ active: route.path === '/feed' }"
            aria-label="Feed"
          >
            <Icon name="home" size="24" />
            <span class="nav-label">Feed</span>
          </NuxtLink>

          <NuxtLink 
            to="/status" 
            class="nav-icon" 
            :class="{ active: route.path === '/status' }"
            aria-label="Statuses Ecosystem"
          >
            <Icon name="layers" size="24" />
            <span class="nav-label">Status</span>
          </NuxtLink>

          <NuxtLink 
            to="/posts/create" 
            class="nav-icon" 
            :class="{ active: route.path === '/posts/create' }"
            aria-label="Create Post"
          >
            <Icon name="plus-square" size="24" />
            <span class="nav-label">Post</span>
          </NuxtLink>

          <NuxtLink 
            to="/stream" 
            class="nav-icon" 
            :class="{ active: route.path === '/stream' }"
            aria-label="Live Stream"
          >
            <Icon name="radio" size="24" />
            <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>

          <NuxtLink 
            to="/wallet" 
            class="nav-icon" 
            :class="{ active: route.path === '/wallet' }"
            aria-label="Wallet"
          >
            <Icon name="wallet" size="24" />
            <span class="nav-label">Wallet</span>
          </NuxtLink>
        </nav>

        <div class="header-right">
          <div class="user-avatar-wrapper">
            <img 
              :src="userAvatar" 
              :alt="userName" 
              class="user-avatar"
              @click="goToProfilePage()"
              :style="{ cursor: currentUser?.id ? 'pointer' : 'default' }"
            />
            <span class="status-indicator" :class="userStatus"></span>
          </div>
        </div>
      </div>

      <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

      <aside :class="['sidebar', { open: sidebarOpen }]">
       <div class="sidebar-header">
  <h3>Menu</h3>
  <button class="close-btn" @click="toggleSidebar">
    <Icon name="lucide:x" size="20" />
  </button>
</div>

        <nav class="sidebar-nav">
          <div 
            v-if="!currentUser?.id"
            class="sidebar-item disabled-info"
            title="Not authenticated"
          >
            <Icon name="user" size="18" />
            <span>Profile</span>
            <span class="warning-badge">!</span>
          </div>
          
          <button 
            v-else
            class="sidebar-item"
            @click="goToProfilePage()"
            title="Go to your profile"
          >
            <Icon name="user" size="18" />
            <span>Profile</span>
          </button>

          <NuxtLink to="/status" class="sidebar-item" @click="toggleSidebar">
            <Icon name="layers" size="18" />
            <span>Statuses</span>
          </NuxtLink>

          <NuxtLink to="/chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="message-circle" size="18" />
            <span>Chat</span>
            <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <NuxtLink to="/notifications" class="sidebar-item" @click="toggleSidebar">
            <Icon name="bell" size="18" />
            <span>Notifications</span>
            <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
          </NuxtLink>

          <NuxtLink to="/inbox" class="sidebar-item" @click="toggleSidebar">
            <Icon name="inbox" size="18" />
            <span>Inbox</span>
            <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar">
            <Icon name="compass" size="18" />
            <span>Explore</span>
          </NuxtLink>

          <div class="sidebar-divider"></div>

          <NuxtLink to="/p2p" class="sidebar-item" @click="toggleSidebar">
            <Icon name="trending-up" size="18" />
            <span>P2P Trading</span>
          </NuxtLink>

          <NuxtLink to="/escrow" class="sidebar-item" @click="toggleSidebar">
            <Icon name="shield" size="18" />
            <span>Escrow</span>
          </NuxtLink>

          <NuxtLink to="/monetization" class="sidebar-item" @click="toggleSidebar">
            <Icon name="dollar-sign" size="18" />
            <span>Monetization</span>
          </NuxtLink>

          <NuxtLink to="/ads" class="sidebar-item" @click="toggleSidebar">
            <Icon name="megaphone" size="18" />
            <span>Ads</span>
          </NuxtLink>

          <div class="sidebar-divider"></div>

          <NuxtLink to="/support-chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="headphones" size="18" />
            <span>Agent Support</span>
          </NuxtLink>

          <NuxtLink to="/terms-and-policy" class="sidebar-item" @click="toggleSidebar">
            <Icon name="file-text" size="18" />
            <span>Policy & T&Cs</span>
          </NuxtLink>

          <NuxtLink to="/settings" class="sidebar-item" @click="toggleSidebar">
            <Icon name="settings" size="18" />
            <span>Settings</span>
          </NuxtLink>

          <div class="sidebar-divider"></div>

          <button class="sidebar-item logout-btn" @click="handleLogout">
            <Icon name="log-out" size="18" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </header>

    <main class="feed-main-wrapper">
      <ClientOnly>
        <aside class="feed-sidebar-left">
          <div v-if="profileLoading" class="profile-card loading">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>

          <div v-else-if="profileError" class="profile-card error">
            <Icon name="alert-circle" size="32" />
            <p>Failed to load profile</p>
            <button @click="retryProfileLoad" class="btn-retry">
              <Icon name="refresh-cw" size="14" /> Retry
            </button>
          </div>

          <div v-else-if="currentUser?.id" class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar-wrapper">
                <img 
                  :src="userAvatar" 
                  :alt="userName" 
                  class="profile-avatar"
                  @click="goToProfilePage()"
                  :style="{ cursor: 'pointer' }"
                />
                <span :class="['status-indicator', userStatus]"></span>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ userName }}</h3>
                <p class="profile-username">@{{ userUsername || 'loading...' }}</p>
              </div>
            </div>

            <div class="profile-stats">
              <div class="stat" @click="goToFollowers">
                <span class="stat-value">{{ userFollowers }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat" @click="goToFollowing">
                <span class="stat-value">{{ userFollowing }}</span>
                <span class="stat-label">Following</span>
              </div>
              <div class="stat" @click="goToUserPosts">
                <span class="stat-value">{{ userPosts }}</span>
                <span class="stat-label">Posts</span>
              </div>
            </div>

            <div class="profile-actions">
              <button class="btn-edit-profile" @click="goToSettingsProfile">
                <Icon name="settings" size="16" />
                Profile Settings
              </button>
              <button class="btn-share-profile" @click="shareProfile">
                <Icon name="share-2" size="16" />
              </button>
            </div>

            <div class="quick-stats">
              <div class="quick-stat">
                <span class="label">Wallet Balance</span>
                <span class="value">{{ walletBalance }}</span>
              </div>
              <div class="quick-stat">
                <span class="label">Verification</span>
                <span :class="['value', isVerified ? 'verified' : 'pending']">
                  {{ isVerified ? '✓ Verified' : '⏳ Pending' }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="profile-card error">
            <Icon name="alert-circle" size="32" />
            <p>Please log in to continue</p>
            <NuxtLink to="/signin" class="btn-retry">
              <Icon name="log-in" size="14" /> Sign In
            </NuxtLink>
          </div>
        </aside>
      </ClientOnly>

      <section class="feed-content">
        <div class="feed-tabs">
          <button 
            v-for="tab in feedTabs" 
            :key="tab.id"
            :class="['feed-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id; refreshFeed()"
          >
            <Icon :name="tab.icon" size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <ClientOnly>
          <div class="status-tray-container">
            <div class="status-tray-header">
              <span class="tray-title">Active Statuses</span>
              <NuxtLink to="/status" class="tray-action-link">
                <Icon name="plus" size="14" /> Create Status
              </NuxtLink>
            </div>
            
            <div v-if="statusLoading" class="status-tray-loading">
              <div class="spinner-mini"></div>
            </div>
            
            <div v-else class="status-horizontal-scroll">
              <div class="status-node creator-node" @click="navigateTo('/status')">
                <div class="node-avatar-wrapper">
                  <img :src="userAvatar" alt="Your avatar" class="node-avatar self" />
                  <div class="plus-badge"><Icon name="plus" size="12" /></div>
                </div>
                <span class="node-label">Your Status</span>
              </div>

              <div 
                v-for="statusItem in fetchedStatuses" 
                :key="statusItem.id" 
                class="status-node item-node"
                @click="triggerStatusViewer(statusItem)"
                :style="{ borderColor: statusItem.colors?.background || '#3b82f6' }"
              >
                <div class="node-avatar-wrapper">
                  <img 
                    :src="statusItem.author?.avatar_url || '/default-avatar.svg'" 
                    :alt="statusItem.author?.full_name" 
                    class="node-avatar" 
                  />
                  <div class="type-indicator-badge" v-if="statusItem.media_type !== 'text'">
                    <Icon :name="statusItem.media_type === 'image' ? 'image' : 'video'" size="10" />
                  </div>
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
              <div class="create-post-input-wrapper">
                <input 
                  type="text" 
                  placeholder="What's on your mind?" 
                  class="create-post-input"
                  @click="goToCreatePost"
                  readonly
                />
              </div>
            </div>
            <div class="create-post-actions">
              <button class="action-btn" @click="goToCreatePost" title="Add Photo">
                <Icon name="image" size="18" /> <span class="action-label">Photo</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Video">
                <Icon name="video" size="18" /> <span class="action-label">Video</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Feeling">
                <Icon name="smile" size="18" /> <span class="action-label">Feeling</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Poll">
                <Icon name="bar-chart-2" size="18" /> <span class="action-label">Poll</span>
              </button>
            </div>
          </div>
        </ClientOnly>

        <ClientOnly>
          <EmailVerificationBanner 
            :isVerified="authStore.isEmailVerified"
            :email="authStore.userEmail"
            @send-verification="handleVerificationSent"
            @dismiss="handleBannerDismissed"
            @verified="handleEmailVerified"
          />

          <div v-if="postsLoading && posts.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>
          
          <div v-else-if="posts.length > 0" class="posts-list">
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="feed-post"
              :class="{ 'has-media': post.media && post.media.length > 0 }"
            >
              <div class="post-header">
                <img 
                  :src="post.author?.avatar_url || '/default-avatar.svg'" 
                  :alt="post.author?.full_name" 
                  class="post-avatar"
                  @click="goToUserProfile(post.author?.username, post.author?.id)"
                  :style="{ cursor: post.author?.id ? 'pointer' : 'default' }"
                  :title="post.author?.id ? 'View profile' : 'Profile unavailable'"
                />
                <div class="post-author-info">
                  <div class="author-name-row">
                    <h4 class="post-author-name">{{ post.author?.full_name }}</h4>
                    <span v-if="post.author?.verified" class="verified-badge" title="Verified">
                      <Icon name="check-circle" size="14" />
                    </span>
                  </div>
                  <p class="post-author-username">@{{ post.author?.username }}</p>
                  <span class="post-timestamp">{{ formatTime(post.created_at) }}</span>
                </div>
                <button class="post-menu-btn" @click="togglePostMenu(post.id)" title="More options">
                  <Icon name="more-vertical" size="20" />
                </button>
                <div v-if="activePostMenu === post.id" class="post-menu">
                  <button class="menu-item" @click="reportPost(post.id)">
                    <Icon name="flag" size="16" /> Report Post
                  </button>
                  <button v-if="post.author?.id === currentUser?.id" class="menu-item" @click="deletePost(post.id)">
                    <Icon name="trash-2" size="16" /> Delete Post
                  </button>
                  <button class="menu-item" @click="copyPostLink(post.id)">
                    <Icon name="link" size="16" /> Copy Link
                  </button>
                </div>
              </div>

              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                
                <div v-if="post.media && post.media.length > 0" class="post-media-gallery">
                  <img 
                    v-for="(media, index) in post.media" 
                    :key="index"
                    :src="media" 
                    :alt="`Post media ${index + 1}`" 
                    class="post-image"
                    @click="openMediaViewer(media)"
                  />
                </div>

                <div v-if="post.hashtags && post.hashtags.length > 0" class="post-hashtags">
                  <NuxtLink 
                    v-for="tag in post.hashtags" 
                    :key="tag"
                    :to="`/explore?tag=${tag}`"
                    class="hashtag"
                  >
                    #{{ tag }}
                  </NuxtLink>
                </div>
              </div>

              <div class="post-stats">
                <span class="stat" @click="viewPostLikes(post.id)">
                  <Icon name="heart" size="14" /> {{ post.likes_count || 0 }} Likes
                </span>
                <span class="stat" @click="viewPostComments(post.id)">
                  <Icon name="message-circle" size="14" /> {{ post.comments_count || 0 }} Comments
                </span>
                <span class="stat" @click="viewPostShares(post.id)">
                  <Icon name="share-2" size="14" /> {{ post.shares_count || 0 }} Shares
                </span>
              </div>

              <div class="post-actions">
                <button 
                  :class="['action-btn', { liked: post.liked_by_me }]" 
                  @click="likePost(post.id)"
                  :title="post.liked_by_me ? 'Unlike' : 'Like'"
                >
                  <Icon name="heart" size="18" :fill="post.liked_by_me" />
                  <span>{{ post.liked_by_me ? 'Liked' : 'Like' }}</span>
                </button>
                <button class="action-btn" @click="commentPost(post.id)" title="Comment">
                  <Icon name="message-circle" size="18" /> <span>Comment</span>
                </button>
                <button class="action-btn" @click="sharePost(post.id)" title="Share">
                  <Icon name="share-2" size="18" /> <span>Share</span>
                </button>
                <button class="action-btn" @click="savePost(post.id)" title="Save">
                  <Icon name="bookmark" size="18" /> <span>Save</span>
                </button>
              </div>
            </article>

            <div v-if="hasMorePosts" class="load-more">
              <button v-if="!loadingMore" @click="loadMorePosts" class="btn-load-more">Load More Posts</button>
              <div v-else class="loading-more">
                <div class="spinner-small"></div> <span>Loading...</span>
              </div>
            </div>
          </div>

          <div v-else class="no-posts">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Start following people to see their posts!</p>
            <div class="no-posts-actions">
              <NuxtLink to="/explore" class="btn-explore">
                <Icon name="compass" size="18" /> Explore People
              </NuxtLink>
              <button @click="goToCreatePost" class="btn-create">
                <Icon name="plus-square" size="18" /> Create Post
              </button>
            </div>
          </div>
        </ClientOnly>
      </section>

      <ClientOnly>
        <aside class="feed-sidebar-right">
          <div class="search-card">
            <div class="search-wrapper">
              <Icon name="search" size="18" class="search-icon" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search posts, people..." 
                class="search-input"
                @keyup.enter="performSearch"
              />
            </div>
          </div>

          <div class="recommendations-card">
            <div class="card-header">
              <h3 class="card-title">Suggested For You</h3>
              <button class="refresh-btn" @click="refreshSuggestedUsers" title="Refresh">
                <Icon name="refresh-cw" size="16" />
              </button>
            </div>
            
            <div v-if="suggestedUsersLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="suggestedUsers.length > 0" class="recommendations-list">
              <div v-for="user in suggestedUsers" :key="user.id" class="recommendation-item">
                <img 
                  :src="user.avatar_url || '/default-avatar.svg'" 
                  :alt="user.full_name" 
                  class="rec-avatar"
                  @click="goToUserProfile(user.username, user.id)"
                  :style="{ cursor: user.id ? 'pointer' : 'default' }"
                  :title="user.id ? 'View profile' : 'Profile unavailable'"
                />
                <div class="rec-info">
                  <h4 class="rec-name">{{ user.full_name }}</h4>
                  <p class="rec-username">@{{ user.username }}</p>
                </div>
                <button 
                  :class="['btn-follow', { following: user.following }]"
                  @click="followUser(user.id)"
                >
                  {{ user.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small"><p>No suggestions available</p></div>
          </div>

          <div class="trending-card">
            <div class="card-header">
              <h3 class="card-title">Trending Now</h3>
              <button class="refresh-btn" @click="refreshTrending" title="Refresh">
                <Icon name="refresh-cw" size="16" />
              </button>
            </div>
            
            <div v-if="trendingLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="trendingTopics.length > 0" class="trending-list">
              <NuxtLink
                v-for="trend in trendingTopics" 
                :key="trend.id" 
                :to="`/explore?tag=${trend.title}`"
                class="trending-item"
              >
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="empty-state-small"><p>No trending topics</p></div>
          </div>
        </aside>
      </ClientOnly>
    </main>

    <ClientOnly>
      <div v-if="activeSelectedStatus" class="status-lightbox-modal" @click.self="closeStatusViewer">
        <div class="lightbox-content" :style="{ backgroundColor: activeSelectedStatus.colors?.background || '#000', color: activeSelectedStatus.colors?.text || '#fff' }">
          <div class="lightbox-top-meta">
            <div class="meta-left">
              <img :src="activeSelectedStatus.author?.avatar_url || '/default-avatar.svg'" class="lightbox-author-avatar" />
              <div>
                <h5>{{ activeSelectedStatus.author?.full_name }}</h5>
                <span>@{{ activeSelectedStatus.author?.username }}</span>
              </div>
            </div>
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

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSocialFeed } from '~/composables/useSocialFeed.ts'
import EmailVerificationBanner from '~/components/EmailVerificationBanner.vue'

definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})

const {
  sidebarOpen, isLiveStreaming, posts, postsLoading, loadingMore, hasMorePosts,
  activeTab, activePostMenu, suggestedUsers, suggestedUsersLoading, trendingTopics,
  trendingLoading, searchQuery, unreadNotifications, unreadMessages, walletBalance,
  isVerified, profileLoading, profileError, fetchedStatuses, statusLoading,
  activeSelectedStatus, feedTabs, currentUser, userName, userUsername, userAvatar,
  userFollowers, userFollowing, userPosts, userStatus, authStore,
  toggleSidebar, handleLogout, retryProfileLoad, goToProfilePage, goToUserProfile,
  goToFollowers, goToFollowing, goToUserPosts, goToCreatePost, goToSettingsProfile,
  shareProfile, togglePostMenu, likePost, commentPost, sharePost, savePost, reportPost,
  deletePost, copyPostLink, viewPostLikes, viewPostComments, viewPostShares, openMediaViewer,
  followUser, performSearch, refreshFeed, refreshSuggestedUsers, refreshTrending,
  loadMorePosts, triggerStatusViewer, closeStatusViewer, formatTime, initPipeline
} = useSocialFeed()

onMounted(async () => {
  await initPipeline()
})
</script>
     

<style>

.feed-page {
  min-height: 100vh;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ============================================================================
   HEADER SECTION
   ============================================================================ */
.feed-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 0 1rem;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  max-width: 1280px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}
     .menu-btn :deep(svg),
.menu-btn i {
  width: 20px;
  height: 20px;
  display: block;
  color: currentColor;
  opacity: 1;
}
   .menu-btn {
  min-width: 40px;
  min-height: 40px;
}  

.menu-btn:hover {
  color: #f8fafc;
  background-color: #334155;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #f8fafc;
}

.logo-img {
  height: 2rem;
  width: 2rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

/* Navigation Menu (Center) */
.header-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  text-decoration: none;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  min-width: 4.5rem;
}

.nav-icon:hover {
  color: #3b82f6;
  background-color: #334155;
}

.nav-icon.active {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.nav-label {
  font-size: 0.65rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Live Streaming Badge */
.notification-badge.live {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid #334155;
  transition: border-color 0.2s;
}

.user-avatar:hover {
  border-color: #3b82f6;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  border: 2px solid #1e293b;
}

.status-indicator.online { background-color: #10b981; }
.status-indicator.away { background-color: #f59e0b; }
.status-indicator.offline { background-color: #64748b; }

/* ============================================================================
   SIDEBAR & DRAWER SYSTEM
   ============================================================================ */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background-color: #1e293b;
  border-right: 1px solid #334155;
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #334155;
}

.sidebar-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: #f8fafc;
  background-color: #334155;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  color: #94a3b8;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.sidebar-item:hover {
  color: #f8fafc;
  background-color: #334155;
}

.sidebar-item.router-link-active {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.sidebar-item .badge {
  position: absolute;
  right: 1rem;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.sidebar-item.disabled-info {
  opacity: 0.6;
  cursor: not-allowed;
}

.warning-badge {
  position: absolute;
  right: 1rem;
  background-color: #f59e0b;
  color: #0f172a;
  font-weight: 700;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.sidebar-divider {
  height: 1px;
  background-color: #334155;
  margin: 0.75rem 1rem;
}

.logout-btn {
  color: #ef4444;
  margin-top: auto;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* ============================================================================
   LAYOUT ARCHITECTURE
   ============================================================================ */
.feed-main-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 1.5rem;
  padding: 1.5rem 1rem;
}

/* ============================================================================
   LEFT SIDEBAR - USER PROFILE INFO
   ============================================================================ */
.feed-sidebar-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.25rem;
}

.profile-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid #334155;
}

.profile-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile-name {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  color: #f8fafc;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.profile-username {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0.125rem 0 0 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Profile Statistical Breakdown */
.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  padding: 0.875rem 0;
  margin-bottom: 1.25rem;
  text-align: center;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #f8fafc;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.125rem;
}

/* Action Control Matrices */
.profile-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.btn-edit-profile {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #334155;
  color: #f8fafc;
  border: none;
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-edit-profile:hover {
  background-color: #475569;
}

.btn-share-profile {
  background-color: #334155;
  color: #f8fafc;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-share-profile:hover {
  background-color: #475569;
}

/* Enterprise Commerce Metrics */
.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background-color: #0f172a;
  padding: 0.875rem;
  border-radius: 0.5rem;
}

.quick-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.quick-stat .label {
  color: #94a3b8;
}

.quick-stat .value {
  font-weight: 600;
  color: #f8fafc;
}

.quick-stat .value.verified { color: #10b981; }
.quick-stat .value.pending { color: #f59e0b; }

/* Completion Notice Callouts */
.profile-completion-prompt {
  margin-top: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  padding: 0.875rem;
  border-radius: 0.5rem;
  color: #f59e0b;
}

.prompt-content {
  flex: 1;
}

.prompt-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 0.125rem 0;
}

.prompt-text {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.25;
}

.btn-complete {
  background: none;
  border: none;
  color: #f59e0b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
}

/* Profiles Error/States */
.profile-card.error {
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  color: #ef4444;
}

.profile-card.error p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0.75rem 0 1.25rem 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  text-decoration: none;
}

.btn-retry:hover {
  background-color: #2563eb;
}

/* ============================================================================
   CENTER FEED - STREAMS & MODULES
   ============================================================================ */
.feed-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Filter Navigation Bars */
.feed-tabs {
  display: flex;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.375rem;
  gap: 0.25rem;
}

.feed-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  padding: 0.625rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.feed-tab:hover {
  color: #f8fafc;
  background-color: #334155;
}

.feed-tab.active {
  color: #3b82f6;
  background-color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Global Content Composer */
.create-post-section {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1rem;
}

.create-post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #334155;
}

.create-post-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  object-fit: cover;
}

.create-post-input-wrapper {
  flex: 1;
}

.create-post-input {
  width: 100%;
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.625rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.create-post-input:hover {
  border-color: #475569;
}

.create-post-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding-top: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #334155;
  color: #f8fafc;
}

/* ============================================================================
   FEED POST ENGINE (SOCIAL CARD DEFINITIONS)
   ============================================================================ */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feed-post {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
  position: relative;
}

.post-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;
}

.post-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  object-fit: cover;
}

.post-author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.post-author-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.verified-badge {
  color: #3b82f6;
  display: inline-flex;
}

.post-author-username {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.post-timestamp {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.125rem;
}

.post-menu-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.post-menu-btn:hover {
  color: #f8fafc;
  background-color: #334155;
}

/* Dropdown Context Panels */
.post-menu {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 0.375rem;
  z-index: 10;
  min-width: 160px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  background: none;
  border: none;
  color: #94a3b8;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  text-align: left;
  border-radius: 0.375rem;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #334155;
  color: #f8fafc;
}

/* Content Layout Components */
.post-content {
  margin-bottom: 1rem;
}

.post-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e2e8f0;
  margin: 0 0 1rem 0;
  white-space: pre-wrap;
}

.post-media-gallery {
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #334155;
  background-color: #0f172a;
  max-height: 420px;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  display: block;
}

.post-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
}

.hashtag {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
}

.hashtag:hover {
  text-decoration: underline;
}

/* Post Metadata Logs */
.post-stats {
  display: flex;
  gap: 1rem;
  padding: 0.625rem 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
}

.post-stats .stat {
  flex-direction: row;
  gap: 0.375rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.post-stats .stat:hover {
  color: #3b82f6;
  transform: none;
}

/* Interactive Event Connectors */
.post-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding-top: 0.375rem;
}

.post-actions .action-btn.liked {
  color: #ef4444;
}

.post-actions .action-btn.liked:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Pagination Control Layout */
.load-more {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.btn-load-more {
  background-color: #334155;
  border: 1px solid #475569;
  color: #f8fafc;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover {
  background-color: #475569;
  border-color: #64748b;
}

/* Empty Node Overrides */
.no-posts {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #64748b;
}

.no-posts h3 {
  color: #f8fafc;
  font-size: 1.25rem;
  margin: 1rem 0 0.5rem 0;
}

.no-posts p {
  font-size: 0.9rem;
  margin: 0 0 1.5rem 0;
  max-width: 280px;
}

.no-posts-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-explore {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #334155;
  color: #f8fafc;
  text-decoration: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0.375rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
}

/* ============================================================================
   RIGHT SIDEBAR - ANALYTICS & REQS
   ============================================================================ */
.feed-sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Advanced Discovery Engines */
.search-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  color: #64748b;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

/* System Aggregators (Suggested/Trending) */
.recommendations-card,
.trending-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #f8fafc;
}

.refresh-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
}

.refresh-btn:hover {
  color: #f8fafc;
  background-color: #334155;
}

/* User Vector Match Lists */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rec-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  object-fit: cover;
}

.rec-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rec-name {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.rec-username {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.btn-follow {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.375rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
}

.btn-follow:hover {
  background-color: #2563eb;
}

.btn-follow.following {
  background-color: #334155;
  color: #94a3b8;
  border: 1px solid #475569;
}

.btn-follow.following:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

/* Real-time Metadata Hubs */
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0 -0.5rem;
}

.trending-item {
  display: block;
  padding: 0.625rem 0.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.trending-item:hover {
  background-color: #334155;
}

.trend-info {
  display: flex;
  flex-direction: column;
}

.trend-category {
  font-size: 0.7rem;
  color: #64748b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trend-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0.125rem 0;
}

.trend-count {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Minimalist Inline Feedback Modules */
.empty-state-small {
  text-align: center;
  padding: 1rem 0;
  color: #64748b;
  font-size: 0.85rem;
}

.loading-small {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

/* ============================================================================
   ANIMATIONS, SPINNING NODES & MICRO-INTERACTIONS
   ============================================================================ */
.spinner,
.spinner-small {
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
}

.spinner-small {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
  font-size: 0.9rem;
  gap: 0.75rem;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* ============================================================================
   RESPONSIVE DESIGN BREAKPOINTS
   ============================================================================ */
@media (max-width: 1200px) {
  .feed-main-wrapper {
    grid-template-columns: 240px 1fr;
  }
  .feed-sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .feed-main-wrapper {
    grid-template-columns: 1fr;
    padding: 1rem 0.5rem;
  }
  .feed-sidebar-left {
    display: none;
  }
  .header-center {
    display: none;
  }
}
</style>
