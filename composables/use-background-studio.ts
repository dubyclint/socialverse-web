import { ref, shallowRef } from 'vue'
import type { ImageSegmenter } from '@mediapipe/tasks-vision'

export type StudioMode = 'none' | 'blur' | 'image' | 'video'

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
    if (!running || !video || !canvas || !ctx || !small || !mask || !person || !segmenter) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (w && h) {
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; person.width = w; person.height = h }
      const sctx = small.getContext('2d')!
      sctx.drawImage(video, 0, 0, MASK_W, MASK_H)
      const ts = performance.now()
      if (ts > lastTs) {
        lastTs = ts
        const res = segmenter.segmentForVideo(small, ts)
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

  const buildOutput = () => {
    if (!canvas || !source) return null
    const track = (canvas.captureStream(30).getVideoTracks()[0])!
    return new MediaStream([track, ...source.getAudioTracks()])
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
      // Keep the same canvas video track, swap audio to the new camera's.
      const v = output.value.getVideoTracks()[0]
      output.value = new MediaStream([...(v ? [v] : []), ...camera.getAudioTracks()])
    }
    return output.value ?? camera
  }

  const setBackground = async (next: StudioMode, file?: File) => {
    error.value = ''
    if (next === 'none') { stop(); return null }
    if (!source) { error.value = 'Start the camera first'; return null }
    loading.value = true
    try {
      await ensureSegmenter()
      if (bgUrl) { URL.revokeObjectURL(bgUrl); bgUrl = null }
      bgImage = null
      if (bgVideo) { bgVideo.pause(); bgVideo = null }
      if (file && next === 'image') {
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
      if (!output.value) output.value = buildOutput()
      return output.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Background Studio failed to start'
      stop()
      return null
    } finally { loading.value = false }
  }

  const stop = () => {
    running = false
    mode.value = 'none'
    output.value?.getVideoTracks().forEach(t => t.stop())
    output.value = null
    if (bgVideo) { bgVideo.pause(); bgVideo = null }
    if (bgUrl) { URL.revokeObjectURL(bgUrl); bgUrl = null }
    bgImage = null
  }

  const dispose = () => { stop(); segmenter?.close(); segmenter = null; if (video) video.srcObject = null }

  return { mode, loading, error, output, setSource, setBackground, stop, dispose }
}
