implement this instruction:

Admin or manager can revoke a verification badge already approved to a user, in this case the request verification returns to user profile for user to apply again.

There is duplications
 of  edit profile  from feed.vue sidebar , when a profile is visited every action can be done there . Every edit profile will done under edit on profile. Unify let there single source, which is visit profile then edit from there . So unify and remove edit profile from sidebar , the tab and should be ad manager on feed.vue

- on chat message and group chat whenever theme and background are called for , the wallpaper should be there on the list to choose too .
- the profile photo set for group chat should display during chat, 
- from my admin dashboard I can see that there are total of 900 pew in wallets : my question as the super admin is are these accounts and wallets usable? all pew created not from the add fund payment gateway methods should be sent back to super admin user balance after work or testing, only amount needed for testing not above 50pew should be left. apply security concern to this as pew is a value that can be withdrawn to cash. security please.
- make sure the verification badge now display alongside user - profile name on chat message list table and across app, check the create group icon on chat message, I don't want 2 different icon doing the same work.

- apply 2factor Auth system like  (Time-Based One-Time Password) Authenticator Apps (like Google    on login for any user that sets it on on settings. Note: it's only for users that set it on on settings)
Step 1: Database Schema Modifications

You need to add three fields to your database users table to track the 2FA state:
• two_factor_secret: String (Encrypted). Stores the unique cryptographic key for the user.
• two_factor_enabled: Boolean (Defaults to false). Ensures 2FA doesn't block them until registration is fully confirmed.
• two_factor_recovery_codes: JSON Array (Hashed strings). Backup codes in case they lose their phone.

Step 2: The Setup Phase (Inside App Settings > Security)

When a logged-in user decides to toggle on 2FA, your app must execute this exact confirmation handshake. Never enable 2FA without making the user verify a test code first, or they might lock themselves out with a broken configuration.
[User clicks "Enable 2FA"] ──> Nuxt API generates secret string & QR Link
                                                   │
                                                   ▼
User types code from Google Auth <── App displays QR Code / Manual Key
                                                   │
                                                   ▼
[Nuxt API verifies code] ──> Sets `

The Backend Setup Endpoint (Nuxt Nitro Route)

Use a standard, lightweight library like otplib or speakeasy on your Node server: 
Step 3: The Intercept Phase (On Login)

Now that the user has it enabled, your standard username/password login process changes from a single step to a two-step checkpoint.

[User Submits User/Pass] ──> [Backend: Password Correct?]
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
    [two_factor_enabled is false]             [two_factor_enabled is true]
                 │                                         │
                 ▼                                         ▼
   Issue Full JWT / Login Session            Issue Restricted Temporary Token
                                                           │
                                                           ▼
                                            App displays 2FA Input Screen


 The Updated Login API Route

When a user attempts a normal login, modify your response payload:// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(user.password, password))) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' });
  }

  // CHECK 2FA STATE
  if (user.two_factor_enabled) {
    // Generate a temporary token that is ONLY allowed to access the 2FA verification route.
    // Do not issue the final session cookie or full application JWT yet.
    const tempToken = generateTemporary2faToken(user.id); 
    
    return {
      status: 'REQUIRES_2FA',
      tempToken
    };
  }

  // Normal login flow if 2FA is off
  const sessionToken = issueFullSession(user);
  return { status: 'SUCCESS', sessionToken };
});


The Nuxt UI Route Guard

In your Nuxt/Capacitor application code, capture that status code: // composables/useAuth.ts
const login = async (email, password) => {
  const res = await $fetch('/api/auth/login', { method: 'POST', body: { email, password } });
  
  if (res.status === 'REQUIRES_2FA') {
    // Save the temporary token in memory/state
    temp2faToken.value = res.tempToken;
    
    // Redirect them to the 2FA check step screen
    return navigateTo('/login/verify-2fa');
  }
  
  // Proceed with normal login...
}


3. The Final Verification Route

On the /login/verify-2fa screen, the user enters the current 6 digits from their app. Your application submits both the tempToken and the 6-digit code: // server/api/auth/2fa/authenticate.post.ts
import { authenticator } from 'otplib';

export default defineEventHandler(async (event) => {
  const { code, tempToken } = await readBody(event);
  
  // 1. Verify the temporary token belongs to a real pending user login
  const userId = verifyTemporary2faToken(tempToken);
  const user = await db.user.findUnique({ where: { id: userId } });

  // 2. Validate the 6-digit code against their stored master secret
  const isValid = authenticator.verify({
    token: code,
    secret: user.two_factor_secret
  });

  if (!isValid) {
    throw createError({ statusCode: 400, message: 'Invalid authentication code' });
  }

  // 3. Clear the temporary token and log them in completely!
  const finalSessionToken = issueFullSession(user);
  return { status: 'SUCCESS', sessionToken: finalSessionToken };
});


- there is improper CSS flex/overflow management, heavy unoptimized local asset storage, and a breaking state management loop in this project :chat box spacing inconsistent, my frontend page loading slow, chat message feature loading is slow, sometimes when on feature doing something app sends off to sign in again, audio/video call on chat message now slow to connect or cut off immediately connected , there is inconsistency or persistent issue
      (check for Dom-element bloat and unoptimized message rendering,virtual scrolling,Optimize v-for keys,Lazy-load media components,• Separate your network timeout logic from your auth routing guard logic. A slow or broken connection should trigger an offline banner notification, not an automatic routing dispatch to your /login screen.
• Update your Axios/Fetch interceptor to retry token refreshing at least twice during high-latency network drops before forcing a hard sign-out.• Increase signaling connection timeout thresholds: Modify your WebRTC connection configurations to expand the connection handshake window up to 15-20 seconds during poor network states.
• Force TURN servers: When networks are heavily restricted or weak, standard peer-to-peer (STUN) direct routing fails entirely. Ensure your WebRTC implementation is properly fallback-routing calls through a dedicated, geographically close TURN relay server to stabilize transmission.
   
- the chat message chat typing box is very good on desktop but not on mobile , even the create group design and styling isn't very good so you look at this code to improve the design

 <template>
  <div class="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-white h-[100dvh] w-full overflow-hidden">
    
    <!-- HEADER BAR PANEL -->
    <header class="flex items-center justify-between p-4 border-b border-slate-800 bg-[#111b21]">
      <div class="flex flex-col">
        <h3 class="text-lg font-bold text-slate-100">New group</h3>
        <!-- Dynamic Selected Counter Token Chip Badge -->
        <div v-if="selectedContacts.length > 0" class="flex flex-wrap gap-1 mt-2">
          <span 
            v-for="name in selectedContacts" 
            :key="name"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30"
          >
            {{ name }}
            <button @click="toggleContact(name)" class="hover:text-blue-200 focus:outline-none">✕</button>
          </span>
        </div>
      </div>
      <button class="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </header>

    <!-- FORM INPUT FILTER REGION -->
    <section class="p-4 space-y-3 bg-[#111b21]/50 border-b border-slate-800/60">
      <div class="flex items-center gap-3 bg-[#202c33] rounded-xl px-3 py-2.5 border border-slate-700/40">
        <div class="p-2 bg-slate-700/50 rounded-lg text-slate-300 cursor-pointer hover:bg-slate-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <input 
          type="text" 
          placeholder="Group name" 
          class="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
        />
      </div>
      <input 
        type="text" 
        placeholder="Search your contacts and pals" 
        class="w-full bg-[#202c33] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/40 focus:outline-none focus:border-blue-500"
      />
    </section>

    <!-- CONTENT ITERATION LIST (SCROLLABLE) -->
    <main class="flex-1 overflow-y-auto divide-y divide-slate-800/40 px-2">
      <div 
        v-for="user in contacts" 
        :key="user.username"
        @click="toggleContact(user.name)"
        class="flex items-center justify-between p-3.5 my-1 hover:bg-[#202c33]/50 rounded-xl cursor-pointer transition-colors duration-150"
      >
        <!-- LEFT: User Meta Info Block -->
        <div class="flex items-center gap-3">
          <img :src="user.avatar" class="w-11 h-11 rounded-full object-cover border border-slate-700/50 bg-slate-800" alt="Avatar"/>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-200">{{ user.name }}</span>
            <span class="text-xs text-slate-500 mt-0.5">{{ user.username }}</span>
          </div>
        </div>

        <!-- RIGHT: Custom Fixed Checkbox (Corrected & Refined) -->
        <div class="flex items-center pr-1">
          <div 
            class="w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center"
            :class="selectedContacts.includes(user.name) 
              ? 'bg-blue-600 border-blue-600 scale-105' 
              : 'border-slate-500 bg-transparent'"
          >
            <svg 
              v-if="selectedContacts.includes(user.name)" 
              class="w-3.5 h-3.5 text-white stroke-[3.5]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
    </main>

    <!-- ACTIONS FOOTER BOX PANEL -->
    <footer class="p-4 bg-[#111b21] border-t border-slate-800 flex items-center justify-end gap-3 pb-[calc(1rem+safe-area-inset-bottom)]">
      <button class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all">
        Cancel
      </button>
      <button 
        :disabled="selectedContacts.length === 0"
        class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-blue-600/10"
      >
        Create ({{ selectedContacts.length }})
      </button>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedContacts = ref(['kehinde'])

const contacts = ref([
  { name: "Zikorah Evan's", username: "@cyprianblessing", avatar: "https://unsplash.com" },
  { name: 'Frank', username: '@ikpatfrank', avatar: "https://unsplash.com" },
  { name: 'kehinde', username: '@kehinde', avatar: "https://unsplash.com" },
  { name: 'favyt', username: '@favyt', avatar: "https://unsplash.com" },
  { name: 'Daniel Augustine', username: '@danaugust', avatar: "https://unsplash.com" }
])

const toggleContact = (name) => {
  if (selectedContacts.value.includes(name)) {
    selectedContacts.value = selectedContacts.value.filter(item => item !== name)
  } else {
    selectedContacts.value.push(name)
  }
}
</script> . • Checkbox Relocation: The custom checkbox node is now positioned on the far right within an explicitly managed flex justification flow (justify-between), cleanly balancing out user names and avatars.
• Aesthetic Check Indicator: Replaced the unstyled native browser target component blocks with an scalable, customizable SVG check badge wrapper that changes borders instantly using reactive active states (:class).
• Eliminated Mobile Clipping Bugs: Added pb-[calc(1rem+safe-area-inset-bottom)] directly onto the bottom sticky layout container element, forcing the browser to maintain clean safety padding clearances around modern smartphone hardware gesture sliders.
Now apply a matching CSS animation snippet to make the checkbox transition smoother.

 - Some tab from feed.vue should not  be visible to users and manager accounts but  only admin, since it's still in development. Tabs like : p2p trading, escrow , match , universe chat, support agent. Apply this immediately. very important and critical apply now: the statues feature isnt working good, the create statutes page and system seems broken , make the statuses feature/ post work.


- the chat message is not delivering in order when sent offline and later came online.

Generate Local Microsecond Timestamps (Client-Side)
Do not wait for the server to assign a timestamp or an ID when a user is offline. Generate a microsecond-precise ISO string or Unix timestamp the exact millisecond the user hits "Send" on their device.
javascript
// Do this immediately on the sender's device when offline:
const offlineMessagePayload = {
  clientMsgId: `msg_${Math.random().toString(36).substr(2, 9)}`, // Temporary unique tracking ID
  senderId: "user_A",
  receiverId: "user_B",
  text: "Message 1 sent offline",
  // Use performance.now() or microsecond date strings to guarantee a unique order sequence
  localTimestamp: new Date().toISOString() // e.g., "2026-10-22T01:53:10.123Z"
};


Queue and Sync Sequentially (FIFO Queue)

Instead of sending all 6 messages to your API in parallel via multiple independent fetch requests when the phone goes back online, force the app to use a First-In, First-Out (FIFO) sync queue. Send Message 1, wait for the server acknowledgment, then send Message 2.

3. Enforce Mandatory Frontend UI Sorting

Never trust the raw order array returned by a network connection pulse or database sync payload. On the frontend UI layout layer, always run a .sort() function against the explicit localTimestamp key right before passing the message array to your view iterator loop:
javascript
// Force the UI array layout container to order itself cleanly by creation timestamp
const arrangedMessages = computed(() => {
  return rawChatMessages.value.slice().sort((a, b) => {
    return new Date(a.localTimestamp) - new Date(b.localTimestamp);
  });
});

 create and apply the p2p instructions now and immediately:
- Now the features update: 1. P2P:  on p2p option add fund add all currency option in the world no country exception with rates linked to USD. 1pew = 1usd. Min deposit is 5 pew on using p2p . Add p2p option too on withdrawal method ,  The admin admin can assign / revoke any user a seller privedges

The seller p2p page setting involves setting name to be displayed, small box to be filled  instruction notes for buyer , payment method:  currency list all currency of country with no exception . app rate , sell margin or fee or limits applied .   Now the seller can create max 30 currency different bank or payment method. 

What happens is that when add fund request is made the currency and amount are matched, and all matching sellers are listed for choosing, after seeing their rates limits and margin etc( read the seller note or any app t&C's )

If seller chosen, next

To be displayed to buyer are note, bank details for payment.

Buyer is advised to click I'm paying tab so that the amount is locked in escrow while payment continue. 45 mins is allowed for payment , buyer then proceed to pay and if done, clicks paid tab this trigger check payment tab for seller, if confirmed seller clicks confirm and  another yes I confirm. Immediately the pew is released to buyer . 

Apply similar system apply  to withdrawal too. But withdrawal of pew using P2P, first apply withdrawal fee to the pew amount to be withdrawn or traded then apply the system used on add fund. ( Apply my template yet apply best  security, or best p2p  practices)
Once 45 mins time for payment elapse dispute tabs displays on both seller and buyer who can initiate dispute but if both click same micro second the buyer is chosen. once dispute button is clicked agent/ support joins the chat read aspo.md and apply the best , the support who  then consider the case by collecting evidence and decide the out come either by  releasing fund if it he has admin privileges to  or escalate to admin who has the role ( note   on control create or improve P2P or escrow dispute resolution decider role this role can be assigned to any user by super admin , they decide and release or cancel disputed trade in p2p or escow , their decision is final. nevertheless wWhile settlement is ongoing the buyer or seller in position to confirm and release can confirm and release and close the dispute if not admin will decide and release or cancel trade. there is no timeframe for admin decision.


- some settings in chat message should be moved or copied to app  profile page on settings and applied globally and functional where example the general setting app appearance, status privacy ,

- there are  issue across this project: This is a classic mobile layout breakdown caused by a flex conflict between unconstrained text columns and hardcoded button containers.
On a desktop screen, there is plenty of horizontal space for long bios. But on mobile, the text for users like tocos runs out of space, forcing the browser to wrap each individual word into a vertical staircase while overlapping the layout's buttons.
To fix this globally across your entire app, you need to implement The Standard Three-Layer Row Rule. 
The Standard Global Solution (Tailwind CSS)

Every responsive user-list row in a production platform should explicitly use this structural hierarchy: <!-- THE GLOBAL ROW CONTAINER -->
<div class="flex items-center justify-between w-full p-4 bg-[#111b21] rounded-xl gap-3">
  
  <!-- LAYER 1 & 2: AVATAR + TEXT WRAPPER (Must have min-w-0 to prevent text blowout) -->
  <div class="flex items-center gap-3 min-w-0 flex-1">
    
    <!-- LAYER 1: AVATAR (Must have a fixed width and flex-shrink-0) -->
    <div class="relative flex-shrink-0">
      <img src="/avatar.jpg" class="w-11 h-11 rounded-full object-cover" alt="User avatar" />
    </div>

    <!-- LAYER 2: TEXT BLOCK (Must have min-w-0 to allow truncation or proper wrapping) -->
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-1.5">
        <h4 class="font-semibold text-sm text-slate-100 truncate">tocos</h4>
        <span class="text-blue-500 flex-shrink-0"><!-- Blue Check SVG --></span>
      </div>
      <p class="text-xs text-slate-400 truncate">@tocos</p>
      
      <!-- BIO TEXT: Pick Option A or Option B below depending on your preference -->
      <p class="text-xs text-slate-500 mt-1 break-words line-clamp-2">
        Anthony Chinedu Ohaegbu is a digital content creator and multimedia editor specializing in sports media...
      </p>
    </div>

  </div>

  <!-- LAYER 3: ACTION BUTTONS (Must have flex-shrink-0 so text cannot compress them) -->
  <div class="flex items-center gap-2 flex-shrink-0 unique-action-buttons">
    <button class="px-3 py-1.5 bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg hover:bg-slate-700">
      Message
    </button>
    <button class="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
      Remove
    </button>
    <button class="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400">
      Block
    </button>
  </div>

</div>

The 3 Critical Classes That Fix the Bug

To prevent this layout regression from happening anywhere else on viorp.com, your global styling must include these three behaviors:

1. Add min-w-0 to the Text Wrapper Parent

By default, flex items try to fit their content and refuse to shrink smaller than the longest unbroken word or element inside them (min-content). Adding min-w-0 forces the flex child container to allow itself to be compressed by the boundaries of the mobile viewport screen.

2. Add flex-shrink-0 to Avatars and Action Buttons

This tells the browser: "No matter how long the user's name or biography is.

 
I see exactly what is causing these design and layout regressions on your mobile views. When porting layouts from desktop down to mobile viewports, default CSS flexing, rigid height limits, and oversized element components often break standard UI patterns.
Here is a direct teardown of the bugs shown in your screenshots and how to resolve them cleanly in your codebase.
Issue 1: Chat Typing Box Scaling & Viewport Collision
In your second image (://viorp.com), the browser's top URL bar and the native mobile keyboard shifting have caused your custom chat background cake image to clip down incorrectly, while pushing parts of the input block out of alignment.
🛠️ The Fix: Dynamic Viewport Units (dvh)
Desktop views rely heavily on height: 100vh; for full-screen chats. On mobile, standard vh doesn't account for the browser address bar or virtual keyboards, which squishes and overflows components.
Update your main layout wrapper to use Dynamic Viewport Height (dvh), and make sure your input section doesn't have a hardcoded bottom margin.
Tailwind CSS CSS Fix:
html
<!-- Main Chat Screen Wrapper -->
<div class="h-[100dvh] w-full flex flex-col justify-between overflow-hidden">
  
  <!-- Chat Messages Container Area -->
  <div class="flex-1 overflow-y-auto style-scrollbar">
    <!-- Messages & Custom Wallpaper go here -->
  </div>

  <!-- Message Input Bar Sticky Footer -->
  <div class="w-full p-3 bg-[#1e293b] border-t border-slate-700 pb-[safe-area-inset-bottom]">
    <div class="flex items-center gap-2 bg-[#0f172a] rounded-xl px-3 py-2">
      <!-- Emoji, Input box, Attach, Mic -->
    </div>
  </div>
</div>

Issue 2: Oversized Contact Selection Boxes & Bad Checkbox Contrast
In your third and fourth images, the checkbox blocks are massive unstyled white squares that completely disrupt the visual hierarchy. Furthermore, the bottom footer block carrying the actions (Cancel and Create) looks cramped with accidental page-bottom clipping.
🛠️ The Fix: Component Refactoring
The unstyled squares are likely coming from browser-native <input type="checkbox"> elements stretching out inside a flex grid container that lacks strict size boundaries.
Change those large white container boxes to fixed-size rounded badges using specialized checkbox elements or conditional utility styling:
html
<!-- Individual Contact Row -->
<div class="flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg">
  
  <div class="flex items-center gap-3">
    <!-- Checkbox Control (Left side) -->
    <label class="relative flex items-center cursor-pointer">
      <input type="checkbox" class="sr-only peer" />
      <!-- Custom visual check square -->
      <div class="w-5 h-5 border-2 border-slate-400 rounded transition-all 
                  peer-checked:bg-blue-600 peer-checked:border-blue-600 
                  flex items-center justify-center text-white text-xs">
        <svg v-if="checked" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
    </label>

    <!-- User Profile Avatar Image -->
    <img src="/avatar.jpg" class="w-10 h-10 rounded-full object-cover" alt="User profile" />

    <!-- User Information Content Block -->
    <div>
      <h4 class="text-sm font-semibold text-white">kehinde</h4>
      <p class="text-xs text-slate-400">@kehinde</p>
    </div>
  </div>

</div>
Use code with caution.
Fixing the Action Footer ("Cancel" / "Create")
The button drawer container at the bottom should have explicit padding offsets to avoid sinking beneath native mobile navigation gesture bars.
html
<!-- Footer Action Panel Overlay Box -->
<div class="w-full flex items-center justify-end gap-3 p-4 bg-[#1e293b] border-t border-slate-800 safe-bottom">
  <button class="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium">
    Cancel
  </button>
  <button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
    Create (1)
  </button>
</div>


- a fix continuation of the chat message crate group.... during create group proces
Moving the checkbox of list of users to be added to the right aligns perfectly with modern mobile design conventions (like WhatsApp, Telegram, and iOS lists), making it much easier for right-handed users to tap efficiently with their thumbs.
Here is the fully refactored, production-ready frontend code designed specifically to resolve your layout issues on mobile viewports.
🛠️ The Complete Refactored Nuxt Component Layout
This structure moves the checkboxes to the right side, replaces the large white boxes with smooth custom checkmarks, ensures clean text spacing, and adds safe-bottom paddings to stop the action buttons from getting clipped by mobile phone navigation keys.
html
<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-white h-[100dvh] w-full overflow-hidden">
    
    <!-- HEADER BAR PANEL -->
    <header class="flex items-center justify-between p-4 border-b border-slate-800 bg-[#111b21]">
      <div class="flex flex-col">
        <h3 class="text-lg font-bold text-slate-100">New group</h3>
        <!-- Dynamic Selected Counter Token Chip Badge -->
        <div v-if="selectedContacts.length > 0" class="flex flex-wrap gap-1 mt-2">
          <span 
            v-for="name in selectedContacts" 
            :key="name"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30"
          >
            {{ name }}
            <button @click="toggleContact(name)" class="hover:text-blue-200 focus:outline-none">✕</button>
          </span>
        </div>
      </div>
      <button class="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </header>

    <!-- FORM INPUT FILTER REGION -->
    <section class="p-4 space-y-3 bg-[#111b21]/50 border-b border-slate-800/60">
      <div class="flex items-center gap-3 bg-[#202c33] rounded-xl px-3 py-2.5 border border-slate-700/40">
        <div class="p-2 bg-slate-700/50 rounded-lg text-slate-300 cursor-pointer hover:bg-slate-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <input 
          type="text" 
          placeholder="Group name" 
          class="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
        />
      </div>
      <input 
        type="text" 
        placeholder="Search your contacts and pals" 
        class="w-full bg-[#202c33] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/40 focus:outline-none focus:border-blue-500"
      />
    </section>

    <!-- CONTENT ITERATION LIST (SCROLLABLE) -->
    <main class="flex-1 overflow-y-auto divide-y divide-slate-800/40 px-2">
      <div 
        v-for="user in contacts" 
        :key="user.username"
        @click="toggleContact(user.name)"
        class="flex items-center justify-between p-3.5 my-1 hover:bg-[#202c33]/50 rounded-xl cursor-pointer transition-colors duration-150"
      >
        <!-- LEFT: User Meta Info Block -->
        <div class="flex items-center gap-3">
          <img :src="user.avatar" class="w-11 h-11 rounded-full object-cover border border-slate-700/50 bg-slate-800" alt="Avatar"/>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-200">{{ user.name }}</span>
            <span class="text-xs text-slate-500 mt-0.5">{{ user.username }}</span>
          </div>
        </div>

        <!-- RIGHT: Custom Fixed Checkbox (Corrected & Refined) -->
        <div class="flex items-center pr-1">
          <div 
            class="w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center"
            :class="selectedContacts.includes(user.name) 
              ? 'bg-blue-600 border-blue-600 scale-105' 
              : 'border-slate-500 bg-transparent'"
          >
            <svg 
              v-if="selectedContacts.includes(user.name)" 
              class="w-3.5 h-3.5 text-white stroke-[3.5]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
    </main>

    <!-- ACTIONS FOOTER BOX PANEL -->
    <footer class="p-4 bg-[#111b21] border-t border-slate-800 flex items-center justify-end gap-3 pb-[calc(1rem+safe-area-inset-bottom)]">
      <button class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all">
        Cancel
      </button>
      <button 
        :disabled="selectedContacts.length === 0"
        class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-blue-600/10"
      >
        Create ({{ selectedContacts.length }})
      </button>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedContacts = ref(['kehinde'])

const contacts = ref([
  { name: "Zikorah Evan's", username: "@cyprianblessing", avatar: "https://unsplash.com" },
  { name: 'Frank', username: '@ikpatfrank', avatar: "https://unsplash.com" },
  { name: 'kehinde', username: '@kehinde', avatar: "https://unsplash.com" },
  { name: 'favyt', username: '@favyt', avatar: "https://unsplash.com" },
  { name: 'Daniel Augustine', username: '@danaugust', avatar: "https://unsplash.com" }
])

const toggleContact = (name) => {
  if (selectedContacts.value.includes(name)) {
    selectedContacts.value = selectedContacts.value.filter(item => item !== name)
  } else {
    selectedContacts.value.push(name)
  }
}
</script>
Use code with caution.
What Changed To Fix Your Visual Regressions?
Checkbox Relocation: The custom checkbox node is now positioned on the far right within an explicitly managed flex justification flow (justify-between), cleanly balancing out user names and avatars.
Aesthetic Check Indicator: Replaced the unstyled native browser target component blocks with an scalable, customizable SVG check badge wrapper that changes borders instantly using reactive active states (:class).
Eliminated Mobile Clipping Bugs: Added pb-[calc(1rem+safe-area-inset-bottom)] directly onto the bottom sticky layout container element, forcing the browser to maintain clean safety padding clearances around modern smartphone hardware gesture sliders.
Would you like me to supply a matching CSS animation snippet to make the checkbox transition smoother when clicked, or do you want to implement the layout script directly into your page view first?




This is a classic mobile layout breakdown caused by a flex conflict between unconstrained text columns and hardcoded button containers.
On a desktop screen, there is plenty of horizontal space for long bios. But on mobile, the text for users like tocos runs out of space, forcing the browser to wrap each individual word into a vertical staircase while overlapping the layout's buttons.
To fix this globally across your entire app, you need to implement The Standard Three-Layer Row Rule.
🧱 The Standard Global Solution (Tailwind CSS)
Every responsive user-list row in a production platform should explicitly use this structural hierarchy:
html
<!-- THE GLOBAL ROW CONTAINER -->
<div class="flex items-center justify-between w-full p-4 bg-[#111b21] rounded-xl gap-3">
  
  <!-- LAYER 1 & 2: AVATAR + TEXT WRAPPER (Must have min-w-0 to prevent text blowout) -->
  <div class="flex items-center gap-3 min-w-0 flex-1">
    
    <!-- LAYER 1: AVATAR (Must have a fixed width and flex-shrink-0) -->
    <div class="relative flex-shrink-0">
      <img src="/avatar.jpg" class="w-11 h-11 rounded-full object-cover" alt="User avatar" />
    </div>

    <!-- LAYER 2: TEXT BLOCK (Must have min-w-0 to allow truncation or proper wrapping) -->
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-1.5">
        <h4 class="font-semibold text-sm text-slate-100 truncate">tocos</h4>
        <span class="text-blue-500 flex-shrink-0"><!-- Blue Check SVG --></span>
      </div>
      <p class="text-xs text-slate-400 truncate">@tocos</p>
      
      <!-- BIO TEXT: Pick Option A or Option B below depending on your preference -->
      <p class="text-xs text-slate-500 mt-1 break-words line-clamp-2">
        Anthony Chinedu Ohaegbu is a digital content creator and multimedia editor specializing in sports media...
      </p>
    </div>

  </div>

  <!-- LAYER 3: ACTION BUTTONS (Must have flex-shrink-0 so text cannot compress them) -->
  <div class="flex items-center gap-2 flex-shrink-0 unique-action-buttons">
    <button class="px-3 py-1.5 bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg hover:bg-slate-700">
      Message
    </button>
    <button class="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
      Remove
    </button>
    <button class="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400">
      Block
    </button>
  </div>

</div>
  
🔑 The 3 Critical Classes That Fix the Bug
To prevent this layout regression from happening anywhere else on viorp.com, your global styling must include these three behaviors:
1. Add min-w-0 to the Text Wrapper Parent
By default, flex items try to fit their content and refuse to shrink smaller than the longest unbroken word or element inside them (min-content). Adding min-w-0 forces the flex child container to allow itself to be compressed by the boundaries of the mobile viewport screen.
2. Add flex-shrink-0 to Avatars and Action Buttons
This tells the browser: "No matter how long the user's name or biography is, you are never allowed to shrink, squeeze, or break the width layout of the buttons or profile pictures."
3. Control Long Bios (Truncate vs. Wrap)
You have two architectural options for handling long text sections on mobile screens:
Option A: Clean Multi-line Wrap (Recommended for Bios). Use the Tailwind CSS class line-clamp-2 alongside break-words. This naturally wraps the text cleanly but cuts it off with an automatic ellipsis (...) after 2 lines, keeping all row heights beautifully consistent.
Option B: Strict Single-line Cutoff (Recommended for Names/Usernames). Use the Tailwind CSS class truncate. This keeps the text locked perfectly to a single line and ends it with a clean ellipsis when it runs out of pixel space.

- On verification badge super admin can search up any username be it profile or page, choose the type of badge and award it to the user even without user application/request. Super admin can revoke it too. Only super admin can do this .
- Add this verification badge request T&C's . Don't forget to add the verification badge fees to admin settings as admin can change it anytime.

Here is the full Verified Badge T&C page with wallet balance check + fees for each class.

Save as `pages/verification/terms.vue` or `pages/verify/terms.vue`
<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <div class="max-w-4xl mx-auto px-6 py-12">

      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-600/30 text-[12px] text-violet-300 mb-4">
          <span class="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span> VERIFICATION PROGRAM
        </div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Verified Badge - Terms & Application Requirements</h1>
        <p class="mt-4 text-zinc-400 text-[15px] leading-relaxed">
          Requesting an official VIORP Verified Badge signifies authenticity, trust, and ecosystem compliance. Please read these Terms carefully before submitting your application. All fees are deducted from your in-app wallet.
        </p>
      </div>

      <!-- Wallet Requirement - Critical -->
      <section class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 mb-8">
        <h2 class="flex items-center gap-2 text-[15px] font-bold text-amber-300 mb-3">
          ⚠️ Mandatory Wallet Balance Requirement
        </h2>
        <p class="text-[14px] leading-relaxed text-zinc-300">
          To be eligible to submit a Verified Badge request, your wallet balance must contain <span class="font-bold text-white">the full required fee amount for your selected Class & Tier</span> at the time of application.
          <br><br>
          <span class="text-amber-200/80">- System will auto-check your PEW balance before allowing submission.</span><br>
          <span class="text-amber-200/80">- If balance is insufficient, your request button will remain locked.</span><br>
          <span class="text-amber-200/80">- Fees are held in escrow and deducted only upon Admin review initiation. Failed/rejected applications are non-refundable.</span>
        </p>
      </section>

      <!-- Badge Classes & Fees -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 mb-8">
        <h2 class="text-lg font-semibold mb-6">Badge Classes & Fee Structure (in PEW)</h2>

        <div class="grid gap-4">

          <!-- 1 -->
          <div class="rounded-xl border border-zinc-800 bg-[#111] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex gap-4 items-start">
              <img src="/assets/badges/personal_orbit_verified_128.png" class="w-12 h-12" />
              <div>
                <h3 class="font-semibold text-[15px]">1. Personal Profile</h3>
                <p class="text-[13px] text-zinc-400 mt-1 max-w-md">For individual users, creators, and public personalities on their personal account. Purple orbit.</p>
                <p class="text-[11px] text-zinc-500 mt-2">Includes: ID KYC + Liveness + 1 Year Validity</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold">25 PEW</div>
              <div class="text-[11px] text-zinc-500">Non-refundable</div>
            </div>
          </div>

          <!-- 2 -->
          <div class="rounded-xl border border-zinc-800 bg-[#111] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex gap-4 items-start">
              <img src="/assets/badges/personal_orbit_verified_128.png" class="w-12 h-12" />
              <div>
                <h3 class="font-semibold text-[15px]">2. Personal Page</h3>
                <p class="text-[13px] text-zinc-400 mt-1 max-w-md">For fan pages, creator pages, artist pages managed by a verified personal profile.</p>
                <p class="text-[11px] text-zinc-500 mt-2">Requires: Owner must already hold Personal Profile badge</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold">60 PEW</div>
              <div class="text-[11px] text-zinc-500">Per Page / Year</div>
            </div>
          </div>

          <!-- 3 -->
          <div class="rounded-xl border border-amber-500/20 bg-[#151201] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex gap-4 items-start">
              <img src="/assets/badges/business_orbit_verified_128.png" class="w-12 h-12" />
              <div>
                <h3 class="font-semibold text-[15px]">3. Business / Corporate Page</h3>
                <p class="text-[13px] text-zinc-400 mt-1 max-w-md">For registered businesses, brands, startups, companies. CAC / Business registration required.</p>
                <p class="text-[11px] text-zinc-500 mt-2">Includes: Business KYC + Domain Verification</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-amber-300">150 PEW</div>
              <div class="text-[11px] text-zinc-500">Per Entity / Year</div>
            </div>
          </div>

          <!-- 4 -->
          <div class="rounded-xl border border-emerald-500/20 bg-[#051410] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex gap-4 items-start">
              <img src="/assets/badges/government_orbit_verified_128.png" class="w-12 h-12" />
              <div>
                <h3 class="font-semibold text-[15px]">4. Government Page</h3>
                <p class="text-[13px] text-zinc-400 mt-1 max-w-md">For government ministries, agencies, public institutions, elected officials.</p>
                <p class="text-[11px] text-zinc-500 mt-2">Requires: Official Letterhead + .gov Domain + Admin Approval</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-emerald-300">350 PEW</div>
              <div class="text-[11px] text-zinc-500">Per Entity / Year</div>
            </div>
          </div>

        </div>
      </section>

      <!-- Terms -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 mb-8">
        <h2 class="text-lg font-semibold mb-6">Verification Terms & Conditions</h2>
        <ol class="space-y-4 text-[14px] leading-relaxed text-zinc-300 list-decimal list-inside">
          <li><span class="font-semibold text-white">Eligibility & Wallet Lock:</span> Application will not be submitted unless your wallet holds the full fee for your selected class. System validates balance in real-time.</li>
          <li><span class="font-semibold text-white">Non-Refundable Fee:</span> All verification fees are non-refundable, even if your application is rejected, revoked, or voluntarily removed.</li>
          <li><span class="font-semibold text-white">KYC Required:</span> Personal classes require government ID + selfie liveness. Business requires CAC/Business certificate. Government requires official documentation and verifiable domain.</li>
          <li><span class="font-semibold text-white">Authenticity & Uniqueness:</span> Only one verified badge per entity. Impersonation, false documents, or duplicate accounts will result in permanent ban and forfeiture of fees.</li>
          <li><span class="font-semibold text-white">Admin Discretion:</span> The Admin Team reserves absolute right to approve, reject, revoke, or downgrade any badge based on platform safety, compliance, and community standards.</li>
          <li><span class="font-semibold text-white">Badge Validity & Renewal:</span> All badges are valid for 12 months. Renewal requires re-verification and fee payment 30 days before expiry.</li>
          <li><span class="font-semibold text-white">Conduct Clause:</span> Verified accounts must maintain good standing. Violations, fraud, or wallet abuse will lead to badge removal without refund.</li>
          <li><span class="font-semibold text-white">Display Rules:</span> Verified orbit badge must not be edited, cropped, or misrepresented. Only use official assets from `/assets/badges/`.</li>
        </ol>
      </section>

      <!-- Action -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-[13px] text-zinc-400">
          <span class="text-white font-semibold">Current Wallet:</span> -- PEW <span class="text-zinc-600">(Live check on application page)</span>
        </div>
        <button class="px-8 py-4 rounded-xl bg-white text-black font-bold text-[14px] hover:bg-zinc-200 transition">
          Continue to Application →
        </button>
      </div>

      <div class="mt-10 text-center text-[11px] text-zinc-600">
        By continuing, you agree to the Verified Badge T&C and Wallet Deduction Policy.
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Verified Badge - Terms & Fees' })
</script>
*Fee logic I set for you (you can edit numbers):*
Class	Badge	
*Personal Profile	: fee is 4 pew a month or 25 PEW a year 
**Personal Page*: fee is 7 pew a month or 	40 PEW a year 
**Business/ Corporate*: fee= 10 pew a month  and 40 pew a year minimum for ( for mainly SME and sole owner business, for large businesses or corporation it  20 pew monthly and 200 pew yearly)
**Government Page: 350 PEW yearly 
- Wallet check is enforced before request
- Non-refundable, 12 months validity, or monthly 
- Personal Page requires you already own Personal Profile badge though this is encouraged not binding
- Don't forget when admin change rate or fee it should update on verification badge T&C's page too.

  
  -I find out that all implementation on notification isn't yet working, user interaction is notifying users on notification icon count . Activities like successful verification badge, likes, comment, gift(with notification sign in wallet icon)share, download, mention, tagged, post,  yet most importantly when opened the notification should be able to take one to event if clicked.all notification push sound on unless user set it off at setting.

- we are to launch now:
Check all security loope, apply scalability capacity for 1m users.
Checklist:
(privacy policy,terms page, clear CTA,FAQ, robots.txt, sitemap.xml, custom 404 pages,alt text, analytics, meta titles,meta description, social share, favicon, canonical URLs, cookies consent, footer links, compress image,clickable profile photo and email and phone number, mobile versions overflow works?, accessibility, test forms, check for broken links and button and nav , optimise performance. including 
- rate limiting 
- caching and CDN
-load balancing and scaling
-error tracking and logging 
-availability and disaster recovery.
