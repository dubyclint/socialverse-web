<template>
  <article class="legal">
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: {{ updated }}</p>

    <h2>1. Acceptance</h2>
    <p>
      By creating a Viorp account or using <a href="https://viorp.com">viorp.com</a> or the Viorp
      apps you agree to these terms. If you do not agree, do not use the service.
    </p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 13 years old, or the minimum age required in your country, and not barred from using the service under applicable law.</p>

    <h2>3. Your content</h2>
    <p>
      You keep ownership of what you post. You grant Viorp a worldwide, non-exclusive licence to
      host, display and distribute your content for the purpose of operating the service. You are
      responsible for having the rights to everything you upload.
    </p>

    <h2>4. Acceptable use</h2>
    <ul>
      <li>No illegal content, harassment, hate speech, sexual content involving minors, or spam.</li>
      <li>No fraud, impersonation, market manipulation, or circumvention of escrow protections.</li>
      <li>No scraping, automated abuse, or attempts to breach platform security.</li>
    </ul>

    <h2>5. PEW, gifts and wallet</h2>
    <p>
      PEW is a closed-loop in-app credit. It has no independent monetary value outside Viorp, is not
      a deposit or e-money product, and is not redeemable except through the payout mechanisms we
      offer. Gifts are final once sent.
    </p>

    <h2>6. P2P and escrow</h2>
    <p>
      Viorp provides escrow tooling between users. Value is locked in escrow until the trade is
      released or cancelled. We are not a party to your trade, but we may resolve disputes using the
      evidence recorded on the trade. Fees are disclosed before you commit.
    </p>

    <h2>7. Ads and monetisation</h2>
    <p>Advertisers must comply with our ad policies. Payouts and revenue shares are subject to the rates published in the app at the time of accrual.</p>

    <h2>8. Termination</h2>
    <p>
      You may delete your account at any time at
      <NuxtLink to="/settings/delete-account">Settings → Delete account</NuxtLink>. We may suspend or
      terminate accounts that breach these terms or applicable law.
    </p>

    <h2>9. Disclaimers and liability</h2>
    <p>
      The service is provided “as is”. To the maximum extent permitted by law, Viorp is not liable
      for indirect or consequential loss, and our aggregate liability is limited to the amount you
      paid us in the 12 months before the claim.
    </p>

    <h2>10. Changes</h2>
    <p>We will post material changes in the app before they take effect. Continued use means acceptance.</p>

    <h2>11. Contact</h2>
    <p><a href="mailto:support@viorp.com">support@viorp.com</a></p>
  </article>
</template>

<script setup lang="ts">
const updated = '11 July 2026'

useHead({
  title: 'Terms of Service - Viorp',
  meta: [{ name: 'description', content: 'The terms governing use of Viorp.' }]
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

h1,
h2 {
  font-family: var(--font-heading);
}

h2 {
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
