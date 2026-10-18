Question ID (machine readable),Response ID (machine readable),Response value,Answer requirement,Human-friendly question label
PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA,,true,REQUIRED,Does your app collect or share any of the required user data types?
PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT,,true,MAYBE_REQUIRED,Is all of the user data collected by your app encrypted in transit?
PSL_SUPPORTED_ACCOUNT_CREATION_METHODS,PSL_ACM_USER_ID_PASSWORD,true,MULTIPLE_CHOICE,Which of the following methods of account creation does your app support? Select all that apply / Username and password
PSL_ACCOUNT_DELETION_URL,,https://viorp.com/settings/delete-account,MAYBE_REQUIRED,Add a link that users can use to request that their account and associated data is deleted 
PSL_SUPPORT_DATA_DELETION_BY_USER,DATA_DELETION_YES,true,SINGLE_CHOICE,Do you provide a way for users to request that their data is deleted? / Yes
PSL_DATA_DELETION_URL,,https://viorp.com/settings/delete-account,MAYBE_REQUIRED,Delete data URL
PSL_DATA_TYPES_PERSONAL,PSL_NAME,true,MULTIPLE_CHOICE,Personal info / Name
PSL_DATA_TYPES_PERSONAL,PSL_EMAIL,true,MULTIPLE_CHOICE,Personal info / Email address
PSL_DATA_TYPES_PERSONAL,PSL_USER_ACCOUNT,true,MULTIPLE_CHOICE,Personal info / User IDs
PSL_DATA_TYPES_PERSONAL,PSL_PHONE,true,MULTIPLE_CHOICE,Personal info / Phone number
PSL_DATA_TYPES_PERSONAL,PSL_OTHER_PERSONAL,true,MULTIPLE_CHOICE,Personal info / Other info
PSL_DATA_TYPES_FINANCIAL,PSL_CREDIT_DEBIT_BANK_ACCOUNT_NUMBER,true,MULTIPLE_CHOICE,Financial info / User payment info
PSL_DATA_TYPES_FINANCIAL,PSL_PURCHASE_HISTORY,true,MULTIPLE_CHOICE,Financial info / Purchase history
PSL_DATA_TYPES_LOCATION,PSL_APPROX_LOCATION,true,MULTIPLE_CHOICE,Location / Approximate location
PSL_DATA_TYPES_EMAIL_AND_TEXT,PSL_OTHER_MESSAGES,true,MULTIPLE_CHOICE,Messages / Other in-app messages
PSL_DATA_TYPES_PHOTOS_AND_VIDEOS,PSL_PHOTOS,true,MULTIPLE_CHOICE,Photos and videos / Photos
PSL_DATA_TYPES_PHOTOS_AND_VIDEOS,PSL_VIDEOS,true,MULTIPLE_CHOICE,Photos and videos / Videos
PSL_DATA_TYPES_AUDIO,PSL_AUDIO,true,MULTIPLE_CHOICE,Audio files / Voice or sound recordings
PSL_DATA_TYPES_CONTACTS,PSL_CONTACTS,true,MULTIPLE_CHOICE,Contacts / Contacts
PSL_DATA_TYPES_APP_PERFORMANCE,PSL_CRASH_LOGS,true,MULTIPLE_CHOICE,App info and performance / Crash logs
PSL_DATA_TYPES_APP_PERFORMANCE,PSL_PERFORMANCE_DIAGNOSTICS,true,MULTIPLE_CHOICE,App info and performance / Diagnostics
PSL_DATA_TYPES_APP_PERFORMANCE,PSL_OTHER_PERFORMANCE,true,MULTIPLE_CHOICE,App info and performance / Other app performance data
PSL_DATA_TYPES_APP_ACTIVITY,PSL_USER_INTERACTION,true,MULTIPLE_CHOICE,App activity / App interactions
PSL_DATA_TYPES_APP_ACTIVITY,PSL_IN_APP_SEARCH_HISTORY,true,MULTIPLE_CHOICE,App activity / In-app search history
PSL_DATA_TYPES_APP_ACTIVITY,PSL_APPS_ON_DEVICE,true,MULTIPLE_CHOICE,App activity / Installed apps
PSL_DATA_TYPES_APP_ACTIVITY,PSL_USER_GENERATED_CONTENT,true,MULTIPLE_CHOICE,App activity / Other user-generated content
PSL_DATA_TYPES_APP_ACTIVITY,PSL_OTHER_APP_ACTIVITY,true,MULTIPLE_CHOICE,App activity / Other actions
PSL_DATA_TYPES_IDENTIFIERS,PSL_DEVICE_ID,true,MULTIPLE_CHOICE,Device or other IDs / Device or other IDs


problems 2: fix this Issues/ problem statement:let's say 13million users from 134 countries signed up into a web app, that has post/feed system , live stream, message chat, profile and sub pages system. how is the post / feed matched and rendered to users of different languages, categories and demographics. what is the standard practice for this my project, then apply 


My suggestion/instructions:

# Role & Context
You are an expert Principal Solutions Architect and Lead Full-Stack Engineer specializing in highly scalable, cross-platform applications. 
Your technical core is **Nuxt 3 / Vue 3** paired with **Capacitor JS** to build a unified codebase that targets:
* Web (SEO-optimized, Server-Side Rendered or Edge-rendered where applicable)
* Desktop PWA
* Native Android (via Capacitor)
* Native iOS (via Capacitor)

The platform is a high-scale social and entertainment ecosystem serving millions of global users. You write clean, modular, highly performant code, and design resilient, low-latency architectures.

---

# System Architecture & Core Modules
When writing code, designing schemas, or planning features, you must always align with the requirements of these interconnected modules:

### 1. Unified Cross-Platform Shell (Nuxt  + Capacitor JS)
* **Environment-Aware Logic:** Code must dynamically detect the platform (`Capacitor.getPlatform()`) to toggle between Web APIs and Native SDK wrappers.
* **Performance:** Strict optimization for mobile WebViews (handling memory leaks, optimizing heavy DOM trees, lazy-loading routes and components).
* **State Management:** Highly organized state using Pinia, with selective local persistence (Preferences API for native, LocalStorage/Cookies for web).

### 2. Multi-Tiered Post / Feed System
* **Feed Pipeline Architecture:** Design for a multi-stage pipeline: Retrieval (Candidate Generation), ML-driven Heavy Ranking (Language, Category, and Demographic matching), and final Diversity Filtering.
* **UI/UX Performance:** Virtual scrolling / infinite scrolling optimized for native WebViews to prevent lag on 60fps mobile screens.
* **Content Tagging:** Post payloads must strictly support language ISO tags, structural categories (e.g., gaming, sports), and geographic coordinates/regions.

### 3. Profile & Profile Sub-Pages System
* **Routing Structure:** Nuxt dynamic routing (nested child routes) optimized for smooth tab-switching inside profiles (e.g., `/user/:id/posts`, `/user/:id/media`, `/user/:id/about`).
* **Caching & Hydration:** Cache profile meta-data efficiently. Ensure deep-linked profile sub-pages hydrate seamlessly on both Web SSR and Mobile SPAs.

### 4. Live Stream Engine
* **Protocol & Video Delivery:** Implementation patterns for low-latency streaming (HLS, WebRTC, or Dash). 
* **State & Overlay Handling:** Manage high-frequency real-time events over the video layer (live viewer counts, floating hearts, active gifting, pinned chat).
* **Lifecycle Management:** Graceful handling of mobile application lifecycle events (app pausing, backgrounding, incoming phone calls during a live stream).

### 5. High-Throughput Chat Messaging
* **Transport Layer:** Real-time bi-directional communication via WebSockets (or EventStreams) with a fallback HTTP polling mechanism.
* **Local Storage & Sync:** Offline-first caching of chat threads using SQLite (via Capacitor community plugins) or IndexedDB, syncing seamlessly when online.
* **UI Responsiveness:** Optimistic UI updates for sent messages and dynamic keyboard-height adjustments on iOS/Android.

### 6. Hybrid In-App Ad Placement Manager
* **Internal Ad Server:** A priority system that fetches and renders custom internal ad campaigns managed from your backend dashboard.
* **Waterfall & Fallback Logic:** If the internal ad server returns empty, has capped impressions, or fails, the client must seamlessly fall back to external programmatic Ad mediation SDKs.
* **External Providers:** Implementation handles integrations with services like **Appodeal** and **Monetag** via native Capacitor bridges or web-based fallback tags, optimizing fill rates globally across 134+ countries.

### 7. Support & Customer Operations System
* **Ticketing & Real-time Support:** In-app ticketing dashboard, live chat support redirection, and automated diagnostic payload gathering (App version, OS version, Network type, Platform) to accompany user logs.

---

# Operational Rules & Output Guidelines
1. **Never Assume Environment:** Always write platform-agnostic code or wrap native-specific code inside robust conditional blocks (`if (this.$device.isMobile) ...`).
2. **Prioritize Performance:** Because Vue/Nuxt runs inside a Capacitor WebView, look out for heavy computations on the main thread, layout thrashing, or un-virtualized lists.
3. **Data-Driven & Scalable:** Assume the system operates at a scale of 13M+ users. Suggest optimized indexing, caching tiers (Redis/CDN), and minimal payload sizes.
4. **Be Direct and Practical:** Provide production-ready, TypeScript-compatible Vue 3 Composition API code blocks (`<script setup lang="ts">`). Avoid placeholders or pseudo-code unless explicitly asked.
  
add global announcement features and let tab accessed from profile or sidebar of feed.vue (only for admin or manager user)  <!-- layouts/default.vue -->
<script setup>
import { onMounted, ref } from 'vue'

const showAnnouncement = ref(false)
const announcementText = ref('')
const announcementId = ref(null)

onMounted(async () => {
  try {
    // 1. Fetch the cached announcement from your server/CDN
    const response = await fetch('https://viorp.com')
    const data = await response.json()
    
    if (data && data.active) {
      // 2. Check if the user has already closed this specific update
      const readId = localStorage.getItem('viorp_dismissed_announcement_id')
      
      if (readId !== String(data.id)) {
        announcementId.value = data.id
        announcementText.value = data.message
        showAnnouncement.value = true
      }
    }
  } catch (err) {
    console.error('Announcement check skipped silently:', err)
  }
})

const dismissAlert = () => {
  localStorage.setItem('viorp_dismissed_announcement_id', String(announcementId.value))
  showAnnouncement.value = false
}
</script>

<template>
  <div>
    <!-- Global Overlay Announcement Block -->
    <div v-if="showAnnouncement" class="announcement-banner">
      <p>{{ announcementText }}</p>
      <button @click="dismissAlert">Got it</button>
    </div>
    
    <slot />
  </div>
</template>

<style scoped>
.announcement-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  background-color: #007bff;
  color: white;
  padding: 12px;
  text-align: center;
  z-index: 9999;
  display: flex; justify-content: space-between; align-items: center;
}
</style>


<script setup>
import { ref } from 'vue'

// Role authentication check mock properties (derived from your app's global state / auth store)
const props = defineProps({
  userRole: {
    type: String,
    required: true,
    validator: (value) => ['admin', 'manager', 'user'].includes(value)
  }
})

const announcementTitle = ref('')
const announcementMessage = ref('')
const isPublishing = ref(false)
const serverFeedback = ref({ success: false, text: '' })

const handlePublishAnnouncement = async () => {
  // Front-End Safeguard: Ensure unauthorized roles cannot even attempt the submit trigger
  if (props.userRole !== 'admin' && props.userRole !== 'manager') {
    serverFeedback.value = { success: false, text: 'Access Denied: Insufficient authorization permissions.' }
    return
  }

  if (!announcementTitle.value || !announcementMessage.value) {
    serverFeedback.value = { success: false, text: 'Please fill out all required fields before broadcasting.' }
    return
  }

  isPublishing.value = true
  serverFeedback.value = { success: false, text: '' }

  try {
    // API request routes straight to your backend admin controller layer
    const response = await fetch('https://viorp.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('viorp_auth_token')}` // Secure auth state token
      },
      body: JSON.stringify({
        title: announcementTitle.value,
        message: announcementMessage.value,
        published_by_role: props.userRole
      })
    })

    if (response.ok) {
      serverFeedback.value = { success: true, text: 'Broadcast issued successfully! Users will pull down the update.' }
      announcementTitle.value = ''
      announcementMessage.value = ''
    } else {
      const errData = await response.json()
      serverFeedback.value = { success: false, text: errData.message || 'Server rejected broadcast instruction.' }
    }
  } catch (err) {
    serverFeedback.value = { success: false, text: 'Network connection failure encountered.' }
    console.error(err)
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <div class="announcement-manager-panel">
    <!-- UI Block Wrapper Guardrail -->
    <div v-if="userRole === 'admin' || userRole === 'manager'" class="management-card">
      <div class="card-header">
        <h3>📢 Global Announcement Broadcaster</h3>
        <p class="role-badge" :class="userRole">Authorized Level: {{ userRole.toUpperCase() }}</p>
      </div>

      <div class="form-group">
        <label for="announcement-title">Alert Title</label>
        <input 
          id="announcement-title"
          v-model.trim="announcementTitle"
          type="text" 
          placeholder="e.g., Scheduled Core Maintenance Window"
          maxlength="100"
          :disabled="isPublishing"
        />
      </div>

      <div class="form-group">
        <label for="announcement-body">Announcement Message Content</label>
        <textarea 
          id="announcement-body"
          v-model.trim="announcementMessage"
          placeholder="Type the message details you want to display globally to all 50 million users..."
          rows="5"
          maxlength="1000"
          :disabled="isPublishing"
        ></textarea>
        <small class="char-counter">{{ announcementMessage.length }}/1000 characters used</small>
      </div>

      <button 
        @click="handlePublishAnnouncement" 
        class="publish-btn"
        :disabled="isPublishing"
      >
        {{ isPublishing ? 'Broadcasting to Cloud Cache...' : 'Publish Global Live Broadcast' }}
      </button>

      <p v-if="serverFeedback.text" class="feedback-msg" :class="{ 'success-style': serverFeedback.success }">
        {{ serverFeedback.text }}
      </p>
    </div>

    <!-- Fallback if unauthorized personnel somehow access the link -->
    <div v-else class="unauthorized-fallback-banner">
      <p>⚠️ Error 403: Access Restricted. Only Admin and Manager credentials can issue network broadcasts.</p>
    </div>
  </div>
</template>

<style scoped>
.announcement-manager-panel {
  max-width: 600px;
  margin: 20px auto;
  font-family: sans-serif;
}
.management-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.role-badge {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: bold;
  border-radius: 4px;
}
.role-badge.admin { background: #ffebee; color: #c62828; }
.role-badge.manager { background: #e8f5e9; color: #2e7d32; }
.form-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}
label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
input, textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
input:focus, textarea:focus {
  outline: none;
  border-color: #007bff;
}
.char-counter {
  text-align: right;
  color: #777;
  font-size: 11px;
  margin-top: 4px;
}
.publish-btn {
  width: 100%;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px;
  font-size: 15px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.publish-btn:hover:not(:disabled) { background-color: #0056b3; }
.publish-btn:disabled { background-color: #cccccc; cursor: not-allowed; }
.feedback-msg {
  margin-top: 15px;
  font-size: 13px;
  color: #d32f2f;
  text-align: center;
}
.feedback-msg.success-style { color: #2e7d32; }
.unauthorized-fallback-banner {
  background: #fff3cd;
  color: #856404;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #ffeeba;
}
</style>

<!-- layouts/default.vue -->
<template>
  <div>
    <!-- Global Scale-Safe Overlay Banner -->
    <Transition name="fade-slide">
      <div v-if="showAnnouncement" class="announcement-root-banner" role="alert">
        <div class="announcement-content-box">
          <span class="mega-horn-icon">📢</span>
          <div class="text-block">
            <strong class="headline">{{ alertTitle }}</strong>
            <p class="body-copy">{{ alertMessage }}</p>
          </div>
        </div>
        <button @click="dismissAlert" class="close-action-button" aria-label="Dismiss Announcement">
          ✕
        </button>
      </div>
    </Transition>
    
    <!-- Render core cross-platform application structure layout -->
    <slot />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const showAnnouncement = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const announcementId = ref(null)

onMounted(async () => {
  // Prevent any script execution on Server Side Rendering context blocks
  if (process.server) return

  try {
    // This public URL is heavily proxied behind Cloudflare Edge layers to insulate your database
    const response = await fetch('https://viorp.com')
    
    if (!response.ok) return // Exit silently if no active live alert is cached
    
    const data = await response.json()
    
    if (data && data.id) {
      // Cross-verify unique numerical ID strings using browser local storage keys
      const historicalReadId = localStorage.getItem('viorp_dismissed_announcement_id')
      
      if (historicalReadId !== String(data.id)) {
        announcementId.value = data.id
        alertTitle.value = data.title
        alertMessage.value = data.message
        showAnnouncement.value = true
      }
    }
  } catch (err) {
    // Silent catch block to ensure any ad block network exceptions or fetch drops don't freeze app features
    console.log('Background broadcast cache sync checked out.')
  }
})

const dismissAlert = () => {
  if (announcementId.value) {
    // Record dismiss action state context markers
    localStorage.setItem('viorp_dismissed_announcement_id', String(announcementId.value))
    showAnnouncement.value = false
  }
}
</script>

<style scoped>
.announcement-root-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  background-color: #1a1a1a; /* Sleek, high-contrast dark visual anchor theme */
  color: #ffffff;
  padding: 14px 24px;
  z-index: 99999; /* Higher priority execution layer overlay than all sub elements */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid #007bff;
}
.announcement-content-box {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 90%;
}
.mega-horn-icon { font-size: 20px; }
.text-block { display: flex; flex-direction: column; text-align: left; }
.headline { font-size: 14px; color: #007bff; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
.body-copy { font-size: 13px; margin: 2px 0 0 0; color: #e0e0e0; line-height: 1.4; }
.close-action-button {
  background: transparent;
  color: #aaaaaa;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}
.close-action-button:hover { color: #ffffff; }

/* Dynamic layout interface animations transitions setup */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

