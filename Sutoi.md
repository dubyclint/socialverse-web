fviorp tech A: study and apply every bit of Tech Stack Behind TikTok's Seamless Video Player on this viorp project 

1. The Video Delivery Pipeline (HLS & MPEG-DASH)

TikTok never serves raw static .mp4 video files directly to users. Instead, they use Adaptive Bitrate Streaming (ABR) formats via HLS (HTTP Live Streaming) or MPEG-DASH.
• How it works: When a video is uploaded to the backend, an encoding worker pipeline breaks the video down into tiny 2-second to 4-second .ts or .m4s video segments.
• The Magic Manifest: The backend creates a master .m3u8 or .mpd playlist file. This playlist points to the same video compressed at multiple quality tiers: Low (240p/360p), Medium (480p/720p), and High (1080p).

Low Network Handling: If a Viorp user hits a cellular dead zone, the video player engine detects the drop in download speed instantly. Instead of pausing to buffer, it seamlessly switches mid-playback to fetch the next 2-second segment from the 360p low-bitrate pool. The video turns slightly grainy, but it never stops playing.
2. The Video Codec Generation Shift (AV1 vs. H.264)
TikTok pushes the boundaries of compression to save bandwidth costs at scale.
Traditional apps use H.264 (AVC)—it is compatible with every device but creates larger file sizes.
TikTok transcodes videos into HEVC (H.265) or AV1. AV1 offers up to 30% to 50% better compression than H.264 at the exact same visual quality. This drastically reduces the total megabytes streamed per second over tight mobile data• connections.

3. Client-Side Orchestration: Pre-Rendering and Intersection Observers

TikTok tricks the human brain into thinking there is zero load time by utilizing aggressive client-side caching.
• The Infinite Scroll Queue: The feed works like a sliding window buffer queue.
• The Prefetching Strategy: While the user is watching Video #1, the app has already downloaded the first 3 seconds of Video #2 and Video #3 into the local mobile device memory cache. When the user swipes up, Video #2 plays instantly because the data is already on the device.


The Custom Implementation for Viorp (Nuxt + Capacitor)

To build this yourself using your current framework architecture, follow this design pattern:

A. Backend Video Encoding Pipeline (The Infrastructure)

You cannot do this encoding inside your main Nuxt server. You must offload it to an asynchronous worker service using FFmpeg or a cloud service like AWS Elemental MediaConvert.
When a user uploads a video on Viorp, your worker must execute an FFmpeg command to output a fragmented HLS stream:# Example FFmpeg architecture logic to generate a multi-bitrate HLS stream
ffmpeg -i input.mp4 \
  -map 0:v -map 0:a -s:v:0 640x360 -b:v:0 400k \
  -map 0:v -map 0:a -s:v:1 1280x720 -b:v:1 1200k \
  -f hls -hls_time 3 -hls_playlist_type vod \
  -master_pl_name master.m3u8 stream_%v.m3u8

B. The Frontend Vue/Nuxt Video Component Shell

Instead of a native <video> tag which behaves poorly with HLS links across cross-platform WebViews, use a high-performance framework player wrapper like Video.js or Hls.js.
Here is how you handle the sliding window container queue in Vue 3:

<!-- components/VerticalVideoPlayer.vue -->
<script setup>
import Hls from 'hls.js';

const props = defineProps({
  videoUrl: String, // Path to master.m3u8
  isActive: Boolean  // True if this slide is currently active on screen
});

const videoRef = ref(null);
let hlsInstance = null;

watch(() => props.isActive, (isNowActive) => {
  if (isNowActive) {
    videoRef.value.play().catch(() => {});
  } else {
    videoRef.value.pause();
    videoRef.value.currentTime = 0; // Reset state to free up memory
  }
});

onMounted(() => {
  if (Hls.isSupported()) {
    hlsInstance = new Hls({
      maxBufferLength: 6,      // Keep only 6 seconds buffered ahead to save mobile data
      maxMaxBufferLength: 10,
      capLevelToPlayerSize: true // Don't download 1080p if player container is low res
    });
    
    hlsInstance.loadSource(props.videoUrl);
    hlsInstance.attachMedia(videoRef.value);
  }
});

onBeforeUnmount(() => {
  if (hlsInstance) hlsInstance.destroy();
});
</script>

<template>
  <div class="relative w-full h-full bg-black flex items-center justify-center snap-start">
    <video 
      ref="videoRef"
      loop
      muted
      playsinline
      webkit-playsinline
      class="w-full h-full object-cover"
    ></video>
    
    <!-- Custom TikTok-style neat overlay controls go here -->
    <div class="absolute bottom-4 left-4 text-white z-10">
      <slot name="metadata" />
    </div>
  </div>
</template>


C. The Capacitor Layer: Network Pre-fetching Optimization

To make this work flawlessly on iOS and Android wrappers, you can optimize native asset routing:
1. Detect Network Connection States: Use the official @capacitor/network plugin. If the network drops down to a cellular 2g or 3g connection status, pass a global flag to your video player component config to enforce an overriding ceiling constraint forcing it to only fetch the low-bitrate 360p stream variants, preventing buffering entirely.
2. Local Caching Layer: For premium performance, you can use the @capacitor/file-system plugin to download the tiny .m3u8 manifest configurations of upcoming videos into local persistent application storage folders during device idle frames.
This Tech Apply to Live Streams?
Yes, but with critical structural differences.
While recorded videos focus on pre-fetching background files ahead of time, Live Streaming cannot look into the future. Instead, Live streams shift their core engineering priority to Ultra-Low Latency protocols and dynamic bitrate adaptation.
Here is how the tech stack handles a low-network live stream inside an app like TikTok or Viorp:
1. They Swap the Protocol (LL-HLS or WebRTC)
Standard HLS stream chunks have a latency lag of 6 to 30 seconds behind real-time action, which completely ruins interactive live chat features.
Instead, live platforms deploy Low-Latency HLS (LL-HLS) or WebRTC (Real-Time Communication).
LL-HLS drops video chunks into tiny 0.5-second sub-chunks, dropping latency down to roughly 1–2 seconds. WebRTC drops latency to sub-second speeds (under 500 milliseconds) directly over peer connections, which is what allows creators to read chats instantly with zero delay.
2. Aggressive Server-Side Dynamic Transcoding
When a creator goes live from their phone, they send a single high-quality video feed stream up to the ingestion server backend (using RTMP or SRT protocols).
• The server cluster immediately clones that single live stream and down-samples it into multiple resolution tracks in real-time.
• If a viewer on Viorp suddenly walks into an area with poor cellular coverage, the streaming engine immediately intercepts the player instance and switches them to the low-bitrate 240p/360p stream segment stream thread.

3. No Pre-fetching, Only Buffer Management

Because you can't pre-fetch live data, low-network stalls are solved by modifying the client player buffer configurations:

• The Frame-Drop Rule: If the viewer's network drops significantly and cannot keep up with real-time video frames, the video engine skips audio-visual processing frames entirely. It chooses to intentionally drop structural background visual data frames to ensure the active audio stream stream continues playing cleanly without pausing the interactive live experience.

viorp Tech B: High number of Text  on posts should not display , rather maximum 2 lines. you need to implement Multi-line Text Truncation (Line Clamping).
You can achieve this layout by pairing CSS to handle the visual cutting with a simple JavaScript toggle to reveal the full content when clicked.

1. The CSS (To force the 2-line maximum)

Apply these rules to your post text element. The combination of -webkit-line-clamp and overflow: hidden forces the browser to truncate your text and automatically add the ellipsis (...) at the end of the second line.
.post-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* Limits the text to exactly 2 lines */
  overflow: hidden;      /* Hides everything after line 2 */
}

/* When the user clicks "...more", remove the restriction */
.post-text.expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

Keep your text and the toggle button close to each other. <div class="post-container">
  <!-- The full 50 lines of text can sit here safely -->
  <p class="post-text" id="postText">
    Congratulations Harry Kane! History made! Harry Kane has officially joined English football royalty by winning the 2026 Ballon d'Or... [Rest of your 50 lines of text]
  </p>
  <span class="more-btn" id="toggleBtn" onclick="toggleText()">... more</span>
</div>

To handle the user interaction so they can actually reveal the text: function toggleText() {
  const textElement = document.getElementById("postText");
  const btnElement = document.getElementById("toggleBtn");

  // Toggle the expanded class to show/hide text
  textElement.classList.toggle("expanded");

  // Hide the "... more" button once expanded
  if (textElement.classList.contains("expanded")) {
    btnElement.style.display = "none"; 
  } else {
    btnElement.style.display = "inline";
  }
}

viorp tech C:  We are implementing an immersive feature called "veep" which re-engineers TikTok’s full-screen, of  ultra-low-latency media processing architecture and algorithmic feed engine.
Please generate the complete module architecture, UI implementation layouts, state managers, and media rendering pipelines based on the detailed requirements below.


1. UI Entry Point & Header Navigation 

• Target Placement: Place a new "veep" icon (fullscreen layout or custom icon asset) directly onto the main global header bar of Viorp , located in the top navigation strip right next to the search 🔍 icon.
• Interaction Model: Tapping this icon triggers a structural view mutation, switching the posts viewport from the standard platform layout to a completely immersive, full-screen vertical swipe feed (post become the full  screen background )
• Sub-Navigation Menu (Top Overlay): At the absolute top-center of the "veep" view, overlay a clean, blurred navbar containing four specific sub-feed routes:

	1. Veep: Serves post/feed of an aggregated recommendation matrix pulling together the user’s explicitly selected interests, friend circles, tracked topics/niches, and past interactions.

Global: Renders a global feed of content originating outside the user's immediate geographical region, forced into the immersive device full-screen design.

Trend: Aggregates and displays highly viral and trending posts from both the user's localized node up to global clusters.

Hood: local promiximity , country, region 

The application is
 when a post especially post having audio and video is tapped on feed.vue it opens fullscreen as in veep and users can now scroll up or down to next content or post in fullscreen veep and continue watching Post or content or return to feed.vue page by clicking home button on veep . 


Immersive Component Re-mapping & Layout Conversion 

• Full-Screen Mapping: Take any target post containing a picture or a video element and restructure its layout entirely when rendered inside the veep channel. The layout must match  with zero layout exceptions.
• Component Relocation Matrix: Use Vue 3 <slot> teleportation or dynamic layouts to rearrange the standard elements from the post container into absolute overlays:
	• Media Canvas: Video or image scales to full device/container height (w-full h-screen object-cover).
	• Bottom-Left Text Stack: Profile handler (@username), descriptive content text, hashtags, and contextual tags are absolutely positioned at the bottom left (absolute bottom-20 left-4 z-10 max-w-[70%]).

Meatball menu at below  page besides (veep quality settings, support /report, hide veep, 

Kebab menu vertical 3 dot  at top right ( library: - recently saved veep, - liked veep,- watched veep, -shared veep) you can see all these activities anyone you click. Recently watched as default. 

• Right-Side Action Stack: Place the interaction elements into a vertical flex column along the right margin (absolute right-4 bottom-28 z-10 flex flex-col items-center gap-5). This column explicitly holds:
	• Author Profile Circle: Avatar wrapped with a primary color action indicator (Plus symbol).
	• Likes/Heart Component: Metric counter placed directly under a high-performance vector heart button.
	• Comments Component: Triggers a bottom sheet tray that matches the exact layout of TikTok's slide-up drawer without mutating the core viewport scale.

		• Favorites/Bookmarks & Share Nodes: Configured with active count states underneath.
		• Gifting  Take the gifting modules and map them into the action stack or bottom-left zone as a clean, translucent overlay icon that opens the gifting system modal on-tap. The like, comments,share, save, gift , along with other needed icons should arrange properly vertically at the right body side of the screen ( just like Tiktok.) and the down: home icon( feed.vue), Chat icon, wallet icon, live icon

3. Media Processing Infrastructure (TikTok Reverse-Engineered Copy)

To mimic TikTok’s specific performance on poor or volatile internet connectivity, you must design a client-side media pipeline inside Nuxt using standard browser APIs and Capacitor plugins:
• Segmented Pre-Caching & Video Buffering: Implement a custom chunked asset manager using HTTP Range Requests. Do not load entire media blocks. The media coordinator must request only the first 500KB - 1MB of upcoming content clips in the feed sequence.
• Pre-Play Execution: Initialize hidden HTML5 video elements for the next two items down the stack array. Execute .load() on these elements so they sit at frame zero ready to play. The moment a user swipes down, execute .play() instantly to drop perceived latency to 0ms.
- • Adaptive Bitrate Streaming & Low-Network Resiliency: integrate a simplified client-side controller that dynamically hooks into the browser network API and Capacitor's network status wrapper. If the bandwidth drops below 1.5 Mbps:
	• Dynamically throttle down source media manifests (e.g., swapping fallback links from 1080p to a optimized crf compressed 480p fallback chunk).
	• Maintain a memory buffer loop where partially downloaded segments can be rendered inline before network context drops out, ensuring frames play continuously instead of hanging on a stalled loading wheel.
• Smooth Crossfade & Sound Management: Ensure unified audio state execution. As the active card changes during  swipe gesture, fade out the audio track of the previous item linearly over 150ms while setting the target item to full volume instantly.


4. Algorithm Routing Strategy

Define a Nuxt state service (useveepFeedStore) that handles the payload generation for the four header streams. Ensure the payload requests passing to our backend include the following metrics:
• Location Filters: For the Trend and veep paths, compute localized telemetry tags (IP/Capacitor GPS coordinates) to fetch geo-fenced trends.
• Global Extraction: For Global, instruct the backend to bypass local server caches and return multi-region high-engagement pools.
• Interest/Interaction Vectors: The veep pipeline should monitor dynamic client events: watch completion percentage, loop counts, skip speed, expansion of comment drawers, and gift-modal triggers. These parameters should be passed into subsequent API payload iterations to tune recommendations in real time.

very important: on the profile page the post should be arranged as : 1. All ; which is all posts scrolled through down  2., photos: all photos be it profile photo or Posts photos arrange in 3 coloums grid , when clicked it open in full screen 3: veep : all audio/video posts arranged in 3 coloums grid with view counts , ( standard view 5 second default, engaged views 25ec default, high tier engagement metrics 30mins. admin should be able to adjust /set how many seconds for each on dashboard control. actual view is engaged view or watch to finish . 

critical: add in monitization page : requirements qualifications and progress page that 200000 views in 30 days from authentic videos, not copyright videos. Clippers video are reviewed, the standard views 5 seconds don't count only the engaged views counts. When you go to pages/settings live, you will see how go live  and requirements and progress is shown to users. This is how I want the monitization requirements and progress to be shown to users on monitization page.

Be best in 
1. Vue 3 Full-Screen Core Skeleton: Provide a vertically swipable wrapper using a touch gesture handler or a native CSS scroll snap wrapper (snap-y snap-mandatory h-screen overflow-y-scroll).
2. Telemetry-Aware Video Player Component: Write an optimized, robust <veepVideoPlayer /> or <veepImageCanvas /> component containing the pre-buffer loop, range-request strategy, and audio crossfade hooks.
3. UI Component Layering Map: Generate the Tailwind-configured absolute layer containing the right-side control column (avatar, like, comment, share, gifting node) and the bottom overlay metadata in best .
Please write clean, TypeScript-safe Vue  / Nuxt  composition code, and account for mobile performance optimization under Capacitor.js wrapping.

The ad placement in veep should align exactly to veep fullscreen design. And admin can set its settings at admin dashboard just like feed/post.
 
viorp tech D: When statuses are active and yet completely not viewed yet , a Blue coloured ring should encircle the profile to indicate that, and  this should be seen across  across posts, veep, chat message, live stream. And when clicked should take  one to the statuses and if more than one statuses then bar Segmented Progress .
• Behavior: Each segment represents one single, distinct status post or video clip within a user's collection.
2. Auto-Play & Timing Rules
• Duration: Each segment actively fills up from left to right over a set period of seconds (typically 5 seconds for static photos or matching the exact duration of a video clip).
• Auto-Advance: As soon as the active segment finishes filling up, it automatically transitions (auto-advances) to the next segment in the timeline. Once all segments for a specific user finish, it automatically advances to the next active user's statuses.
3. Direct User Navigation (Tapping to Go Back or Forward)
Skip Forward (Next): Tapping the right side of the screen instantly jumps the user to the next segment in the current timeline, forcing the current bar to fill completely.
Go Back (Previous): Tapping the left side of the screen instantly takes the user backward. If clicked mid-segment, it restarts the current segment. If clicked at the start of a segment, it jumps back to the previous post.
Pause on Hold: Pressing and holding down anywhere on the screen pauses the timer and hides the UI elements so the user can look closer.
4. Inter-User Navigation (Horizontal Swiping)
Swipe Left/Right: Swiping horizontally switches between entirely different users. A swipe from right-to-left skips the current user entirely and opens the active statuses of the next user in the queue.

Note the ad should also be there in between every 3 statuses on the bar.
On feed.vue Make sure my feed post rendering obeys this. Make sure my admin settings apply.
other posts placement arrangement order in feed or veep are
First Post, 
 ad sponsored / strips of and,(note strip are not allowed in veep since it fullscreen per post)
another  different 2 posts,
  Strips of trending posts ,
 Another 3 posts ,
 One ad sponsored post
 Another 10 posts,
 Strips of posts from local region location ,
Another 2 posts global foreign trending, 

The idea is place trending post , pals post, ad mixed in between, other posts ( admin settings apply)

For veep rendering apply all my post feed logic / algorithm but find out if I'm missing add other sophisticated render tech or post ideal on Tiktok or Facebook.
  
The ad placement in veep should align exactly to veep fullscreen design. And admin can set its settings at admin dashboard just like feed/post. When statuses are active and yet completely not viewed yet , a Blue coloured ring should encircle the profile to indicate that, and  this should be seen across  across posts, veep, chat message, live stream. And when clicked should take  one to the statuses and if more than one statuses then bar Segmented Progress .
• Behavior: Each segment represents one single, distinct status post or video clip within a user's collection.
2. Auto-Play & Timing Rules
• Duration: Each segment actively fills up from left to right over a set period of seconds (typically 5 seconds for static photos or matching the exact duration of a video clip).
• Auto-Advance: As soon as the active segment finishes filling up, it automatically transitions (auto-advances) to the next segment in the timeline. Once all segments for a specific user finish, it automatically advances to the next active user's statuses.
3. Direct User Navigation (Tapping to Go Back or Forward)
Skip Forward (Next): Tapping the right side of the screen instantly jumps the user to the next segment in the current timeline, forcing the current bar to fill completely.
Go Back (Previous): Tapping the left side of the screen instantly takes the user backward. If clicked mid-segment, it restarts the current segment. If clicked at the start of a segment, it jumps back to the previous post.
Pause on Hold: Pressing and holding down anywhere on the screen pauses the timer and hides the UI elements so the user can look closer.
4. Inter-User Navigation (Horizontal Swiping)
Swipe Left/Right: Swiping horizontally switches between entirely different users. A swipe from right-to-left skips the current user entirely and opens the active statuses of the next user in the queue.
 to users on monitization page.

viorp  tech E : For verification , the real life  approach is. There are 2 purpose((KYC, verified badge)and 2 methods ( manual verification , and using dedit or other api). So allow personal manual  application  and  submission to admin which already  exists, option 2 for faster personal application is using didit or any other api. the prompt for didit API is : You are integrating **Didit KYC (identity verification)**. Use a KYC workflow id.

**Recommended:** configure a webhook so your backend is notified when a verification decision is made. If you don't have one yet, create a webhook destination and add its signing secret to your `.env` as `DIDIT_WEBHOOK_SECRET` (see the Webhooks section below).

## Your Didit account

Put these two secrets in `.env.local` — server-side only (never commit, never ship to the browser):

```bash
DIDIT_API_KEY=XBhJu2kqoLbbav1JT3Pnx12aliOzRxdTJ_zzdn1ff4o
DIDIT_WEBHOOK_SECRET=<paste from console → Webhooks → signing secret>
```

Pass `workflow_id: d95c68c8-b199-46a7-843a-8004c6cfe7c4` — "Compliance workflow" in the body of each `POST /v3/session/` call. It's per-session config, not an env var.

## Selected stack

Target **Web (JS / TS)** (React · Vue · Next.js · vanilla). Use this surface only.

**Install:**

```bash
npm install @didit-protocol/sdk-web
```

**Open the verification (after your backend returns the session):**

```
import { DiditSdk } from "@didit-protocol/sdk-web";

// session.url comes from your backend POST /v3/session/
DiditSdk.shared.startVerification({ url: session.url });
```

---

# Integrate Didit into my application

You are integrating Didit into my application end-to-end. Didit is one API for KYC, KYB, AML screening, biometric verification, and transaction monitoring. (Coverage, pricing, and free-tier numbers are in the **Module catalogue** appendix — you don't need them to build.)

> If a **## Selected stack** block was prepended above this file, use its SDK install + client snippet for the client step; everything else here is unchanged.

---

## Summary

Verification runs in three moves:

1. **Backend** `POST`s a `workflow_id` to `https://verification.didit.me/v3/session/` (with your `x-api-key`) → gets back `{ url, session_id }`.
2. **Frontend** opens that `url` (SDK modal, iframe, or redirect) → the user completes verification on Didit's hosted flow.
3. **Didit** `POST`s a signed webhook (`Approved` / `Declined` / `In Review` / …) → you verify the HMAC and update your DB.

The API key never touches the browser. You only need two secrets in `.env`.

## Install

**No install needed for iframe, redirect, or REST-only integrations.** Install the SDK only if you want the in-page modal:

```bash
npm install @didit-protocol/sdk-web   # web modal only; skip for iframe / redirect / REST
```

## .env (only two secrets — nothing else)

```bash
DIDIT_API_KEY=         # long-lived API key for every https://verification.didit.me/v3/* call (x-api-key header)
DIDIT_WEBHOOK_SECRET=  # shared secret used to verify the X-Signature-V2 HMAC on incoming webhooks
```

> `workflow_id` is **NOT** an env var. It is chosen **per session** and passed in the create-session request body. Get it from the console (Workflows) or `GET /v3/workflows/`. It is a configuration value, not a secret — store it in code/config, e.g. a `WORKFLOW_ID` constant.

## Files to create (Next.js App Router default)

Adapt paths/idioms to my stack if it isn't Next.js — the three responsibilities (create-session route, webhook route, client trigger) are identical everywhere.

### 1. `app/api/verify/route.ts` — create a session server-side, return `{ url, session_id }`

```ts
import { NextResponse } from "next/server";

// Per-session config, NOT a secret and NOT an env var. Get a workflow_id from
// the console (Workflows) or GET /v3/workflows/, then paste it here.
const WORKFLOW_ID = "REPLACE_WITH_YOUR_WORKFLOW_ID";

export async function POST(req: Request) {
  // Identify the user from YOUR auth/session — never trust an id sent from the browser blindly.
  const { vendorData } = await req.json().catch(() => ({ vendorData: undefined }));

  const res = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": process.env.DIDIT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      vendor_data: vendorData ?? "internal-user-id", // your stable internal user id
      callback: "https://myapp.com/verify/done", // where Didit returns the user after the flow
    }),
  });

  if (!res.ok) {
    // 403 => missing/invalid/revoked x-api-key. Body: {"detail":"You do not have permission to perform this action."}
    const detail = await res.text();
    return NextResponse.json({ error: "session_create_failed", detail }, { status: 502 });
  }

  const session = await res.json(); // { session_id, session_token, url, status, workflow_id, vendor_data }
  // Return ONLY what the client needs. session_token is for native SDKs; url is for web/iframe/redirect.
  return NextResponse.json({ url: session.url, session_id: session.session_id });
}
```

### 2. `app/api/webhooks/didit/route.ts` — verify `X-Signature-V2`, handle the decision

```ts
// SKIM PATH: read the 6 numbered steps inside POST() below — that's the whole flow.
// The two helpers (shortenFloats, sortKeys) are load-bearing canonicalisation for the
// X-Signature-V2 HMAC; you don't need to parse them to follow the handler.
// NOTE: Didit ships no official webhook-verify helper — this hand-rolled
// canonicalisation IS the supported approach. Don't go hunting for an SDK util.
import crypto from "node:crypto";

// Whole-number floats (1.0) -> integers (1), recursively. Matches Didit's server canonicalisation.
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}

// Recursive lexicographic key sort (array order preserved).
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature-v2") ?? "";

  // 1. Canonicalise (shortenFloats -> sortKeys -> JSON.stringify with unescaped Unicode, the JS default).
  const parsed = JSON.parse(raw);
  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

  // 2. Constant-time HMAC-SHA256 compare against X-Signature-V2.
  const expected = crypto
    .createHmac("sha256", process.env.DIDIT_WEBHOOK_SECRET!)
    .update(canonical, "utf8")
    .digest("hex");
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return new Response("bad sig", { status: 401 });
  }

  // 3. Freshness — check the SIGNED `parsed.timestamp` field, never the unsigned
  //    `X-Timestamp` header: the header is excluded from the HMAC, so a caller can
  //    replay a captured (body, signature) pair with a freshened header and pass.
  const ts = Number(parsed.timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new Response("stale", { status: 401 });
  }

  // 4. Idempotency — dedupe on event_id (unique per delivery attempt). Use an atomic,
  //    durable store (a DB unique constraint or `SET NX` in Redis) so two concurrent
  //    retries can't both pass the check.
  if (await alreadyProcessed(parsed.event_id)) return new Response("ok");
  await markProcessed(parsed.event_id);

  // 5. Apply the decision. Status strings are case-sensitive literals.
  switch (parsed.status) {
    case "Approved":
      await setUserVerified(parsed.vendor_data, parsed.decision);
      break;
    case "Declined":
      await setUserDeclined(parsed.vendor_data, parsed.decision);
      break;
    case "In Review":
      await setUserPendingReview(parsed.vendor_data);
      break;
    case "Resubmitted":
      await reopenNodes(parsed.vendor_data, parsed.resubmit_info?.nodes_to_resubmit);
      break;
    case "Kyc Expired":
      await markReverificationNeeded(parsed.vendor_data);
      break;
    default:
      // "Not Started" | "In Progress" | "Awaiting User" | "Abandoned" | "Expired" — log/no-op.
      break;
  }

  // 6. Return 2xx within 5 seconds. Push heavy work to a queue if needed.
  return new Response("ok");
}

// Replace these stubs with an atomic, durable store (a DB unique constraint on
// event_id, or `SET NX` in Redis) so two concurrent retries can't both pass the check.
async function alreadyProcessed(_id: string) {
  return false;
}
async function markProcessed(_id: string) {}
async function setUserVerified(_v: string, _d: unknown) {}
async function setUserDeclined(_v: string, _d: unknown) {}
async function setUserPendingReview(_v: string) {}
async function reopenNodes(_v: string, _n: unknown) {}
async function markReverificationNeeded(_v: string) {}
```

### 3. `app/verify/VerifyButton.tsx` — minimal client "Verify" button (web SDK default)

```tsx
"use client";
import { DiditSdk } from "@didit-protocol/sdk-web";

export function VerifyButton() {
  async function start() {
    const res = await fetch("/api/verify", { method: "POST", body: JSON.stringify({}) });
    const { url } = await res.json();
    DiditSdk.shared.onComplete = (result) => {
      // result.status: "completed" | "cancelled" | "failed" — UI hint only.
      // The webhook is the source of truth for the verification decision.
      console.log("flow finished:", result.status);
    };
    DiditSdk.shared.startVerification({ url }); // opens the Didit modal
  }
  return <button onClick={start}>Verify my identity</button>;
}
```

Other presentation options for the same `url` (pick one):

| Pattern                      | Code                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Iframe (embedded)            | `<iframe src={url} allow="camera; microphone; fullscreen; autoplay; encrypted-media" />`     |
| Redirect (cross-device)      | `window.location.href = url`                                                                 |
| iOS / Android / RN / Flutter | `DiditSdk.startVerification(token: session_token)` — return `session_token` instead of `url` |

## ALWAYS / NEVER

**ALWAYS**

- Create sessions **server-side only**; the `x-api-key` lives on the backend.
- Send `x-api-key: $DIDIT_API_KEY` on every `https://verification.didit.me/v3/*` call.
- Pass `workflow_id` in the create-session **body** (per session), and a stable `vendor_data` (your internal user id).
- Treat the **webhook** as the source of truth — verify `X-Signature-V2` (HMAC-SHA256, constant-time compare), then enforce 300s freshness against the SIGNED `timestamp` field in the body.
- Canonicalise the webhook body as `shortenFloats` → `sortKeys` → `JSON.stringify` (unescaped Unicode) before HMAC.
- Dedupe on `event_id` using an atomic, durable store; compare status strings **case-sensitively**.
- Read the V3 **plural arrays** (`id_verifications[]`, `liveness_checks[]`, `face_matches[]`, …), indexing by `node_id`.
- Return `2xx` from the webhook within 5 seconds; offload heavy work.

**NEVER**

- Never ship `DIDIT_API_KEY` (or any secret) to the browser.
- Never put `workflow_id` in `.env` or treat it as a secret — it's per-session config.
- Never trust the SDK `onComplete` result or the `callback` redirect as proof of approval — only the verified webhook is authoritative.
- Never skip signature verification or the timestamp freshness check, and never derive freshness from the unsigned `X-Timestamp` header — it's excluded from the HMAC, so a replayed (body, signature) pair with a freshened header would otherwise pass.
- Never read the legacy **singular** decision keys (`aml`, `liveness`, `id_verification`, …) — they only ship for `webhook_version: "v2"` destinations.
- Never register a webhook on `localhost`/private IPs (SSRF guard rejects them — HTTPS public hostnames only).
- Never block the webhook response on slow downstream work.

## Verify before responding

- [ ] `DIDIT_API_KEY` and `DIDIT_WEBHOOK_SECRET` are read from env and never committed (only these two secrets).
- [ ] A `WORKFLOW_ID` is configured in code/config (not `.env`) and passed in the create-session body.
- [ ] `app/api/verify` creates the session server-side and returns `{ url, session_id }` only.
- [ ] The client opens the returned `url` (SDK / iframe / redirect) matching my stack.
- [ ] `app/api/webhooks/didit` does, in order: canonical V2 re-serialise → constant-time HMAC-SHA256 vs `X-Signature-V2` → freshness ≤ 300s against the SIGNED body `timestamp` (not the `X-Timestamp` header) → `event_id` idempotency → dispatch on `status` → `2xx` within 5s.
- [ ] DB update logic covers all statuses: `Not Started`, `In Progress`, `Awaiting User`, `In Review`, `Approved`, `Declined`, `Resubmitted`, `Abandoned`, `Expired`, `Kyc Expired` (exact, case-sensitive).
- [ ] No API key in the browser; decision logic trusts the webhook, not the client callback.
- [ ] User-facing consent/disclosure is shown before the verification `url` opens.

## Next steps

1. Register the webhook destination once (gets you `DIDIT_WEBHOOK_SECRET`) — see **Webhooks** below.
2. Create a Didit account programmatically if you don't have an `api_key` yet — see **Account** below.
3. Pick/confirm a `workflow_id` (console → Workflows, or `GET /v3/workflows/`).
4. Run the flow end-to-end; inspect deliveries and the full decision JSON via `GET /v3/session/{id}/decision/`.
5. Add only the modules you need (AML, NFC, POA, Age, Phone/Email, KYB, transactions) — see the **Module catalogue**.

---

# Reference appendix

Everything below is accurate detail for when you need more than the core flow. Skim it; don't paste it blindly.

## Base URLs

| Surface                                                                                                                                          | Base URL                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Verification API — every `/v3/...` endpoint (sessions, workflows, lists, billing, webhook destinations, entities, transactions, standalone APIs) | `https://verification.didit.me`           |
| Auth / account-management API (`/auth/v2/programmatic/...`, `/auth/v2/organizations/...`)                                                        | `https://apx.didit.me`                    |
| Console (human UI)                                                                                                                               | `https://business.didit.me`               |
| Hosted verification URL handed to end users                                                                                                      | `https://verify.didit.me`                 |
| Docs (cross-check anything)                                                                                                                      | `https://docs.didit.me`                   |
| OpenAPI spec (verification API)                                                                                                                  | `https://docs.didit.me/openapi-25.json`   |
| OpenAPI spec (auth + apps)                                                                                                                       | `https://docs.didit.me/openapi-auth.json` |

## Account — create one programmatically (only if you have no `api_key`)

Two API calls. No browser. No 2FA. Returns an `api_key` you use for every verification API request.

```bash
# 1) Register — creates a pending account + emails a 6-character code (15 min TTL).
#    Password rules: >=8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special (!@#$%^&*()_+-=[]{}|;:,.<>?)
#    Use a REAL inbox. Reserved test domains (@example.com, @example.org, @*.test, @*.example, @*.invalid)
#    are refused by mail delivery and the call returns 500.
curl -X POST https://apx.didit.me/auth/v2/programmatic/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "you@yourdomain.com", "password": "StrongP@ss1"}'
# 201 -> {"message": "Registration successful...", "email": "you@yourdomain.com"}

# 2) Verify email with the code from the inbox — returns api_key, JWT tokens, org, app.
curl -X POST https://apx.didit.me/auth/v2/programmatic/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{"email": "you@yourdomain.com", "code": "A3K9F2"}'
# 200 -> {
#   "access_token": "...", "refresh_token": "...", "expires_in": 86400,
#   "organization": { "uuid": "..." },
#   "application":  { "uuid": "...", "client_id": "...", "api_key": "..." }
# }
# Persist response.application.api_key as DIDIT_API_KEY — your only long-lived secret.
```

If you lose the key, log in again with `POST /auth/v2/programmatic/login/` (same body as register) → `GET /auth/v2/organizations/me/` → `GET /auth/v2/organizations/me/{org_id}/applications/{app_id}/` and read `api_key`.

**Auth failure shape (every `/v3/...` endpoint).** Missing, malformed, or revoked `x-api-key` → **HTTP 403**:

```json
{ "detail": "You do not have permission to perform this action." }
```

There is no machine-readable discriminator — handle missing/expired/wrong-app cases uniformly (re-check env or rotate the key in the console).

## Workflows — create or reuse (provides the per-session `workflow_id`)

A workflow defines which modules run during a session and the per-feature thresholds. Create one via API (or `https://business.didit.me` → Workflows → Create).

```bash
# List existing workflows (newest first; unpaginated).
curl https://verification.didit.me/v3/workflows/ -H "x-api-key: $DIDIT_API_KEY"

# Create a new KYC workflow.
# - features[] entries are objects: { "feature": "<UPPERCASE_ENUM>", "config": { ... } }
# - The config block is optional per feature; sensible defaults apply.
# - workflow_type defaults to "kyc"; set "kyb" for business onboarding.
curl -X POST https://verification.didit.me/v3/workflows/ \
  -H "x-api-key: $DIDIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_label": "Standard KYC",
    "features": [
      { "feature": "OCR" },
      { "feature": "LIVENESS", "config": { "face_liveness_method": "PASSIVE" } },
      { "feature": "FACE_MATCH" },
      { "feature": "IP_ANALYSIS" }
    ]
  }'
# 201 -> response.uuid is the published version uuid; response.workflow_id is the
# stable identifier you pass per session to POST /v3/session/ (in the body, NOT as an env var).
```

Feature enum values (UPPERCASE):

- **KYC features:** `OCR`, `NFC`, `LIVENESS` (`face_liveness_method`: `PASSIVE` | `ACTIVE_3D` | `FLASHING`), `FACE_MATCH`, `AGE_ESTIMATION`, `PHONE_VERIFICATION`, `EMAIL_VERIFICATION`, `DATABASE_VALIDATION`, `AML`, `IP_ANALYSIS`, `PROOF_OF_ADDRESS`, `QUESTIONNAIRE`.
- **KYB features:** `KYB_REGISTRY`, `KYB_DOCUMENTS`, `KYB_KEY_PEOPLE` (each plus `AML` / `DATABASE_VALIDATION` as needed).

For a KYB workflow set `"workflow_type": "kyb"`. Workflow type is locked at creation — create separate workflows per kind.

## Create-session — full field reference

```bash
curl -X POST https://verification.didit.me/v3/session/ \
  -H "x-api-key: $DIDIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "your-workflow-id",
    "vendor_data": "internal-user-id",
    "callback": "https://myapp.com/done"
  }'
```

Successful response (201 Created):

```json
{
  "session_id": "4c5c7f3a-...",
  "session_token": "eyJ...",
  "url": "https://verify.didit.me/session/...",
  "status": "Not Started",
  "session_kind": "user",
  "workflow_id": "...",
  "vendor_data": "internal-user-id"
}
```

`vendor_data` is **your internal user ID** — Didit links the session to a User entity (auto-created if new). For KYB workflows it links to a Business entity. Use `url` for web (SDK/iframe/redirect); use `session_token` for native mobile SDKs.

**Optional create-session fields:**

| Field                | Type                                                                            | Notes                                                                                      |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `callback_method`    | `"initiator"` \| `"completer"` \| `"both"`                                      | Which side of a cross-device flow receives the `callback` redirect. Default `"initiator"`. |
| `metadata`           | object                                                                          | Arbitrary JSON; echoed back on every webhook for this session.                             |
| `language`           | ISO 639-1 string                                                                | Locks the hosted UI to that language (defaults to browser detection).                      |
| `contact_details`    | `{ email, send_notification_emails, email_lang, phone }`                        | Lets Didit email or SMS the user a hosted-flow link.                                       |
| `expected_details`   | `{ first_name, last_name, date_of_birth, id_country, expected_document_types }` | Sanity-checks document data against what your app already knows.                           |
| `vendor_business_id` | string                                                                          | KYB only — your internal business identifier.                                              |

## SDK table (full — the core uses the web SDK; pick the one matching my surface)

| Stack                                               | Package                            | Install                                                                                             |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Web (React, Vue, Next.js, Nuxt, Svelte, vanilla JS) | `@didit-protocol/sdk-web`          | `npm install @didit-protocol/sdk-web`                                                               |
| iOS (Swift / SwiftUI / UIKit)                       | `DiditSDK`                         | SPM: `https://github.com/didit-protocol/sdk-ios` · CocoaPods: `pod 'DiditSDK'`                      |
| Android (Kotlin / Jetpack Compose)                  | `me.didit:didit-sdk`               | Maven (custom repo: `https://raw.githubusercontent.com/didit-protocol/sdk-android/main/repository`) |
| React Native (Expo or bare, RN 0.76+)               | `@didit-protocol/sdk-react-native` | `npm install @didit-protocol/sdk-react-native`                                                      |
| Flutter (3.3+, Dart 3.11+)                          | `didit_sdk`                        | `flutter pub add didit_sdk`                                                                         |
| Backend-only / batch / custom UI                    | none — call REST directly          | —                                                                                                   |

- Web: `DiditSdk.shared.startVerification({ url })` (pass the create-session `url`).
- Native (iOS/Android/RN/Flutter): `DiditSdk.startVerification(token: session_token)` (pass the create-session `session_token`).
- Always prefer native iOS / Android SDKs over WebView on mobile (NFC + camera + biometrics work natively; NFC needs iOS 15+).

## Webhooks — register the destination and verify deliveries

**Register the webhook destination once** (returns the secret to store as `DIDIT_WEBHOOK_SECRET`):

```bash
curl -X POST https://verification.didit.me/v3/webhook/destinations/ \
  -H "x-api-key: $DIDIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Production session webhooks",
    "url": "https://myapp.com/api/webhooks/didit",
    "webhook_version": "v3",
    "subscribed_events": ["status.updated", "data.updated"]
  }'
```

Response includes `secret_shared_key` — save as `DIDIT_WEBHOOK_SECRET` immediately. Use `webhook_version: "v3"` for all new integrations (plural arrays). The `(application, url)` pair must be unique — POSTing the same URL twice returns 400.

**Cloudflare / restrictive firewall users:** allowlist `18.203.201.92` (Didit's webhook egress IP, User-Agent `DiditWebhook/2.0 +https://didit.me`). HTTPS only, public hostnames only (no localhost / private CIDRs — SSRF guard).

**Three signature headers** ship on every webhook. Verify **one** — `X-Signature-V2` is recommended because it survives JSON middleware re-encoding:

| Header                         | What it signs                                                                 | When to use                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-Signature-V2` ★ recommended | `JSON.stringify(sortKeys(shortenFloats(parsed_body)))` with unescaped Unicode | Default — works through Express / Django / FastAPI / Next.js body parsers                                                                      |
| `X-Signature`                  | The raw request bytes verbatim (`sort_keys=True, ensure_ascii=True`)          | Only if you can guarantee no middleware re-encodes the body                                                                                    |
| `X-Signature-Simple`           | `"{timestamp}:{session_id}:{status}:{webhook_type}"`                          | Fallback only — does NOT authenticate `decision`, so treat decision data as untrusted unless you re-fetch via `GET /v3/session/{id}/decision/` |

**Endpoint requirements (in order):** parse JSON → canonicalise (`shortenFloats` → `sortKeys` → `JSON.stringify`, unescaped Unicode) → `HMAC-SHA256(DIDIT_WEBHOOK_SECRET, canonical, "utf8")` → constant-time compare against `X-Signature-V2` → reject if `abs(now - body.timestamp) > 300` (the SIGNED body field — never the unsigned `X-Timestamp` header, which a replayed request can freshen without invalidating the signature) → dispatch on `webhook_type`/`status` → return `2xx` within 5s (timeout is 5s; retries on 5xx/404 twice, ~1 min then ~4 min). The Node/Next.js implementation is in the core above.

**Webhook event types** (exact strings in `subscribed_events` — no wildcard):
`status.updated`, `data.updated`, `user.status.updated`, `user.data.updated`, `business.status.updated`, `business.data.updated`, `activity.created`, `transaction.created`, `transaction.status.updated`.

**Session webhook envelope (V3):**

```json
{
  "event_id": "uuid",
  "webhook_type": "status.updated",
  "timestamp": 1774970000,
  "created_at": 1774969994,
  "application_id": "uuid",
  "session_id": "uuid",
  "status": "Approved",
  "workflow_id": "uuid",
  "workflow_version": 4,
  "vendor_data": "internal-user-id",
  "metadata": { "any": "json" },
  "decision": {
    /* present on Approved | Declined | In Review | Abandoned */
  }
}
```

KYB sessions additionally include `business_session_id`, `session_kind: "business"`, and `vendor_business_id`. `status: "Resubmitted"` carries `resubmit_info: { nodes_to_resubmit: [...], reasons: { node_id: "why" } }` instead of `decision`.

The literal session status strings are exactly: `"Not Started"`, `"In Progress"`, `"Awaiting User"`, `"In Review"`, `"Approved"`, `"Declined"`, `"Resubmitted"`, `"Abandoned"`, `"Expired"`, `"Kyc Expired"` (mixed-case literal). Compare case-sensitively.

**The `decision` object holds per-module plural arrays** (V3 schema — each entry keyed by its `node_id` in the workflow graph):

- `id_verifications[]`: `first_name`, `last_name`, `document_type`, `document_number`, `date_of_birth`, `nationality`, `expiration_date`, `issuing_state`, `address`, `parsed_address`, `mrz`, `front_image_quality_score`, `back_image_quality_score`, `warnings[]`
- `nfc_verifications[]`: `status`, `document_type`, `mrz`, `signature_status`, `chip_data`
- `liveness_checks[]`: `status`, `score` (0–100), `method` (`"active"` | `"passive"` — lowercase in the response; the workflow config enum is uppercase `PASSIVE` / `ACTIVE_3D` / `FLASHING`), `reference_image`, `video_url` (active mode only), `face_quality`, `face_luminance`
- `face_matches[]`: `status`, `score` (0–100), `source_image`, `target_image`, `warnings[]`
- `phone_verifications[]`: `status`, `phone_number`, `carrier`, `is_disposable`, `is_virtual`
- `email_verifications[]`: `status`, `email`, `is_breached`, `is_disposable`, `is_undeliverable`, `breaches[]`
- `poa_verifications[]`: `status`, `document_type`, `issuer`, `poa_address`, `poa_parsed_address`, `issue_date`, `expiration_date`
- `aml_screenings[]`: `status`, `total_hits`, `hits[]` (`pep_matches`, `sanction_matches`, `warning_matches`, `adverse_media_matches`), `entity_type` (`"person"` | `"company"`)
- `ip_analyses[]`: `status`, `ip_address`, `country`, `vpn`, `proxy`, `tor`, `hosting`, `risk_score`
- `database_validations[]`: `status`, `provider`, `match_type`, `fields_matched`
- `questionnaire_responses`: nullable object keyed by question `node_id` → answer
- `reviews[]`: manual-review audit trail (analyst, action, comment, timestamp)
- KYB-only: `registry_checks[]`, `document_verifications[]`, `key_people_checks[]`

For the full per-feature field reference see `https://docs.didit.me/reference/data-models`.

V2 → V3 migration: V2 used singular keys (`aml`, `phone`, `email`, `poa`, `id_verification`, `nfc`, `liveness`, `face_match`). V3 renamed them to plural arrays so a single workflow can run the same module multiple times on different nodes — always index by `node_id`. Do **not** read the legacy singular fields; they only ship when a destination is explicitly pinned to `webhook_version: "v2"`.

**Idempotency & retries.** Session and transaction webhooks dedupe on `event_id` (unique per delivery attempt; fallback compound key `session_id + webhook_type + timestamp`). On 5xx/404 Didit retries up to **2 times** (~1 min, then ~4 min); the outbound HTTP timeout is 5s. After the second retry the delivery is dropped — replay from the **Deliveries** tab in the console. Always return `2xx` immediately, even when processing is async.

## Decision → database state machine (reference)

```ts
switch (event.status) {
  case "Approved":
    user.verified = true;
    user.verifiedAt = new Date();
    storeDecision(event.decision);
    break;
  case "Declined":
    user.verificationStatus = "declined";
    logWarnings(event.decision);
    break;
  case "In Review":
    user.verificationStatus = "pending_review";
    break;
  case "In Progress":
    user.verificationStatus = "in_progress";
    break;
  case "Awaiting User":
    user.verificationStatus = "awaiting_user";
    break; // KYB only — waiting for a UBO / officer KYC sub-session
  case "Resubmitted":
    reopenNodes(event.resubmit_info.nodes_to_resubmit);
    break; // reviewer asked the user to retry specific steps
  case "Abandoned":
    scheduleReminderEmail(user);
    break; // decision may still be present with partial data
  case "Expired":
    break; // session URL aged out before the user finished
  case "Kyc Expired":
    user.verified = false;
    createNewSession(user);
    break; // verified user's KYC has aged out per retention policy
  case "Not Started":
    break;
}
```

## Module catalogue (use whichever ones match my use case)

Coverage: 220+ countries, 14,000+ document types, 48+ languages. Pricing is pay-per-call from $0.30, with 500 free verifications per core feature per month, no minimums, no contract.

| Module                                                                                              | Endpoint                                         | Price               | Free tier            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------- | -------------------- |
| Core KYC bundle (ID + Liveness + Face Match + IP)                                                   | session w/ workflow                              | **$0.30**           | 500/mo (per feature) |
| ID Verification (standalone)                                                                        | `POST /v3/id-verification/`                      | $0.20               | 500/mo               |
| Passive Liveness (standalone)                                                                       | `POST /v3/passive-liveness/`                     | $0.05               | 500/mo               |
| Active Liveness (`ACTIVE_3D` / `FLASHING`)                                                          | session-only                                     | $0.15               | —                    |
| Face Match 1:1                                                                                      | `POST /v3/face-match/`                           | $0.05               | 500/mo               |
| Face Search 1:N                                                                                     | `POST /v3/face-search/`                          | $0.05               | —                    |
| Age Estimation                                                                                      | `POST /v3/age-estimation/`                       | $0.10               | —                    |
| AML Screening                                                                                       | `POST /v3/aml/`                                  | $0.20               | —                    |
| Ongoing AML Monitoring                                                                              | org-level continuous (per active user/yr)        | $0.07 / user / year | —                    |
| Database Validation (gov registries)                                                                | `POST /v3/database-validation/`                  | variable            | —                    |
| Proof of Address                                                                                    | `POST /v3/poa/`                                  | $0.20               | —                    |
| Email Verification                                                                                  | `POST /v3/email/send/` + `POST /v3/email/check/` | $0.03               | —                    |
| Phone Verification (SMS / WhatsApp / voice / RCS / Telegram)                                        | `POST /v3/phone/send/` + `POST /v3/phone/check/` | $0.04 + carrier     | —                    |
| NFC Verification (native SDKs only)                                                                 | session module                                   | $0.15               | —                    |
| Biometric Authentication (re-auth)                                                                  | session module                                   | $0.10               | —                    |
| Device & IP Analysis                                                                                | session module                                   | $0.03               | —                    |
| Custom Questionnaire                                                                                | session module                                   | $0.10               | —                    |
| Business Verification (KYB)                                                                         | `POST /v3/session/` w/ KYB workflow              | $2.00               | —                    |
| Company AML Screening                                                                               | KYB module                                       | $0.20               | —                    |
| Person AML (per UBO / officer)                                                                      | KYB module                                       | $0.20               | —                    |
| Transaction Screening (rule engine)                                                                 | `POST /v3/transactions/`                         | $0.02 / tx          | —                    |
| Wallet Verification & Screening (counterparty sanctions + wallet risk via Crystal / Merkle Science) | inside `/v3/transactions/`                       | $0.15 / tx          | —                    |
| Reusable KYC (share verified user across partners)                                                  | session feature                                  | Free                | —                    |
| White Label                                                                                         | workflow option                                  | $0.20               | —                    |

## Operational APIs your code should know

| Action                                                        | Endpoint                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Read full decision JSON                                       | `GET /v3/session/{sessionId}/decision/`                                                               |
| List sessions (filter by status, workflow, vendor_data, date) | `GET /v3/sessions` (no trailing slash)                                                                |
| Manually approve / decline / request review                   | `PATCH /v3/session/{sessionId}/update-status/`                                                        |
| Patch metadata or extracted KYC/POA/NFC data                  | `PATCH /v3/session/{sessionId}/update-data/`                                                          |
| Download compliance PDF                                       | `GET /v3/session/{sessionId}/generate-pdf`                                                            |
| Delete a single session (GDPR / cleanup)                      | `DELETE /v3/session/{sessionId}/delete/`                                                              |
| Batch delete sessions                                         | `POST /v3/sessions/delete/`                                                                           |
| Mint a Reusable KYC share token                               | `POST /v3/session/{sessionId}/share/`                                                                 |
| Redeem a Reusable KYC share token                             | `POST /v3/session/import-shared/`                                                                     |
| Submit a transaction for monitoring                           | `POST /v3/transactions/`                                                                              |
| List / create lists (blocklist, allowlist, custom)            | `GET/POST /v3/lists/`                                                                                 |
| Add entry to a list                                           | `POST /v3/lists/{list_uuid}/entries/`                                                                 |
| Upload a face image to a blocklist                            | `POST /v3/lists/{list_uuid}/entries/face-upload/`                                                     |
| Check credit balance                                          | `GET /v3/billing/balance/`                                                                            |
| Top up credits (returns Stripe checkout URL)                  | `POST /v3/billing/top-up/`                                                                            |
| List / get / update / delete vendor users                     | `GET /v3/users/`, `GET/PATCH /v3/users/{vendor_data}/`, `POST /v3/users/delete/`                      |
| List / get / update / delete vendor businesses                | `GET /v3/businesses/`, `GET/PATCH /v3/businesses/{vendor_data}/`, `POST /v3/businesses/delete/`       |
| List / create / update / delete webhook destinations          | `GET/POST /v3/webhook/destinations/`, `GET/PATCH/DELETE /v3/webhook/destinations/{destination_uuid}/` |

Every `/v3/...` endpoint above is served from `https://verification.didit.me` and authenticates with `x-api-key`. Auth/registration is the only surface on `https://apx.didit.me`.

## When you need more detail

- API root: `https://verification.didit.me/v3/` (everything `/v3/`). Auth only: `https://apx.didit.me/auth/v2/programmatic/`.
- Sessions overview: `https://docs.didit.me/sessions-api/overview`
- Create session: `https://docs.didit.me/sessions-api/create-session`
- Retrieve session decision: `https://docs.didit.me/sessions-api/retrieve-session`
- Standalone APIs index: `https://docs.didit.me/standalone-apis/id-verification`
- Programmatic registration: `https://docs.didit.me/integration/programmatic-registration`
- AI agent / MCP integration: `https://docs.didit.me/integration/ai-agent-integration`
- Webhooks reference: `https://docs.didit.me/integration/webhooks`
- Verification statuses (literal API strings): `https://docs.didit.me/integration/verification-statuses`
- Data models (canonical V3 schema for every `decision.*` array): `https://docs.didit.me/reference/data-models`
- SDKs overview: `https://docs.didit.me/integration/sdks`
- Full OpenAPI 3 spec (verification API): `https://docs.didit.me/openapi-25.json`
- Auth + apps OpenAPI: `https://docs.didit.me/openapi-auth.json`
- MCP server config (drop into `.cursor/mcp.json`, `claude_desktop_config.json`, or equivalent). The hosted server signs in with OAuth in the browser, so no credentials go in the file:

```json
{
  "mcpServers": {
    "didit": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.didit.me/mcp"]
    }
  }
}
```

To run it locally (stdio) instead, use the npm package: `"command": "npx", "args": ["-y", "@didit-protocol/mcp-server"]`, with `"env": { "DIDIT_ACCESS_TOKEN": "user-access-token" }` or no token (the agent then signs in with `didit_account_login`, plus `didit_account_verify_2fa` when the account has 2FA).

The MCP server exposes 40+ tools spanning auth, sessions, workflows, questionnaires, users, billing, blocklist, and every standalone API — see `https://docs.didit.me/integration/ai-agent-integration` for the full tool catalogue.

---

Now build it: if my stack is unstated, ask once, then ship all three files.
. Note : if user pew balance is lower than the verification pew balance ask user if he/she will pay later if yes continue and create negative balance on the pew balance which will paid or balanced first on any deposit or gift recieved  if no redirect to manual method with hint that while submission is allowed admin will still effect fee on approval.Now if user applied and submited for KYC alone,  using app manual method , user agree all terms conditions .  The KYC fee is 1.4pew irrespective of method of application (admin can adjust this fee on control dashboard, also this KYC can be revoked by admin and user can reapply. KYC is for app internal use case so status of KYC should not be seen by others only a user can see that he/she is KYC verified,  but this is not same for verification badge as it validate the user publicly) admin can award this KYC bypass the  fee by using the assign directly privilege , meaning only super admin or admin can assign/ remove or revoke KYC or verification badge directly. update that when KYC or verification badge application is submitted by a user, and when the approval manager or admin click approve the wallet of the user is auto debited the amount for KYC, or the amount for the class/type of badge, if balance is low it approval won't work but says low pew balance, the manager/ admin can decide to approve it next time or leave the application till later, or rejected the application with manual reason written as low pew balance for the badge type applied.


(Note : KYC is for individual profile not pages, pages can only apply for badges. verifcation fee for badges across individual profile and pages remains are already set and can be adjusted by admin and applies on application irrespective of method of application.) 

- the application page for verification should be  adjusted  to include needed details of applicants for the KYC ( full name , iD; type only ( government ID) if manual  application, upload sentence photo: write the sentence provided by admin on paper hold close to the face snap and upload.  The default sentence is; my name is -----( applicant name) I'm resident of ( ----) my ID type and number is --- and --- and I confirm all to be true . Signature ------ , date ---- . 
Note admin can change or edit this sentence .  
 Sound a very critical bold warning that admin can ask for extra verification through  support chat , chat message , email and can request live channel be it call or video. 

- Name used on  KYC / must match  name submitted or used in p2p or withdrawal .
(Note : Unless users with privileges then this does not apply. )

- for business badge application: the application is manual but the application page must contain ownership details filling and standard ownership rights and share details along needed informations , upload all corporate files , tax, etc file. 
- the rightfull owner which should have 25 - 100% and considered major owner, or the  authorised entity or person (s),  filling for this badge unbehalf of this business must be KYC verified and have active badge.

- the government badge application is manual and classified. The applicant fill in institution name or agency,  the position/rank of you the applicant 
Upload all supporting documents to the application.

Read and agree the terms for government pages : all fees applies , also  only user with verified badge can apply this in their behalf. 

On individual/government badge application. A hint info that individual that are in government can update their badge to government badge . They should contact support. All T&C's applies

- on trade  sellers username should not be shown if  trading with another user who does have such seller privilege or manager,admin privileges . 
Let displayed name show 

- when a user is  filling details on withdrawal using p2p  the name provided on KYC is auto filled and  cannot be edited, but if user is not KYC verified . A very very Tiny KYC  verify button show red and tickles besides name  text box telling user to KYC verify so that legal payment name can be populated. The button takes user to verification page in profile. 
- unless edited, Reason for payment deposit/ withdrawal: should always default as viorp top up/  , earnings/ gifts withdrawal. Also seller can drop note on terms for the buyer or user paying to the provided account on withdrawal p2p.
. For users with verified badge already without KYC , the  same KYC request and process should trigger and suffice so that they can update and provide legitimate name and details to used during transaction especially withdrawal.
   
- create a special privilege where a seller can edit account name to be paid in .  Note only admin can assign this privilege to any user. If this is not assigned default sellers KYC name applies. 

Everyone can add fund using P2P
 The p2p trade chat should not mix with chat message chat , they are different what, The seller name displayed on trade chat should be displayed name not username only admin can permit seller username to display if not never should it ,I want seller privacy protection so nothing clicked should to seller profile or chat  or any other in app. but seller can access the buyer or any user provided he/she doesn't have seller privilege . any agent/support that would enter trade chat on dispute should also supposed to have set his/ her displayed name, if not the  support followed by their user name would default.

-anytime a user  login or even if the user is on another feature and there is gift sent, or any credit, money should rain on the screen, the wallet icon should indicate unread and unread income or gift state with best wallet interactives.

- the P2P trading on sidebar on feed.vue should be renamed P2P  Network and the tab should have counts of active trades.
Refactor and redesign the Trade Chat component ;   Requirements:Attachment & Media Upload:Add an attachment button (paperclip/plus icon) inside the input toolbar.Allow users to upload photos (PNG, JPG), screenshots, screen recordings (MP4, WEBM), and documents (PDF).Include a file picker drawer/modal with options: Take Photo/Video, Upload File/Image, Paste Screenshot.Display a pre-send preview thumbnail area for selected media with a remove/cancel option.UI & Styling Improvements:Replace the rigid box design with a modern, full-width responsive chat box.   Redesign the message input bar to combine [Attachment Button] [Text Input] [Send Button] seamlessly in one toolbar.   Modernize the active/disabled states for the Send button.   Improve empty state UX for "No messages yet." with an icon/illustration and helpful prompt (e.g., "Communicate with the seller or attach payment proof here").Add distinct chat bubbles for sent vs. received messages, including timestamps and read/delivered status icons.Output Required:Provide clean, modular frontend code (React / Tailwind CSS / HTML) and file upload handler logic.

viorp tech G : - create creators analysts : only admin , manager can see the tab on profile since it's still in development: all miss matched figures should be aligned, admin control is important in any missing place

Your objective is to architect, design, and code the Creator Analytics Dashboard, Ad Revenue Share Telemetry Loop, and Administrative Controls tailored exactly to our app's structure and monetization requirements.

REVISED CAPABILITY MATRIX & SYSTEM CONSTRAINTS
Platform Payout Rule: There are NO static platform pool payments. Creators receive a configured, fixed percentage share ("set% share") of ad revenue generated exclusively when a user triggers an Engaged View (>= 6 seconds) AND actively interacts with or completes an ad render during that window.
Free Tier Utilities: Chat Messaging, Wallet transfers/logs, and Pages/Posts are strictly utility modules and do not generate or consume revenue.
Network Scale Gate: Programmatic SDK initializations for Monetag and Appodeal are explicitly PAUSED in code. They must remain deactivated until the platform's overall metrics cross the 10,000 Daily Active Users (DAU) milestone.
LAYER 1: DATA TELEMETRY & MULTI-TIER VIEW SCHEMA
The data tracking layer must pair media playback runtime tightly with ad network event callbacks. Structure your data models and ingestion hooks to log:

view_id, video_id, creator_id, viewer_id
watch_time_seconds (float)
is_engaged_view (boolean, triggers true at >= 6.0 seconds or 100% video completion)
ad_interacted (boolean, validated via client-side Ad SDK callback event)
raw_ad_revenue (decimal, incoming ad server callback postback value)
creator_payout_share (decimal, calculated strictly on the backend as: raw_ad_revenue * platform_set_percentage_share)
LAYER 2: THE FRONTEND CREATOR STUDIO (NUXT / VUE 3)
Develop modular, touch-responsive Vue 3 views optimized for low-overhead performance in Capacitor native web views. Group insights under clean, scannable subheadings:

A. Monetized Veep Performance Grid
Total Video Plays: Public-facing counter visible on the profile's 3-column Veep tab thumbnail.
Ad-Interacted Engaged Views: The exact volume of views that met the 6-second marker AND successfully tracked an ad interaction.
Wallet Revenue Ledger: A read-only transactional stream showing incoming ad-share distributions mapped directly to specific video IDs.
B. Retention & Monetization Efficiency Analytics
Audience Drop-Off Curve: A line chart displaying video runtime vs. retention. Superimpose a distinct vertical visual indicator on the chart at the 6-second mark to show the creator exactly what percentage of their audience reaches the ad-monetization window.
LAYER 3: ADMINISTRATIVE PANEL & NETWORK CONTROL HOOKS
Create a secure dashboard interface reserved for system administrators. Integrate the following handlers into the pipeline:

A. DAU Gating & Ad Network Activation Studio
Active DAU Monitor: Real-time calculation system tracking unique user device tokens or authentication requests over a rolling 24-hour window.
Network Initialization Logic: Enforce a hard gateway check in your boot configurations: if (global_platform_dau < 10000) { disable_monetag_appodeal = true; serve_fallback_house_ads = true; }
Platform Revenue Share Configuration: An admin interface setting to update the global set% share paid to creators (e.g., changing the creator cut from 50% to 60%).
B. View Padding Adjustments
Public View Offset Configuration: Interface to inject a baseline flat metric booster (+500 views, +1000 page reads) to public video thumbnails on the profile grid. The calculation engine must process public views as: displayed_public_views = actual_views + admin_padding_offset. This modifier must never touch, alter, or inflate the ad-interacted wallet payout ledger.
PIPELINE DELIVERY EXPECTATIONS
When processing instructions from this prompt:

Deliver clean, modular Vue 3 scripts using <script setup> syntax styled with Tailwind CSS.
Ensure ad network callbacks hook natively via Capacitor plugin interfaces.
Explicitly comment on how the system verifies that is_engaged_view and ad_interacted are both true before modifying any Wallet variables.
Your objective is to design and code the Ad Network Selection Engine, CPM Payout Math System, and Admin Render Rate rules matching our explicit monetization criteria.

CORE LOGICAL LAWS & CONSTRAINTS
Monetization Trigger: Payout calculations occur ONLY when an Engaged View (>= 6.0 seconds) successfully fetches, fills, and renders an ad frame.
The CPM Payment Law: Ad networks pay per 1,000 views (eCPM). Individual view credits must be computed as fractional micro-payments based on a configured eCPM value.
Scale Gating Rules:
If current DAU < 6,000: Block third-party SDK calls (Monetag, Appodeal). Force internal 'House Ads'.
If current DAU >= 6,000: Execute third-party ad mediation waterfalls.
LAYER 1: DATA SCHEMAS & CALCULATED CPM PAYOUT MATH
The database architecture must handle micro-precision floats to protect against rounding errors on single impressions. Implement this explicit mathematical payout model:

System Variable: platform_set_share (e.g., 0.60 for a 60% creator split to be set by admin)
Ad Variable: network_ecpm (The Effective Cost Per 1,000 impressions returned by the ad network or set by admin, e.g., $2.00 to )
Formula for Single Play Payout: single_view_revenue = network_ecpm / 1000 creator_wallet_credit = single_view_revenue * platform_set_share
Ensure the database schema records:

ad_request_id (UUID), video_id, creator_id
ad_type_served (enum: 'interstitial', 'rewarded', 'native_banner', 'house_ad', 'none')
network_source (enum: 'monetag', 'appodeal', 'internal_house')
fill_status (enum: 'requested', 'filled', 'rendered_failed', 'no_ad')
current_network_ecpm (decimal, scale 4)
wallet_credit_amount (decimal, scale 8 - for processing micro-cents safely)
LAYER 2: THE RENDERING RULES ENGINE (WATERFALL & FILL TIMEOUTS)
Write the client-side lifecycle wrapper within the Vue 3 / Capacitor component to manage media playback injection rules:

Step 1: At second 6 of playback, suspend or overlay the video state. Fire an asynchronous client ad request event.
Step 2: Evaluate DAU. If < 6k, request an internal House Ad asset from the asset cache database. If >= 6k, ping the programmatic SDK mediation layer.
Step 3: Implement a Render Time-out Limit (Max 3.5 seconds). If the ad network fails to deliver a 'Filled' event callback before the timeout expires, catch the error, change fill_status to 'no_ad', and instantly resume video playback without modifying the creator's wallet data.
Step 4: If an ad successfully fires its 'Rendered/Completed' callback, dispatch a secure webhook signed by a backend token to queue the wallet adjustment script.
LAYER 3: ADMINISTRATOR TECH OVERRIDES HUB
Provide explicit configuration management settings for platform control:

A. Ad Configuration & CPM Optimization
Base Network eCPM Modifier: An admin input canvas setting custom baseline eCPM estimates per country region or ad format tier (e.g., setting Interstitials to $2.00 eCPM, and Native Banners to $1.50 eCPM) used to calculate wallet allocations during programmatic callback delays.
Creators' Custom Payout Percentage Cut: A central administrative global variable input (set% share) determining platform vs. user revenue distribution.
B. Render Rate & Traffic Delivery Diagnostics
Render-Rate Traffic Metric Panels: Real-time visual data displaying: Render Rate % = (Total Rendered Ads / Total Ad Requests) * 100
Fill Failure Alarms: System diagnostics reporting how many requests hit the timeout threshold resulting in an absolute 'No Ad' delivery state.
PIPELINE DELIVERY EXPECTATIONS
Deliver clean Nuxt 3 server endpoints (/server/api/ad-revenue-processor.ts) utilizing precise big-decimal mathematics to handle micro-cent wallet updates securely.
Deliver Vue 3 frontend composition logic tracking playback time, firing ad overlays, and managing the 3.5-second ad-load timeout fallback chain seamlessly inside native web views.
