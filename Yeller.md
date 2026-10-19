this is support feature creation: very important is to match user language on device, or location to support agent language on device, location,or phone code for country, list of language support agent filled he she can work with. if no match default language is English 


1. Structural Architecture: Support vs. Standard Chat.

Never route support messages into a manager’s personal profile inbox. Instead, route customer support inquiries into a centralized Support Ticket Queue. Note user can tripped the support from support,from escrow trade , p2p trade. align all to existing support system. so any admin or manager with support role or privileges can claim a ticket or escalate to higher admin or manager. 


               ┌──────────────────────────────────────┐
               │         USER TRIPPED SUPPORT         │
               └──────────────────┬───────────────────┘
                                  │
                       Creates a New Support ID
                                  │
                                  ▼
               ┌──────────────────────────────────────┐
               │    CENTRALIZED SUPPORT QUEUE PANEL   │
               │ (Database: Open, Pending, Resolved)  │
               └──────────────────┬───────────────────┘
                                  │
                       Rotates load to available
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌──────────────────┐                            ┌──────────────────┐
│  MANAGER ALICE   │                            │  MANAGER BOB     │
│ (Claims Ticket)  │                            │ (Claims Ticket)  │
└──────────────────┘                            └──────────────────┘


2. Standard Practice Role Permissions Matrix

Giving managers full database or application access just to answer text chat queries introduces severe security and privacy risks. You must enforce the Principle of Least Privilege using custom permission scopes

Role Designation	App Live Chat Privilege Level	Dashboard View Restraints
Admin	Full Context Access	Can assign tickets, view conversation quality logs, delete messages, and audit financial transaction data.
Support Manager / Agent	Ticket-Bound Read/Write	Cannot view standard user-to-user chat logs. Can only read and reply to messages inside tickets explicitly assigned to them or left in the unassigned public queue.

3. improve this 

Production Technical Blueprint

To implement a clean, lightweight support routing system using your Nuxt/Vue and relational database stack, apply this secure data structure and frontend allocation system into your project.

A. Database Schema Context Target


Your backend database schema needs to abstract chats using a support_tickets structure:CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,              -- The user asking for help
    assigned_manager_id INT NULL,      -- The specific manager answering
    status VARCHAR(20) DEFAULT 'open', -- open, pending, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES support_tickets(id),
    sender_id INT NOT NULL,            -- Can be user_id or assigned_manager_id
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




B. The Manager’s Live Queue Dashboard UI Component

This component allows users with manager or admin authorization tokens to see incoming inquiries, claim them to prevent duplicate responses, and execute live chat assistance securely.


<!-- components/ManagerSupportQueue.vue -->
<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  managerId: { type: Number, required: true },
  managerRole: { type: String, required: true } // 'admin' or 'manager'
})

const openTickets = ref([])
const activeTicketId = ref(null)
const currentChatLog = ref([])
const replyMessage = ref('')

// 1. Fetch unassigned live tickets from the central queue
const fetchActiveQueue = async () => {
  try {
    const res = await fetch('https://viorp.com', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('viorp_auth_token')}` }
    })
    openTickets.value = await res.json()
  } catch (err) {
    console.error('Failed to sync support grid queue:', err)
  }
}

// 2. Claim an unassigned ticket so no other manager clicks it
const claimSupportTicket = async (ticketId) => {
  try {
    const res = await fetch(`https://viorp.com/${ticketId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('viorp_auth_token')}`
      },
      body: JSON.stringify({ manager_id: props.managerId })
    })
    if (res.ok) {
      activeTicketId.value = ticketId
      loadTicketChatLogs(ticketId)
      fetchActiveQueue()
    }
  } catch (err) {
    console.error('Error securing ticket claim allocation:', err)
  }
}

const loadTicketChatLogs = async (ticketId) => {
  const res = await fetch(`https://viorp.com/${ticketId}/messages`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('viorp_auth_token')}` }
  })
  currentChatLog.value = await res.json()
}

const sendSupportReply = async () => {
  if (!replyMessage.value.trim()) return
  
  try {
    const res = await fetch(`https://viorp.com/${activeTicketId.value}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('viorp_auth_token')}`
      },
      body: JSON.stringify({ sender_id: props.managerId, message: replyMessage.value })
    })
    
    if (res.ok) {
      replyMessage.value = ''
      loadTicketChatLogs(activeTicketId.value)
    }
  } catch (err) {
    console.error('Broadcast message send error:', err)
  }
}

onMounted(() => {
  if (props.managerRole === 'admin' || props.managerRole === 'manager') {
    fetchActiveQueue()
    // Poll the incoming public support loop every 30 seconds for updates
    setInterval(fetchActiveQueue, 30000)
  }
})
</script>

<template>
  <div class="support-dashboard">
    <!-- Sidebar Ticket Allocation Queue List -->
    <div class="ticket-sidebar">
      <h3>📥 Active Support Tickets</h3>
      <div v-for="ticket in openTickets" :key="ticket.id" class="ticket-item-card">
        <p><strong>Ticket #{{ ticket.id }}</strong> (User ID: {{ ticket.user_id }})</p>
        <button v-if="!ticket.assigned_manager_id" @click="claimSupportTicket(ticket.id)" class="claim-btn">
          Claim & Open Chat
        </button>
        <span v-else class="claimed-badge">Assigned to Manager ID: {{ ticket.assigned_manager_id }}</span>
      </div>
    </div>

    <!-- Active Support Live Chat Box Viewport -->
    <div class="chat-workspace">
      <div v-if="activeTicketId" class="chat-window">
        <div class="chat-header">Active Support Session: Ticket #{{ activeTicketId }}</div>
        <div class="message-logs">
          <div 
            v-for="msg in currentChatLog" 
            :key="msg.id" 
            :class="['bubble', msg.sender_id === managerId ? 'manager-right' : 'user-left']"
          >
            {{ msg.message }}
          </div>
        </div>
        <div class="input-action-tray">
          <input v-model="replyMessage" @keyup.enter="sendSupportReply" type="text" placeholder="Type official response..." />
          <button @click="sendSupportReply">Send</button>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Select or claim an active incoming ticket from the left sidebar panel queue to initiate a chat link session.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.support-dashboard { display: flex; height: 500px; background: #222; color: #fff; font-family: sans-serif; border-radius: 8px; overflow: hidden; }
.ticket-sidebar { width: 35%; border-right: 1px solid #333; padding: 16px; overflow-y: auto; background: #1a1a1a; }
.ticket-item-card { background: #2c2c2c; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
.claim-btn { background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 6px; width: 100%; }
.claimed-badge { font-size: 11px; color: #aaa; font-style: italic; display: block; margin-top: 4px; }
.chat-workspace { width: 65%; display: flex; flex-direction: column; background: #121212; }
.empty-state { margin: auto; color: #777; font-size: 14px; text-align: center; padding: 20px; }
.chat-window { display: flex; flex-direction: column; height: 100%; }
.chat-header { background: #1f1f1f; padding: 14px; font-weight: bold; border-bottom: 1px solid #333; }
.message-logs { flex-grow: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.4; }
.manager-right { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
.user-left { background: #2c2c2c; color: #e0e0e0; align-self: flex-start; border-bottom-left-radius: 2px; }
.input-action-tray { display: flex; padding: 12px; background: #1a1a1a; gap: 10px; border-top: 1px solid #333; }
.input-action-tray input { flex-grow: 1; padding: 10px; border: 1px solid #333; background: #2a2a2a; color: white; border-radius: 4px; }
.input-action-tray button { background: #28a745; color: white; border: none; padding: 0 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
</style>



Summary Checklist :

1. Never do profile sharing: Give every manager their own separate dashboard login credentials.
2. Isolate tracking metrics: Storing logs this way allows your admin role profile to see which manager claimed a ticket, how fast they replied, and when a complaint was resolved.
3. Database Guardrail: Enforce server-side authentication checking on the /admin/support/* routes to ensure that only authenticated user rows with roles explicitly matching admin or manager can fetch ticket lists.
build a clean Vue Composable helper file that handles the end-user side of things


// this is end for support feature ☝️. stop . improve it




add this to creating post post system:
Role: Senior Full-Stack .TS, .JS Engineer (Expert in Nuxt , Vue , Capacitor JS, and Media Processing)
Task: Implement a cross-platform "Add Audio Track & Trimmer" feature for media posts (Videos/Photos).

Target Platforms:
1. Native iOS & Android apps (via Capacitor JS wrapper)
2. Web / Progressive Web App (PWA)

Key Requirements:
- Users must be able to choose between a hosted catalog of Royalty-Free tracks( pixabay + Audius) or upload custom audio files directly from their own device.
- The UI must display an interactive, touch-friendly waveform allowing users to select a specific section of the audio track (up to 15 seconds long).
- The final media encoding must be handled efficiently depending on the running platform environment.

Please write the complete code structures following the architecture specified below:

---

### STEP 1: Dependencies Setup
Ensure the solution utilizes these exact tools:
- Frontend Core: Nuxt 3 (Vue 3 Composition API with `<script setup>`).
- Audio Frontend Engine: `wavesurfer.js` (v7+) along with its native `@plugins/regions` package for the trimmer UI.
- Native Native Device Pickers: `@capawesome/capacitor-file-picker` to securely handle local device files on mobile platforms.
- Server/Node.js Layer: `fluent-ffmpeg` to handle server-side rendering for PWA clients.

---

### STEP 2: Unified Frontend Asset Intake Engine
Implement a robust mechanism to convert different input sources into standard URLs readable by WaveSurfer:
1. For Royalty-Free Tracks: Use standard HTTPS CDN URLs.
2. For Web/PWA custom tracks: Utilize standard HTML `<input type="file" accept="audio/*">` and map them via `URL.createObjectURL(file)`.
3. For Native Capacitor (iOS/Android): Intercept selection with the Capawesome FilePicker plugin and convert the native storage URI using `Capacitor.convertFileSrc(nativeFilePath)`.

---

### STEP 3: Vue 3 Audio Trimmer Component (`components/AudioTrimmer.vue`)
Create an optimized Vue component that:
- Receives a `defaultAudioUrl` prop.
- Instantiates a clean WaveSurfer player inside an `onMounted` hook and destroys it safely inside `onBeforeUnmount` to prevent memory leaks.
- Dynamically attaches a visual region overlay restricted to a maximum length of 15 seconds (`maxLength: 15`).
- Hooks into the `audioprocess` event to automatically loop playback back to the region's start marker once it hits the region's end point.
- Listens for region shifts and continuously emits an `onTrimChange` payload back up to the parent view containing: `startTime`, `duration`, and `sourceType` ('royalty-free' vs 'custom-device').

---

### STEP 4: Platform-Aware Encoding Strategy
Implement conditional logic to stitch the video and the selected audio clip together:

- IF RUNNING NATIVELY (`Capacitor.isNativePlatform() === true`):
  Execute a client-side mixing sequence on the device. Provide the logical scaffolding or plugin shell using an FFmpeg native bridge (like `ffmpeg-kit-capacitor`). Include the following FFmpeg filtering command syntax:
  "-i [input_video] -ss [start_time] -t [duration] -i [input_audio] -filter_complex '[0:a]volume=0.3[a1];[1:a]volume=0.8[a2];[a1][a2]amix=inputs=2:duration=first' -c:v copy -c:a aac [output_path]"

- IF RUNNING IN WEB/PWA CLIENT:
  Do not process on the frontend to avoid crashing mobile browsers. Instead, write a parent submission handler that builds a multi-part `FormData` object.
  - If a custom file was uploaded, pack the raw audio file blob.
  - If a royalty-free track was chosen, pack the database string ID.
  - Pack the raw video/photo asset file.
  - Pack JSON variables mapping `audioStartOffset` and `audioDurationBound`.
  - Dispatch this packet to a server endpoint via `$fetch`.

---

### STEP 5: Nuxt 3 Nitro Backend API Endpoint (`server/api/posts/create.post.ts`)
Write a Node.js API route matching Nuxt 3's Nitro standards to handle PWA fallbacks:
- Use `readMultipartFormData(event)` to parse files and parameter fields securely.
- Stream or resolve the audio source path (whether a newly uploaded custom file or fetching the royalty-free mp3 track from your backend bucket).
- Use `fluent-ffmpeg` to merge the streams, mimicking the volume balancing logic from Step 4.
- Output the finalized, production-ready video file back to server storage or your object store.

Please output the code blocks cleanly, write highly readable code with self-explanatory comments, and implement proper error handling for missing files or invalid formats.

Vet and correct where possible.

Apply this :
Apply create pages . on profile my pages create pages , every user max 5 pages can only be created , these pages will be linked to the user profile but can be managed by another user by allowing giving different admin privileges to another user. pages have all profile system and post system features and components  and operated as sub user account so to say. it this the standard practice ? standardise this


You are an expert full-stack engineer and software architect specializing in Nuxt 3, Vue 3, TypeScript, and cross-platform development via Capacitor.js. 

Your task is to implement a robust, standardized "Sub-User Pages" system where users can create up to 5 Pages linked to their profile, delegate admin privileges to other users, and seamlessly switch contexts to operate a page just like a primary user account.

Implement this system across the database, backend API layer, and the Nuxt frontend according to the specifications below.

---

### 1. DATABASE SCHEMA & RBAC RELATIONSHIPS
Implement a Polymorphic Actor Pattern and Role-Based Access Control (RBAC). Do not nest pages inside user models.

- **Users Table**: Standard auth and personal profile data (`id`, `email`, `display_name`, etc.).
- **Pages Table**: Metadata for pages (`id`, `name`, `profile_picture`, `bio`, `created_by_user_id`, `created_at`).
- **Page_Admins Table**: A junction table linking Users to Pages.
  - Attributes: `id`, `user_id`, `page_id`, `role` (Enum).
  - Define roles strictly as: 
    - `OWNER`: Full access, handles page deletion, counts toward creation cap.
    - `MANAGER`: Can edit profile, post content, view metrics, but cannot touch admin settings or delete page.
    - `MODERATOR`: Can only engage with community (reply/delete comments, moderate user posts).
- **Polymorphic Posts Table**: Standardize the posting system so both users and pages share the exact same feed infrastructure.
  - Attributes: `id`, `content`, `created_at`.
  - Polymorphic Keys: `author_id` (UUID) and `author_type` (Enum: 'USER' | 'PAGE').

---

### 2. COMPONENT-DRIVEN REUSABILITY (NUXT/VUE 3)
Because this application runs cross-platform via Capacitor on iOS, Android, PWA, and Web, UI components must be completely agnostic to *who* is using them.

- **Decoupled Components**: Ensure `PostCard.vue`, `CreatePostModal.vue`, `CommentSection.vue`, and `ProfileHeader.vue` take generic `author` configurations. They should not hardcode checks like `user.id`. They should look at the unified signature: `{ id, name, avatar, type }`.
- **Context Switcher UI**: Design a global profile-switching drawer/modal component (`ContextSwitcher.vue`) optimized for mobile touch targets (Capacitor). It should list the user's personal profile alongside the pages they have access to, updating the global state on click.

---

### 3. GLOBAL CONTEXT & STATE MANAGEMENT (PINIA)
Manage the active identity across the entire cross-platform frontend app dynamically.

- Create a `useContextStore` in Pinia.
- State properties must include:
  - `user`: The authenticated primary user object.
  - `activeActor`: An object containing `{ id: string, name: string, avatar: string, type: 'USER' | 'PAGE', role?: string }`.
  - `managedPages`: An array of pages the user has permission to switch into.
- By default on initialization, `activeActor` must mirror the primary `user`.
- Ensure state persistence handles mobile application lifecycles gracefully using a secure local storage strategy compatible with Capacitor (e.g., matching Pinia persistence to Capacitor Preferences or standard web storage safely).

---

### 4. API LAYER & THE "ACTING AS" CONTEXT HEADER
- **Request Interception**: Configure the global fetching client (e.g., Nuxt `useFetch` wrapper or Axios instance) to automatically attach an identity header on every single request: `X-Acting-As-Actor-ID` and `X-Acting-As-Actor-Type`.
- **Backend Validation Middleware**: 
  - Write a strict middleware wrapper for incoming API requests.
  - If `X-Acting-As-Actor-Type` is 'PAGE', the backend must check the `Page_Admins` table to verify if the authenticated `user.id` has a valid role (`OWNER`, `MANAGER`, or `MODERATOR`) for that specific `page_id`. 
  - If unauthorized or missing, fail immediately with a `403 Forbidden` response.

---

### 5. BUSINESS LOGIC & REFINED SAFEGUARDS
Enforce strict boundaries to prevent system abuse:

- **Creation Cap Check**: Write backend validation rule preventing a page creation mutation if `SELECT COUNT(*) FROM Pages WHERE created_by_user_id = :userId` is equal to or greater than 5.
  - *Note*: If a user is invited to manage an external page, that page does NOT count toward their 5-page cap.
- **Orphan & Deletion Guardrails**: 
  - Block primary user account deletion if they are the sole `OWNER` of any pages. 
  - They must either delete the page or transfer the `OWNER` role to another user first.
- **Action Isolation**: Ensure that mutations (like liking a post, creating a post, gifting,or commenting) strictly map the `author_id` and `author_type` to the active context passed in the headers. Action leaks (e.g., posting as a page but appearing as a personal profile) must be architecturally impossible.

---

### OUTPUT EXPECTATIONS
1. Provide highly structured, atomic, and typed clean code (TypeScript).
2. Follow Nuxt 3 best practices (composables for state, server routes for backend handling if utilizing Nuxt server, or clean API service layout).
3. Do not assume or generate incomplete placeholders. Provide the operational code for the schema definitions, state management, interceptor, and validation checks.

On the profile page every user should be able to privately access user settings for this app be it privacy settings, general settings, account settings, profile settings,
Add any other settings 

Show post counts, pal counts

Now check and read  files  on  interests across codebase and  in the app.
The profile page has personal info like marital status, University, work/business, religion/denomination,
Gender.

 The users should be able to provide / list interest on their profile and decide to keep it private or public in settings. 

Note!!!  User should be able to edit , set public off/on, on each of These privacy info or listed interests. E.g University ; edit, off/on 

Allow profile lock on/off only basic info displays 


For editing profile. pages/profile/edit.vue is the true page but if you click  profile photo now it takes you to an edit profile page which displays another  profile page edit. Fix it.

- other users should be able to know if a user is online  (online presence . On profile across app especially on message chat.  also on user settings every user should be on/off their online presence.
On profile page, under the profile  comes posts below so that when someone views a user profile he can keep scrolling down to continue viewing their posts too

for verification badge on profile:
Fix and Implement the verification badge and approval by admin / admin settings or control since this can also be removed or another badge ressigned by admin 

I have uploaded 6 PNG verified badges to repo:

/assets/badges/
- personal_orbit_verified.png (1024)
- business_orbit_verified.png (1024)
- government_orbit_verified.png (1024)
- personal_orbit_verified_128.png (128)
- business_orbit_verified_128.png (128)
- government_orbit_verified_128.png (128)

Create components/VerifiedBadge.tsx

Props:
type: 'personal' | 'business' | 'government'
size?: 16 | 20 | 24 | 32 | 48 | 128 | default 20
className?

Logic:
- if size <= 24, use *_128.png (faster, less memory for feed)
- if size > 24, use *.png 1024
- img must be transparent, no background
- style width/height = size, object-fit contain
- alt="verified ${type}"

Map:
personal -> purple #6D28D9
business -> gold #FFC233  
government -> mint #5EE9B5

Usage: <VerifiedBadge type="personal" size={20} />

I needed all admin /manager control page to be accessed by admin / manager Users

Solution : if  user role is  admin / or manager , then on login/signin to feed.vue ,  let control dashboard tab display at sidebar in feed.vue.

Now this control dashboard tab when clicked now opens page having control of all admin control or manager pages.

Arranged like:
- roles and privileges assignment to manager  
- App fees page setting 
- The  verification  badge application approval and it's  profile assignment ( note this badge is 3 design  corporate, government, individual) the admin choose which and approve ) remember user apply it from their profile page so remember to add the apply tab and system  on the profile page and wire all needed 

- ( please read the files on all admin control and settings to add all.


The admin page have all admin control roles and functionality for this app . Which includes:

Pages for assigning roles to user , assigning privedges and tasks to manager or user 

The fee setting page where admin set all fee across app

The behaviour compliance page where admin or manager apply  restriction app feature like wallet balance , user ban ,time ban, post restrictions, content flaging , chat message and others

The app admin/ manager metrics and analytics reporting page 

The  admin security and notifications  page

The admin page for  verification badge approval for users 



!!! Note: check all admin  related pages  and files mention across this project and get all admin task to create comprehensive admin / manager system control dashboard.

Rewrite the pages/wallet.vue . Just to have the  incoming flow ( deposit, recieved gift , p2p buy,and, monitization, or escrow recieved) and outgoing flow ( sent gift, P2P sell, withdrawal) 

The total pew balance ( displayed in pew ) is 

all incoming/ outgoing flow -+ all fees apart the withdrawable balance.



The fee are set by admin at admin settings but apply these fees now instantly it can be changed by admin later.

On add fund apply 1.2% app processing fee  automatically . On gifting across app apply 5% the gift value automatically.
On  withdrawal apply 37% fee  the pew value + any %  tax if set .  Infact the withdrawal balance should display 37 % the pew gifts gotten in USD.

Note : all pew deposited by add fund methods except P2P method are not qualified for withdrawal , only pew gift from gifting or in app activities like P2P escrow are and applied 37% fee as displayed on withdraw balance. This to avoid money laundering.


total balance as total added fund + total gift balance + incoming ( total any other transactions be it from p2p or escow, etc)

The gift history should show sent and received history .

 transaction history should show  all incoming and outgoing transaction  be it deposit , trade, sent ,or recieved. withdrawal page where user selects if it's bank or crypto fills in details and send for admin approval 

 Fix , delete this terminology to correct words and use cases; transfer ,  transfer mode , Total Income Accumulation, Outbound Expense Sheet , Pending Disbursals. 

So clean up the page and align any other files to fit its use cases. 

Remember to put transaction states ( successful, pending, processing, failed)on history 

Make sure all fix agree and  allign to my database ledger system,  working and secure.

For testing  flutterwave public key:FLWPUBK_TEST-5f088fb4d97e4d82ae8c4024fa3ddc41-X

Secret key : FLWSECK_TEST-d6eeb486d247480a6b1c2813affd4251-X

Encryption key: FLWSECK_TEST635a3dd04b6e

Now apply on add fund for payment gateway integration make it work . Provide me  the live wehbook URL and secret hash to add to flutterwave, then I will provide you live API keys on zeabur env var to rotate this test API keys.  Make this work.
