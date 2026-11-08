/**
 * Plays post media from blob: URLs instead of the storage URL, so browser "media detector"
 * download pop-ups (Phoenix, UC, IDM) don't see a downloadable video on the page.
 * Each blob is shared between players and freed shortly after the last one lets go.
 */
interface Entry { p: Promise<string>, refs: number, obj?: string, timer?: ReturnType<typeof setTimeout> }
const entries = new Map<string, Entry>()
const MAX_BYTES = 60 * 1024 * 1024

const passThrough = (url: string) => !url || url.startsWith('blob:') || url.startsWith('data:') || /\.m3u8(\?|$)/i.test(url)

const load = async (url: string, entry: Entry): Promise<string> => {
  try {
    const ctrl = new AbortController()
    const res = await fetch(url, { credentials: 'omit', signal: ctrl.signal })
    if (!res.ok) throw new Error(String(res.status))
    // Very large files stream directly rather than waiting for the whole download.
    if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) {
      ctrl.abort()
      return url
    }
    entry.obj = URL.createObjectURL(await res.blob())
    return entry.obj
  } catch {
    return url
  }
}

export const acquireMediaBlob = (url: string): Promise<string> => {
  if (!import.meta.client || passThrough(url)) return Promise.resolve(url)
  let entry = entries.get(url)
  if (!entry) {
    entry = { refs: 0 } as Entry
    entry.p = load(url, entry)
    entries.set(url, entry)
  }
  if (entry.timer) { clearTimeout(entry.timer); entry.timer = undefined }
  entry.refs++
  return entry.p
}

export const releaseMediaBlob = (url: string) => {
  const entry = entries.get(url)
  if (!entry) return
  entry.refs = Math.max(0, entry.refs - 1)
  if (entry.refs || entry.timer) return
  entry.timer = setTimeout(() => {
    if (entry.refs) return
    if (entry.obj) URL.revokeObjectURL(entry.obj)
    entries.delete(url)
  }, 30_000)
}
