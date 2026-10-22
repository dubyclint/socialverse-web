<!-- ============================================================================
     FILE: /pages/feed.vue 
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
            <Logo size="md" text="Viorp" />
          </NuxtLink>
        </div>
        <nav class="header-center">
          <NuxtLink to="/feed" class="nav-icon" :class="{ active: route.path === '/feed' }" aria-label="Feed">
            <Icon name="home" size="24" /> <span class="nav-label">Feed</span>
          </NuxtLink>
          <NuxtLink to="/notifications" class="nav-icon" :class="{ active: route.path === '/notifications' }" aria-label="Notifications">
            <Icon name="bell" size="24" /> <span class="nav-label">Notifications</span>
            <ClientOnly><span v-if="unreadNotifications > 0" class="count-badge">{{ unreadLabel(unreadNotifications) }}</span></ClientOnly>
          </NuxtLink>
          <NuxtLink to="/chat" class="nav-icon" :class="{ active: route.path === '/chat' }" aria-label="Chat">
            <Icon name="message-circle" size="24" /> <span class="nav-label">Chat</span>
            <ClientOnly><span v-if="unreadMessages > 0" class="count-badge">{{ unreadLabel(unreadMessages) }}</span></ClientOnly>
          </NuxtLink>
          <NuxtLink to="/stream" class="nav-icon" :class="{ active: route.path === '/stream' }" aria-label="Live Stream">
            <Icon name="aperture" size="24" /> <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>
          <NuxtLink to="/wallet" class="nav-icon" :class="{ active: route.path === '/wallet' }" aria-label="Wallet">
            <Icon name="wallet" size="24" /> <span class="nav-label">Wallet</span>
          </NuxtLink>
        </nav>
        <div class="header-right">
          <NuxtLink to="/search" class="header-search" aria-label="Search people">
            <Icon name="search" size="22" />
          </NuxtLink>
          <NuxtLink to="/pal" class="header-search header-pals" aria-label="My PALs">
            <Icon name="users" size="22" />
            <ClientOnly><span v-if="pendingPalRequests > 0" class="dot-indicator" aria-label="New PAL requests"></span></ClientOnly>
          </NuxtLink>
          <ClientOnly><ContextSwitcher v-if="contextStore.managedPages.length" /></ClientOnly>
          <div v-if="!contextStore.managedPages.length" class="user-avatar-wrapper">
            <img :src="userAvatar" :alt="userName" class="user-avatar" @click="goToProfilePage()" :style="{ cursor: currentUser?.id ? 'pointer' : 'default' }" />
            <span class="status-indicator" :class="userStatus"></span>
          </div>
        </div>
      </div>

      <!-- Backdrop Overlay -->
      <Transition name="fade">
        <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
      </Transition>

      <!-- Redesigned Sidebar Drawer -->
      <aside :class="['sidebar', { open: sidebarOpen }]">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <h3 class="sidebar-header-title">Menu</h3>
          <button class="close-btn" @click="toggleSidebar" aria-label="Close menu">
            <Icon name="lucide:x" size="20" />
          </button>
        </div>

        <!-- Scrollable Navigation Container -->
        <nav class="sidebar-nav">
          <!-- Profile Card Header Block (if logged in) -->
          <div v-if="currentUser?.id" class="sidebar-user-card">
            <div class="sidebar-user-info">
              <img :src="userAvatar" :alt="userName" class="sidebar-user-avatar" />
              <div class="sidebar-user-details">
                <span class="sidebar-user-name">{{ userName }}</span>
                <span class="sidebar-user-handle">@{{ userUsername || 'user' }}</span>
              </div>
            </div>
            <div class="sidebar-user-actions">
              <button class="sidebar-quick-btn" @click="goToProfilePage(); toggleSidebar()">
                <Icon name="user" size="14" /> Profile
              </button>
              <NuxtLink to="/profile/edit" class="sidebar-quick-btn outline" @click="toggleSidebar">
                <Icon name="edit-3" size="14" /> Edit
              </NuxtLink>
            </div>
          </div>

          <!-- Section: YOU -->
          <div class="sidebar-group">
            <p class="sidebar-section-title">YOU</p>
            <div v-if="!currentUser?.id" class="sidebar-item disabled-info" title="Not authenticated">
              <Icon name="user" class="item-icon" size="18" />
              <span class="item-label">Profile</span>
              <span class="warning-badge">!</span>
            </div>
            <button v-else class="sidebar-item" @click="goToProfilePage(); toggleSidebar()" title="Go to your profile">
              <Icon name="user" class="item-icon" size="18" />
              <span class="item-label">Profile</span>
            </button>
            <NuxtLink v-if="currentUser?.id" to="/profile/edit" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="edit-3" class="item-icon" size="16" />
              <span class="item-label">Edit profile</span>
            </NuxtLink>
            <NuxtLink to="/notifications" class="sidebar-item" @click="toggleSidebar">
              <Icon name="bell" class="item-icon" size="18" />
              <span class="item-label">Notifications</span>
              <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
            </NuxtLink>
            <NuxtLink to="/pal" class="sidebar-item" @click="toggleSidebar">
              <Icon name="users" class="item-icon" size="18" />
              <span class="item-label">My PALs</span>
            </NuxtLink>
          </div>

          <!-- Section: SOCIAL -->
          <div class="sidebar-group">
            <p class="sidebar-section-title">SOCIAL</p>
            <NuxtLink to="/chat" class="sidebar-item" @click="toggleSidebar">
              <Icon name="message-circle" class="item-icon" size="18" />
              <span class="item-label">Chat</span>
              <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
            </NuxtLink>
            <NuxtLink to="/universe" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="globe" class="item-icon" size="16" />
              <span class="item-label">Universe chat</span>
            </NuxtLink>
            <NuxtLink to="/status" class="sidebar-item" @click="toggleSidebar">
              <Icon name="layers" class="item-icon" size="18" />
              <span class="item-label">Statuses</span>
            </NuxtLink>
            <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar">
              <Icon name="compass" class="item-icon" size="18" />
              <span class="item-label">Explore</span>
            </NuxtLink>
            <NuxtLink to="/match" class="sidebar-item" @click="toggleSidebar">
              <Icon name="heart" class="item-icon" size="18" />
              <span class="item-label">Match</span>
            </NuxtLink>
          </div>

          <!-- Section: CREATE -->
          <div class="sidebar-group">
            <p class="sidebar-section-title">CREATE</p>
            <NuxtLink to="/posts/create" class="sidebar-item" @click="toggleSidebar">
              <Icon name="plus-square" class="item-icon" size="18" />
              <span class="item-label">Create post</span>
            </NuxtLink>
            <NuxtLink to="/posts" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="file-text" class="item-icon" size="16" />
              <span class="item-label">My posts</span>
            </NuxtLink>
            <NuxtLink to="/pages" class="sidebar-item" @click="toggleSidebar">
              <Icon name="flag" class="item-icon" size="18" />
              <span class="item-label">My Pages</span>
            </NuxtLink>
            <NuxtLink to="/stream" class="sidebar-item" @click="toggleSidebar">
              <Icon name="aperture" class="item-icon" size="18" />
              <span class="item-label">Live streaming</span>
            </NuxtLink>
            <NuxtLink to="/stream/broadcast" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="radio" class="item-icon" size="16" />
              <span class="item-label">Go live</span>
            </NuxtLink>
            <NuxtLink to="/stream/history" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="clock" class="item-icon" size="16" />
              <span class="item-label">Past streams</span>
            </NuxtLink>
          </div>

          <!-- Section: EARN -->
          <div class="sidebar-group">
            <p class="sidebar-section-title">EARN</p>
            <NuxtLink to="/wallet" class="sidebar-item" @click="toggleSidebar">
              <Icon name="wallet" class="item-icon" size="18" />
              <span class="item-label">Wallet</span>
            </NuxtLink>
            <NuxtLink to="/monetization" class="sidebar-item" @click="toggleSidebar">
              <Icon name="dollar-sign" class="item-icon" size="18" />
              <span class="item-label">Monetization</span>
            </NuxtLink>
            <NuxtLink to="/p2p" class="sidebar-item" @click="toggleSidebar">
              <Icon name="trending-up" class="item-icon" size="18" />
              <span class="item-label">P2P trading</span>
            </NuxtLink>
            <NuxtLink to="/escrow" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="shield" class="item-icon" size="16" />
              <span class="item-label">Escrow</span>
            </NuxtLink>
            <NuxtLink to="/ads" class="sidebar-item" @click="toggleSidebar">
              <Icon name="megaphone" class="item-icon" size="18" />
              <span class="item-label">Ads</span>
            </NuxtLink>
          </div>

          <!-- Section: HELP & ACCOUNT -->
          <div class="sidebar-group">
            <p class="sidebar-section-title">HELP &amp; ACCOUNT</p>
            <NuxtLink to="/support" class="sidebar-item" @click="toggleSidebar">
              <Icon name="life-buoy" class="item-icon" size="18" />
              <span class="item-label">Support</span>
            </NuxtLink>
            <NuxtLink to="/support-chat" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="headphones" class="item-icon" size="16" />
              <span class="item-label">Agent support</span>
            </NuxtLink>
            <NuxtLink v-if="isStaff" to="/admin" class="sidebar-item staff-item" @click="toggleSidebar">
              <Icon name="shield" class="item-icon" size="18" />
              <span class="item-label">Control dashboard</span>
              <span class="badge staff-role">{{ staff?.role === 'admin' ? 'Admin' : 'Manager' }}</span>
            </NuxtLink>
            <NuxtLink v-if="canStaff('announcements')" to="/admin/announcements" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="megaphone" class="item-icon" size="16" />
              <span class="item-label">Global announcement</span>
            </NuxtLink>
            <NuxtLink to="/settings" class="sidebar-item" @click="toggleSidebar">
              <Icon name="settings" class="item-icon" size="18" />
              <span class="item-label">Settings</span>
            </NuxtLink>
            <NuxtLink to="/terms-and-policy" class="sidebar-item sub" @click="toggleSidebar">
              <Icon name="file-text" class="item-icon" size="16" />
              <span class="item-label">Policy &amp; terms</span>
            </NuxtLink>
            <NuxtLink to="/settings/delete-account" class="sidebar-item sub danger" @click="toggleSidebar">
              <Icon name="trash-2" class="item-icon" size="16" />
              <span class="item-label">Delete account</span>
            </NuxtLink>
          </div>

          <!-- Bottom Logout Button Container -->
          <div class="sidebar-footer">
            <button class="logout-btn" @click="handleLogout">
              <Icon name="log-out" size="18" />
              <span>Logout</span>
            </button>
          </div>
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
                <h3 class="profile-name">{{ userName }} <VerifiedBadge v-if="isVerified" :type="verifiedType" :size="18" /></h3>
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
          <button v-for="tab in feedTabs" :key="tab.id" :class="['feed-tab', { active: activeTab === tab.id }]" @click="activeTab = tab.id; refreshFeed(tab.id)">
            <Icon :name="tab.icon" size="18" /> <span>{{ tab.label }}</span>
          </button>
        </div>

        <ClientOnly>
          <LiveRail v-if="activeTab === 'for-you'" class="feed-live-rail-wrapper" />
        </ClientOnly>

        <!-- STREAMLINED FACEBOOK & INSTAGRAM-STYLE STORIES/STATUS TRAY -->
        <ClientOnly>
          <div class="status-tray-container">
            <div v-if="statusLoading" class="status-tray-loading"><div class="spinner-mini"></div></div>
            <div v-else class="status-horizontal-scroll">
              <!-- Add / Create Story Card -->
              <div class="story-card create-story-card" @click="navigateTo('/status')">
                <div class="story-cover-image">
                  <img :src="userAvatar" alt="Your avatar" />
                </div>
                <div class="create-story-footer">
                  <div class="plus-icon-badge">
                    <Icon name="plus" size="16" />
                  </div>
                  <span class="story-label">Create Story</span>
                </div>
              </div>

              <!-- Active Status / Story Cards -->
              <div v-for="statusItem in fetchedStatuses" :key="statusItem.id" class="story-card user-story-card" @click="triggerStatusViewer(statusItem)">
                <div class="story-background-wrapper" :style="{ backgroundColor: statusItem.colors?.background || '#1e293b' }">
                  <img v-if="statusItem.media_type === 'image' && statusItem.media_url" :src="statusItem.media_url" class="story-bg-media" />
                  <p v-else-if="statusItem.content" class="story-preview-text">{{ statusItem.content }}</p>
                </div>
                <div class="story-card-overlay">
                  <div class="story-avatar-badge">
                    <img :src="statusItem.author?.avatar_url || '/default-avatar.svg'" :alt="statusItem.author?.full_name" />
                  </div>
                  <span class="story-author-name">{{ statusItem.author?.full_name || statusItem.author?.username || 'User' }}</span>
                </div>
              </div>
            </div>
          </div>
        </ClientOnly>

        <!-- STREAMLINED FACEBOOK-STYLE CREATE POST WIDGET -->
        <ClientOnly>
          <div class="create-post-section">
            <div class="create-post-header">
              <img :src="userAvatar" :alt="userName" class="create-post-avatar" />
              <div class="create-post-input-wrapper" @click="goToCreatePost">
                <span class="placeholder-text">What's on your mind, {{ userName ? userName.split(' ')[0] : 'there' }}?</span>
              </div>
              <button class="media-quick-btn" @click="goToCreatePost" title="Photo/video">
                <Icon name="image" size="22" class="text-emerald-400" />
              </button>
            </div>
            <div class="create-post-actions">
              <button class="action-btn photo-action" @click="goToCreatePost" title="Photo/video">
                <Icon name="image" size="20" class="btn-icon text-emerald-400" />
                <span class="action-label">Photo/video</span>
              </button>
              <button class="action-btn feeling-action" @click="goToCreatePost" title="Feeling/activity">
                <Icon name="smile" size="20" class="btn-icon text-amber-400" />
                <span class="action-label">Feeling/activity</span>
              </button>
              <button class="action-btn poll-action" @click="goToCreatePost" title="Create Poll">
                <Icon name="bar-chart-2" size="20" class="btn-icon text-sky-400" />
                <span class="action-label">Poll</span>
              </button>
            </div>
          </div>
        </ClientOnly>

        <ClientOnly>
          <GlobalAnnouncement inline />
          <EmailVerificationBanner :isVerified="authStore.isEmailVerified" :email="authStore.userEmail" @send-verification="handleVerificationSent" @dismiss="handleBannerDismissed" @verified="handleEmailVerified" />
          <div v-if="postsLoading && posts.length === 0" class="loading-state"><div class="spinner"></div><p>Loading posts...</p></div>
          <div v-else-if="feedItems.length > 0" class="posts-list">
            <template v-for="(item, index) in feedItems" :key="item.type === 'post' ? item.post.id : `slot-${index}`">
              <FeedAdSlot v-if="item.type !== 'post'" :item="item" />
              <PalSuggestionsRail v-if="index === 3" />
              <div v-for="post in postOf(item)" :key="post.id" v-impression="() => trackImpression(post.id)">
                <PostsPostCard
                  :post="post"
                  :viewer-avatar="userAvatar"
                  @pewgift="openGiftModal"
                  @removed="removeFeedPost"
                />
              </div>
            </template>
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
      </section>

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

    <PewGiftModal 
      v-if="isGiftModalOpen"
      :is-open="isGiftModalOpen" 
      :post="activeGiftPost" 
      @close="isGiftModalOpen = false" 
      @confirm="handleConfirmGift" 
    />

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
import { useContextStore } from '~/stores/context';
import EmailVerificationBanner from '~/components/EmailVerificationBanner.vue';
import PewGiftModal from '~/components/modals/PewGiftModal.vue';
import LiveRail from '~/components/feed/live-rail.vue';
import FeedAdSlot from '~/components/feed/feed-ad-slot.vue';
import PalSuggestionsRail from '~/components/feed/pal-suggestions-rail.vue';
import GlobalAnnouncement from '~/components/global-announcement.vue';
import VerifiedBadge from '~/components/VerifiedBadge.vue';
import { useStaff } from '~/composables/useStaff';

const { staff, isStaff, can: canStaff, load: loadStaff } = useStaff();
onMounted(() => { loadStaff(true); });

// Top Navigation Configuration with updated Lucide icon mappings
const topNavItems = [
  { id: 'feed', label: 'Feed', icon: 'home', path: '/feed' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', path: '/notifications' },
  { id: 'chat', label: 'Chat', icon: 'message-circle', path: '/chat' },
  { id: 'live', label: 'Live', icon: 'aperture', path: '/stream' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', path: '/wallet' }
];

// --- Initialize Unified Social Feed ---
const socialFeed = useSocialFeed();
const contextStore = useContextStore();
const { 
  posts, postsLoading, hasMorePosts, loadingMore, 
  loadMorePosts, refreshFeed, initPipeline, 
  userName, userAvatar, userUsername, userStatus, walletBalance, isVerified, verifiedType,
  fetchedStatuses, statusLoading, triggerStatusViewer, activeSelectedStatus,
  suggestedUsers, suggestedUsersLoading, refreshSuggestedUsers, followUser,
  trendingTopics, trendingLoading, refreshTrending,
  sidebarOpen, toggleSidebar, handleLogout, currentUser, 
  authStore,
  profileLoading, profileError, retryProfileLoad, userFollowers, 
  userFollowing, userPosts, goToFollowers, goToFollowing, 
  goToUserPosts, isLiveStreaming, feedItems, trackImpression, removeFeedPost
} = socialFeed;

const {
  notifications: unreadNotifications,
  chat: unreadMessages,
  palRequests: pendingPalRequests,
  label: unreadLabel,
  track: trackUnread
} = useUnreadCounts();
trackUnread();

// Ranked feed items include sponsored slots; posts render through this alias.
const postOf = (item) => (item.type === 'post' ? [item.post] : []);

// --- Modal State Management ---
const isGiftModalOpen = ref(false);
const activeGiftPost = ref(null);

const openGiftModal = (post) => {
  activeGiftPost.value = post;
  isGiftModalOpen.value = true;
};

const handleConfirmGift = () => {
  isGiftModalOpen.value = false;
  activeGiftPost.value = null;
};

// --- Local UI State ---
const route = useRoute();
const feedTabs = [
  { id: 'for-you', label: 'For You', icon: 'sparkles' },
  { id: 'following', label: 'Following', icon: 'users' },
  { id: 'trending', label: 'Trending', icon: 'trending-up' },
];
const activeTab = ref('for-you'); 
const searchQuery = ref('');

// --- Navigation & Action Handlers ---
const goToCreatePost = () => navigateTo('/posts/create');
const goToProfilePage = () => navigateTo('/profile');
const goToUserProfile = (username, id) => id ? navigateTo(`/profile/${username}`) : null;
const goToSettingsProfile = () => navigateTo('/profile/edit');
const closeStatusViewer = () => activeSelectedStatus.value = null;

const performSearch = () => {
  if (searchQuery.value) navigateTo({ path: '/search', query: { q: searchQuery.value } });
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

// --- Lifecycle ---
onMounted(async () => {
  await initPipeline();
});
</script>

<style scoped>
/* ============================================================================
   GLOBAL & LAYOUT ARCHITECTURE
   ============================================================================ */
.feed-page { min-height: 100vh; background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

.feed-main-wrapper {
  max-width: 1280px; margin: 0 auto; display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  gap: 1rem; padding: 0.75rem 0.5rem; align-items: start;
}

/* ============================================================================
   AVATARS
   ============================================================================ */
.user-avatar-wrapper, .profile-avatar-wrapper, .node-avatar-wrapper { position: relative; display: inline-flex; flex: 0 0 auto; }
.user-avatar, .profile-avatar, .node-avatar, .create-post-avatar,
.post-avatar, .rec-avatar, .lightbox-author-avatar, .skeleton-avatar {
  border-radius: 9999px; object-fit: cover; flex: 0 0 auto; background-color: #334155;
}
.user-avatar { width: 2.25rem; height: 2.25rem; }
.profile-avatar { width: 5rem; height: 5rem; border: 2px solid #3b82f6; }
.node-avatar { width: 3.5rem; height: 3.5rem; border: 2px solid #3b82f6; }
.create-post-avatar, .post-avatar, .lightbox-author-avatar { width: 2.5rem; height: 2.5rem; }
.rec-avatar, .skeleton-avatar { width: 2.25rem; height: 2.25rem; }

/* ============================================================================
   HEADER & TOP NAVIGATION
   ============================================================================ */
.feed-header { position: sticky; top: 0; z-index: 50; background-color: #1e293b; border-bottom: 1px solid #334155; }
.header-top { display: flex; align-items: center; justify-content: space-between; height: 3.5rem; max-width: 1280px; margin: 0 auto; padding: 0 0.75rem; }
.header-left, .header-center, .header-right { display: flex; align-items: center; }
.logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #f8fafc; font-weight: 600; }
.menu-btn { background: none; border: none; color: #94a3b8; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.menu-btn:hover { color: #f8fafc; background-color: #334155; }
.header-search { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; margin-right: 0.25rem; border-radius: 999px; color: #cbd5e1; }
.header-search:hover { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.header-pals { position: relative; }
.dot-indicator { position: absolute; top: 0.4rem; right: 0.4rem; width: 0.6rem; height: 0.6rem; border-radius: 999px; background: #ef4444; box-shadow: 0 0 0 2px #1e293b; pointer-events: none; }
.nav-icon { display: flex; flex-direction: column; align-items: center; padding: 0.35rem 0.75rem; color: #94a3b8; border-radius: 0.5rem; transition: all 0.2s; text-decoration: none; position: relative; }
.count-badge { position: absolute; top: 0.1rem; right: 0.45rem; min-width: 1.15rem; height: 1.15rem; padding: 0 0.3rem; border-radius: 999px; background: #ef4444; color: #fff; font-size: 0.68rem; font-weight: 700; line-height: 1.15rem; text-align: center; box-shadow: 0 0 0 2px #1e293b; pointer-events: none; }
.nav-icon.active { color: #3b82f6; background-color: rgba(59, 130, 246, 0.1); }

/* ============================================================================
   FACEBOOK-STYLE CREATE POST WIDGET
   ============================================================================ */
.create-post-section {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.625rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 0.25rem;
}

.create-post-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-post-input-wrapper {
  flex: 1;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 9999px;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  min-width: 0;
}

.create-post-input-wrapper:hover {
  background-color: #1a2638;
  border-color: #475569;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 0.875rem;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-quick-btn {
  background: transparent;
  border: none;
  padding: 0.375rem;
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.media-quick-btn:hover {
  background-color: #334155;
}

.create-post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #334155;
  padding-top: 0.375rem;
  gap: 0.25rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.25rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background-color: #334155;
}

.action-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #cbd5e1;
}

.text-emerald-400 { color: #34d399; }
.text-amber-400 { color: #fbbf24; }
.text-sky-400 { color: #38bdf8; }

/* ============================================================================
   VERTICAL STORY / STATUS CARDS (HORIZONTAL SCROLL)
   ============================================================================ */
.status-tray-container {
  width: 100%;
  overflow: hidden;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.status-tray-loading {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.status-horizontal-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.125rem 0;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

.status-horizontal-scroll::-webkit-scrollbar {
  height: 4px;
}
.status-horizontal-scroll::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}

.story-card {
  position: relative;
  flex: 0 0 100px;
  height: 160px;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  background-color: #1e293b;
  border: 1px solid #334155;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Create Story Card Specifics */
.create-story-card {
  display: flex;
  flex-direction: column;
}

.story-cover-image {
  height: 105px;
  width: 100%;
  overflow: hidden;
  background-color: #0f172a;
}

.story-cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.create-story-card:hover .story-cover-image img {
  transform: scale(1.05);
}

.create-story-footer {
  height: 55px;
  background-color: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0.375rem;
  position: relative;
}

.plus-icon-badge {
  position: absolute;
  top: -12px;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background-color: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1e293b;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.story-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #f8fafc;
  text-align: center;
}

/* Active User Story Cards */
.story-background-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  overflow: hidden;
}

.story-bg-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

.story-preview-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  z-index: 1;
}

.story-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0) 40%, rgba(15, 23, 42, 0.85) 100%);
  padding: 0.375rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 2;
}

.story-avatar-badge {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  padding: 2px;
  background: linear-gradient(135deg, #3b82f6, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-avatar-badge img {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  object-fit: cover;
}

.story-author-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* ============================================================================
   REDEFINED SIDEBAR MENU DRAWER
   ============================================================================ */
.sidebar-overlay { 
  position: fixed; 
  inset: 0; 
  background-color: rgba(15, 23, 42, 0.75); 
  backdrop-filter: blur(6px); 
  z-index: 999; 
}

.sidebar { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 300px; 
  height: 100vh; 
  background-color: #0f172a; 
  border-right: 1px solid #1e293b;
  z-index: 1000; 
  transform: translateX(-100%); 
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); 
  display: flex;
  flex-direction: column;
  box-shadow: 10px 0 25px -5px rgba(0, 0, 0, 0.5);
}

.sidebar.open { 
  transform: translateX(0); 
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #1e293b;
  background-color: #0f172a;
}

.sidebar-header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.01em;
  margin: 0;
}

.close-btn {
  background: #1e293b;
  border: none;
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #334155;
  color: #f8fafc;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Custom Scrollbar for Drawer */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}

/* User Quick Card inside Drawer */
.sidebar-user-card {
  background-color: #1e293b;
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.sidebar-user-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 1.5px solid #3b82f6;
}

.sidebar-user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-handle {
  font-size: 0.7rem;
  color: #94a3b8;
}

.sidebar-user-actions {
  display: flex;
  gap: 0.5rem;
}

.sidebar-quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  padding: 0.35rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s;
}

.sidebar-quick-btn:hover {
  background-color: #2563eb;
}

.sidebar-quick-btn.outline {
  background-color: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
}

.sidebar-quick-btn.outline:hover {
  background-color: #334155;
  color: #f8fafc;
}

/* Grouping & Items */
.sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sidebar-section-title {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.5rem;
  margin: 0;
  text-transform: uppercase;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.sidebar-item:hover, .sidebar-item.router-link-active {
  background-color: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
}

.staff-item { color: var(--color-primary, #7c3aed); font-weight: 600; }
.badge.staff-role { background: #7c3aed; color: #fff; }
.sidebar-item.sub {
  padding-left: 0.875rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.sidebar-item.sub:hover {
  color: #f8fafc;
  background-color: #1e293b;
}

.sidebar-item.danger {
  color: #f87171;
}

.sidebar-item.danger:hover {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.item-icon {
  flex-shrink: 0;
}

.item-label {
  flex: 1;
}

.sidebar-item .badge {
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-badge {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  background: #f59e0b;
  color: #0f172a;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

/* Footer Section */
.sidebar-footer {
  margin-top: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid #1e293b;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.875rem;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background-color: #ef4444;
  color: #ffffff;
}

/* ============================================================================
   COMPONENT CARDS & MAIN FEED
   ============================================================================ */
.feed-sidebar-left { position: sticky; top: 4.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.profile-card, .recommendations-card, .trending-card {
  background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1rem;
}

.feed-content { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.feed-live-rail-wrapper { margin-bottom: 0.25rem; }
.post-media-gallery { border-radius: 0.5rem; overflow: hidden; border: 1px solid #334155; background-color: #0f172a; margin-top: 0.5rem; }
.post-image { width: 100%; display: block; object-fit: cover; }

.posts-list { display: flex; flex-direction: column; gap: 0.5rem; }

.post-actions-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid #334155;
}

.pew-gift-btn { color: #f59e0b; }
.pew-gift-btn:hover:not(:disabled) { background-color: rgba(245, 158, 11, 0.1); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============================================================================
   RESPONSIVE BREAKPOINTS
   ============================================================================ */
@media (max-width: 1200px) {
  .feed-main-wrapper { grid-template-columns: 240px minmax(0, 1fr); }
  .feed-sidebar-right { display: none; }
}

@media (max-width: 768px) {
  .feed-main-wrapper { 
    grid-template-columns: 1fr; 
    padding: 0.25rem 0.25rem calc(4.5rem + env(safe-area-inset-bottom, 0px)); 
    gap: 0.375rem;
  }
  .feed-sidebar-left { display: none; }

  .header-center {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    justify-content: space-around;
    background-color: #1e293b;
    border-top: 1px solid #334155;
    padding: 0.25rem 0.25rem calc(0.25rem + env(safe-area-inset-bottom, 0px));
  }
  .nav-icon { padding: 0.35rem 0.5rem; flex: 1; }
  .nav-label { font-size: 0.65rem; }

  .story-card {
    flex: 0 0 95px;
    height: 150px;
  }
  .story-cover-image {
    height: 98px;
  }
  .create-story-footer {
    height: 52px;
  }

  .action-label {
    display: none;
  }
}
</style>
