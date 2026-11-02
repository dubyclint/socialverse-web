import { shallowRef } from 'vue'

export interface CompositorTile { key: string, name: string, stream: MediaStream }

/**
 * Host-side grid compositor for Multi-Guest / Co-Host: draws host + guests into
 * one portrait canvas and mixes their audio, so viewers keep receiving a single
 * stream (works for mesh and media-server transports alike).
 */
export const useLiveCompositor = () => {
  const output = shallowRef<MediaStream | null>(null)
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  let tiles: (CompositorTile & { video: HTMLVideoElement })[] = []
  let audioCtx: AudioContext | null = null
  let mainDest: MediaStreamAudioDestinationNode | null = null
  const sources = new Map<string, MediaStreamAudioSourceNode>()
  const returns = new Map<string, MediaStreamAudioDestinationNode>()
  let raf = 0
  const W = 720
  const H = 1280

  const grid = (n: number) => n <= 1 ? [1, 1] : n === 2 ? [1, 2] : n <= 4 ? [2, 2] : n <= 6 ? [2, 3] : [3, 3]

  const draw = () => {
    if (!ctx || !canvas) return
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    const [cols, rows] = grid(tiles.length)
    const tw = W / cols!
    const th = H / rows!
    tiles.forEach((t, i) => {
      const x = (i % cols!) * tw
      const y = Math.floor(i / cols!) * th
      const v = t.video
      if (v.readyState >= 2 && v.videoWidth) {
        const s = Math.max(tw / v.videoWidth, th / v.videoHeight)
        const dw = v.videoWidth * s
        const dh = v.videoHeight * s
        ctx!.save()
        ctx!.beginPath(); ctx!.rect(x, y, tw, th); ctx!.clip()
        ctx!.drawImage(v, x + (tw - dw) / 2, y + (th - dh) / 2, dw, dh)
        ctx!.restore()
      }
      ctx!.strokeStyle = '#000'; ctx!.lineWidth = 4; ctx!.strokeRect(x, y, tw, th)
      ctx!.font = '600 22px system-ui, sans-serif'
      const label = i === 0 ? `${t.name} · Host` : t.name
      const lw = ctx!.measureText(label).width + 16
      ctx!.fillStyle = 'rgba(0,0,0,.55)'; ctx!.fillRect(x + 8, y + th - 40, lw, 30)
      ctx!.fillStyle = '#fff'; ctx!.fillText(label, x + 16, y + th - 18)
    })
    raf = requestAnimationFrame(draw)
  }

  const wireAudio = () => {
    if (!audioCtx || !mainDest) return
    sources.forEach(s => s.disconnect())
    sources.clear()
    for (const t of tiles) {
      const a = t.stream.getAudioTracks()
      if (a.length) sources.set(t.key, audioCtx.createMediaStreamSource(new MediaStream(a)))
    }
    sources.forEach(s => s.connect(mainDest!))
    // Each guest hears everyone except themselves.
    for (const t of tiles.slice(1)) {
      let d = returns.get(t.key)
      if (!d) { d = audioCtx.createMediaStreamDestination(); returns.set(t.key, d) }
      sources.forEach((s, key) => { if (key !== t.key) s.connect(d!) })
    }
  }

  /** First tile is the host. Returns the composite stream. */
  const update = (next: CompositorTile[]) => {
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
      ctx = canvas.getContext('2d')
      audioCtx = new AudioContext()
      mainDest = audioCtx.createMediaStreamDestination()
      output.value = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...mainDest.stream.getAudioTracks()])
      raf = requestAnimationFrame(draw)
    }
    const keep = new Map(tiles.map(t => [t.key, t]))
    tiles = next.map((n) => {
      const old = keep.get(n.key)
      if (old && old.stream === n.stream) return { ...old, name: n.name }
      const video = document.createElement('video')
      Object.assign(video, { muted: true, playsInline: true, autoplay: true, srcObject: n.stream })
      void video.play().catch(() => {})
      return { ...n, video }
    })
    for (const key of [...returns.keys()]) if (!tiles.some(t => t.key === key)) returns.delete(key)
    void audioCtx?.resume()
    wireAudio()
    return output.value
  }

  const returnTrackFor = (key: string) => returns.get(key)?.stream.getAudioTracks()[0] ?? null

  const stop = () => {
    cancelAnimationFrame(raf)
    output.value?.getTracks().forEach(t => t.stop())
    output.value = null
    tiles = []
    sources.clear(); returns.clear()
    void audioCtx?.close().catch(() => {})
    audioCtx = null; mainDest = null; canvas = null; ctx = null
  }

  return { output, update, returnTrackFor, stop }
}
