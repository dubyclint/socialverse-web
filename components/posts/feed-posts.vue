<template>
  <div class="feed-posts">
    <CreatePost @post-created="onPostCreated" />
    <h2>Latest Posts</h2>
    <div v-if="loading && posts.length === 0" class="loading">
      Loading posts...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <ul v-else class="posts-list">
      <li v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-header">
          <div class="author-info">
            <img 
              :src="post.author_avatar || '/default-avatar.png'" 
              :alt="post.author || 'Anonymous'"
              class="author-avatar"
            />
            <span class="post-author">{{ post.author || 'Anonymous' }}</span>
            <span v-if="post.is_verified" class="verified-badge">✓</span>
          </div>
          <span class="post-date">{{ formatDate(post.created_at) }}</span>
        </div>
        
        <div v-html="renderPost(post.content)" class="post-content"></div>
        
        <!-- Media content -->
        <div v-if="post.media_urls && post.media_urls.length > 0" class="post-media">
          <img 
            v-for="(url, index) in post.media_urls" 
            :key="index"
            :src="url" 
            :alt="`Post media ${index + 1}`"
            class="post-image"
          />
        </div>

        <!-- Interaction Bar -->
        <div class="interaction-bar">
          <!-- Like Button -->
          <button 
            @click="toggleLike(post)"
            :class="['interaction-btn', 'like-btn', { 'liked': post.user_liked }]"
            :disabled="post.liking"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="count">{{ formatCount(post.likes_count || 0) }}</span>
          </button>

          <!-- Comment Button -->
          <button 
            @click="toggleComments(post)"
            class="interaction-btn comment-btn"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21,6H3A1,1 0 0,0 2,7V17A1,1 0 0,0 3,18H8.5L12,21.5L15.5,18H21A1,1 0 0,0 22,17V7A1,1 0 0,0 21,6M13,14H11V12H13V14M13,10H11V8H13V10Z"/>
            </svg>
            <span class="count">{{ formatCount(post.comments_count || 0) }}</span>
          </button>

          <!-- Share Button -->
          <button 
            @click="sharePost(post)"
            class="interaction-btn share-btn"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.6 20.92,19A2.84,2.84 0 0,0 18,16.08Z"/>
            </svg>
            <span class="count">{{ formatCount(post.shares_count || 0) }}</span>
          </button>

          <!-- PewGift Button - UPDATED with toggle functionality -->
          <button 
            @click="toggleGifts(post)"
            :class="['interaction-btn', 'pewgift-btn', { 'has-gifts': post.pewgifts_count > 0, 'active': post.showGifts }]"
            title="View gifts or send a gift"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,10A2.5,2.5 0 0,0 5,12.5A2.5,2.5 0 0,0 7.5,15A2.5,2.5 0 0,0 10,12.5A2.5,2.5 0 0,0 7.5,10M16.5,10A2.5,2.5 0 0,0 14,12.5A2.5,2.5 0 0,0 16.5,15A2.5,2.5 0 0,0 19,12.5A2.5,2.5 0 0,0 16.5,10Z"/>
            </svg>
            <span class="count">{{ formatCount(post.pewgifts_count || 0) }}</span>
          </button>
        </div>

        <!-- Comments Section -->
        <div v-if="post.showComments" class="comments-section">
          <div class="comment-input">
            <input 
              v-model="post.newComment"
              @keyup.enter="addComment(post)"
              placeholder="Write a comment..."
              class="comment-field"
            />
            <button 
              @click="addComment(post)"
              :disabled="!post.newComment?.trim()"
              class="comment-submit"
            >
              Post
            </button>
          </div>
          
          <div v-if="post.comments && post.comments.length > 0" class="comments-list">
            <div 
              v-for="comment in post.comments" 
              :key="comment.id"
              class="comment-item"
            >
              <img 
                :src="comment.author_avatar || '/default-avatar.png'" 
                :alt="comment.author"
                class="comment-avatar"
              />
              <div class="comment-content">
                <span class="comment-author">{{ comment.author }}</span>
                <p class="comment-text">{{ comment.content }}</p>
                <div class="comment-actions">
                  <button 
                    @click="toggleCommentLike(comment)"
                    :class="['comment-like', { 'liked': comment.user_liked }]"
                  >
                    ♥ {{ comment.likes_count || 0 }}
                  </button>
                  <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================================
             ✅ NEW: Gift History Section - MISSING FEATURE #5 (TEMPLATE)
             ============================================================================ -->
        <div v-if="post.showGifts" class="gifts-section">
          <div class="gifts-header">
            <h4>Gifts Received ({{ post.gifts?.length || 0 }})</h4>
            <button 
              @click="toggleGifts(post)"
              class="close-gifts-btn"
              title="Hide gifts"
            >
              ✕
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="!post.gifts || post.gifts.length === 0" class="no-gifts">
            <p>No gifts yet. Be the first to send one! 🎁</p>
          </div>

          <!-- Gifts List -->
          <div v-else class="gifts-list">
            <div 
              v-for="gift in post.gifts" 
              :key="gift.id"
              class="gift-item"
            >
              <!-- Gift Sender Info -->
              <div class="gift-sender-info">
                <img 
                  :src="gift.sender_avatar || '/default-avatar.png'" 
                  :alt="gift.sender_name"
                  class="gift-sender-avatar"
                />
                <div class="gift-sender-details">
                  <div class="gift-sender-name">
                    <span class="sender-name">{{ gift.sender_name }}</span>
                    <span v-if="gift.sender_verified" class="verified-badge" title="Verified">✓</span>
                  </div>
                  <span class="gift-date">{{ gift.formatted_date }}</span>
                </div>
              </div>

              <!-- Gift Amount -->
              <div class="gift-amount-badge">
                <span class="pew-icon">🎁</span>
                <span class="amount">{{ gift.formatted_amount }} PEW</span>
              </div>

              <!-- Gift Actions (Optional) -->
              <div class="gift-actions">
                <button 
                  @click="toggleGiftLike(gift)"
                  :class="['gift-like-btn', { 'liked': gift.user_liked }]"
                  title="Like this gift"
                >
                  ♥ {{ gift.likes_count || 0 }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
    
    <button 
      v-if="hasMore" 
      @click="loadMore" 
      :disabled="loading"
      class="load-more-btn"
    >
      {{ loading ? 'Loading...' : 'Load More' }}
    </button>

    <!-- PewGift Modal -->
    <div v-if="showPewGiftModal" class="modal-overlay" @click="closePewGift">
      <div class="pewgift-modal" @click.stop>
        <h3>Send PewGift</h3>
        <p>Send a gift to support this post!</p>
        <div class="gift-amounts">
          <button 
            v-for="amount in [1, 5, 10, 25, 50]" 
            :key="amount"
            @click="selectedGiftAmount = amount"
            :class="['amount-btn', { 'selected': selectedGiftAmount === amount }]"
          >
            {{ amount }} PEW
          </button>
        </div>
        <div class="custom-amount">
          <input 
            v-model.number="customAmount"
            type="number"
            placeholder="Custom amount"
            min="1"
            class="custom-input"
          />
        </div>
        <div class="modal-actions">
          <button @click="closePewGift" class="cancel-btn">Cancel</button>
          <button 
            @click="sendPewGift" 
            :disabled="!getGiftAmount() || sending"
            class="send-btn"
          >
            {{ sending ? 'Sending...' : `Send ${getGiftAmount()} PEW` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import CreatePost from '~/components/posts/create-post.vue';
import MarkdownIt from 'markdown-it';
import EmojiConvertor from 'emoji-js';
import { supabase } from '~/utils/supabase';

const md = new MarkdownIt();
const emoji = new EmojiConvertor();
emoji.img_set = 'emojione';
emoji.img_sets.emojione.path = 'https://cdn.jsdelivr.net/emojione/assets/4.5/png/64/';

// Reactive data
const posts = ref([]);
const page = ref(1);
const loading = ref(false);
const error = ref('');
const hasMore = ref(true);
const postsPerPage = 10;
const currentUser = ref(null);

// PewGift modal
const showPewGiftModal = ref(false);
const selectedPost = ref(null);
const selectedGiftAmount = ref(null);
const customAmount = ref(null);
const sending = ref(false);

// Get current user
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser.value = user;
  loadPosts();
});

// ============================================================================
// Utility functions
// ============================================================================

function renderPost(content) {
  if (!content) return '';
  const markdown = md.render(content);
  return emoji.replace_colons(markdown);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

function onPostCreated(newPost) {
  posts.value.unshift({
    ...newPost,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    pewgifts_count: 0,
    user_liked: false,
    showComments: false,
    comments: [],
    newComment: '',
    // ✅ NEW: Gift properties - MISSING FEATURE #3
    gifts: [],
    showGifts: false,
  });
}

// ============================================================================
// Load posts with interaction data
// ============================================================================

async function loadPosts() {
  try {
    loading.value = true;
    error.value = '';
    
    const { data, error: supabaseError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        likes_count:post_likes!post_id(count),
        comments_count:post_comments!post_id(count),
        shares_count:post_shares!post_id(count),
        pewgifts_count:pew_gifts!post_id(count),
        user_liked:post_likes!post_id(user_id)
      `)
      .order('created_at', { ascending: false })
      .range((page.value - 1) * postsPerPage, page.value * postsPerPage - 1);
    
    if (supabaseError) throw supabaseError;
    
    if (data && data.length > 0) {
      const processedPosts = data.map(post => ({
        ...post,
        author: post.profiles?.username || 'Anonymous',
        author_avatar: post.profiles?.avatar_url,
        is_verified: post.profiles?.is_verified || false,
        likes_count: post.likes_count?.[0]?.count || 0,
        comments_count: post.comments_count?.[0]?.count || 0,
        shares_count: post.shares_count?.[0]?.count || 0,
        pewgifts_count: post.pewgifts_count?.[0]?.count || 0,
        user_liked: post.user_liked?.some(like => like.user_id === currentUser.value?.id) || false,
        showComments: false,
        comments: [],
        newComment: '',
        liking: false,
        // ✅ NEW: Initialize gift properties for all posts - MISSING FEATURE #4
        gifts: [],
        showGifts: false,
      }));
      
      if (page.value === 1) {
        posts.value = processedPosts;
      } else {
        posts.value.push(...processedPosts);
      }
      hasMore.value = data.length === postsPerPage;
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    error.value = 'Failed to load posts: ' + err.message;
  } finally {
    loading.value = false;
  }
}

// ============================================================================
// Like/Unlike functionality
// ============================================================================

async function toggleLike(post) {
  if (!currentUser.value) {
    error.value = 'Please log in to like posts';
    return;
  }

  post.liking = true;
  const wasLiked = post.user_liked;

  try {
    if (wasLiked) {
      // Unlike
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.value.id);

      if (unlikeError) throw unlikeError;
      
      post.user_liked = false;
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          post_id: post.id,
          user_id: currentUser.value.id
        });

      if (likeError) throw likeError;
      
      post.user_liked = true;
      post.likes_count += 1;
    }
  } catch (err) {
    error.value = 'Failed to update like: ' + err.message;
    // Revert optimistic update
    post.user_liked = wasLiked;
    post.likes_count += wasLiked ? 1 : -1;
  } finally {
    post.liking = false;
  }
}

// ============================================================================
// Comments functionality
// ============================================================================

async function toggleComments(post) {
  post.showComments = !post.showComments;
  
  if (post.showComments && post.comments.length === 0) {
    await loadComments(post);
  }
}

async function loadComments(post) {
  try {
    const { data, error: commentsError } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes_count:comment_likes!comment_id(count),
        user_liked:comment_likes!comment_id(user_id)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    post.comments = data.map(comment => ({
      ...comment,
      author: comment.profiles?.username || 'Anonymous',
      author_avatar: comment.profiles?.avatar_url,
      likes_count: comment.likes_count?.[0]?.count || 0,
      user_liked: comment.user_liked?.some(like => like.user_id === currentUser.value?.id) || false
    }));
  } catch (err) {
    error.value = 'Failed to load comments: ' + err.message;
  }
}

async function addComment(post) {
  if (!currentUser.value) {
    error.value = 'Please log in to comment';
    return;
  }

  if (!post.newComment?.trim()) return;

  try {
    const { data, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        user_id: currentUser.value.id,
        content: post.newComment.trim()
      })
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();

    if (commentError) throw commentError;

    const newComment = {
      ...data,
      author: data.profiles?.username || 'Anonymous',
      author_avatar: data.profiles?.avatar_url,
      likes_count: 0,
      user_liked: false
    };

    post.comments.push(newComment);
    post.comments_count += 1;
    post.newComment = '';
  } catch (err) {
    error.value = 'Failed to add comment: ' + err.message;
  }
}

async function toggleCommentLike(comment) {
  if (!currentUser.value) return;

  const wasLiked = comment.user_liked;

  try {
    if (wasLiked) {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.value.id);

      if (error) throw error;
      
      comment.user_liked = false;
      comment.likes_count = Math.max(0, comment.likes_count - 1);
    } else {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: comment.id,
          user_id: currentUser.value.id
        });

      if (error) throw error;
      
      comment.user_liked = true;
      comment.likes_count += 1;
    }
  } catch (err) {
    error.value = 'Failed to update comment like: ' + err.message;
  }
}

// ============================================================================
// Share functionality
// ============================================================================

async function sharePost(post) {
  if (!currentUser.value) {
    error.value = 'Please log in to share posts';
    return;
  }

  try {
    // Record the share
    const { error: shareError } = await supabase
      .from('post_shares')
      .insert({
        post_id: post.id,
        user_id: currentUser.value.id
      });

    if (shareError) throw shareError;

    post.shares_count += 1;

    // Copy link to clipboard
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    await navigator.clipboard.writeText(postUrl);
    
    alert('Post link copied to clipboard!');
  } catch (err) {
    error.value = 'Failed to share post: ' + err.message;
  }
}

// ============================================================================
// ✅ NEW: PewGift functionality - MISSING FEATURES #1, #2, #5
// ============================================================================

// MISSING FEATURE #1: Load PewGifts Function
async function loadPewGifts(post) {
  try {
    console.log('[PewGift] Loading gifts for post:', post.id);
    
    const { data, error: giftsError } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        sender:sender_id(username, avatar_url, is_verified),
        recipient:recipient_id(username, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });

    if (giftsError) throw giftsError;

    // Map gifts to readable format
    post.gifts = data.map(gift => ({
      ...gift,
      sender_name: gift.sender?.username || 'Anonymous',
      sender_avatar: gift.sender?.avatar_url,
      sender_verified: gift.sender?.is_verified || false,
      recipient_name: gift.recipient?.username || 'Anonymous',
      recipient_avatar: gift.recipient?.avatar_url,
      formatted_amount: formatCount(gift.amount),
      formatted_date: formatDate(gift.created_at),
      likes_count: 0,
      user_liked: false
    }));

    console.log('[PewGift] Loaded', post.gifts.length, 'gifts');
  } catch (err) {
    console.error('[PewGift] Failed to load gifts:', err);
    error.value = 'Failed to load gifts: ' + err.message;
    post.gifts = [];
  }
}

// MISSING FEATURE #2: Toggle Gifts Function
async function toggleGifts(post) {
  try {
    console.log('[PewGift] Toggling gifts for post:', post.id);
    
    post.showGifts = !post.showGifts;
    
    // Load gifts if showing and not already loaded
    if (post.showGifts && (!post.gifts || post.gifts.length === 0)) {
      console.log('[PewGift] Loading gifts on demand');
      await loadPewGifts(post);
    }
  } catch (err) {
    console.error('[PewGift] Failed to toggle gifts:', err);
    error.value = 'Failed to toggle gifts: ' + err.message;
    post.showGifts = false;
  }
}

function openPewGift(post) {
  if (!currentUser.value) {
    error.value = 'Please log in to send gifts';
    return;
  }
  
  selectedPost.value = post;
  showPewGiftModal.value = true;
  selectedGiftAmount.value = null;
  customAmount.value = null;
}

function closePewGift() {
  showPewGiftModal.value = false;
  selectedPost.value = null;
  selectedGiftAmount.value = null;
  customAmount.value = null;
}

function getGiftAmount() {
  return selectedGiftAmount.value || customAmount.value || 0;
}

// MISSING FEATURE #5: Updated sendPewGift Function
async function sendPewGift() {
  const amount = getGiftAmount();
  if (!amount || !selectedPost.value) return;

  sending.value = true;

  try {
    // Check user balance first
    const { data: userBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('pew_balance')
      .eq('user_id', currentUser.value.id)
      .single();

    if (balanceError) throw balanceError;

    if (userBalance.pew_balance < amount) {
      throw new Error('Insufficient PEW balance');
    }

    // Send the gift
    const { data: giftData, error: giftError } = await supabase
      .from('pew_gifts')
      .insert({
        sender_id: currentUser.value.id,
        recipient_id: selectedPost.value.user_id,
        post_id: selectedPost.value.id,
        amount: amount
      })
      .select(`
        *,
        sender:sender_id(username, avatar_url, is_verified),
        recipient:recipient_id(username, avatar_url)
      `)
      .single();

    if (giftError) throw giftError;

    // ✅ NEW: Update post gift count
    selectedPost.value.pewgifts_count += 1;
    console.log('[PewGift] Gift sent successfully, count updated to:', selectedPost.value.pewgifts_count);

    // ✅ NEW: Reload gift history if it's currently visible
    if (selectedPost.value.showGifts) {
      console.log('[PewGift] Reloading gift history');
      await loadPewGifts(selectedPost.value);
    } else {
      // ✅ NEW: Add the new gift to the array if it exists
      if (selectedPost.value.gifts) {
        const newGift = {
          ...giftData,
          sender_name: giftData.sender?.username || 'Anonymous',
          sender_avatar: giftData.sender?.avatar_url,
          sender_verified: giftData.sender?.is_verified || false,
          recipient_name: giftData.recipient?.username || 'Anonymous',
          recipient_avatar: giftData.recipient?.avatar_url,
          formatted_amount: formatCount(giftData.amount),
          formatted_date: formatDate(giftData.created_at),
          likes_count: 0,
          user_liked: false
        };
        selectedPost.value.gifts.unshift(newGift);
      }
    }

    // Show success message
    alert(`Successfully sent ${amount} PEW!`);
    closePewGift();
  } catch (err) {
    console.error('[PewGift] Failed to send gift:', err);
    error.value = 'Failed to send gift: ' + err.message;
  } finally {
    sending.value = false;
  }
}

// BONUS: Optional - Like on Gifts
async function toggleGiftLike(gift) {
  if (!currentUser.value) {
    error.value = 'Please log in to like gifts';
    return;
  }

  const wasLiked = gift.user_liked;

  try {
    if (wasLiked) {
      // Unlike gift
      const { error: unlikeError } = await supabase
        .from('gift_likes')
        .delete()
        .eq('gift_id', gift.id)
        .eq('user_id', currentUser.value.id);

      if (unlikeError) throw unlikeError;
      
      gift.user_liked = false;
      gift.likes_count = Math.max(0, gift.likes_count - 1);
    } else {
      // Like gift
      const { error: likeError } = await supabase
        .from('gift_likes')
        .insert({
          gift_id: gift.id,
          user_id: currentUser.value.id
        });

      if (likeError) throw likeError;
      
      gift.user_liked = true;
      gift.likes_count = (gift.likes_count || 0) + 1;
    }
  } catch (err) {
    console.error('[PewGift] Failed to update gift like:', err);
    error.value = 'Failed to update gift like: ' + err.message;
    // Revert optimistic update
    gift.user_liked = wasLiked;
  }
}

function loadMore() {
  page.value++;
  loadPosts();
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.feed-posts {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  margin: 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.loading,
.error {
  padding: 1rem;
  text-align: center;
  border-radius: 8px;
  margin: 1rem 0;
}

.loading {
  background: #e3f2fd;
  color: #1976d2;
}

.error {
  background: #ffebee;
  color: #c62828;
}

.posts-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.post-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-author {
  font-weight: 600;
  color: #333;
}

.verified-badge {
  color: #2196f3;
  font-size: 0.9rem;
}

.post-date {
  font-size: 0.85rem;
  color: #999;
}

.post-content {
  padding: 1rem;
  color: #555;
  line-height: 1.6;
}

.post-media {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}

.post-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.post-image:hover {
  transform: scale(1.02);
}

.interaction-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.interaction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.interaction-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.interaction-btn.liked {
  color: #e74c3c;
}

.interaction-btn.pewgift-btn.active {
  background: linear-gradient(135deg, #ffd54f 0%, #ffb74d 100%);
  color: #f57f17;
}

.interaction-btn.pewgift-btn.has-gifts .count {
  background: #ff6f00;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.count {
  font-size: 0.85rem;
}

/* Comments Section */
.comments-section {
  padding: 1rem;
  background: #f9f9f9;
  border-top: 1px solid #eee;
}

.comment-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.comment-field {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.comment-submit {
  padding: 0.5rem 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.comment-submit:hover:not(:disabled) {
  background: #1976d2;
}

.comment-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-author {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.comment-text {
  margin: 0.25rem 0;
  color: #555;
  font-size: 0.9rem;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.comment-like {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.comment-like:hover {
  color: #e74c3c;
}

.comment-like.liked {
  color: #e74c3c;
}

.comment-date {
  color: #999;
}

/* ============================================================================
   ✅ NEW: Gift History Section Styles - MISSING FEATURE #5 (STYLES)
   ============================================================================ */

.gifts-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border-radius: 8px;
  border: 1px solid #ffe082;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gifts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ffd54f;
}

.gifts-header h4 {
  margin: 0;
  color: #f57f17;
  font-size: 1rem;
  font-weight: 600;
}

.close-gifts-btn {
  background: none;
  border: none;
  color: #f57f17;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-gifts-btn:hover {
  transform: scale(1.2);
  color: #e65100;
}

.no-gifts {
  text-align: center;
  padding: 1rem;
  color: #f57f17;
  font-style: italic;
}

.gifts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.gift-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #ffe082;
  transition: all 0.2s;
}

.gift-item:hover {
  background: #fffde7;
  box-shadow: 0 2px 8px rgba(245, 127, 23, 0.15);
}

.gift-sender-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.gift-sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffd54f;
  flex-shrink: 0;
}

.gift-sender-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.gift-sender-name {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.sender-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified-badge {
  color: #2196f3;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.gift-date {
  font-size: 0.75rem;
  color: #999;
}

.gift-amount-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #ffd54f 0%, #ffb74d 100%);
  border-radius: 20px;
  font-weight: 600;
  color: #f57f17;
  font-size: 0.85rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.pew-icon {
  font-size: 1rem;
}

.gift-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.gift-like-btn {
  background: none;
  border: 1px solid #ffd54f;
  color: #f57f17;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.gift-like-btn:hover {
  background: #fff9e6;
  border-color: #f57f17;
}

.gift-like-btn.liked {
  background: #ffb74d;
  color: white;
  border-color: #ffb74d;
}

/* Scrollbar styling for gifts list */
.gifts-list::-webkit-scrollbar {
  width: 6px;
}

.gifts-list::-webkit-scrollbar-track {
  background: #fff9e6;
  border-radius: 3px;
}

.gifts-list::-webkit-scrollbar-thumb {
  background: #ffd54f;
  border-radius: 3px;
}

.gifts-list::-webkit-scrollbar-thumb:hover {
  background: #ffb74d;
}

/* PewGift Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pewgift-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.pewgift-modal h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.pewgift-modal p {
  color: #666;
  margin-bottom: 1rem;
}

.gift-amounts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.amount-btn {
  padding: 0.5rem;
  background: #f0f0f0;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.amount-btn:hover {
  background: #e0e0e0;
}

.amount-btn.selected {
  background: #ffd54f;
  border-color: #f57f17;
  color: #f57f17;
}

.custom-amount {
  margin-bottom: 1rem;
}

.custom-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.cancel-btn,
.send-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.send-btn {
  background: linear-gradient(135deg, #ffd54f 0%, #ffb74d 100%);
  color: #f57f17;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 127, 23, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-more-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #1976d2;
}

.load-more-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 640px) {
  .feed-posts {
    padding: 0.5rem;
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .interaction-bar {
    flex-wrap: wrap;
  }

  .interaction-btn {
    flex: 1 1 calc(50% - 0.25rem);
  }

  .gift-item {
    flex-wrap: wrap;
  }

  .gift-sender-info {
    flex: 1 1 100%;
  }

  .gift-amount-badge {
    flex: 1 1 auto;
  }

  .gift-actions {
    flex: 1 1 100%;
    justify-content: flex-end;
  }

  .gift-amounts {
    grid-template-columns: repeat(3, 1fr);
  }

  .pewgift-modal {
    width: 95%;
    padding: 1.5rem;
  }
}
</style>
