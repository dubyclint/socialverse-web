import type { SellerMatch, SupportedAsset, P2PTrade } from '~/types/p2p'

/** Thin typed client over the P2P endpoints; all pricing comes from the server. */
export function useP2p() {
  const assets = ref<SupportedAsset[]>([])
  const notice = ref('')
  const matches = ref<SellerMatch[]>([])
  const trades = ref<P2PTrade[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function describe(err: unknown): string {
    if (err && typeof err === 'object' && 'statusMessage' in err) {
      return String((err as { statusMessage?: string }).statusMessage ?? 'Request failed')
    }
    return err instanceof Error ? err.message : 'Request failed'
  }

  async function loadAssets(kind?: 'FIAT' | 'CRYPTO') {
    const res = await $fetch<{ notice: string; assets: SupportedAsset[] }>('/api/p2p/assets', {
      query: kind ? { kind } : undefined
    })
    assets.value = res.assets
    notice.value = res.notice
  }

  async function findSellers(asset: string, amount: number) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ matches: SellerMatch[] }>('/api/p2p/match', { query: { asset, amount } })
      matches.value = res.matches
    } catch (err) {
      error.value = describe(err)
      matches.value = []
    } finally {
      loading.value = false
    }
  }

  async function openTrade(listingId: string, amount: number) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ trade: P2PTrade }>('/api/p2p/trades', {
        method: 'POST',
        body: { listingId, amount, acceptedTerms: true }
      })
      return res.trade
    } catch (err) {
      error.value = describe(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadTrades() {
    const res = await $fetch<{ trades: P2PTrade[] }>('/api/p2p/trades')
    trades.value = res.trades
  }

  async function loadTrade(id: string) {
    const res = await $fetch<{ trade: P2PTrade }>(`/api/p2p/trades/${id}`)
    return res.trade
  }

  async function act(id: string, action: 'paid' | 'release' | 'cancel' | 'dispute', reason?: string) {
    error.value = null
    try {
      await $fetch(`/api/p2p/trades/${id}/${action}`, { method: 'POST', body: reason ? { reason } : {} })
      return true
    } catch (err) {
      error.value = describe(err)
      return false
    }
  }

  return { assets, notice, matches, trades, loading, error, loadAssets, findSellers, openTrade, loadTrades, loadTrade, act }
}
