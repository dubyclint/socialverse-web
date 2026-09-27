// instrucion: RePlan, only add or improve what is missing or needed .The Delvin should not waste token on just test but also apply Delvin fusion rule. the feed.vue is the base file for reading. At the feed.vue ,the posts / feed , box or container page view  are not good on web mobile view as the the head section having the photo, name , username  timestamp and the hamburger icon is scattered in web mobile view instead of arranged horizontaly stayed across web and device for uniformity and space. but good on desktop.  Very  important to fix is that the body which have the file content or photo should cover huge area space for good visibility. the head section and footer should be adjusted in size to give good view space post contents . Some  post  photo are not full on desktop but okay on phone. You must study the Facebook post/feed box view to apply it better here. the following are not working or wired well or functional; delete post, repost, edit is not working for change of post photo,  MP4 cannot be posted  fix that  to work 10mb max . During posting user  backend info are exposed. Make  icons unclick and  click and display counts , let it count  likes, comments, comments, share, gift. show user list for likes , let comment on the post page not take user to another page to write  but let drop down to write also to see all  comment section  and reply any other users.let all icon show.
The desktop view have at the end of the screen the  search, suggested for you list , and trending list on the right , and profile box on left. in desktop the feed.vue page displays the feed, live , and  other navigation at head section but this is not seen in web  mobile view.This is very good for desktop but solve that puzzle to get this to mobile view without in any error spoiling this  view, else let it be . The sidebar or sidenav  styling of words of the  listed features along their arrangement is poor and not standard. many features at the sidebar  are not wired to all their use main feature home page file and importantly their other  connected use case files till they are functional which is the best approach  instead they are just wired to main parent file. All stub pages should be eliminated and replaced with real. At real pewgift should be in wallet not different icon all users pages for wallet features and pewgift be done be it deposit, withdrawal, and all others  the my pal system and all files studied to fix project friends system, the chat and all its features and services to function is a priority. The ad  pages for users use cases are missing or not wired well. The following should be addressed if necessary after the above is done ; universe chat , statuses, support,agent support, policy& TC, settings. The logout should be timed out. now read and relate some of the project PRD .   Product Requirements Document (PRD)
1. Authentication & User Profile Module
 * *Features:* Phone number and  biometric login (FaceID/Fingerprint), multi-device state synchronization, and very important the  comprehensive profile customization (avatar, banner, bio, social links, privacy controls).
 * *Security: secured chat socket or/and* End-to-end style  key exchange for private chats, OAuth 2.0 / JWT session management, rate-limiting on sensitive endpoints.
2. Messaging Engine 
 * *Features:*
   * Direct 1-on-1 and group chats (up to 1,024 participants) with admin permissions.
   * Rich media sharing: photos, videos, voice notes with waveform scrubbing, documents, location pins, and contact cards.
   * Interactive features: message replies, reactions (emoji bar), text formatting (bold, italic, strikethrough), disappearing messages, and message deletion ("Delete for Everyone").
   * Real-time indicators: typing status, recording status, delivery ticks (sent, delivered, read).
   * Statuses/Stories module: 24-hour disappearing photo/video updates with viewer analytics or list.
#### 3. Social Feed System (Facebook & TikTok Hybrid)
 * *Features:*
   * Dual-tab feed architecture: *Following* (chronological/graph-based) and *For You* (algorithmic recommendation engine).
   * Multi-format post cards: Text-with-background, photo carousels, and vertical short-form video player with swipe-to-scroll.
   * Engagement suite: Double-tap or heart-to-like, nested comment threads with replies, share-to-chat, bookmark/save-to-collection, and remix/duet triggers.
   * Creator Studio tools: Video trimmer, filter/effects selector, audio/music picker, and post-analytics dashboard (reach, retention, engagement rate).
#### 4. Live Streaming Engine (TikTok-Style)
 * *Features:*
   * Low-latency streaming via WebRTC/RTMP ingest with adaptive bitrate playback (HLS).
   * Real-time interactive overlay: Scrolling chat feed with pinned messages, floating animated virtual gift icons, and live viewer counter.
   * Monetization flow: Coin wallet balance, gift selection drawer, send animation broadcast across all connected clients.
   * Streamer tools: Dual-host/co-hosting split screen, guest request queue, comment filtering/banning, kick user, and live stream summary report upon ending.
#### 5. Relationship & Friend System
 * *Features:*
   * Asymmetric or symmetric social graph support (Followers/Following + Mutual Friends).
   * Action lifecycle: Send friend request, cancel outgoing request, accept/reject incoming request, unfriend, block/unblock, and restrict visibility.
### Frontend Pages & UI/UX Component Matrix
| Screen Name | Core UI/UX Components | Key User Interactions & Actions |
|---|---|---|
| *Splash & Onboarding* | Carousel slides, Phone/Email input field, Country code selector, OTP 6-digit pin boxes | Authenticate identity, trigger SMS/Email token, grant push notification & camera permissions |
| *Home Feed Screen* | Top navigation bar (Following / For You tabs), Vertical video/post pager, Floating Action Button (+ Create), Bottom Navigation Bar | Swipe vertical feeds, like/comment/share, switch between algorithmic and social feeds |
| *Chat List (Inbox)* | Search bar, Pinned chats section, Chat row (Avatar, Name, Last Message preview, Timestamp, Unread badge), Floating New Chat button | Search conversations, archive/pin chats, swipe-to-delete or mute |
| *Chat Room Screen* | Top bar (Contact info, Call/Video call icons), Message bubble list (Incoming/Outgoing with status ticks), Rich attachment bottom sheet, Text input + Voice note hold-to-record button | Send text/media, record audio notes, reply to specific bubbles, view media gallery |
| *Friend Requests & Contacts* | Segmented tabs (My Friends, Pending Incoming, Pending Outgoing, Suggested), User card with Avatar + Bio + Mutual count, Dual action buttons (*Accept, **Reject* / *Cancel* / *Remove*) | Accept/reject incoming requests, cancel sent requests, remove existing friends, search directory |
| *Live Stream Viewer* | Full-screen video surface, Top-left streamer profile + Follow button, Right-side vertical action column (Gift, Share, Like), Bottom live chat scroll overlay + Comment input bar + Gift coin tray | Watch stream, tap screen for floating hearts, type live chat messages, purchase and dispatch virtual gifts |
| *Live Stream Broadcast Studio* | Camera preview feed, Live filter/beauty toggle, Title/Category input modal, Go Live countdown button, Active viewer list, End Stream confirmation dialog | Configure stream metadata, broadcast live video, moderate incoming comments, review live earnings summary |
| *Profile Screen* | Header (Avatar, Cover, Name, Bio, Edit Profile button), Metric counters (Friends, Following, Followers, Total Likes), Content tab switcher (Grid Posts, Videos, Liked), Settings gear icon | Edit profile details, toggle privacy settings, switch between posted media grids, access account settings | 
