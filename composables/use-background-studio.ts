import { ref, shallowRef } from 'vue'
import type { ImageSegmenter } from '@mediapipe/tasks-vision'

export type StudioMode = 'none' | 'blur' | 'image' | 'video' | 'clip' | 'screen'

const MASK_W = 256
const MASK_H = 144

/**
 * Viorp Background Studio: on-device person segmentation (MediaPipe selfie
 * segmenter, self-hosted wasm + model) composited on a canvas so the LIVE can
 * blur or replace the background with an uploaded photo or video.
 */
export const useBackgroundStudio = () => {
  const mode = ref<StudioMode>('none')
  const loading = ref(false)
  const error = ref('')
  const output = shallowRef<MediaStream | null>(null)

  let segmenter: ImageSegmenter | null = null
  let source: MediaStream | null = null
  const video = typeof document !== 'undefined' ? document.createElement('video') : null
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  const small = typeof document !== 'undefined' ? document.createElement('canvas') : null
  const mask = typeof document !== 'undefined' ? document.createElement('canvas') : null
  const person = typeof document !== 'undefined' ? document.createElement('canvas') : null
  let maskData: ImageData | null = null
  let bgImage: HTMLImageElement | null = null
  let bgVideo: HTMLVideoElement | null = null
  let bgUrl: string | null = null
  let running = false
  let lastTs = -1
  let clipVideo: HTMLVideoElement | null = null
  let screenStream: MediaStream | null = null
  let screenVideo: HTMLVideoElement | null = null
  let audioCtx: AudioContext | null = null
  let mixDest: MediaStreamAudioDestinationNode | null = null
  const clipPlaying = ref(false)
  const clipMuted = ref(false)
  let onRevert: (() => void) | null = null
  const whenReverted = (fn: () => void) => { onRevert = fn }

  const ensureSegmenter = async () => {
    if (segmenter) return
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
    const files = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    const make = (delegate: 'GPU' | 'CPU') => ImageSegmenter.createFromOptions(files, {
      baseOptions: { modelAssetPath: '/models/selfie_segmenter.tflite', delegate },
      runningMode: 'VIDEO',
      outputCategoryMask: false,
      outputConfidenceMasks: true
    })
    segmenter = await make('GPU').catch(() => make('CPU'))
  }

  const cover = (c: CanvasRenderingContext2D, el: CanvasImageSource, sw: number, sh: number, w: number, h: number) => {
    if (!sw || !sh) return
    const s = Math.max(w / sw, h / sh)
    const dw = sw * s
    const dh = sh * s
    c.drawImage(el, (w - dw) / 2, (h - dh) / 2, dw, dh)
  }

  const frame = () => {
    if (!running || !video || !canvas || !ctx || !small || !mask || !person) return
    if (!segmenter && mode.value !== 'clip' && mode.value !== 'screen') { schedule(); return }
    const w = video.videoWidth
    const h = video.videoHeight
    if (w && h && (mode.value === 'clip' || mode.value === 'screen')) {
      // Explainer layout: the clip/screen fills the frame, the host talks from a camera bubble.
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      const main = mode.value === 'clip' ? clipVideo : screenVideo
      if (main && main.readyState >= 2) {
        const sw = main.videoWidth
        const sh = main.videoHeight
        const sc = Math.min(w / sw, h / sh)
        ctx.drawImage(main, (w - sw * sc) / 2, (h - sh * sc) / 2, sw * sc, sh * sc)
      }
      const r = Math.round(Math.min(w, h) * 0.17)
      const cx = w - r - Math.round(w * 0.04)
      const cy = Math.round(h * 0.2) + r
      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
      const side = Math.min(w, h)
      ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2)
      ctx.restore()
      ctx.lineWidth = Math.max(3, Math.round(r * 0.06)); ctx.strokeStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      schedule()
      return
    }
    if (w && h) {
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; person.width = w; person.height = h }
      const sctx = small.getContext('2d')!
      sctx.drawImage(video, 0, 0, MASK_W, MASK_H)
      const ts = performance.now()
      if (ts > lastTs) {
        lastTs = ts
        const res = segmenter!.segmentForVideo(small, ts)
        const conf = res.confidenceMasks?.[0]
        if (conf) {
          const f = conf.getAsFloat32Array()
          if (!maskData) maskData = new ImageData(MASK_W, MASK_H)
          for (let i = 0; i < f.length; i++) { const o = i * 4; maskData.data[o + 3] = Math.round(f[i]! * 255) }
          mask.getContext('2d')!.putImageData(maskData, 0, 0)
        }
        res.close()
      }
      // Background
      ctx.save()
      if (mode.value === 'blur') { ctx.filter = 'blur(14px)'; ctx.drawImage(video, 0, 0, w, h) }
      else if (mode.value === 'image' && bgImage?.complete) cover(ctx, bgImage, bgImage.naturalWidth, bgImage.naturalHeight, w, h)
      else if (mode.value === 'video' && bgVideo && bgVideo.readyState >= 2) cover(ctx, bgVideo, bgVideo.videoWidth, bgVideo.videoHeight, w, h)
      else ctx.drawImage(video, 0, 0, w, h)
      ctx.restore()
      // Person cut-out, soft edges
      const pctx = person.getContext('2d')!
      pctx.globalCompositeOperation = 'source-over'
      pctx.clearRect(0, 0, w, h)
      pctx.drawImage(video, 0, 0, w, h)
      pctx.globalCompositeOperation = 'destination-in'
      pctx.filter = 'blur(3px)'
      pctx.drawImage(mask, 0, 0, w, h)
      pctx.filter = 'none'
      ctx.drawImage(person, 0, 0)
    }
    schedule()
  }

  const schedule = () => {
    if (!running || !video) return
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(frame)
    else requestAnimationFrame(frame)
  }

  let canvasTrack: MediaStreamTrack | null = null
  /** Mic + clip/screen audio mixed into one track while explaining a clip. */
  const mixedAudio = (): MediaStreamTrack[] => {
    const extra = mode.value === 'screen' ? screenStream?.getAudioTracks() ?? [] : []
    if (mode.value !== 'clip' && !extra.length) return source?.getAudioTracks() ?? []
    if (!audioCtx) { audioCtx = new AudioContext(); mixDest = audioCtx.createMediaStreamDestination() }
    const dest = mixDest!
    if (source?.getAudioTracks().length) audioCtx.createMediaStreamSource(new MediaStream(source.getAudioTracks())).connect(dest)
    if (extra.length) audioCtx.createMediaStreamSource(new MediaStream(extra)).connect(dest)
    void audioCtx.resume()
    return dest.stream.getAudioTracks()
  }
  const buildOutput = () => {
    if (!canvas || !source) return null
    if (!canvasTrack || canvasTrack.readyState === 'ended') canvasTrack = canvas.captureStream(30).getVideoTracks()[0] ?? null
    return new MediaStream([...(canvasTrack ? [canvasTrack] : []), ...mixedAudio()])
  }
  const resetAudio = () => {
    void audioCtx?.close().catch(() => {})
    audioCtx = null
    mixDest = null
  }
  const clearSources = () => {
    if (clipVideo) { clipVideo.pause(); clipVideo.removeAttribute('src'); clipVideo = null }
    screenStream?.getTracks().forEach(t => t.stop()); screenStream = null; screenVideo = null
    clipPlaying.value = false
    resetAudio()
  }
  const toggleClip = () => {
    if (!clipVideo) return
    if (clipVideo.paused) { void clipVideo.play(); clipPlaying.value = true } else { clipVideo.pause(); clipPlaying.value = false }
  }
  const toggleClipSound = () => {
    if (!clipVideo) return
    clipMuted.value = !clipMuted.value
    clipVideo.muted = clipMuted.value
  }

  /** Point the studio at a (new) camera stream; returns the processed stream. */
  const setSource = async (camera: MediaStream) => {
    source = camera
    if (!video) return camera
    video.muted = true
    video.playsInline = true
    video.srcObject = camera
    await video.play().catch(() => {})
    if (output.value) {
      resetAudio()
      if (mode.value === 'clip' && clipVideo) attachClipAudio(clipVideo)
      output.value = buildOutput()
    }
    return output.value ?? camera
  }

  const setBackground = async (next: StudioMode, file?: File) => {
    error.value = ''
    if (next === 'none') { stop(); return null }
    if (!source) { error.value = 'Start the camera first'; return null }
    loading.value = true
    try {
      if (next === 'blur' || next === 'image' || next === 'video') await ensureSegmenter()
      if (bgUrl) { URL.revokeObjectURL(bgUrl); bgUrl = null }
      bgImage = null
      if (bgVideo) { bgVideo.pause(); bgVideo = null }
      clearSources()
      if (next === 'clip') {
        if (!file) throw new Error('Pick a video clip')
        bgUrl = URL.createObjectURL(file)
        clipVideo = document.createElement('video')
        Object.assign(clipVideo, { src: bgUrl, loop: true, playsInline: true, muted: false })
        clipVideo.crossOrigin = 'anonymous'
        mode.value = 'clip'
        attachClipAudio(clipVideo)
        await clipVideo.play()
        clipPlaying.value = true
        clipMuted.value = false
      } else if (next === 'screen') {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true })
        screenVideo = document.createElement('video')
        Object.assign(screenVideo, { srcObject: screenStream, muted: true, playsInline: true })
        await screenVideo.play()
        screenStream.getVideoTracks()[0]?.addEventListener('ended', () => { stop(); onRevert?.() })
      } else if (file && next === 'image') {
        bgUrl = URL.createObjectURL(file)
        bgImage = new Image()
        bgImage.src = bgUrl
        await bgImage.decode()
      } else if (file && next === 'video') {
        bgUrl = URL.createObjectURL(file)
        bgVideo = document.createElement('video')
        Object.assign(bgVideo, { src: bgUrl, loop: true, muted: true, playsInline: true })
        await bgVideo.play()
      }
      mode.value = next
      if (!canvas) { canvas = document.createElement('canvas'); ctx = canvas.getContext('2d') }
      if (small) { small.width = MASK_W; small.height = MASK_H }
      if (mask) { mask.width = MASK_W; mask.height = MASK_H }
      if (!running) { running = true; schedule() }
      output.value = buildOutput()
      return output.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Background Studio failed to start'
      stop()
      return null
    } finally { loading.value = false }
  }

  /** Clip audio goes to the LIVE mix and to the host's speaker so they can follow it. */
  function attachClipAudio (el: HTMLVideoElement) {
    if (!audioCtx) { audioCtx = new AudioContext(); mixDest = audioCtx.createMediaStreamDestination() }
    const node = audioCtx.createMediaElementSource(el)
    node.connect(mixDest!)
    node.connect(audioCtx.destination)
  }

  const stop = () => {
    running = false
    mode.value = 'none'
    clearSources()
    canvasTrack?.stop()
    canvasTrack = null
    output.value = null
    if (bgVideo) { bgVideo.pause(); bgVideo = null }
    if (bgUrl) { URL.revokeObjectURL(bgUrl); bgUrl = null }
    bgImage = null
  }

  const dispose = () => { stop(); segmenter?.close(); segmenter = null; if (video) video.srcObject = null }

  return { mode, loading, error, output, clipPlaying, clipMuted, setSource, setBackground, toggleClip, toggleClipSound, whenReverted, stop, dispose }
}
