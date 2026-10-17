<template>
  <div class="wizard">
    <header class="head">
      <NuxtLink
        to="/ads"
        class="back"
      >
        ← Ads Manager
      </NuxtLink>
      <h1>{{ editId ? 'Edit ad' : 'Create ad' }}</h1>
      <p class="muted">
        Pay per 1,000 impressions ({{ pricing.cpm_pew }} PEW CPM). Budget is held from your wallet and unspent PEW comes back if the ad is rejected, ended or deleted.
      </p>
    </header>

    <nav class="steps">
      <button
        v-for="(label, i) in STEPS"
        :key="label"
        class="step"
        :class="{ on: step === i, done: step > i }"
        @click="go(i)"
      >
        <span>{{ i + 1 }}</span>{{ label }}
      </button>
    </nav>

    <p
      v-if="loadError"
      class="error"
    >
      {{ loadError }}
    </p>

    <!-- 1. Campaign -->
    <section
      v-show="step === 0"
      class="card"
    >
      <label>Campaign name<input
        v-model="form.title"
        maxlength="120"
        placeholder="e.g. October promo"
      ></label>

      <h3>Campaign type</h3>
      <div class="options">
        <button
          v-for="o in OBJECTIVES"
          :key="o.value"
          class="option"
          :class="{ on: form.objective === o.value }"
          @click="setObjective(o.value)"
        >
          <strong>{{ o.label }}</strong><small>{{ o.description }}</small>
        </button>
      </div>

      <h3>Goal</h3>
      <div class="options compact">
        <button
          v-for="g in goals"
          :key="g"
          class="option"
          :class="{ on: form.goal === g }"
          @click="setGoal(g)"
        >
          {{ GOAL_LABELS[g] }}
        </button>
      </div>

      <h3>Special ad category</h3>
      <p class="muted">
        Ads about these topics must declare it. Age, gender, detailed demographics and behaviours cannot be used to narrow them.
      </p>
      <select v-model="form.specialCategory">
        <option :value="null">
          None
        </option>
        <option
          v-for="c in SPECIAL_CATEGORIES"
          :key="c.value"
          :value="c.value"
        >
          {{ c.label }}
        </option>
      </select>
      <label
        v-if="form.specialCategory"
        class="check"
      >
        <input
          v-model="specialAck"
          type="checkbox"
        >
        I confirm this ad follows Viorp's advertising policy and the laws for {{ specialLabel }} ads, including required disclaimers.
      </label>

      <h3>Advertise as</h3>
      <select
        v-model="form.pageId"
        :disabled="Boolean(editId)"
      >
        <option :value="null">
          My personal profile
        </option>
        <option
          v-for="p in pages"
          :key="p.id"
          :value="p.id"
        >
          {{ p.name }} (Page · {{ p.role.toLowerCase() }})
        </option>
      </select>
      <label
        v-if="form.pageId && !editId"
        class="check"
      >
        <input
          v-model="form.fundFromPage"
          type="checkbox"
        > Pay from the Page wallet instead of my wallet
      </label>

      <template v-if="!editId">
        <label>Total budget (PEW)
          <input
            v-model.number="form.budget"
            type="number"
            :min="pricing.min_budget_pew"
            step="1"
          >
        </label>
        <small class="muted">Minimum {{ pricing.min_budget_pew }} PEW · your wallet: {{ fmt(balance) }} PEW · about {{ estImpressions.toLocaleString() }} impressions</small>
      </template>
      <template v-else>
        <label>Add budget (PEW, optional)<input
          v-model.number="extraBudget"
          type="number"
          min="0"
          step="1"
        ></label>
      </template>
    </section>

    <!-- 2. Audience -->
    <section
      v-show="step === 1"
      class="card"
    >
      <label>Locations (countries, states or cities, comma separated — empty means everywhere)
        <input
          v-model="locationsText"
          placeholder="Nigeria, Lagos, Ghana"
        >
      </label>
      <div class="row2">
        <label>Min age<input
          v-model.number="form.targeting.age_min"
          type="number"
          min="13"
          max="65"
          :disabled="Boolean(form.specialCategory)"
        ></label>
        <label>Max age<input
          v-model.number="form.targeting.age_max"
          type="number"
          min="13"
          max="65"
          :disabled="Boolean(form.specialCategory)"
        ></label>
      </div>
      <h3>Gender</h3>
      <div class="chips">
        <button
          v-for="g in ['male', 'female', 'other']"
          :key="g"
          class="chip"
          :class="{ on: has(form.targeting.genders, g) }"
          :disabled="Boolean(form.specialCategory)"
          @click="toggle(form.targeting.genders, g)"
        >
          {{ g }}
        </button>
      </div>

      <details :open="!form.specialCategory">
        <summary>Demographics</summary>
        <p
          v-if="form.specialCategory"
          class="muted"
        >
          Not available for special ad categories.
        </p>
        <div
          v-for="(group, key) in DEMOGRAPHICS"
          v-else
          :key="key"
        >
          <h4>{{ group.label }}</h4>
          <div class="chips">
            <button
              v-for="opt in group.options"
              :key="opt"
              class="chip"
              :class="{ on: has(demo(key), opt) }"
              @click="toggle(demo(key), opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
        <label v-if="!form.specialCategory">Employers / businesses (comma separated)<input
          v-model="employersText"
          placeholder="Viorp, MTN"
        ></label>
      </details>

      <details open>
        <summary>Interests</summary>
        <div
          v-for="(list, group) in INTERESTS"
          :key="group"
        >
          <h4>{{ group }}</h4>
          <div class="chips">
            <button
              v-for="opt in list"
              :key="opt"
              class="chip"
              :class="{ on: has(form.targeting.interests, opt) }"
              @click="toggle(form.targeting.interests, opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </details>

      <details :open="!form.specialCategory">
        <summary>Behaviours</summary>
        <p
          v-if="form.specialCategory"
          class="muted"
        >
          Not available for special ad categories.
        </p>
        <div
          v-else
          class="chips"
        >
          <button
            v-for="b in BEHAVIOURS"
            :key="b.value"
            class="chip"
            :class="{ on: has(form.targeting.behaviours, b.value) }"
            @click="toggle(form.targeting.behaviours, b.value)"
          >
            {{ b.label }}
          </button>
        </div>
      </details>

      <details>
        <summary>Devices and connection</summary>
        <h4>Operating system</h4>
        <div class="chips">
          <button
            v-for="o in DEVICE_OS"
            :key="o"
            class="chip"
            :class="{ on: has(form.targeting.os, o) }"
            @click="toggle(form.targeting.os, o)"
          >
            {{ o }}
          </button>
        </div>
        <h4>Mobile brand</h4>
        <div class="chips">
          <button
            v-for="o in DEVICE_BRANDS"
            :key="o"
            class="chip"
            :class="{ on: has(form.targeting.devices, o) }"
            @click="toggle(form.targeting.devices, o)"
          >
            {{ o }}
          </button>
        </div>
        <h4>Connection</h4>
        <div class="chips">
          <button
            v-for="o in CONNECTIONS"
            :key="o"
            class="chip"
            :class="{ on: has(form.targeting.connections, o) }"
            @click="toggle(form.targeting.connections, o)"
          >
            {{ o.toUpperCase() }}
          </button>
        </div>
      </details>

      <label class="check"><input
        v-model="form.targeting.expand"
        type="checkbox"
      > Expand to similar people when it improves results (Advantage audience)</label>
    </section>

    <!-- 3. Ad set -->
    <section
      v-show="step === 2"
      class="card"
    >
      <label>Ad set name<input
        v-model="form.adsetName"
        maxlength="120"
        :placeholder="`${form.title || 'Campaign'} — ad set`"
      ></label>

      <h3>Conversion location</h3>
      <div class="options compact">
        <button
          v-for="l in locations"
          :key="l"
          class="option"
          :class="{ on: form.conversionLocation === l }"
          @click="form.conversionLocation = l"
        >
          {{ LOCATION_LABELS[l] }}
        </button>
      </div>

      <template v-if="form.conversionLocation === 'POST'">
        <label>Post to promote
          <select v-model="form.postId">
            <option
              :value="null"
              disabled
            >Choose one of your posts</option>
            <option
              v-for="p in myPosts"
              :key="p.id"
              :value="p.id"
            >{{ (p.content || 'Media post').slice(0, 70) }}</option>
          </select>
        </label>
        <label>…or paste a post link<input
          v-model="postLink"
          placeholder="https://viorp.com/posts/…"
          @change="readPostLink"
        ></label>
      </template>
      <p
        v-if="form.conversionLocation === 'PAGE'"
        class="muted"
      >
        People will visit {{ selectedPage?.name ?? 'the Page chosen in step 1' }}.
      </p>
      <p
        v-if="form.conversionLocation === 'CHAT'"
        class="muted"
      >
        People tap the button to start a chat with {{ selectedPage ? 'you' : 'you' }} in Viorp Chat.
      </p>
      <label v-if="form.conversionLocation === 'WEBSITE' || form.conversionLocation === 'APP'">
        {{ form.conversionLocation === 'APP' ? 'App store link' : 'Website link' }}
        <input
          v-model="form.destinationUrl"
          type="url"
          placeholder="https://"
        >
      </label>

      <h3>Schedule</h3>
      <div class="row2">
        <label>Start<input
          v-model="startsAt"
          type="datetime-local"
        ></label>
        <label>End<input
          v-model="endsAt"
          type="datetime-local"
        ></label>
      </div>
      <div class="chips">
        <button
          v-for="(d, i) in DAYS"
          :key="d"
          class="chip"
          :class="{ on: has(form.schedule.days, i) }"
          @click="toggle(form.schedule.days, i)"
        >
          {{ d }}
        </button>
      </div>
      <small class="muted">No days selected means every day.</small>
      <div class="row2">
        <label>Run from (hour)<input
          v-model.number="form.schedule.start_hour"
          type="number"
          min="0"
          max="23"
        ></label>
        <label>Until (hour)<input
          v-model.number="form.schedule.end_hour"
          type="number"
          min="1"
          max="24"
        ></label>
      </div>
      <small class="muted">Business hours in your time zone (UTC{{ tzLabel }}). 0–24 runs all day.</small>

      <h3>Daily spend</h3>
      <div class="row2">
        <label>Minimum (PEW)<input
          v-model.number="form.dailyMinSpend"
          type="number"
          min="0"
        ></label>
        <label>Maximum (PEW)<input
          v-model.number="form.dailyMaxSpend"
          type="number"
          :min="pricing.min_daily_pew"
          placeholder="No limit"
        ></label>
      </div>

      <h3>Bidding and charging</h3>
      <div class="fixed">
        <div><strong>Bid strategy:</strong> Highest volume — get the most results for your budget</div>
        <div><strong>You are charged per:</strong> Impression ({{ pricing.cpm_pew }} PEW per 1,000 viewable impressions; your own views are free)</div>
      </div>
    </section>

    <!-- 4. Ad -->
    <section
      v-show="step === 3"
      class="card"
    >
      <h3>Format</h3>
      <div class="chips">
        <button
          class="chip"
          :class="{ on: form.format === 'SINGLE' && kind === 'image' }"
          @click="setFormat('SINGLE', 'image')"
        >
          Single image
        </button>
        <button
          class="chip"
          :class="{ on: form.format === 'SINGLE' && kind === 'video' }"
          @click="setFormat('SINGLE', 'video')"
        >
          Single video
        </button>
        <button
          class="chip"
          :class="{ on: form.format === 'CAROUSEL' }"
          @click="setFormat('CAROUSEL', 'image')"
        >
          Carousel (2–10 cards)
        </button>
      </div>

      <div
        v-if="form.conversionLocation !== 'CATALOG'"
        class="media"
      >
        <div
          v-for="(m, i) in form.media"
          :key="m.url"
          class="media-item"
        >
          <video
            v-if="m.type === 'video'"
            :src="m.url"
            muted
            playsinline
          />
          <img
            v-else
            :src="m.url"
            alt=""
          >
          <template v-if="form.format === 'CAROUSEL'">
            <input
              v-model="m.headline"
              placeholder="Card headline"
              maxlength="80"
            >
            <input
              v-model="m.link"
              placeholder="Card link (optional)"
              type="url"
            >
          </template>
          <button
            class="btn small ghost"
            @click="form.media.splice(i, 1)"
          >
            Remove
          </button>
        </div>
        <label
          v-if="form.media.length < maxMedia"
          class="upload"
        >
          {{ uploading ? `Uploading ${progressPercentage}%…` : `+ Add ${kind === 'video' ? 'video' : 'image'}` }}
          <input
            type="file"
            :accept="kind === 'video' ? 'video/*' : 'image/*'"
            hidden
            :disabled="uploading"
            @change="upload"
          >
        </label>
      </div>

      <label>Primary text<textarea
        v-model="form.primaryText"
        rows="3"
        maxlength="2000"
        placeholder="Tell people what you're offering"
      /></label>
      <label>Headline<input
        v-model="form.headline"
        maxlength="120"
      ></label>
      <label>Call to action
        <select v-model="form.cta">
          <option
            v-for="(label, key) in CTA_LABELS"
            :key="key"
            :value="key"
          >{{ label }}</option>
        </select>
      </label>

      <template v-if="form.conversionLocation === 'INSTANT_FORM'">
        <h3>Instant form</h3>
        <label>Intro<textarea
          v-model="form.leadForm.intro"
          rows="2"
          maxlength="300"
        /></label>
        <div
          v-for="(q, i) in form.leadForm.questions"
          :key="i"
          class="question"
        >
          <input
            v-model="q.label"
            placeholder="Question"
            maxlength="120"
          >
          <select v-model="q.type">
            <option value="text">
              Short answer
            </option>
            <option value="email">
              Email
            </option>
            <option value="phone">
              Phone
            </option>
            <option value="choice">
              Multiple choice
            </option>
          </select>
          <input
            v-if="q.type === 'choice'"
            :value="(q.options ?? []).join(', ')"
            placeholder="Options, comma separated"
            @input="q.options = splitList(($event.target as HTMLInputElement).value)"
          >
          <button
            class="btn small ghost"
            @click="form.leadForm.questions.splice(i, 1)"
          >
            ✕
          </button>
        </div>
        <button
          class="btn small ghost"
          :disabled="form.leadForm.questions.length >= 10"
          @click="form.leadForm.questions.push({ label: '', type: 'text' })"
        >
          + Question
        </button>
        <label>Privacy policy link (required)<input
          v-model="form.leadForm.privacy_url"
          type="url"
          placeholder="https://"
        ></label>
      </template>

      <template v-if="form.conversionLocation === 'CATALOG'">
        <h3>Catalogue products</h3>
        <div
          v-for="(item, i) in form.catalog"
          :key="i"
          class="question"
        >
          <img
            v-if="item.image"
            :src="item.image"
            class="mini"
            alt=""
          >
          <input
            v-model="item.name"
            placeholder="Product name"
            maxlength="80"
          >
          <input
            v-model="item.price"
            placeholder="Price"
            maxlength="30"
          >
          <input
            v-model="item.link"
            placeholder="Product link https://"
            type="url"
          >
          <label class="upload small">Image<input
            type="file"
            accept="image/*"
            hidden
            @change="uploadCatalog($event, i)"
          ></label>
          <button
            class="btn small ghost"
            @click="form.catalog.splice(i, 1)"
          >
            ✕
          </button>
        </div>
        <button
          class="btn small ghost"
          :disabled="form.catalog.length >= 20"
          @click="form.catalog.push({ name: '', price: '', image: '', link: '' })"
        >
          + Product
        </button>
      </template>
    </section>

    <!-- 5. Preview -->
    <section
      v-show="step === 4"
      class="card"
    >
      <h3>Preview</h3>
      <div class="preview">
        <SponsoredAd
          :ad="previewAd"
          preview
        />
      </div>
      <ul class="summary">
        <li><strong>Campaign:</strong> {{ form.title }} · {{ GOAL_LABELS[form.goal] }}</li>
        <li><strong>Ad set:</strong> {{ form.adsetName || `${form.title} — ad set` }} · {{ LOCATION_LABELS[form.conversionLocation] }}</li>
        <li><strong>Audience:</strong> {{ audienceSummary }}</li>
        <li><strong>Runs:</strong> {{ startsAt.replace('T', ' ') }} → {{ endsAt.replace('T', ' ') }}, {{ form.schedule.start_hour }}:00–{{ form.schedule.end_hour }}:00</li>
        <li v-if="!editId">
          <strong>Budget:</strong> {{ fmt(form.budget) }} PEW from {{ form.pageId && form.fundFromPage ? 'the Page wallet' : 'your wallet' }}
        </li>
      </ul>
      <p class="muted">
        Ads are reviewed before they run. Editing a running ad sends it back to review.
      </p>
    </section>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
    <footer class="nav">
      <button
        v-if="step > 0"
        class="btn ghost"
        @click="step--"
      >
        Back
      </button>
      <span class="grow" />
      <button
        v-if="step < STEPS.length - 1"
        class="btn"
        @click="next"
      >
        Next
      </button>
      <button
        v-else
        class="btn"
        :disabled="publishing"
        @click="publish"
      >
        {{ publishing ? 'Publishing…' : editId ? 'Save and resubmit' : 'Publish' }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SponsoredAd from '~/components/ads/sponsored-ad.vue'
import { useFileUpload } from '~/composables/use-file-upload'
import {
  BEHAVIOURS, CONNECTIONS, CTA_LABELS, DEMOGRAPHICS, DEVICE_BRANDS, DEVICE_OS, GOAL_LABELS, GOAL_LOCATIONS,
  INTERESTS, LOCATION_LABELS, OBJECTIVES, SPECIAL_CATEGORIES
} from '~/utils/ad-options'
import type { AdGoal, AdMediaItem, AdObjective, AdSchedule, AdTargeting, AdView, CatalogItem, ConversionLocation, LeadQuestion } from '~/utils/ad-options'

definePageMeta({ middleware: ['auth'] })

const STEPS = ['Campaign', 'Audience', 'Ad set', 'Ad', 'Preview']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface PageOption { id: string, name: string, handle: string, avatar_url: string | null, role: string }
interface PostOption { id: string, content: string | null }
interface CampaignDetail {
  title: string
  objective: AdObjective
  goal: AdGoal
  special_category: string | null
  page_id: string | null
  funding_source: string
  adset_name: string | null
  conversion_location: ConversionLocation
  post_id: string | null
  ad_format: 'SINGLE' | 'CAROUSEL'
  media: AdMediaItem[] | null
  primary_text: string | null
  headline: string | null
  cta_label: string | null
  lead_form: { intro?: string, questions: LeadQuestion[], privacy_url?: string } | null
  catalog: CatalogItem[] | null
  target_destination_url: string | null
  targeting_demographics: AdTargeting | null
  schedule: AdSchedule | null
  daily_min_spend: number | null
  daily_max_spend: number | null
  starts_at: string
  ends_at: string
}

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const { uploading, progressPercentage, uploadFile } = useFileUpload()

const editId = computed(() => (typeof route.query.edit === 'string' ? route.query.edit : ''))
const step = ref(0)
const error = ref('')
const loadError = ref('')
const publishing = ref(false)
const pricing = ref({ cpm_pew: 2, min_budget_pew: 5, min_daily_pew: 1 })
const balance = ref(0)
const pages = ref<PageOption[]>([])
const myPosts = ref<PostOption[]>([])
const specialAck = ref(false)
const extraBudget = ref(0)
const kind = ref<'image' | 'video'>('image')
const postLink = ref('')
const locationsText = ref('')
const employersText = ref('')

const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const startsAt = ref(toLocal(new Date()))
const endsAt = ref(toLocal(new Date(Date.now() + 7 * 86400000)))
const tzOffset = -new Date().getTimezoneOffset()
const tzLabel = `${tzOffset >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')}:${String(Math.abs(tzOffset) % 60).padStart(2, '0')}`

const form = reactive({
  title: '',
  objective: 'ENGAGEMENT' as AdObjective,
  goal: 'ENGAGEMENT' as AdGoal,
  specialCategory: null as string | null,
  pageId: null as string | null,
  fundFromPage: false,
  budget: 20,
  adsetName: '',
  conversionLocation: 'POST' as ConversionLocation,
  postId: null as string | null,
  destinationUrl: '',
  format: 'SINGLE' as 'SINGLE' | 'CAROUSEL',
  media: [] as AdMediaItem[],
  primaryText: '',
  headline: '',
  cta: 'LEARN_MORE',
  leadForm: { intro: '', questions: [{ label: 'Full name', type: 'text', prefill: 'full_name' }, { label: 'Email', type: 'email', prefill: 'email' }] as LeadQuestion[], privacy_url: '' },
  catalog: [] as CatalogItem[],
  targeting: {
    age_min: 18, age_max: 65, genders: [] as string[], demographics: {} as Record<string, string[]>, interests: [] as string[],
    behaviours: [] as string[], os: [] as string[], devices: [] as string[], connections: [] as string[], expand: true
  },
  schedule: { days: [] as number[], start_hour: 0, end_hour: 24, utc_offset_minutes: tzOffset },
  dailyMinSpend: 0,
  dailyMaxSpend: null as number | null
})

const goals = computed(() => OBJECTIVES.find(o => o.value === form.objective)?.goals ?? [])
const locations = computed(() => GOAL_LOCATIONS[form.goal])
const selectedPage = computed(() => pages.value.find(p => p.id === form.pageId) ?? null)
const specialLabel = computed(() => SPECIAL_CATEGORIES.find(c => c.value === form.specialCategory)?.label.toLowerCase() ?? '')
const maxMedia = computed(() => (form.format === 'CAROUSEL' ? 10 : 1))
const estImpressions = computed(() => Math.floor((Number(form.budget) || 0) / pricing.value.cpm_pew * 1000))

const splitList = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean)
const has = <T,>(list: T[] | undefined, v: T) => Boolean(list?.includes(v))
const toggle = <T,>(list: T[], v: T) => {
  const i = list.indexOf(v)
  if (i >= 0) list.splice(i, 1)
  else list.push(v)
}
const demo = (key: string) => (form.targeting.demographics[key] ??= [])
const fmt = (n: number | string) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const message = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage
  ?? (e as { statusMessage?: string, message?: string })?.statusMessage ?? (e as Error)?.message ?? 'Something went wrong'

const setObjective = (o: AdObjective) => {
  form.objective = o
  if (!goals.value.includes(form.goal)) setGoal(goals.value[0]!)
}
const setGoal = (g: AdGoal) => {
  form.goal = g
  if (!GOAL_LOCATIONS[g].includes(form.conversionLocation)) form.conversionLocation = GOAL_LOCATIONS[g][0]!
  const ctaFor: Partial<Record<ConversionLocation, string>> = {
    CHAT: 'SEND_MESSAGE', APP: 'INSTALL_NOW', INSTANT_FORM: 'SIGN_UP', CATALOG: 'SHOP_NOW', PAGE: 'VISIT_PAGE', POST: 'VIEW_POST'
  }
  form.cta = ctaFor[form.conversionLocation] ?? 'LEARN_MORE'
}
const setFormat = (f: 'SINGLE' | 'CAROUSEL', k: 'image' | 'video') => {
  form.format = f
  kind.value = k
  form.media = form.media.filter(m => m.type === k).slice(0, f === 'CAROUSEL' ? 10 : 1)
}

const readPostLink = () => {
  const match = postLink.value.match(/posts\/([0-9a-f-]{36})/i) ?? postLink.value.match(/^([0-9a-f-]{36})$/i)
  if (match) form.postId = match[1]!
}

const upload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  error.value = ''
  try {
    const isVideo = file.type.startsWith('video/')
    const res = await uploadFile(file, 'posts', { optimize: !isVideo })
    if (!res) throw new Error('Upload failed')
    form.media.push({ url: res.url, type: isVideo ? 'video' : 'image' })
  } catch (err) {
    error.value = message(err)
  }
}
const uploadCatalog = async (e: Event, i: number) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const res = await uploadFile(file, 'posts', { optimize: true })
    if (res && form.catalog[i]) form.catalog[i]!.image = res.url
  } catch (err) {
    error.value = message(err)
  }
}

const validateStep = (i: number): string => {
  if (i === 0) {
    if (!form.title.trim()) return 'Give your campaign a name'
    if (form.specialCategory && !specialAck.value) return 'Confirm the special ad category policy'
    if (!editId.value && (Number(form.budget) || 0) < pricing.value.min_budget_pew) return `Budget must be at least ${pricing.value.min_budget_pew} PEW`
  }
  if (i === 1 && (form.targeting.age_min || 18) > (form.targeting.age_max || 65)) return 'Minimum age must be below maximum age'
  if (i === 2) {
    if (form.conversionLocation === 'POST' && !form.postId) return 'Choose the post to promote'
    if (form.conversionLocation === 'PAGE' && !form.pageId) return 'Go back to step 1 and choose the Page to advertise'
    if (['WEBSITE', 'APP'].includes(form.conversionLocation) && !/^https?:\/\/\S+/.test(form.destinationUrl)) return 'Enter a valid https:// link'
    if (new Date(endsAt.value) <= new Date(startsAt.value)) return 'End must be after start'
    if (form.dailyMaxSpend && form.dailyMinSpend > form.dailyMaxSpend) return 'Daily minimum cannot exceed daily maximum'
  }
  if (i === 3) {
    if (form.format === 'CAROUSEL' && form.media.length < 2 && form.conversionLocation !== 'CATALOG') return 'A carousel needs at least 2 cards'
    if (!['POST', 'CATALOG'].includes(form.conversionLocation) && !form.media.length) return 'Add an image or video'
    if (form.conversionLocation === 'INSTANT_FORM' && !/^https?:\/\//.test(form.leadForm.privacy_url)) return 'Add your privacy policy link'
    if (form.conversionLocation === 'CATALOG' && !form.catalog.some(c => c.name && c.image && c.link)) return 'Add at least one product with name, image and link'
  }
  return ''
}
const next = () => {
  error.value = validateStep(step.value)
  if (!error.value) step.value += 1
}
const go = (i: number) => {
  for (let s = 0; s < i; s++) {
    const problem = validateStep(s)
    if (problem) {
      step.value = s
      error.value = problem
      return
    }
  }
  error.value = ''
  step.value = i
}

const targetingPayload = (): AdTargeting => {
  const demographics = { ...form.targeting.demographics }
  const employers = splitList(employersText.value)
  if (employers.length) demographics.employers = employers
  return { ...form.targeting, demographics, locations: splitList(locationsText.value) }
}

const payload = () => ({
  title: form.title,
  objective: form.objective,
  goal: form.goal,
  specialCategory: form.specialCategory,
  pageId: form.pageId,
  fundFromPage: form.fundFromPage,
  budget: form.budget,
  adsetName: form.adsetName,
  conversionLocation: form.conversionLocation,
  postId: form.conversionLocation === 'POST' ? form.postId : null,
  destinationUrl: form.destinationUrl,
  format: form.format,
  media: form.conversionLocation === 'CATALOG' ? [] : form.media,
  primaryText: form.primaryText,
  headline: form.headline,
  cta: form.cta,
  leadForm: form.conversionLocation === 'INSTANT_FORM' ? form.leadForm : null,
  catalog: form.conversionLocation === 'CATALOG' ? form.catalog : [],
  targeting: targetingPayload(),
  schedule: form.schedule,
  startsAt: new Date(startsAt.value).toISOString(),
  endsAt: new Date(endsAt.value).toISOString(),
  dailyMinSpend: form.dailyMinSpend,
  dailyMaxSpend: form.dailyMaxSpend || null
})

const previewAd = computed<AdView>(() => {
  const page = selectedPage.value
  const meta = user.value?.user_metadata as { username?: string, full_name?: string, avatar_url?: string } | undefined
  return {
    id: 'preview',
    title: form.title,
    advertiser: page
      ? { id: page.id, type: 'PAGE', name: page.name, handle: page.handle, avatar_url: page.avatar_url, is_verified: false }
      : { id: user.value?.id ?? '', type: 'USER', name: meta?.full_name || meta?.username || 'You', handle: meta?.username ?? '', avatar_url: meta?.avatar_url ?? null, is_verified: false },
    objective: form.objective,
    goal: form.goal,
    conversionLocation: form.conversionLocation,
    format: form.format,
    media: form.conversionLocation === 'CATALOG' ? [] : form.media,
    primaryText: form.primaryText || null,
    headline: form.headline || null,
    cta: form.cta,
    destinationUrl: form.destinationUrl || null,
    postId: form.postId,
    pageHandle: page?.handle ?? null,
    leadForm: form.conversionLocation === 'INSTANT_FORM' ? form.leadForm : null,
    catalog: form.conversionLocation === 'CATALOG' ? form.catalog.filter(c => c.name) : [],
    creativeUrl: form.media[0]?.url ?? null,
    advertiserId: user.value?.id ?? ''
  }
})

const audienceSummary = computed(() => {
  const t = targetingPayload()
  const parts = [t.locations?.length ? t.locations.join(', ') : 'Everywhere', `${t.age_min}–${t.age_max}`]
  if (t.genders?.length) parts.push(t.genders.join('/'))
  const detail = Object.values(t.demographics ?? {}).flat().length + (t.interests?.length ?? 0) + (t.behaviours?.length ?? 0)
  if (detail) parts.push(`${detail} detailed targets`)
  if (t.os?.length) parts.push(t.os.join('/'))
  return parts.join(' · ')
})

const publish = async () => {
  for (let s = 0; s < STEPS.length - 1; s++) {
    const problem = validateStep(s)
    if (problem) {
      step.value = s
      error.value = problem
      return
    }
  }
  publishing.value = true
  error.value = ''
  try {
    if (editId.value) {
      await $fetch(`/api/ads/campaigns/${editId.value}`, { method: 'PUT', body: payload() })
      if (extraBudget.value > 0) {
        await $fetch(`/api/ads/campaigns/${editId.value}/budget`, { method: 'POST', body: { amount: extraBudget.value } })
      }
      await router.push(`/ads/${editId.value}`)
    } else {
      const res = await $fetch<{ id: string }>('/api/ads/campaigns', { method: 'POST', body: payload() })
      await router.push(`/ads/${res.id}`)
    }
  } catch (e) {
    error.value = message(e)
  } finally {
    publishing.value = false
  }
}

const loadEdit = async (id: string) => {
  const { campaign: c } = await $fetch<{ campaign: CampaignDetail }>(`/api/ads/campaigns/${id}`)
  const t = c.targeting_demographics ?? {}
  const demographics = { ...(t.demographics ?? {}) }
  employersText.value = (demographics.employers ?? []).join(', ')
  delete demographics.employers
  Object.assign(form, {
    title: c.title,
    objective: c.objective,
    goal: c.goal,
    specialCategory: c.special_category,
    pageId: c.page_id,
    fundFromPage: c.funding_source === 'PAGE',
    adsetName: c.adset_name ?? '',
    conversionLocation: c.conversion_location,
    postId: c.post_id,
    destinationUrl: c.target_destination_url ?? '',
    format: c.ad_format,
    media: c.media ?? [],
    primaryText: c.primary_text ?? '',
    headline: c.headline ?? '',
    cta: c.cta_label ?? 'LEARN_MORE',
    leadForm: { intro: c.lead_form?.intro ?? '', questions: c.lead_form?.questions ?? [], privacy_url: c.lead_form?.privacy_url ?? '' },
    catalog: c.catalog ?? [],
    dailyMinSpend: Number(c.daily_min_spend ?? 0),
    dailyMaxSpend: c.daily_max_spend === null ? null : Number(c.daily_max_spend)
  })
  Object.assign(form.targeting, {
    age_min: t.age_min ?? 18, age_max: t.age_max ?? 65, genders: t.genders ?? [], demographics, interests: t.interests ?? [],
    behaviours: t.behaviours ?? [], os: t.os ?? [], devices: t.devices ?? [], connections: t.connections ?? [], expand: t.expand !== false
  })
  Object.assign(form.schedule, { days: c.schedule?.days ?? [], start_hour: c.schedule?.start_hour ?? 0, end_hour: c.schedule?.end_hour ?? 24 })
  locationsText.value = (t.locations ?? []).join(', ')
  kind.value = form.media[0]?.type === 'video' ? 'video' : 'image'
  startsAt.value = toLocal(new Date(c.starts_at))
  endsAt.value = toLocal(new Date(c.ends_at))
  specialAck.value = Boolean(c.special_category)
}

watch(() => form.pageId, (id) => {
  if (!id) form.fundFromPage = false
})

onMounted(async () => {
  try {
    const [config, wallet, mine] = await Promise.all([
      $fetch<{ pricing: typeof pricing.value }>('/api/ads/config'),
      $fetch<{ balance: number }>('/api/wallet/balance').catch(() => ({ balance: 0 })),
      $fetch<{ pages: PageOption[] }>('/api/pages/mine').catch(() => ({ pages: [] }))
    ])
    pricing.value = config.pricing
    balance.value = Number(wallet.balance ?? 0)
    pages.value = mine.pages.filter(p => ['OWNER', 'MANAGER'].includes(p.role))
    if (form.budget < pricing.value.min_budget_pew) form.budget = pricing.value.min_budget_pew
    if (user.value?.id) {
      const res = await $fetch<{ data?: { posts: PostOption[] } }>(`/api/posts/user/${user.value.id}`, { query: { page: 1, limit: 30 } }).catch(() => null)
      myPosts.value = res?.data?.posts ?? []
    }
    if (editId.value) await loadEdit(editId.value)
  } catch (e) {
    loadError.value = message(e)
  }
})
</script>

<style scoped>
.wizard { max-width: 720px; margin: 0 auto; padding: 20px 16px 100px; color: #e2e8f0; }
.back { color: #93c5fd; text-decoration: none; font-size: 0.9rem; }
h1 { font-size: 1.5rem; font-weight: 800; margin-top: 6px; }
h3 { font-size: 1rem; font-weight: 700; margin-top: 8px; }
h4 { font-size: 0.85rem; color: #cbd5e1; margin: 10px 0 6px; }
.muted { color: #94a3b8; font-size: 0.85rem; margin: 4px 0; }
.steps { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 14px 0; }
.step { flex-shrink: 0; display: flex; gap: 6px; align-items: center; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.step span { width: 20px; height: 20px; border-radius: 999px; background: #334155; display: grid; place-items: center; font-size: 0.75rem; }
.step.on { border-color: #3b82f6; color: #fff; }
.step.on span, .step.done span { background: #2563eb; }
.card { display: flex; flex-direction: column; gap: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
label.check { flex-direction: row; align-items: flex-start; gap: 8px; }
input, textarea, select { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 10px 12px; font: inherit; min-width: 0; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.options { display: grid; gap: 8px; }
.option { text-align: left; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 10px 12px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
.option small { color: #94a3b8; }
.option.on { border-color: #3b82f6; background: #172554; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { background: #0f172a; border: 1px solid #334155; color: #cbd5e1; border-radius: 999px; padding: 5px 11px; cursor: pointer; font-size: 0.82rem; text-transform: capitalize; }
.chip.on { background: #2563eb; border-color: #2563eb; color: #fff; }
.chip:disabled { opacity: .4; cursor: not-allowed; }
details { border-top: 1px solid #334155; padding-top: 8px; }
summary { cursor: pointer; font-weight: 700; }
.fixed { background: #0f172a; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem; }
.media { display: flex; flex-wrap: wrap; gap: 10px; }
.media-item { width: 150px; display: flex; flex-direction: column; gap: 6px; }
.media-item img, .media-item video { width: 150px; height: 150px; object-fit: cover; border-radius: 10px; background: #0f172a; }
.upload { width: 150px; height: 150px; border: 2px dashed #475569; border-radius: 10px; display: grid; place-items: center; text-align: center; cursor: pointer; color: #93c5fd; }
.upload.small { width: auto; height: auto; padding: 8px 10px; }
.question { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.question input { flex: 1; min-width: 120px; }
.mini { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
.preview { max-width: 420px; }
.summary { display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem; padding-left: 18px; }
.nav { display: flex; gap: 8px; margin-top: 14px; }
.grow { flex: 1; }
.btn { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.55rem 1.2rem; font-weight: 600; cursor: pointer; }
.btn.small { padding: 0.35rem 0.8rem; font-size: 0.8rem; flex-shrink: 0; }
.btn.ghost { background: transparent; border: 1px solid #475569; color: #e2e8f0; }
.btn:disabled { opacity: .6; }
.error { color: #f87171; font-size: 0.88rem; margin-top: 8px; }
</style>
