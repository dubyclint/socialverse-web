export interface CelebrateParticle {
  id: number
  kind: 'cash' | 'heart'
  glyph: string
  x: number
  y: number
  delay: number
  duration: number
  drift: number
  size: number
}

const CASH_GLYPHS = ['💵', '💸', '🪙', '💰']
const HEART_GLYPHS = ['❤️', '💖', '💗', '💕']
let nextId = 1

/** App-wide micro-interactions: cash rain for money events, heart pop for likes. */
export const useCelebrate = () => {
  const particles = useState<CelebrateParticle[]>('celebrate-particles', () => [])

  const spawn = (items: Omit<CelebrateParticle, 'id'>[], lifetimeMs: number) => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const created = items.map(item => ({ ...item, id: nextId++ }))
    particles.value = [...particles.value, ...created]
    const ids = new Set(created.map(p => p.id))
    setTimeout(() => {
      particles.value = particles.value.filter(p => !ids.has(p.id))
    }, lifetimeMs)
  }

  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]!

  const cashRain = (count = 36) => {
    spawn(
      Array.from({ length: count }, () => ({
        kind: 'cash' as const,
        glyph: pick(CASH_GLYPHS),
        x: Math.random() * 100,
        y: 0,
        delay: Math.random() * 900,
        duration: 1800 + Math.random() * 1400,
        drift: (Math.random() - 0.5) * 80,
        size: 20 + Math.random() * 18
      })),
      4400
    )
  }

  const heartPop = (clientX: number, clientY: number, count = 8) => {
    spawn(
      Array.from({ length: count }, () => ({
        kind: 'heart' as const,
        glyph: pick(HEART_GLYPHS),
        x: clientX,
        y: clientY,
        delay: Math.random() * 150,
        duration: 800 + Math.random() * 500,
        drift: (Math.random() - 0.5) * 90,
        size: 14 + Math.random() * 12
      })),
      1600
    )
  }

  return { particles, cashRain, heartPop }
}
