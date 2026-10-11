type Pattern = 'incoming' | 'outgoing' | 'notify' | 'message'

let ctx: AudioContext | null = null
let loop: ReturnType<typeof setInterval> | null = null

const audio = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Browsers only allow audio after a user gesture; resume the shared context on
// the first one so later rings and pings are audible.
if (typeof window !== 'undefined') {
  const unlock = () => {
    audio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

const tone = (freqs: number[], start: number, length: number, gain = 0.18) => {
  const c = audio()
  if (!c) return
  const at = c.currentTime + start
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.02)
  g.gain.setValueAtTime(gain, at + length - 0.05)
  g.gain.linearRampToValueAtTime(0, at + length)
  g.connect(c.destination)
  for (const f of freqs) {
    const o = c.createOscillator()
    o.frequency.value = f
    o.connect(g)
    o.start(at)
    o.stop(at + length)
  }
}

const play = (pattern: Pattern) => {
  if (pattern === 'incoming') {
    tone([880, 1320], 0, 0.35)
    tone([880, 1320], 0.45, 0.35)
    navigator.vibrate?.([400, 150, 400])
  } else if (pattern === 'outgoing') {
    tone([440, 480], 0, 1.6, 0.12)
  } else if (pattern === 'message') {
    tone([1046], 0, 0.09, 0.14)
    tone([1568], 0.1, 0.12, 0.14)
  } else {
    tone([784], 0, 0.12, 0.15)
    tone([1175], 0.14, 0.18, 0.15)
    navigator.vibrate?.(120)
  }
}

export const useRingtone = () => {
  const stop = () => {
    if (loop) clearInterval(loop)
    loop = null
    navigator.vibrate?.(0)
  }

  const ring = (pattern: 'incoming' | 'outgoing') => {
    stop()
    play(pattern)
    loop = setInterval(() => play(pattern), pattern === 'incoming' ? 2000 : 4000)
  }

  return { ring, stop, ping: (kind: 'notify' | 'message' = 'notify') => play(kind) }
}
