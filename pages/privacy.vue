<template>
  <article class="legal">
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: {{ updated }}</p>

    <h2>Who we are</h2>
    <p>
      Viorp (“we”, “us”) operates the Viorp social platform at
      <a href="https://viorp.com">viorp.com</a> and the Viorp mobile applications. Contact:
      <a href="mailto:privacy@viorp.com">privacy@viorp.com</a>.
    </p>

    <h2>Data we collect</h2>
    <ul>
      <li><strong>Account data:</strong> username, display name, email, date of birth, avatar, bio.</li>
      <li><strong>Content:</strong> posts, statuses, comments, messages, media you upload.</li>
      <li><strong>Contacts (optional):</strong> if you enable contact matching we send only irreversible SHA-256 hashes of phone numbers; raw numbers are never uploaded and non-matching hashes are discarded.</li>
      <li><strong>Financial:</strong> wallet balances, PEW gift and P2P/escrow transaction records required for ledger integrity and dispute resolution.</li>
      <li><strong>Usage:</strong> impressions, interactions and device/platform data used to rank your feed and to serve ads.</li>
    </ul>

    <h2>How we use it</h2>
    <p>
      To operate the service, personalise your feed and recommendations, deliver and moderate
      messages, process in-app value transfers, prevent fraud and abuse, and comply with legal
      obligations. We do not sell your personal data.
    </p>

    <h2>Advertising</h2>
    <p>
      Ads placed inside Viorp are selected from interests and on-platform behaviour. When no in-app
      inventory is available, third-party networks may serve a fallback ad and process data under
      their own policies.
    </p>

    <h2>Permissions</h2>
    <ul>
      <li><strong>Camera / photos:</strong> only when you attach media or change your avatar.</li>
      <li><strong>Notifications:</strong> only after you grant permission; used for messages and activity.</li>
      <li><strong>Contacts:</strong> only after explicit opt-in, for hashed contact matching.</li>
    </ul>

    <h2>Retention and deletion</h2>
    <p>
      Content is retained while your account exists. You can delete your account at any time at
      <NuxtLink to="/settings/delete-account">Settings → Delete account</NuxtLink>, or by emailing
      <a href="mailto:privacy@viorp.com">privacy@viorp.com</a>. Financial records required by law
      are retained in anonymised form.
    </p>

    <h2>Your rights</h2>
    <p>
      Depending on your jurisdiction you may request access, correction, export or erasure of your
      data, and object to processing. Contact us and we will respond within 30 days.
    </p>

    <h2>Children</h2>
    <p>Viorp is not intended for anyone under 13 (or the minimum age in your country).</p>
  </article>
</template>

<script setup lang="ts">
const updated = '11 July 2026'

useHead({
  title: 'Privacy Policy - Viorp',
  meta: [{ name: 'description', content: 'How Viorp collects, uses and protects your data.' }]
})
</script>

<style scoped>
.legal {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-xl, 32px) var(--space-lg, 24px);
  color: var(--text-primary, #f0fffb);
  line-height: 1.7;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: var(--space-xs, 4px);
}

h2 {
  font-family: var(--font-heading);
  margin: var(--space-lg, 24px) 0 var(--space-sm, 8px);
  font-size: 1.15rem;
}

.updated {
  color: var(--text-muted, #9fb3ad);
  margin-bottom: var(--space-lg, 24px);
}

ul {
  padding-left: 1.2rem;
  list-style: disc;
}
</style>
