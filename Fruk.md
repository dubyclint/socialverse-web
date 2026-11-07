issues: User views should not count on their own posts.
- when profile is switched to page, the complete page account with its own full profile should be  on feed.vue and across app. Page is independent so a switch page should get full page profile account and every needed profile components and features even it's own separate posts photos,veep, creator studio .  Infact a page is a profile on its own with only little limit where necessary.Check Facebook system on page profile on this and  implement it.
- the feed page  is leaking , there is download video arrow which shows a media detector multiple downloads, when opened with Phoenix browser. there is forced logout from feed page or in app when there is poor network or error, This is wrong. There  is  error 401: Get /api/profile/me.
- when a user with username @paul commented twice at on 2 different statuses   of a user with username @madrida , the comment  appeared on chat message list in differently profile as if @madrida is two different profile account , fix this now. 
- I want video posts to be apple to be paused on feed.vue . 

- the gifting system on veep is showing server error.
- the go live  audio system on live streaming needs checking .
- very critical and important a security user settings/ feature that list all online and offline devices that have logged in into your account,there approximate location,time stamps, then your ability to ; 1. Logout each or all out , 2. Allow only listed device or, only a  device only ( this requires , 2factor authentication or fingerprint 
- I hope all my ads are running across feed, veep , statuses, and other relevant pages , make sure other relevant pages are considered.
- on feed.Vue there are this 3 button or tabs which are( for you, following , trending) on top of the feed.vue page , apply them in what what there use case is about, and make them functional and  rendering similar to veep , global, trend, hood rendering system. Note : (for you, and veep is a form of FYP).
- I want the past stream , and  explore tab removed from sidebar on feed.vue as I feel explore  should have been considered in trends rendering.

On Google console:
-   Domain ownership not verified
Users will not go directly to your app from links associated with this path, but will see the app picker or be directed to the web browser. Once you have fixed these issues and published a new version, users need to update their app before the links will work.
Fix domain issues
Digital Asset Links JSON file failed
Add a Digital Asset Links JSON file to all the failed domains
How to fix
Update and publish your Digital Asset Links JSON file using the information below. The code snippet is a reformatted preview of your current JSON file with updates highlighted.      [
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.viorp.app",
      "sha256_cert_fingerprints": [
        "0A:74:18:F9:8D:3B:3A:7B:E4:80:9A:2E:A9:C5:12:B6:F6:68:0D:E0:AA:26:FB:03:03:DF:DE:69:72:16:66:14",
        "86:E4:AD:0F:A3:9B:02:18:90:E2:7C:A9:71:5F:9B:D5:53:F0:55:D7:86:64:8B:74:08:4C:F1:FE:DA:83:95:68",
        "9D:09:ED:F3:F5:89:18:CD:61:E8:20:F0:48:98:9F:55:F3:EF:18:6E:CB:C3:26:AE:B2:D3:A2:5C:18:27:9C:31"
      ]
    }
  }
]

Publish JSON file to this location
https://viorp.com/.well-known/assetlinks.json.

JSON content type failed
Make sure the content type is "application/json" for all the failed domains
How to fix
Make sure the content type is "application/json" for all the failed domains

Fix the the domain issue so that I can recheck verification on Google Play Console.

Deep links not working
Users will not go directly to your app from links associated with this path, but will see the app picker or be directed to the web browser. Once you have fixed these issues and published a new version, users need to update their app before the links will work.
Fix domain issues
2 domains failed validation
Fix domain issues by verifying ownership of web links associated with this path
How to fix
Fix domain issues by verifying ownership of web links associated with this path
Failing domains (2)
‭viorp.com
‭www.viorp.com

- On The posts on feed.vue ,  the repost  is not yet working, make it work.

Also on posts on feed.vue the components  or interactive components icon (ie likes , comments, share ,gift) are seen twice, while it should be once with their counts and listing or opening when icon is clicked.
-  Every profile and page profile should have cover photo 

- during KYC identity verification, the fast and automatic method ,shows that it could not start verification. Fix this .


- Very important : the call for kyc on all  withdrawal option , be it withdrawal by p2p method or any withdrawal method, should be to all accounts be it admin or manager or any user account. This must be applied to all account that have not yet done KYC . Only super admin or account that have seller edit payout name privileges is exempted and if this privilege is withdrawn the KYC request defaults. This fix critically important as verified KYC names are defaults names used  for payment on withdrawal.
  
  -   Critical and important: please make sure add fund fee % is added on all deposit methods  be it p2p or all payment gateway  ( flutterwave ) or crypto like Nowpayment. 

- when a user deposit fund and wants to withdraw it without passing through gifting so that there would be a withdrawable balance.

If so, apply gifting fee and withdrawal fee on the pew balance to provide need amount for withdrawable balance 

This is necessary to avoid a situation where a user who have for example 15 pew balance but 3 pew withdrawable balance and yet cannot withdraw 8 pew.

The system should just apply gifting fee and withdrawal fee on the pew balance and make available the requested amount for withdrawal. ie 3 withdrawable balance + 5 pew( gifting and withdrawal fee applied to the pew added) + any other fee be it tax or whatever provided the balance covers it. Note : as admin I want to regulate this practice , so a very very tiny yellow flag on pew balance saying: withdrawal directly from pew balance is limited set amount , and can trigger wallet review.  

The default limit for this pew balance direct withdrawal is 500 pew in 30 days , and it  refreshes every 30 days , once reached only withdrawable balance can be withdrawn    .  Admin can set both  the warning statement , and the pew balance withdrawal limit for all users generally, and for any particular user.


-I need to launch now. I need you to provide me a  .md file  containing all resources Requirements and needs of this  project across all  userbase with estimated user target 100k -10m users.

 list resource requirements needed to power  100k - 10m user on start  looking at All features in this project . 


- (Hosting resources size Requirements, database resources and size, caching and cookies, WebRTC and sockets, security across features and app) please make sure you list Others needed which I need but did not mention.


Point out any scalability need or job or tool needed. 

 I have set  my default Agent to fusion now and my API default agent to fusion too. I want task to be handled by swe 2 and swe 2 flash too. I want the very best of results yet cost effective.
