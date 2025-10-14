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

          <!-- PewGift Button -->
          <button 
            @click="openPewGift(post)"
            class="interaction-btn pewgift-btn"
            :class="{ 'has-gifts': post.pewgifts_count > 0 }"
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
import CreatePost from '~/components/posts/CreatePost.vue';
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

// Utility functions
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
    newComment: ''
  });
}

// Load posts with interaction data
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
        liking: false
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

// Like/Unlike functionality
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

// Comments functionality
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

// Share functionality
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
    
    // Show success message (you can implement a toast notification here)
    alert('Post link copied to clipboard!');
  } catch (err) {
    error.value = 'Failed to share post: ' + err.message;
  }
}

// PewGift functionality
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
    const { error: giftError } = await supabase
      .from('pew_gifts')
      .insert({
        sender_id: currentUser.value.id,
        recipient_id: selectedPost.value.user_id,
        post_id: selectedPost.value.id,
        amount: amount
      });

    if (giftError) throw giftError;

    // Update post gift count
    selectedPost.value.pewgifts_count += 1;

    closePewGift();
    
    // Show success message
    alert(`Successfully sent ${amount} PEW!`);
  } catch (err) {
    error.value = 'Failed to send gift: ' + err.message;
  } finally {
    sending.value = false;
  }
}

function loadMore() {
  page.value++;
  loadPosts();
}
</script>
