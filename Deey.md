The online presence is for other users to see when one is online not just for user to see themselves that they are online 

- the admin/ manger control dashboard pages are highly important to control all happen in app.
I can't wait to test the verification badge approval for user or page. Answer this question where do user apply or request for the verification badge from their profile page? Fix that

- the ad system implementation is main the focus of the day . The ad manager: create
Campaign - type: 1. ( promotion / engagement/ Traffic)good for Post engagement like getting likes, comments, gifts, messages, wide user viewing and awareness, action like external link clicks , install . 

2. Leads : for collecting leads, instant forms 
3. Sales: for conversion, catalogue .

Set up for type 1: campaign name, budget amount ( pew balance) categories : A. (demography

;education: level, field. Finance ; income: low , middle,high . Parents : of teens , toddlers , late 40s. Relationship: single, divorced, married. Work ; employee : job title, profession : teacher, doctor .. , others, employer: industry , business etc.

Category B: interest; (activities : sports ,games, fitness & wellness related. Food and drink s: all local and national foods , alcohol, wines, non alcoholic, fruit naturals drinks.
Hobbies: I.T ,  programming, coding , computer, marketing, sales, music, art , travel, cars, luxury 
Shopping & fashion: tech gadgets, luxury wears, local brands , digital gifts.

Category 
C. Behaviours

Targeting based on actual consumer habits, device usage, and purchase intents:
• Anniversary: Users within 61–90 days of an anniversary.
• Consumer Classification: Target markets categorized by their preference for high-value or mid-to-high-value goods in specific countries.
• Digital Beliefs/Activities: Operating system users, console gamers, canvas gaming,  Page admins, or early tech adopters.
• Expats: People who live away .
• Mobile Device User: Users segmented by specific smartphone brands, operating systems, or network• connections (4G/5G/Wi-Fi).
• Purchase Behaviour: "Engaged Shoppers" (users who have clicked "Shop Now" buttons in the past week) note: add viorp in app interactive behaviour .
• Travel: Frequent travelers, international travelers, or commuters.

Special categories with the policy and  T&Cs : Financial Products and Services,Employment,Housing,Social Issues, Elections, or Politics

Campaign details: auction engagement :

Next the Ad set which includes: the ad set name, conversion; where ad engagement should occur? : on your ad get people to interact with post or event , on chat message?, external website link?, or selected viorp page.

Set ad format : single image or video,  carousel.

Next set Schedule ; set business hours for and to run, set min/max spend limit. 
Bid strategy is highest volume and user get charged when impression occurs.

Next preview, then publish .  

.  Create control ad hompage for watching performance,analytics , and editing/updating, deleting, every ad campaign 

Note : I provide this suggested blueprint for as type 1, you should know and provide what is needed if any for ad type 2 and 3 ( sales and leads) .

Now this in app placement is one section, another  section is the in  app allowed fallback logic for external ad placement by services like by Appodeal and  monetag which will be applied immediately . Google Adsense and ad manager will delay the project due to delay in verification or issues/conflict with some of this project features.

Now for the rendering: check my in app logic, pages,  for  post or feed ranking among other considerations

There will be Google ad manager conflict or delay for verification as a new project. So we are to use moneytag + Appodeal pending when Google is available or to be activated from Appodeal.
                  ┌─────────────────────────────────────────┐
                  │       YOUR CAPACITOR JS PROJECT         │
                  └────────────────────┬────────────────────┘
                                       │
                    Is the platform native or web browser?
                                       │
             ┌─────────────────────────┴─────────────────────────┐
             ▼                                                   ▼
     [ NATIVE APP LAYER ]                                [ WEB / PWA LAYER ]
     (Android & iOS Apps)                              (Desktop & Mobile Web)
             │                                                   │
   🏆 Appodeal SDK Integration                        🏆 Monetag Integration
             │                                                   │
  ┌──────────┴──────────┐                             ┌──────────┴──────────┐
  ▼                     ▼                             ▼                     ▼
AppLovin/Bidders     AdMob SDK                     Social Bar            1x On-Click Smartlink
(Mintegral, Unity,   (Fallback layer once          (High-engagement      (Triggered via router
 Liftoff, BidMachine) approved by Google)            In-Page Push)         plugin transitions)

                  
Master Ad Placement Strategy Matrix


Feature Zone	Web / PWA Layer (Monetag)	Native App Layer (AppLovin MAX)	UX Safeguard Rule
Global Shell / Main Layout	Social Bar (mimics system alerts)	None	Do not stack standard web banners here; they ruin layout shifting.


Feed / Post System	None	Native Feed Ads (mediated auction)	Keep elements inline with user content.
Action Transitions (Open Post, Enter Chat)	1x On-Click Smartlink	Interstitial Ad	Never use both. Limit pop-unders to 1 per user session to avoid Chrome blacklisting.
Live Stream & Profiles	None or very sensitive ( you must decide what is best standards) .	Rewarded Video (Optional) if the ad award it outside viorp	. Note : viorp don't Give users free wallet tokens/gifts for watching video ads.


Closed-Loop Wallet & Support	AD-FREE ZONE	AD-FREE ZONE	(or sensitive, choose what is standard practice here) Never run programmatic ads inside financial transaction ledgers.

Now implement:

Multi-Platform Ad Router Plugin (Nuxt )

1.
Multi-Platform Ad Router Plugin (plugins/ads.client.js)

This Nuxt client plugin detects the native wrapper via @capacitor/core, maps interstitial calls to your Capacitor Appodeal integration, handles web-side asset injections for Monetag, and provides strict server-side rendering (SSR) safety guardrails.

import { defineNuxtPlugin } from '#app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin((nuxtApp) => {
  // Strict SSR Safety Guardrail
  if (process.server) return

  const isNative = Capacitor.isNativePlatform()
  
  const CONFIG = {
    monetag: {
      socialBarScriptUrl: 'https://alwingulla.com',
      zoneId: '1234567', // Your Monetag Social Bar Zone ID
      smartlinkUrl: 'https://ggoole.com' // Your Monetag Direct/Smartlink URL
    },
    appodeal: {
      appKey: 'YOUR_APPODEAL_ANDROID_OR_IOS_KEY_HERE'
    }
  }

  // --- 1. WEB / PWA LAYER INITIALIZATION (Monetag) ---
  const initMonetagWeb = () => {
    if (document.getElementById('monetag-social-bar')) return

    const script = document.createElement('script')
    script.id = 'monetag-social-bar'
    script.src = CONFIG.monetag.socialBarScriptUrl
    script.async = true
    script.dataset.zone = CONFIG.monetag.zoneId
    
    script.onerror = (err) => console.error('Monetag script failed to load:', err)
    document.head.appendChild(script)
  }

  // --- 2. NATIVE MOBILE LAYER INITIALIZATION (Appodeal Setup) ---
  const initAppodealNative = async () => {
    try {
      // Dynamic import to prevent build errors on web runtime targets
      // Maps to the custom/community capacitor wrapper for Appodeal SDK
      const Appodeal = (await import('capacitor-plugin-appodeal')).default
      
      // Define ad types to initialize (e.g., INTERSTITIAL = 3, NON-REWARDED VIDEO = 128)
      const AD_TYPES = { INTERSTITIAL: 3, NON_REWARDED_VIDEO: 128 }
      
      // Initialize Appodeal with programmatic bidders active
      await Appodeal.initialize({
        appKey: CONFIG.appodeal.appKey,
        adTypes: [AD_TYPES.INTERSTITIAL, AD_TYPES.NON_REWARDED_VIDEO]
      })
      
      console.log('Appodeal SDK Initialized Successfully (Independent Playback Model).')
    } catch (error) {
      console.warn('Native Appodeal Plugin unavailable or failed to initialize:', error)
    }
  }

  // Contextual check at runtime execution
  if (isNative) {
    initAppodealNative()
  } else {
    initMonetagWeb()
  }

  // --- 3. GLOBAL ROUTER INJECTABLE INTERACTION METHOD ---
  const triggerTransitionAd = async () => {
    if (isNative) {
      try {
        const Appodeal = (await import('capacitor-plugin-appodeal')).default
        const AD_TYPES = { INTERSTITIAL: 3 }

        // Check if an interstitial bidder ad has finished caching
        const isLoaded = await Appodeal.isLoaded({ adType: AD_TYPES.INTERSTITIAL })
        
        if (isLoaded.value) {
          // Play the ad independently. The user manually closes it to resume app features.
          await Appodeal.show({ adType: AD_TYPES.INTERSTITIAL })
        } else {
          console.log('Appodeal asset not cached yet; unblocking user journey immediately.')
        }
      } catch (err) {
        console.error('Appodeal Native Bridge encountered an error:', err)
      }
    } else {
      // Web Layer Fallback: User-initiated popup redirection window to trigger Monetag Smartlink
      try {
        const adWindow = window.open(CONFIG.monetag.smartlinkUrl, '_blank')
        if (adWindow) {
          adWindow.blur()
          window.focus()
        }
      } catch (e) {
        console.warn('Pop-under window trigger blocked by browser configurations:', e)
      }
    }
  }

  return {
    provide: {
      triggerTransitionAd
    }
  }
})

2. 
Safe Intercept Composable (composables/useAdIntercept.js)

This composable applies your "1 click on open" strategy. It relies on a local storage timestamp lock to restrict display intervals to once every 15 minutes, safeguarding against Google Chrome's Abusive Experience Filter on PWA, and maximizing native user retention.

import { useNuxtApp } from '#app'

export function useAdIntercept() {
  const { \$triggerTransitionAd } = useNuxtApp()
  
  const COOLDOWN_MS = 15 * 60 * 1000 // Strict 15-minute time window
  const STORAGE_KEY = 'viorp_last_ad_trigger_time'

  /**
   * Intercepts navigation or actions to execute ad display before completion
   * @param {Function} navigationCallback - The primary function code block to execute next
   */
  const handleInterceptedAction = async (navigationCallback) => {
    // Immediate bypass safety check if rendering on server
    if (process.server) {
      if (typeof navigationCallback === 'function') navigationCallback()
      return
    }

    const now = Date.now()
    const lastAdTrigger = localStorage.getItem(STORAGE_KEY)

    // Evaluate cooldown status
    const isCooldownActive = lastAdTrigger && (now - parseInt(lastAdTrigger, 10) < COOLDOWN_MS)

    if (!isCooldownActive) {
      // Lock the timestamp before firing asynchronous scripts to handle race conditions
      localStorage.setItem(STORAGE_KEY, now.toString())
      
      try {
        await \$triggerTransitionAd()
      } catch (adError) {
        console.error('Transition ad system execution failed:', adError)
      }
    } else {
      const remainingSecs = Math.round((COOLDOWN_MS - (now - parseInt(lastAdTrigger, 10))) / 1000)
      console.log(`Ad cooldown structural lock active. Skipping trigger event. Next window in: ${remainingSecs}s`)
    }

    // Process original user intent route seamlessly
    if (typeof navigationCallback === 'function') {
      navigationCallback()
    }
  }

  return {
    handleInterceptedAction
  }
}

3. 
Usage inside a Vue Component/Page (components/PostFeedCard.vue)

This clean architecture pattern allows your components to wrap click actions without knowing whether they are running on Android, iOS, or a desktop web browser.

<script setup>
import { useRouter } from 'vue-router'
import { useAdIntercept } from '~/composables/useAdIntercept'

const router = useRouter()
const { handleInterceptedAction } = useAdIntercept()

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
})

// Action Handler triggered by user interaction click event
const handleOpenPostDetails = () => {
  // Destination execution callback parameter logic
  const navigateToPost = () => {
    router.push(`/posts/${props.postId}`)
  }

  // Intercept action cleanly via the decoupled utility composable
  handleInterceptedAction(navigateToPost)
}
</script>

<template>
  <div class="feed-post-element">
    <h4>Hot Post Feature Topic</h4>
    <p>Interactive web application stream item summary content goes here...</p>
    
    <!-- User action intercept path execution target -->
    <button @click="handleOpenPostDetails" class="interaction-btn">
      Read Full Post
    </button>
  </div>
</template>

<style scoped>
.interaction-btn {
  background-color: #007bff;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>

Programmatic Contextual Ad Routing Architecture Briefing

Managing ad placement across different contexts requires a programmatic Contextual Ad Routing Architecture. Because your feed consists of sensitive, user-generated content, protecting brand safety while maintaining a seamless user experience is the primary goal.

1. The Core Architecture: Contextual Ad Placement Mapping

The standard practice is to inject Context Metadata from the frontend to your ad server (whether it is an internal moderation microservice or external networks mediated via Appodeal or Monetag). Each page type passes specific flags that restrict or permit certain ad formats:


Page Type	Context / Privacy Level	Recommended Ad Format	Why This Format?
Main / Public Feed	Public, Dynamic, Content-Heavy	In-Feed Native Ads (Post-Sponsored)	Matches the visual style of user posts. Highly scrollable, less jarring, and yields the highest engagement.


User Profiles	Personal, High-Intent, Safe	Display Banners or Sticky Bottom Ads	Less invasive to personal spaces; avoids cluttering a user's personal portfolio or wall elements.


Business / Community Pages	Niche Topic, Highly Categorized	Contextual Native Units or Mid-Roll Video	High relevance. example If a page is about "Cooking," the ad payload filters specifically for kitchenware verticals.


Post Detail View	Deep Context, Static Content	Native Inline Ads	Inserted structurally below the main post body and directly above the user comments section.

Closed-Loop Wallet / Gifting	STRICT AD-FREE ZONE	NONE (DISABLED)	Absolute security guardrail. Never run programmatic ads inside financial transaction ledger 

Best Practices for the Feed Pages (The "Public Delicate" Problem)
Because public feeds are "delicate" (risk of inappropriate user-generated content appearing right next to a paid ad placement), you must enforce these functional guardrails:
The 1-in-X Rule (Ad Density): Maintain a frequency of roughly 1 ad every 5 to 7 organic posts, or combine with a time-interval rendering tracker (e.g., minimum 45 seconds between heavy ad impressions) to maximize user retention.
Contextual Brand Safety Tags: Every time a user post is rendered in the feed, your backend should analyze its text/media via keyword filtering or automated AI moderation. If a post contains sensitive themes, the ad placement slot directly below it must be programmatically disabled to protect advertiser contracts.
• Native Styling Wrappers: Appodeal and its premium programmatic bidders provide raw data (JSON/XML containing image asset URLs, headlines, and call-to-action text). Your app should render this data using your exact Vue/Nuxt Tailwind components so the ad looks identical to a standard user post, save for a clear, small "Sponsored" or "Promoted" badge.

3. How to Guide External Ad Services (Integration Flow)

Pass targeting signals via SDK frameworks using two structural methods:

A. Ad Unit IDs / Placements (The Structural Guide)

Do not use one generic key for the entire app footprint. Register distinct Placements/Ad Units in your ad partner dashboards:
• ca-app-pub-feed-native-unit
• ca-app-pub-profile-banner-unit

B. Custom Keywords & Targeting Parameters (The Content Guide)

Pass parameters dynamically in the ad request payload to optimize your fill rates and maximize target eCPMs:

const adRequest = {
  placementId: "feed-native-unit",
  keywords: ["social", "networking", "public-feed"],
  contentUrl: "https://viorp.com", // Assists crawlers in auditing public web context
  customTargeting: {
    page_type: "feed",
    content_rating: "family_friendly" // Dynamically updated by your backend content moderation system
  }
};


Technical Engineering Blueprint


1. Multi-Platform Ad Router Plugin (plugins/ads.client.js)

This Nuxt  client plugin cleanly abstracts your ad environments. It uses @capacitor/core to detect native layers, routes application monetization to Appodeal for iOS/Android builds, fallbacks to script injections for Monetag on Web/PWA browser environments, and provides strict server-side rendering (SSR) safety guardrails.

import { defineNuxtPlugin } from '#app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin((nuxtApp) => {
  // Strict SSR Safety Guardrail - Prevents execution during Server-Side Rendering
  if (process.server) return

  const isNative = Capacitor.isNativePlatform()
  
  // Hardcoded configuration specifications
  const CONFIG = {
    appodeal: {
      appKey: 'YOUR_APPODEAL_ANDROID_OR_IOS_KEY_HERE'
    },
    monetag: {
      socialBarScriptUrl: 'https://alwingulla.com',
      zoneId: '1234567', // Replace with your live Monetag Social Bar Zone ID
      smartlinkUrl: 'https://ggoole.com' // Replace with your live Monetag Smartlink URL
    }
  }

  // --- 1. WEB / PWA LAYER INITIALIZATION (Monetag) ---
  const initMonetagWeb = () => {
    if (document.getElementById('monetag-social-bar')) return

    const script = document.createElement('script')
    script.id = 'monetag-social-bar'
    script.src = CONFIG.monetag.socialBarScriptUrl
    script.async = true
    script.dataset.zone = CONFIG.monetag.zoneId
    
    script.onerror = (err) => console.error('Monetag script failed to load:', err)
    document.head.appendChild(script)
  }

  // --- 2. NATIVE MOBILE LAYER INITIALIZATION (Appodeal Bridge) ---
  const initAppodealNative = async () => {
    try {
      // Dynamic import to prevent build-time crashes on pure web build targets
      const Appodeal = (await import('capacitor-plugin-appodeal')).default
      
      // Define ad types to initialize (e.g., INTERSTITIAL = 3, NON_REWARDED_VIDEO = 128)
      const AD_TYPES = { INTERSTITIAL: 3, NON_REWARDED_VIDEO: 128 }
      
      // Initialize Appodeal with programmatic bidders active
      await Appodeal.initialize({
        appKey: CONFIG.appodeal.appKey,
        adTypes: [AD_TYPES.INTERSTITIAL, AD_TYPES.NON_REWARDED_VIDEO]
      })
      
      console.log('Appodeal SDK Initialized Successfully (Independent Playback Model).')
    } catch (error) {
      console.warn('Native Appodeal SDK missing or failed to initialize:', error)
    }
  }

  // Runtime environment routing check
  if (isNative) {
    initAppodealNative()
  } else {
    initMonetagWeb()
  }

  // --- 3. AD EXECUTION METOD ---

  /**
   * Fires a transitional interstitial ad breakout sequence
   * Web: Triggers a single Monetag Popunder / Smartlink window.
   * Native Mobile: Checks if Appodeal Interstitial is cached and plays it.
   */
  const triggerTransitionAd = async () => {
    if (isNative) {
      try {
        const Appodeal = (await import('capacitor-plugin-appodeal')).default
        const AD_TYPES = { INTERSTITIAL: 3 }

        // Check if an interstitial bidder ad has finished caching
        const isLoaded = await Appodeal.isLoaded({ adType: AD_TYPES.INTERSTITIAL })
        
        if (isLoaded.value) {
          // Play the ad independently. The user manually closes it to resume app features.
          await Appodeal.show({ adType: AD_TYPES.INTERSTITIAL })
        } else {
          console.log('Appodeal asset not cached yet; unblocking user transition path.')
        }
      } catch (err) {
        console.error('Appodeal native interstitial bridge execution crash:', err)
      }
    } else {
      // Web / PWA Mode: Open a single Monetag Popunder / Smartlink window on action clicks
      try {
        const adWindow = window.open(CONFIG.monetag.smartlinkUrl, '_blank')
        if (adWindow) {
          adWindow.blur()
          window.focus()
        }
      } catch (e) {
        console.warn('Popunder window trigger block prevented by browser configurations:', e)
      }
    }
  }

  // Globally inject modules into the runtime instance ecosystem
  return {
    provide: {
      triggerTransitionAd
    }
  }
})


Financial Ledger Page Protection & Execution Composable (composables/useAdIntercept.js)

This composable tracks the 15-minute user cooldown matrix for action clicks and applies strict guardrails to completely freeze ads inside your transaction interfaces (Wallet / Gifting view states). It operates purely as an ad trigger, entirely unlinked from any reward mechanics.

import { useNuxtApp, useRoute } from '#app'

export function useAdIntercept() {
  const { \$triggerTransitionAd } = useNuxtApp()
  const route = useRoute()
  
  const COOLDOWN_MS = 15 * 60 * 1000 // Strict 15-minute lock window tracking bounds
  const STORAGE_KEY = 'viorp_last_action_ad_time'

  // Define restricted financial route patterns to prevent loop vulnerabilities or non-compliance
  const AD_FREE_FINANCIAL_ROUTES = ['/wallet', '/wallet/deposit', '/wallet/withdraw', '/gifting', '/checkout']

  /**
   * Internal routine checking route status validity strings
   */
  const isFinancialZoneActive = () => {
    return AD_FREE_FINANCIAL_ROUTES.some(path => route.path.startsWith(path))
  }

  /**
   * Wraps standard navigation actions to implement the "1 click on open" ad strategy.
   * @param {Function} actionCallback - Secondary app routing path function to execute cleanly after trigger
   */
  const handleTransitionAction = async (actionCallback) => {
    if (process.server) {
      if (typeof actionCallback === 'function') actionCallback()
      return
    }

    // Safety Guardrail: Complete lockdown on financial ledger pages
    if (isFinancialZoneActive()) {
      console.log('Ad-Free financial transaction layer active. Suppressing programmatic transition ad calls.')
      if (typeof actionCallback === 'function') actionCallback()
      return
    }

    const now = Date.now()
    const lastAdTrigger = localStorage.getItem(STORAGE_KEY)
    const isCooldownActive = lastAdTrigger && (now - parseInt(lastAdTrigger, 10) < COOLDOWN_MS)

    if (!isCooldownActive) {
      localStorage.setItem(STORAGE_KEY, now.toString())
      try {
        await \$triggerTransitionAd()
      } catch (err) {
        console.error('Error within intercepted transition routine:', err)
      }
    } else {
      const remainingSecs = Math.round((COOLDOWN_MS - (now - parseInt(lastAdTrigger, 10))) / 1000)
      console.log(`Action ad cooldown active. Next window available in: ${remainingSecs}s`)
    }

    // Seamless user journey execution step
    if (typeof actionCallback === 'function') {
      actionCallback()
    }
  }

  return {
    handleTransitionAction
  }
}


Step-by-Step Implementation Guide for Your Agent

To complete this system integration accurately, instruct your agent to execute development tasks in this precise sequence:
1. Dependencies Setup: Install @capacitor/core and your target interface plugin wrapper for Appodeal (capacitor-plugin-appodeal) in your project root.


Step-by-Step Implementation Guide for Your Agent

To complete this system integration accurately, instruct your agent to execute development tasks in this precise sequence:
1. Dependencies Setup: Install @capacitor/core and your target interface plugin wrapper for Appodeal (capacitor-plugin-appodeal) in your project root.

2. Plugin Placement: Drop the plugins/ads.client.js file into your Nuxt directory. Verify it retains the .client.js naming convention so it initializes exclusively on client builds.
3. Action Wrapping: Deploy the useAdIntercept hook across your core navigation trigger points (e.g., transitions inside the Post Feed System, opening Chat Messages, or loading a user Live Stream wrapper).
4. Confirm Financial Isolation: Perform an audit to ensure all paths listed under AD_FREE_FINANCIAL_ROUTES map 1:1 to your actual Nuxt router pathways, completely locking down the wallet and gifting screens from unexpected ad views.
Now time to import the Appodeal SDK .
1. Insert following code into your settings.gradle.kts at the root of project : repositories {
    maven { url = uri("https://artifactory.appodeal.com/appodeal") }
}

2. Insert following code into your app-level build.gradle.kts : dependencies {
    implementation("com.appodeal.ads.sdk:core:4.4.0")
    // BidMachine
    implementation("io.bidmachine:ads.networks.amazon:12.0.0.0")
    implementation("io.bidmachine:ads.networks.meta_audience:6.21.0.1")
    implementation("io.bidmachine:ads.networks.mintegral:17.1.61.1")
    implementation("io.bidmachine:ads.networks.my_target:5.47.1.2")
    implementation("io.bidmachine:ads.networks.vungle:7.7.4.0")
    // AppLovin MAX
    implementation("com.applovin.mediation:amazon-tam-adapter:11.3.1.0")
    implementation("com.applovin.mediation:bidmachine-adapter:3.7.1.0")
    implementation("com.applovin.mediation:bigoads-adapter:5.9.0.0")
    implementation("com.applovin.mediation:bytedance-adapter:8.1.0.3.0")
    implementation("com.applovin.mediation:chartboost-adapter:9.10.2.0")
    implementation("com.applovin.mediation:facebook-adapter:6.21.0.0")
    implementation("com.applovin.mediation:fyber-adapter:8.4.6.0")
    implementation("com.applovin.mediation:google-ad-manager-adapter:25.2.0.0")
    implementation("com.applovin.mediation:google-adapter:25.2.0.0")
    implementation("com.applovin.mediation:inmobi-adapter:11.3.0.1")
    implementation("com.applovin.mediation:ironsource-adapter:9.4.4.0.0")
    implementation("com.applovin.mediation:mintegral-adapter:17.1.61.0")
    implementation("com.applovin.mediation:mobilefuse-adapter:1.11.0.0")
    implementation("com.applovin.mediation:moloco-adapter:4.3.1.0")
    implementation("com.applovin.mediation:ogury-presage-adapter:6.2.0.0")
    implementation("com.applovin.mediation:pubmatic-adapter:4.10.0.0")
    implementation("com.applovin.mediation:smaato-adapter:22.7.2.3")
    implementation("com.applovin.mediation:unityads-adapter:4.17.0.0")
    implementation("com.applovin.mediation:verve-adapter:3.7.1.0")
    implementation("com.applovin.mediation:vungle-adapter:7.7.4.0")
    implementation("com.applovin.mediation:yandex-adapter:7.17.0.0")
    // Bidon
    implementation("org.bidon:amazon-adapter:12.0.0.0")
    implementation("org.bidon:applovin-adapter:13.6.3.0")
    implementation("org.bidon:bidmachine-adapter:3.7.1.1")
    implementation("org.bidon:bigoads-adapter:5.9.0.0")
    implementation("org.bidon:chartboost-adapter:9.10.2.0")
    implementation("org.bidon:dtexchange-adapter:8.4.6.0")
    implementation("org.bidon:inmobi-adapter:11.3.0.0")
    implementation("org.bidon:ironsource-adapter:9.4.4.0")
    implementation("org.bidon:meta-adapter:6.21.0.0")
    implementation("org.bidon:mintegral-adapter:17.1.61.0")
    implementation("org.bidon:mobilefuse-adapter:1.11.0.0")
    implementation("org.bidon:moloco-adapter:4.3.1.0")
    implementation("org.bidon:startio-adapter:5.2.4.1")
    implementation("org.bidon:taurusx-adapter:1.12.2.0")
    implementation("org.bidon:unityads-adapter:4.17.0.0")
    implementation("org.bidon:vkads-adapter:5.47.1.0")
    implementation("org.bidon:vungle-adapter:7.7.4.0")
    implementation("org.bidon:yandex-adapter:7.17.0.0")
    implementation("org.bidon:zmaticoo-adapter:2.0.7.1.0")
    // Level Play
    implementation("com.unity3d.ads-mediation:admob-adapter:5.7.0")
    implementation("com.unity3d.ads-mediation:applovin-adapter:5.8.0")
    implementation("com.unity3d.ads-mediation:bidmachine-adapter:5.7.0")
    implementation("com.unity3d.ads-mediation:bigo-adapter:5.8.0")
    implementation("com.unity3d.ads-mediation:facebook-adapter:5.3.0")
    implementation("com.unity3d.ads-mediation:fyber-adapter:5.9.0")
    implementation("com.unity3d.ads-mediation:inmobi-adapter:5.7.0")
    implementation("com.unity3d.ads-mediation:mintegral-adapter:5.18.0")
    implementation("com.unity3d.ads-mediation:mobilefuse-adapter:5.3.0")
    implementation("com.unity3d.ads-mediation:moloco-adapter:5.6.0")
    implementation("com.unity3d.ads-mediation:mytarget-adapter:5.5.0")
    implementation("com.unity3d.ads-mediation:ogury-adapter:5.2.0")
    implementation("com.unity3d.ads-mediation:pangle-adapter:5.18.0")
    implementation("com.unity3d.ads-mediation:unityads-adapter:5.6.0")
    implementation("com.unity3d.ads-mediation:verve-adapter:5.2.0")
    implementation("com.unity3d.ads-mediation:vungle-adapter:5.10.0")
    // Appodeal
    implementation("com.appodeal.ads.sdk.adapters:adjust:5.7.0.0")
    implementation("com.appodeal.ads.sdk.adapters:admob:25.2.0.0")
    implementation("com.appodeal.ads.sdk.adapters:amazon:12.0.0.0")
    implementation("com.appodeal.ads.sdk.adapters:applovin:13.6.3.0")
    implementation("com.appodeal.ads.sdk.adapters:applovin_max:13.6.3.1")
    implementation("com.appodeal.ads.sdk.adapters:appsflyer:6.18.0.1")
    implementation("com.appodeal.ads.sdk.adapters:bidmachine:3.7.1.0")
    implementation("com.appodeal.ads.sdk.adapters:bidon:0.14.0.0")
    implementation("com.appodeal.ads.sdk.adapters:bigo_ads:5.9.0.0")
    implementation("com.appodeal.ads.sdk.adapters:chartboost:9.10.2.0")
    implementation("com.appodeal.ads.sdk.adapters:dt_exchange:8.4.6.0")
    implementation("com.appodeal.ads.sdk.adapters:facebook_analytics:18.3.0.0")
    implementation("com.appodeal.ads.sdk.adapters:firebase:23.2.0.0")
    implementation("com.appodeal.ads.sdk.adapters:iab:1.8.1.1")
    implementation("com.appodeal.ads.sdk.adapters:inmobi:11.3.0.0")
    implementation("com.appodeal.ads.sdk.adapters:ironsource:9.4.4.0")
    implementation("com.appodeal.ads.sdk.adapters:level_play:9.4.4.0")
    implementation("com.appodeal.ads.sdk.adapters:meta:6.21.0.0")
    implementation("com.appodeal.ads.sdk.adapters:mintegral:17.1.61.0")
    implementation("com.appodeal.ads.sdk.adapters:mobilefuse:1.11.0.0")
    implementation("com.appodeal.ads.sdk.adapters:moloco:4.3.1.0")
    implementation("com.appodeal.ads.sdk.adapters:my_target:5.47.1.0")
    implementation("com.appodeal.ads.sdk.adapters:ogury:6.2.0.0")
    implementation("com.appodeal.ads.sdk.adapters:pubmatic:4.10.0.0")
    implementation("com.appodeal.ads.sdk.adapters:sentry_analytics:8.44.1.0")
    implementation("com.appodeal.ads.sdk.adapters:smaato:22.7.2.0")
    implementation("com.appodeal.ads.sdk.adapters:startio:5.2.4.0")
    implementation("com.appodeal.ads.sdk.adapters:taurusx:1.12.2.0")
    implementation("com.appodeal.ads.sdk.adapters:unity_ads:4.17.0.0")
    implementation("com.appodeal.ads.sdk.adapters:verve:3.7.1.0")
    implementation("com.appodeal.ads.sdk.adapters:vungle:7.7.4.0")
    implementation("com.appodeal.ads.sdk.adapters:yandex:7.17.0.0")
}

Once that's done, save the file and perform the Gradle sync.

Step 2. Set Up The Project
Add the Network Security Configuration file to your AndroidManifest.xml :

<?xml version="1.0" encoding="utf-8"?>
<manifest>
    <application
        ...
        android:networkSecurityConfig="@xml/network_security_config">
    </application>
</manifest>

In your network_security_config.xml file, add base-config that sets cleartextTrafficPermitted to true :

<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>

Next 

Configure Admob Meta-data ( only if admob adapted is used or available ) if yes : <manifest>
    <application>
        <!-- Add your AdMob App ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"/>
    </application>
</manifest>

Step 3. Initialize SDK
We recommended to call initialization method in your MainActivity - onCreate method only once in your whole app:

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    Appodeal.initialize(
        context = activity,
        appKey = "APP_KEY",
        adTypes = adTypes,
        callback = object : ApdInitializationCallback {
            override fun onInitializationFinished(errors: List<ApdInitializationError>?) {
                // Appodeal initialization finished
            }
        }
    )
}

Note: context - Activity of your application.

Replace APP_KEY with the actual app key from your personal account.

adTypes - Ad formats. Initialize only those ad types you want to use:

Appodeal.INTERSTITIAL for interstitial;
Appodeal.REWARDED_VIDEO for rewarded videos;
Appodeal.NATIVE for native ads;
Appodeal.BANNER for banners
Appodeal.MREC for 300*250 banners.

Now inform me when this SDK implementation is done let me activate confirmed on Appodeal platform.
