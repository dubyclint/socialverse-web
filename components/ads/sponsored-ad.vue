<template>
  <article
    ref="root"
    class="sponsored-ad"
    :class="`placement-${placement}`"
  >
    <header class="ad-head">
      <img
        :src="ad.advertiser.avatar_url || '/default-avatar.svg'"
        :alt="ad.advertiser.name"
        class="ad-avatar"
      >
      <div class="ad-who">
        <span class="ad-name">
          {{ ad.advertiser.name }}
          <VerifiedBadgeIcon v-if="ad.advertiser.is_verified" />
        </span>
        <span class="ad-label">Sponsored</span>
      </div>
    </header>

    <p
      v-if="ad.primaryText"
      class="ad-text"
    >
      {{ ad.primaryText }}
    </p>

    <div
      v-if="ad.conversionLocation === 'CATALOG' && ad.catalog.length"
      class="ad-carousel"
    >
      <a
        v-for="(item, i) in ad.catalog"
        :key="i"
        :href="item.link"
        target="_blank"
        rel="noopener nofollow sponsored"
        class="ad-card"
        @click="track('CLICK', 'SHOP_NOW')"
      >
        <img
          :src="item.image"
          :alt="item.name"
          loading="lazy"
        >
        <span class="card-title">{{ item.name }}</span>
        <span class="card-sub">{{ item.price }}</span>
      </a>
    </div>

    <div
      v-else-if="ad.format === 'CAROUSEL'"
      class="ad-carousel"
    >
      <button
        v-for="(card, i) in ad.media"
        :key="i"
        type="button"
        class="ad-card"
        @click="open(card.link)"
      >
        <video
          v-if="card.type === 'video'"
          :src="card.url"
          muted
          playsinline
          loop
          autoplay
          preload="metadata"
        />
        <img
          v-else
          :src="card.url"
          :alt="card.headline || ad.title"
          loading="lazy"
        >
        <span
          v-if="card.headline"
          class="card-title"
        >{{ card.headline }}</span>
        <span
          v-if="card.description"
          class="card-sub"
        >{{ card.description }}</span>
      </button>
    </div>

    <button
      v-else-if="ad.media[0]"
      type="button"
      class="ad-media"
      @click="open()"
    >
      <video
        v-if="ad.media[0].type === 'video'"
        :src="ad.media[0].url"
        muted
        playsinline
        controls
        preload="metadata"
      />
      <img
        v-else
        :src="ad.media[0].url"
        :alt="ad.headline || ad.title"
        loading="lazy"
      >
    </button>

    <footer class="ad-foot">
      <div class="ad-copy">
        <strong>{{ ad.headline || ad.title }}</strong>
        <span
          v-if="host"
          class="ad-host"
        >{{ host }}</span>
      </div>
      <button
        type="button"
        class="ad-cta"
        @click="open()"
      >
        {{ ctaLabel }}
      </button>
    </footer>

    <div
      v-if="formOpen && ad.leadForm"
      class="lead-backdrop"
      @click.self="formOpen = false"
    >
      <form
        class="lead-form"
        @submit.prevent="submitLead"
      >
        <h3>{{ ad.advertiser.name }}</h3>
        <p
          v-if="ad.leadForm.intro"
          class="lead-intro"
        >
          {{ ad.leadForm.intro }}
        </p>
        <template v-if="!leadSent">
          <label
            v-for="q in ad.leadForm.questions"
            :key="q.label"
            class="lead-field"
          >
            <span>{{ q.label }}</span>
            <select
              v-if="q.type === 'choice'"
              v-model="answers[q.label]"
              required
            >
              <option
                value=""
                disabled
              >Choose…</option>
              <option
                v-for="o in q.options"
                :key="o"
                :value="o"
              >{{ o }}</option>
            </select>
            <input
              v-else
              v-model="answers[q.label]"
              :type="q.type === 'phone' ? 'tel' : q.type"
              required
            >
          </label>
          <p class="lead-privacy">
            By submitting, you share these answers with {{ ad.advertiser.name }}.
            <a
              :href="ad.leadForm.privacy_url"
              target="_blank"
              rel="noopener"
            >Privacy policy</a>
          </p>
          <p
            v-if="leadError"
            class="lead-error"
          >
            {{ leadError }}
          </p>
          <div class="lead-actions">
            <button
              type="button"
              class="btn-ghost"
              @click="formOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="ad-cta"
              :disabled="leadBusy"
            >
              {{ leadBusy ? 'Sending…' : 'Submit' }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="lead-done">
            Thanks — your details were sent.
          </p>
          <button
            type="button"
            class="ad-cta"
            @click="formOpen = false"
          >
            Done
          </button>
        </template>
      </form>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import VerifiedBadgeIcon from '~/components/verified-badge-icon.vue'
import { CTA_LABELS } from '~/utils/ad-options'
import type { AdPlacement, AdView } from '~/utils/ad-options'

const props = withDefaults(defineProps<{ ad: AdView, placement?: AdPlacement }>(), { placement: 'feed' })

const root = ref<HTMLElement | null>(null)
const formOpen = ref(false)
const leadBusy = ref(false)
const leadSent = ref(false)
const leadError = ref('')
const answers = reactive<Record<string, string>>({})
let observer: IntersectionObserver | null = null
let viewTimer: ReturnType<typeof setTimeout> | null = null
let counted = false

const ctaLabel = computed(() => CTA_LABELS[props.ad.cta] ?? 'Learn more')
const host = computed(() => {
  if (!props.ad.destinationUrl) return ''
  try { return new URL(props.ad.destinationUrl).hostname.replace(/^www\./, '') } catch { return '' }
})

const track = (interactionType: 'IMPRESSION' | 'CLICK' | 'MESSAGE', cta = props.ad.cta) =>
  $fetch('/api/ads/track', { method: 'POST', body: { campaignId: props.ad.id, interactionType, placement: props.placement, cta } })
    .catch(error => console.error('[Ads] tracking failed', error))

const open = (link?: string) => {
  const ad = props.ad
  if (ad.conversionLocation === 'INSTANT_FORM') {
    track('CLICK')
    formOpen.value = true
    return
  }
  if (ad.conversionLocation === 'CHAT') {
    track('MESSAGE')
    navigateTo(`/chat?user=${ad.advertiserId}`)
    return
  }
  track('CLICK')
  if (ad.conversionLocation === 'POST' && ad.postId) navigateTo(`/posts/${ad.postId}`)
  else if (ad.conversionLocation === 'PAGE' && ad.pageHandle) navigateTo(`/pages/${ad.pageHandle}`)
  else {
    const url = link || ad.destinationUrl
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const submitLead = async () => {
  leadBusy.value = true
  leadError.value = ''
  try {
    await $fetch(`/api/ads/${props.ad.id}/lead`, { method: 'POST', body: { answers } })
    leadSent.value = true
  } catch (error) {
    const e = error as { data?: { statusMessage?: string }, statusMessage?: string }
    leadError.value = e.data?.statusMessage || e.statusMessage || 'Could not send the form'
  } finally {
    leadBusy.value = false
  }
}

/** An impression counts once at least half the ad has been on screen for 1 second. */
onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    if (counted) return
    if (entry?.isIntersecting) {
      viewTimer = setTimeout(() => {
        counted = true
        track('IMPRESSION')
        observer?.disconnect()
      }, 1000)
    } else if (viewTimer) {
      clearTimeout(viewTimer)
      viewTimer = null
    }
  }, { threshold: 0.5 })
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (viewTimer) clearTimeout(viewTimer)
})
</script>

<style scoped>
.sponsored-ad { background: var(--card-bg, #0f172a); border: 1px solid var(--border-color, #1e293b); border-radius: 0.875rem; padding: 0.75rem; margin-bottom: 1rem; overflow: hidden; }
.ad-head { display: flex; align-items: center; gap: 0.6rem; }
.ad-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.ad-who { display: flex; flex-direction: column; min-width: 0; }
.ad-name { font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-label { font-size: 0.72rem; color: #94a3b8; }
.ad-text { margin: 0.6rem 0; white-space: pre-wrap; word-break: break-word; }
.ad-media { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; margin-top: 0.5rem; }
.ad-media img, .ad-media video { width: 100%; max-height: 520px; object-fit: contain; background: #000; border-radius: 0.6rem; display: block; }
.ad-carousel { display: flex; gap: 0.6rem; overflow-x: auto; scroll-snap-type: x mandatory; margin-top: 0.5rem; padding-bottom: 0.25rem; scrollbar-width: none; }
.ad-carousel::-webkit-scrollbar { display: none; }
.ad-card { flex: 0 0 72%; max-width: 260px; scroll-snap-align: start; display: flex; flex-direction: column; text-align: left; border: 1px solid var(--border-color, #1e293b); border-radius: 0.6rem; overflow: hidden; background: none; padding: 0; color: inherit; text-decoration: none; cursor: pointer; }
.ad-card img, .ad-card video { width: 100%; aspect-ratio: 1; object-fit: cover; }
.card-title { font-weight: 600; padding: 0.4rem 0.5rem 0; }
.card-sub { font-size: 0.8rem; color: #94a3b8; padding: 0 0.5rem 0.5rem; }
.ad-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 0.6rem; }
.ad-copy { display: flex; flex-direction: column; min-width: 0; }
.ad-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-host { font-size: 0.75rem; color: #94a3b8; }
.ad-cta { flex-shrink: 0; background: var(--primary-color, #6366f1); color: #fff; border: 0; border-radius: 0.5rem; padding: 0.5rem 0.9rem; font-weight: 600; cursor: pointer; }
.ad-cta:disabled { opacity: 0.6; }
.lead-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.lead-form { background: var(--card-bg, #0f172a); border-radius: 0.875rem; padding: 1.25rem; width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto; }
.lead-field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.75rem; }
.lead-field input, .lead-field select { padding: 0.55rem; border-radius: 0.5rem; border: 1px solid var(--border-color, #334155); background: transparent; color: inherit; }
.lead-intro, .lead-privacy { font-size: 0.85rem; color: #94a3b8; }
.lead-error { color: #f87171; }
.lead-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.btn-ghost { background: none; border: 1px solid var(--border-color, #334155); color: inherit; border-radius: 0.5rem; padding: 0.5rem 0.9rem; }
</style>
