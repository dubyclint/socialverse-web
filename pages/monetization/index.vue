<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <div class="max-w-4xl mx-auto px-6 py-12">

      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Monetization Portal: Requirements & Terms of Service</h1>
        <p class="mt-4 text-zinc-400 text-[15px] leading-relaxed max-w-3xl">
          Welcome to the Creator Monetization Program. To unlock payouts and withdrawal capabilities, your account must comply with our application ecosystem health, safety, and engagement rules.
        </p>
      </div>

      <!-- Core Legal -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 mb-8">
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-6">
          <span>⚖️</span> Core Legal Terms & Conditions
        </h2>

        <div class="space-y-5 text-[14.5px] leading-relaxed">
          <div class="flex gap-3">
            <span class="font-bold text-zinc-200">1.</span>
            <div><span class="font-semibold text-white">Age Requirement:</span> <span class="text-zinc-400">You must be 18 years or older to participate.</span></div>
          </div>

          <div class="flex gap-3">
            <span class="font-bold text-zinc-200">2.</span>
            <div><span class="font-semibold text-white">Identity Verification:</span> <span class="text-zinc-400">All monetized channels and Page Owners must complete KYC verification or possess an official platform Verified Badge.</span></div>
          </div>

          <div class="flex gap-3">
            <span class="font-bold text-zinc-200">3.</span>
            <div>
              <span class="font-semibold text-white">Wallet Maintenance Policy:</span>
              <span class="text-zinc-400"> To keep your qualifications in active standing, a minimum total of 10 PEW  must have been added through add fund methods within a period of 2 months. Note: While this wallet rule is non-binding during our early launch window, our Admin Team manually reviews your overall wallet activity prior to approving any outbound withdrawal cash-out request.</span>
            </div>
          </div>

          <div class="flex gap-3">
            <span class="font-bold text-zinc-200">4.</span>
            <div>
              <span class="font-semibold text-white">Platform Compliance Guardrails:</span>
              <span class="text-zinc-400"> Accounts with active community standard violations, safety flags, or fraudulent botting signatures are automatically disqualified. The Admin Team reserves the absolute right to modify criteria, freeze transactions, or reverse previous monetization approvals based on platform safety.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Eligibility Progress -->
      <section class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 mb-8">
        <h2 class="text-lg font-semibold mb-2">Monetization Eligibility Progress</h2>
        <p class="text-[13.5px] text-zinc-400 mb-8 leading-relaxed">
          Our system runs automated background checks tracking your feature usage. You must fulfill a minimum of 70% global app feature use to submit a payout request. The Admin Team holds strict override privileges and can manually waive any or all requirements for your profile.
        </p>

        <!-- Fulfilled -->
        <div class="mb-8">
          <h3 class="flex items-center gap-2 text-[14px] font-semibold text-emerald-400 mb-4">
            <span class="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>
            Fulfilled Criteria (Passed Automated Checks)
          </h3>
          <ul class="space-y-3 text-[14px] text-zinc-300">
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Account Security & KYC:</b> Completed age verification (18+) and approved via ID check or Premium Badge.</span></li>
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Post / Engagement:</b> Actively publishing a minimum of 2-6 unique posts per 2 weeks.</span></li>
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Messaging & Community:</b> Transmitting 4+ chat/group messages per week or executing 1 monthly outbound gift.</span></li>
          </ul>
        </div>

        <!-- Pending -->
        <div>
          <h3 class="flex items-center gap-2 text-[14px] font-semibold text-amber-400 mb-4">
            <span class="w-3 h-3 rounded-sm bg-amber-400 inline-block"></span>
            Pending Criteria (Currently In-Progress)
          </h3>
          <ul class="space-y-3 text-[14px] text-zinc-300">
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Daily Active Presence:</b> Accumulate a cumulative session duration of 30 minutes online daily (Calculated on a weekly/monthly rolling cycle).</span></li>
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Live Stream Protocol:</b> Reach 2,000 total followers and complete an active stream featuring an outbound gift within a 2-week window.</span></li>
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>My Pal Social Graph:</b> Maintain a peer connection pool of 600 "Pals" alongside active direct message session loops.</span></li>
            <li class="flex gap-3"><span class="text-zinc-500">•</span><span><b>Ad Manager Suite:</b> Execute a minimum self-serve promotional campaign placement spend of 5 PEW per calendar month.</span></li>
          </ul>
        </div>
      </section>

      <!-- Admin Notes -->
      <section class="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h3 class="font-semibold mb-3 text-[15px]">Admin Status Notes</h3>
        <div class="flex gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-[13.5px] leading-relaxed text-zinc-400">
          <span class="text-lg">ℹ️</span>
          <p>
            <span class="font-semibold text-zinc-200">Special Waiver Note:</span> The system status gauges above depend on live feature event logs. If you do not meet the strict 70% threshold, your application can still be pushed to manual review. Platform Administrators have the authority to issue Global Rule Waivers based on original content quality and other valid considerations.
          </p>
        </div>
      </section>

      <div class="mt-10 text-center text-[12px] text-zinc-600">
        VIORP • Creator Monetization Program • v1.0
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
useHead({
  title: 'Monetization Portal - Requirements & Terms'
})
</script>
