<template>
  <section class="tc">
    <header class="tc-head"><Icon name="message-square" size="16" /> Trade chat <small>Only this trade's parties{{ role === 'staff' ? ' and you (support)' : ' and support on a dispute' }} can read it.</small></header>
    <div ref="list" class="tc-list">
      <div v-if="!messages.length" class="tc-empty">
        <Icon name="paperclip" size="28" />
        <p>No messages yet.</p>
        <small>Communicate with the {{ role === 'seller' ? 'buyer' : 'seller' }} or attach payment proof here.</small>
      </div>
      <div v-for="m in messages" :key="m.id" class="tc-msg" :class="{ mine: m.mine, staff: m.sender_role === 'staff' }">
        <span class="tc-name">{{ m.mine ? 'You' : m.sender.name }}<em v-if="m.sender_role === 'staff'"> · Support</em></span>
        <p v-if="m.body" class="tc-body">{{ m.body }}</p>
        <div v-if="m.attachments.length" class="tc-atts">
          <template v-for="a in m.attachments" :key="a.url">
            <a v-if="a.type.startsWith('image/')" :href="a.url" target="_blank" rel="noopener"><img :src="a.url" alt="attachment" loading="lazy"></a>
            <video v-else-if="a.type.startsWith('video/')" :src="a.url" controls playsinline preload="metadata" />
            <a v-else :href="a.url" target="_blank" rel="noopener" class="tc-doc"><Icon name="file-text" size="16" /> {{ a.name || 'Document' }}</a>
          </template>
        </div>
        <time>{{ new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</time>
      </div>
    </div>

    <div v-if="pending.length" class="tc-preview">
      <div v-for="(f, i) in pending" :key="i" class="tc-thumb">
        <img v-if="f.type.startsWith('image/')" :src="f.preview" alt="">
        <span v-else><Icon :name="f.type.startsWith('video/') ? 'film' : 'file-text'" size="18" /></span>
        <button aria-label="Remove" @click="removePending(i)">×</button>
      </div>
    </div>

    <div v-if="drawer" class="tc-drawer">
      <button @click="pick(cameraInput)"><Icon name="camera" size="16" /> Take photo / video</button>
      <button @click="pick(fileInput)"><Icon name="upload" size="16" /> Upload file / image</button>
      <button @click="pasteShot"><Icon name="clipboard" size="16" /> Paste screenshot</button>
    </div>
    <input ref="cameraInput" type="file" accept="image/*,video/*" capture="environment" hidden @change="onFiles">
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,application/pdf" multiple hidden @change="onFiles">

    <div class="tc-bar" @paste="onPaste">
      <button class="tc-attach" :disabled="closed" aria-label="Attach" @click="drawer = !drawer"><Icon name="paperclip" size="18" /></button>
      <input v-model="draft" class="tc-input" :disabled="closed" :placeholder="closed ? 'Trade closed — chat is read-only' : 'Message…'" @keyup.enter="send">
      <button class="tc-send" :disabled="closed || sending || (!draft.trim() && !pending.length)" aria-label="Send" @click="send"><Icon name="send" size="16" /></button>
    </div>
    <p v-if="error" class="tc-err">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
interface Att { url: string, type: string, name: string }
interface Msg { id: number, sender_role: string, body: string, attachments: Att[], created_at: string, mine: boolean, sender: { name: string } }
interface Pending { file: File, type: string, preview: string }

const props = defineProps<{ tradeId: string, closed?: boolean }>()
const messages = ref<Msg[]>([])
const role = ref('')
const draft = ref('')
const sending = ref(false)
const error = ref('')
const drawer = ref(false)
const pending = ref<Pending[]>([])
const list = ref<HTMLElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const OK = /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm|quicktime)|application\/pdf)$/
let timer: ReturnType<typeof setInterval> | null = null

const scrollEnd = () => nextTick(() => { if (list.value) list.value.scrollTop = list.value.scrollHeight })
async function load() {
  try {
    const after = messages.value.at(-1)?.id ?? 0
    const r = await $fetch<{ role: string, messages: Msg[] }>(`/api/p2p/trades/${props.tradeId}/messages`, { query: { after } })
    role.value = r.role
    if (r.messages.length) { messages.value.push(...r.messages); scrollEnd() }
  } catch { error.value = 'Could not load the trade chat' }
}
const pick = (el: HTMLInputElement | null) => { drawer.value = false; el?.click() }
const addFiles = (files: File[]) => {
  for (const f of files) {
    if (!OK.test(f.type)) { error.value = 'Allowed: PNG, JPG, MP4, WEBM, PDF'; continue }
    if (f.size > 25 * 1024 * 1024) { error.value = 'Files must be 25 MB or smaller'; continue }
    if (pending.value.length < 6) pending.value.push({ file: f, type: f.type, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : '' })
  }
}
const onFiles = (e: Event) => { const t = e.target as HTMLInputElement; addFiles([...(t.files ?? [])]); t.value = '' }
const onPaste = (e: ClipboardEvent) => { const fs = [...(e.clipboardData?.files ?? [])]; if (fs.length) { e.preventDefault(); addFiles(fs) } }
async function pasteShot() {
  drawer.value = false
  try {
    const items = await navigator.clipboard.read()
    for (const it of items) {
      const t = it.types.find(x => x.startsWith('image/'))
      if (t) addFiles([new File([await it.getType(t)], `screenshot.${t.split('/')[1]}`, { type: t })])
    }
  } catch { error.value = 'Copy a screenshot first, or press Ctrl/Cmd+V in the message box' }
}
const removePending = (i: number) => { const p = pending.value[i]; if (p?.preview) URL.revokeObjectURL(p.preview); pending.value.splice(i, 1) }

async function send() {
  if (props.closed || (!draft.value.trim() && !pending.value.length)) return
  sending.value = true; error.value = ''
  try {
    const attachments: Att[] = []
    for (const p of pending.value) {
      const fd = new FormData(); fd.append('file', p.file); fd.append('bucket', 'chat-media')
      const r = await $fetch<{ url?: string }>('/api/upload', { method: 'POST', body: fd })
      if (r.url) attachments.push({ url: r.url, type: p.type, name: p.file.name })
    }
    await $fetch(`/api/p2p/trades/${props.tradeId}/messages`, { method: 'POST', body: { body: draft.value, attachments } })
    draft.value = ''
    pending.value.forEach(p => p.preview && URL.revokeObjectURL(p.preview)); pending.value = []
    await load()
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Message not sent'
  } finally { sending.value = false }
}

watch(() => props.tradeId, () => { messages.value = []; load() }, { immediate: true })
onMounted(() => { timer = setInterval(load, 4000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.tc { width: 100%; display: flex; flex-direction: column; border-radius: 14px; background: var(--card-bg, #fff); border: 1px solid rgba(100,116,139,.2); overflow: hidden; margin-top: 12px; }
.tc-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 10px 12px; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(100,116,139,.15); }
.tc-head small { font-weight: 400; color: #64748b; font-size: 11px; }
.tc-list { min-height: 180px; max-height: 50vh; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.tc-empty { margin: auto; text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tc-empty p { margin: 0; font-weight: 600; }
.tc-msg { max-width: 82%; align-self: flex-start; background: rgba(100,116,139,.12); border-radius: 12px 12px 12px 4px; padding: 6px 10px; }
.tc-msg.mine { align-self: flex-end; background: #4f46e5; color: #fff; border-radius: 12px 12px 4px 12px; }
.tc-msg.staff { background: #fef3c7; color: #78350f; }
.tc-name { display: block; font-size: 11px; font-weight: 600; opacity: .8; }
.tc-body { margin: 2px 0; white-space: pre-wrap; word-break: break-word; font-size: 14px; }
.tc-atts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tc-atts img, .tc-atts video { max-width: 180px; max-height: 180px; border-radius: 8px; object-fit: cover; }
.tc-doc { display: inline-flex; gap: 4px; align-items: center; font-size: 13px; text-decoration: underline; color: inherit; }
.tc-msg time { display: block; text-align: right; font-size: 10px; opacity: .65; }
.tc-preview { display: flex; gap: 6px; padding: 6px 10px; overflow-x: auto; border-top: 1px solid rgba(100,116,139,.15); }
.tc-thumb { position: relative; width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; background: rgba(100,116,139,.15); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.tc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.tc-thumb button { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; min-height: 0; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; line-height: 1; padding: 0; }
.tc-drawer { display: flex; flex-direction: column; border-top: 1px solid rgba(100,116,139,.15); }
.tc-drawer button { display: flex; align-items: center; gap: 8px; padding: 10px 14px; text-align: left; font-size: 14px; background: none; }
.tc-drawer button:hover { background: rgba(100,116,139,.08); }
.tc-bar { display: flex; align-items: center; gap: 6px; padding: 8px; border-top: 1px solid rgba(100,116,139,.15); }
.tc-attach, .tc-send { width: 36px; height: 36px; min-height: 0; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0; }
.tc-attach { background: rgba(100,116,139,.12); }
.tc-send { background: #4f46e5; color: #fff; transition: opacity .15s, transform .1s; }
.tc-send:disabled { opacity: .35; cursor: not-allowed; }
.tc-send:not(:disabled):active { transform: scale(.92); }
.tc-input { flex: 1; min-width: 0; height: 36px; min-height: 0; border-radius: 18px; padding: 0 14px; border: 1px solid rgba(100,116,139,.3); background: transparent; font-size: 14px; }
.tc-err { color: #dc2626; font-size: 12px; padding: 0 10px 8px; margin: 0; }
</style>
