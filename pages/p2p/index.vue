<template>
  <div class="p2p-page">
    <header>
      <h1>P2P deposits</h1>
      <p>Buy Pewgift from verified sellers. 1 Pewgift = $1.00 and credits are locked in escrow until you are paid.</p>
    </header>

    <div class="layout">
      <P2pTradeForm @opened="selectTrade" />

      <aside>
        <section class="trade-list">
          <h3>Your trades</h3>
          <ul>
            <li v-for="trade in trades" :key="trade.id">
              <button class="link" :class="{ active: trade.id === activeTradeId }" @click="selectTrade(trade.id)">
                {{ trade.amount }} Pewgift · {{ trade.asset_code }} · {{ trade.status }}
              </button>
            </li>
          </ul>
          <p v-if="!trades.length" class="empty">No trades yet.</p>
        </section>

        <EscrowStatus :trade-id="activeTradeId" />
        <TradeChat :room-id="activeRoomId" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import P2pTradeForm from '~/components/financial/p2p/p2p-trade-form.vue'
import TradeChat from '~/components/trade-chat.vue'
import EscrowStatus from '~/components/financial/escrow/escrow-status.vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const { trades, loadTrades, loadTrade } = useP2p()
const activeTradeId = ref<string | null>(null)
const activeRoomId = ref<string | null>(null)

async function selectTrade(id: string) {
  activeTradeId.value = id
  const trade = await loadTrade(id)
  activeRoomId.value = trade?.chat_room_id ?? null
  await loadTrades()
}

const route = useRoute()

onMounted(async () => {
  await loadTrades()
  const requested = route.query.trade
  if (typeof requested === 'string') await selectTrade(requested)
})
</script>

<style scoped>
.p2p-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
aside { display: flex; flex-direction: column; gap: 1rem; }
.trade-list { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.trade-list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.link { background: none; border: none; padding: 0.25rem 0; text-align: left; cursor: pointer; color: #0b6bcb; }
.link.active { font-weight: 700; }
.empty { color: #777; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
