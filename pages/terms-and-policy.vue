<template>
  <article class="legal">
    <h1>Policy &amp; Terms</h1>
    <p class="updated">Last updated: {{ updated }}</p>
    <p>Everything that governs your use of Viorp on the web, the PWA and the Android and iOS apps, in one place.</p>

    <nav class="toc" aria-label="Contents">
      <NuxtLink to="/terms">Terms of Service</NuxtLink>
      <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
      <a v-for="s in sections" :key="s.id" :href="`#${s.id}`">{{ s.title }}</a>
    </nav>

    <section id="child-safety">
      <h2>Child Safety &amp; Abuse Reporting Standards</h2>
      <p><strong>We maintain a zero-tolerance policy toward child sexual exploitation and abuse (CSAE/CSAM).</strong></p>
      <p>Viorp prohibits any content, behavior, or activity that sexualizes, grooms, exploits, or endangers minors. This includes but is not limited to sexual content involving minors, romantic relationships between minors and adults, trafficking, employment of minors in sexual services, and production, solicitation or distribution of CSAM.</p>
      
      <h3>How to Report:</h3>
      <p>If you encounter any content, chat message, live stream, profile, or behavior that endangers a minor, please report it immediately:</p>
      <ul>
        <li>Inside the app: Use <strong>Report</strong> on any content or go to <strong>Support &gt; Help &amp; Tickets &gt; Create urgent safety report</strong></li>
        <li>Email our designated safety officers:
          <br />Safety: <a href="mailto:okerekepaul597@gmail.com">okerekepaul597@gmail.com</a>
          <br />Support: <a href="mailto:support@viorp.com">support@viorp.com</a>
          <br />Compliance: <a href="mailto:compliance@viorp.com">compliance@viorp.com</a>
        </li>
      </ul>

      <h3>Our Enforcement Action:</h3>
      <ul>
        <li>All reports regarding child safety are investigated with the highest priority within 24 hours.</li>
        <li>Valid violations result in immediate account termination, permanent device ban, and removal of content.</li>
        <li>We report all instances of CSAM and child exploitation to the <strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong> via CyberTipline and to relevant law enforcement authorities where required by law.</li>
        <li>We cooperate fully with law enforcement investigations.</li>
      </ul>
    </section>

    <section id="community">
      <h2>Community guidelines &amp; user content</h2>
      <p>You own what you post. By posting you give Viorp a worldwide, non-exclusive licence to host, display and distribute it inside Viorp for as long as it stays up. You must have the rights to everything you upload, including music added to posts.</p>
      <p>Not allowed: sexual content involving minors (reported to authorities), nudity or sexual content, hate speech, harassment or threats, violence or terrorism, self-harm promotion, scams, impersonation, spam, illegal goods or services, and sharing someone's private information.</p>
    </section>

    <section id="safety">
      <h2>Safety, reporting &amp; moderation</h2>
      <p>Use <strong>Report</strong> on any post, comment, profile, Page or message, and <strong>Block</strong> to stop someone contacting you. Reports go to the Viorp moderation team.</p>
      <p>Moderators may remove content, restrict posting, chat or other features, or suspend accounts temporarily or permanently. Serious or repeated violations lead to permanent bans. If you think a decision was wrong, email <a href="mailto:support@viorp.com">support@viorp.com</a> to appeal.</p>
    </section>

    <section id="pages">
      <h2>Pages</h2>
      <p>Each person may own up to 5 Pages. Owners are responsible for everything posted, sent or spent as their Page by its managers and moderators. Pages follow the same rules as personal profiles. A verification badge confirms identity only; it is not an endorsement.</p>
    </section>

    <section id="payments">
      <h2>Payments, wallet &amp; PEW</h2>
      <ul>
        <li>PEW is in-app value for gifts, ads and P2P. It is not a bank deposit, does not earn interest and is not legal tender.</li>
        <li>Funds are added through licensed payment providers (for example Paystack, Flutterwave, Bachs or NOWPayments). Viorp never stores your full card number. Your wallet is credited only after the provider confirms the payment to our server.</li>
        <li>Fees: adding funds {{ fees.deposit }}, gifts {{ fees.gift }} (taken from the recipient), withdrawals {{ fees.withdraw }} plus any applicable tax. Each fee is shown as its own line in your wallet history. Fees may change with notice in the app.</li>
        <li>Only earnings (gifts received, P2P sales and escrow releases) can be withdrawn. Funds you add yourself can be spent in Viorp but not withdrawn. Withdrawals are reviewed and may be refused or delayed for fraud, sanctions or legal reasons; refused withdrawals are returned to your wallet.</li>
        <li>Sent gifts are final. Duplicate or failed charges are refunded to the original method or wallet.</li>
        <li>P2P trades are held in escrow until both sides confirm. Disputes are decided by Viorp staff using the trade chat and evidence submitted.</li>
      </ul>
    </section>

    <section id="subscriptions">
      <h2>Subscriptions &amp; renewals</h2>
      <p>Viorp does not currently sell auto-renewing subscriptions. If we introduce one, the price, billing period and the fact that it renews automatically will be shown next to the button before you pay. The button will say exactly what it does (for example “Subscribe for $4.99/month”). You will be able to cancel from Settings at any time, and cancelling stops the next renewal.</p>
    </section>

    <section id="advertising">
      <h2>Advertising</h2>
      <ul>
        <li>Ads are labelled <strong>Sponsored</strong>. Advertisers pay in PEW through the Ads Manager, and every ad is reviewed before it runs.</li>
        <li>Ads are targeted using on-platform signals such as interests, language and approximate country. Viorp does not sell your personal data to advertisers.</li>
        <li>On the website and PWA, Monetag may show fallback ads. In the Android and iOS apps, Appodeal and its partner networks may show ads. These networks process device data under their own privacy policies.</li>
        <li>No ads are shown on wallet, add-funds, gifting, P2P or escrow screens, and nobody is paid or rewarded for viewing ads.</li>
        <li>Prohibited ads: adult content, weapons, drugs, gambling where illegal, misleading financial schemes, and anything breaking the community guidelines.</li>
      </ul>
    </section>

    <section id="deletion">
      <h2>Account deletion &amp; data retention</h2>
      <p>Delete your account at any time at <NuxtLink to="/settings/delete-account">Settings → Delete account</NuxtLink>, or by emailing <a href="mailto:privacy@viorp.com">privacy@viorp.com</a>. You must first withdraw or spend your wallet balance, close open P2P trades and hand over any Page you are the only owner of.</p>
      <p>When you delete, your profile is anonymised and your sign-in is removed straight away. Your name, photo, bio and contact details are erased. Wallet and transaction records are kept in anonymised form for as long as financial and anti-money-laundering law requires. If content or records are subject to a legal hold (a court order, law-enforcement request or open dispute), they are kept until the hold ends and then permanently purged.</p>
    </section>

    <section id="age">
      <h2>Age requirements &amp; content rating</h2>
      <p>You must be at least 13 years old, or older where your country requires it, to use Viorp. You confirm your age when you sign up. Wallet, withdrawal, P2P and advertising features may require you to be 18 or the age of majority where you live. Accounts we believe belong to underage users are removed. Because Viorp hosts user-generated content, chat and in-app purchases, its app-store rating reflects that.</p>
    </section>

    <section id="copyright">
      <h2>Copyright &amp; DMCA</h2>
      <p>If you believe content on Viorp infringes your copyright, send a notice to our designated agent with: your contact details; the work you own; the link to the infringing content; a statement that you believe in good faith the use is not authorised; a statement, under penalty of perjury, that your notice is accurate and you are the owner or authorised to act for them; and your physical or electronic signature.</p>
      <p class="contact-block">
        <strong>Designated copyright agent</strong><br />
        <template v-if="cfg.dmcaAgentName">{{ cfg.dmcaAgentName }}<br /></template>
        <template v-if="cfg.dmcaAgentAddress">{{ cfg.dmcaAgentAddress }}<br /></template>
        <a :href="`mailto:${cfg.dmcaAgentEmail}`">{{ cfg.dmcaAgentEmail }}</a>
      </p>
      <p>The uploader may send a counter-notice. Accounts that repeatedly infringe are terminated.</p>
    </section>

    <section id="tracking">
      <h2>Cookies, fonts &amp; analytics</h2>
      <ul>
        <li>We use only the cookies and local storage needed to keep you signed in and remember your settings.</li>
        <li>Viorp uses your device's own fonts and loads no fonts from Google or other third-party font services.</li>
        <li>Session replay is off: we do not record your screen, taps or keystrokes.</li>
        <li>Crash and performance logs are collected to keep the service reliable.</li>
      </ul>
    </section>

    <section id="email">
      <h2>Emails &amp; notifications</h2>
      <p>We send emails about your account and security, such as verification and password resets. We do not send marketing email without your consent, and any marketing email will include an unsubscribe link and our postal address. Push and in-app notifications can be switched off in Settings or in your device settings.</p>
    </section>

    <section id="data">
      <h2>Data we collect (app-store disclosure)</h2>
      <p>All data is encrypted in transit. Depending on the features you use, we collect: name, email, user ID, phone number and other profile details; payment info and purchase history; approximate location; in-app messages; photos, videos and voice recordings; contacts (as irreversible hashes, only if you opt in); crash logs and diagnostics; app interactions, in-app search history and other content you create; and device identifiers. We use this to run Viorp, personalise your feed, prevent fraud, show ads and meet legal obligations. Details are in the <NuxtLink to="/privacy">Privacy Policy</NuxtLink>.</p>
    </section>

    <section id="contact">
      <h2>Contact</h2>
      <p>
        Support: <a href="mailto:support@viorp.com">support@viorp.com</a><br />
        Privacy: <a href="mailto:privacy@viorp.com">privacy@viorp.com</a>
        <template v-if="cfg.legalBusinessAddress"><br />Postal address: {{ cfg.legalBusinessAddress }}</template>
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
const updated = '18 October 2026'
const cfg = useRuntimeConfig().public as unknown as {
  legalBusinessAddress: string
  dmcaAgentName: string
  dmcaAgentAddress: string
  dmcaAgentEmail: string
}

const sections = [
  { id: 'child-safety', title: 'Child Safety Standards' },
  { id: 'community', title: 'Community & content' },
  { id: 'safety', title: 'Safety & moderation' },
  { id: 'pages', title: 'Pages' },
  { id: 'payments', title: 'Payments & wallet' },
  { id: 'subscriptions', title: 'Subscriptions' },
  { id: 'advertising', title: 'Advertising' },
  { id: 'deletion', title: 'Deletion & retention' },
  { id: 'age', title: 'Age & rating' },
  { id: 'copyright', title: 'Copyright / DMCA' },
  { id: 'tracking', title: 'Cookies & analytics' },
  { id: 'email', title: 'Emails' },
  { id: 'data', title: 'Data we collect' },
  { id: 'contact', title: 'Contact' }
]

const { data: feeData } = await useFetch<{ deposit_fee_pct: number, gift_fee_pct: number, withdrawal_fee_pct: number, withdrawal_tax_pct: number }>('/api/legal/fees')
const fees = computed(() => ({
  deposit: `${feeData.value?.deposit_fee_pct ?? 1.2}%`,
  gift: `${feeData.value?.gift_fee_pct ?? 5}%`,
  withdraw: `${feeData.value?.withdrawal_fee_pct ?? 37}%`
}))

useHead({
  title: 'Policy & Terms - Viorp',
  meta: [{ name: 'description', content: 'Viorp terms, privacy, safety, payments, advertising, deletion and copyright policies.' }]
})
</script>

<style scoped>
.legal { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; line-height: 1.6; color: var(--text, #e2e8f0); }
.legal h1 { font-size: 1.6rem; margin-bottom: 4px; }
.legal h2 { font-size: 1.15rem; margin: 28px 0 8px; scroll-margin-top: 72px; }
.legal h3 { font-size: 1rem; margin: 16px 0 6px; }
.legal a { color: #60a5fa; }
.legal ul { padding-left: 20px; }
.legal li { margin-bottom: 6px; }
.updated { color: #94a3b8; font-size: 0.85rem; }
.toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.toc a { padding: 6px 12px; border-radius: 999px; background: #1e293b; font-size: 0.85rem; text-decoration: none; }
.contact-block { background: #1e293b; padding: 12px; border-radius: 8px; }
#child-safety { background: #1a2332; border: 1px solid #2d3a4f; padding: 16px; border-radius: 12px; }
</style>
