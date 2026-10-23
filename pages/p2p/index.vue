<template>
  <div class="p2p-page">
    <header>
      <div class="header-top">
        <h1>P2P deposits</h1>
        <!-- Currency Selector with standard world currencies -->
        <div class="currency-selector">
          <label for="currency-select">Currency:</label>
          <select 
            id="currency-select" 
            v-model="selectedCurrency" 
            :disabled="loadingRates"
            @change="handleCurrencyChange"
          >
            <option v-for="curr in currencyList" :key="curr.code" :value="curr.code">
              {{ curr.code }} - {{ curr.name }}
            </option>
          </select>
        </div>
      </div>

      <p>
        Buy Pewgift from verified sellers. 
        <strong>1 Pewgift = $1.00 USD</strong>
        <span v-if="selectedCurrency !== 'USD' && currentRate">
          (≈ {{ formatCurrency(currentRate) }} {{ selectedCurrency }})
        </span>
      </p>
    </header>

    <div class="layout">
      <!-- Pass selected currency and current rate to the form component -->
      <P2pTradeForm 
        :selected-currency="selectedCurrency" 
        :exchange-rate="currentRate"
        @opened="selectTrade" 
      />

      <aside>
        <section class="trade-list">
          <h3>Your trades</h3>
          <ul>
            <li v-for="trade in trades" :key="trade.id">
              <button 
                class="link" 
                :class="{ active: trade.id === activeTradeId }" 
                @click="selectTrade(trade.id)"
              >
                {{ trade.amount }} Pewgift 
                <span v-if="selectedCurrency !== 'USD' && currentRate">
                  (≈ {{ formatCurrency(trade.amount * currentRate) }} {{ selectedCurrency }})
                </span>
                · {{ trade.asset_code }} · {{ trade.status }}
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
import { ref, computed, onMounted } from 'vue'
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

// --- Real-time Exchange Rate & Global Currency Logic ---
const selectedCurrency = ref<string>('USD')
const exchangeRates = ref<Record<string, number>>({})
const loadingRates = ref<boolean>(false)

// World Currencies List (ISO 4217 standard)
const currencyList = ref([
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'United Arab Emirates Dirham' },
  { code: 'AFN', name: 'Afghan Afghani' },
  { code: 'ALL', name: 'Albanian Lek' },
  { code: 'AMD', name: 'Armenian Dram' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder' },
  { code: 'AOA', name: 'Angolan Kwanza' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'AZN', name: 'Azerbaijani Manat' },
  { code: 'BAM', name: 'Bosnia and Herzegovina Convertible Mark' },
  { code: 'BBD', name: 'Barbados Dollar' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'BIF', name: 'Burundian Franc' },
  { code: 'BMD', name: 'Bermudian Dollar' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
  { code: 'BSD', name: 'Bahamian Dollar' },
  { code: 'BTN', name: 'Bhutanese Ngultrum' },
  { code: 'BWP', name: 'Botswana Pula' },
  { code: 'BYN', name: 'Belarusian Ruble' },
  { code: 'BZD', name: 'Belize Dollar' },
  { code: 'CDF', name: 'Congolese Franc' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'CRC', name: 'Costa Rican Colón' },
  { code: 'CUP', name: 'Cuban Peso' },
  { code: 'CVE', name: 'Cape Verdean Escudo' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DJF', name: 'Djiboutian Franc' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'DOP', name: 'Dominican Peso' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'ERN', name: 'Eritrean Nakfa' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'FJD', name: 'Fijian Dollar' },
  { code: 'FKP', name: 'Falkland Islands Pound' },
  { code: 'GEL', name: 'Georgian Lari' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'GIP', name: 'Gibraltar Pound' },
  { code: 'GMD', name: 'Gambian Dalasi' },
  { code: 'GNF', name: 'Guinean Franc' },
  { code: 'GTQ', name: 'Guatemalan Quetzal' },
  { code: 'GYD', name: 'Guyanese Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HNL', name: 'Honduran Lempira' },
  { code: 'HTG', name: 'Haitian Gourde' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'IQD', name: 'Iraqi Dinar' },
  { code: 'IRR', name: 'Iranian Rial' },
  { code: 'ISK', name: 'Icelandic Króna' },
  { code: 'JMD', name: 'Jamaican Dollar' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'KGS', name: 'Kyrgyzstani Som' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'KMF', name: 'Comorian Franc' },
  { code: 'KPW', name: 'North Korean Won' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'KYD', name: 'Cayman Islands Dollar' },
  { code: 'KZT', name: 'Kazakhstani Tenge' },
  { code: 'LAK', name: 'Lao Kip' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'LRD', name: 'Liberian Dollar' },
  { code: 'LSL', name: 'Lesotho Loti' },
  { code: 'LYD', name: 'Libyan Dinar' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'MDL', name: 'Moldovan Leu' },
  { code: 'MGA', name: 'Malagasy Ariary' },
  { code: 'MKD', name: 'Macedonian Denar' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'MNT', name: 'Mongolian Tögrög' },
  { code: 'MOP', name: 'Macanese Pataca' },
  { code: 'MRU], name: 'Mauritanian Ouguiya' },
  { code: 'MUR', name: 'Mauritian Rupee' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
  { code: 'MWK', name: 'Malawian Kwacha' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'MZN', name: 'Mozambican Metical' },
  { code: 'NAD', name: 'Namibian Dollar' },
  { code: 'NIO', name: 'Nicaraguan Córdoba' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'PAB', name: 'Panamanian Balboa' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'PGK', name: 'Papua New Guinean Kina' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'PLN', name: 'Polish Złoty' },
  { code: 'PYG', name: 'Paraguayan Guaraní' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'RSD', name: 'Serbian Dinar' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SBD', name: 'Solomon Islands Dollar' },
  { code: 'SCR', name: 'Seychellois Rupee' },
  { code: 'SDG', name: 'Sudanese Pound' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'SHP', name: 'Saint Helena Pound' },
  { code: 'SLE', name: 'Sierra Leonean Leone' },
  { code: 'SOS', name: 'Somali Shilling' },
  { code: 'SRD', name: 'Surinamese Dollar' },
  { code: 'SSP', name: 'South Sudanese Pound' },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra' },
  { code: 'SYP', name: 'Syrian Pound' },
  { code: 'SZL', name: 'Eswatini Lilangeni' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TJS', name: 'Tajikistani Somoni' },
  { code: 'TMT', name: 'Turkmenistan Manat' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'TOP', name: 'Tongan Paʻanga' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar' },
  { code: 'TWD', name: 'New Taiwan Dollar' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'UYU', name: 'Uruguayan Peso' },
  { code: 'UZS', name: 'Uzbekistani Soʻm' },
  { code: 'VES', name: 'Venezuelan Bolívar Sovereign' },
  { code: 'VND', name: 'Vietnamese Đồng' },
  { code: 'VUV', name: 'Vanuatu Vatu' },
  { code: 'WST', name: 'Samoan Tālā' },
  { code: 'XAF', name: 'Central African CFA Franc' },
  { code: 'XCD', name: 'East Caribbean Dollar' },
  { code: 'XOF', name: 'West African CFA Franc' },
  { code: 'XPF', name: 'CFP Franc' },
  { code: 'YER', name: 'Yemeni Rial' },
  { code: 'ZMW', name: 'Zambian Kwacha' },
  { code: 'ZWG', name: 'Zimbabwe Gold' }
])

// Current rate for 1 USD to chosen currency
const currentRate = computed(() => {
  if (selectedCurrency.value === 'USD') return 1
  return exchangeRates.value[selectedCurrency.value] || null
})

// Fetch exchange rates relative to USD (1 USD = X Local Currency)
async function fetchExchangeRates() {
  loadingRates.value = true
  try {
    // You can replace this URL with your preferred Exchange Rate API provider endpoint
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await response.json()
    if (data && data.rates) {
      exchangeRates.value = data.rates
    }
  } catch (err) {
    console.error('Failed to load real-time exchange rates', err)
  } finally {
    loadingRates.value = false
  }
}

function handleCurrencyChange() {
  // Option to persist user choice
  localStorage.setItem('p2p_currency', selectedCurrency.value)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

async function selectTrade(id: string) {
  activeTradeId.value = id
  const trade = await loadTrade(id)
  activeRoomId.value = trade?.chat_room_id ?? null
  await loadTrades()
}

const route = useRoute()

onMounted(async () => {
  const savedCurrency = localStorage.getItem('p2p_currency')
  if (savedCurrency) {
    selectedCurrency.value = savedCurrency
  }

  await Promise.all([loadTrades(), fetchExchangeRates()])
  const requested = route.query.trade
  if (typeof requested === 'string') await selectTrade(requested)
})
</script>

<style scoped>
.p2p-page { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.header-top { display: flex; justify-content: space-between; align-items: center; }
.currency-selector { display: flex; align-items: center; gap: 0.5rem; }
.currency-selector select { padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid #ccc; font-size: 0.95rem; }
.layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
aside { display: flex; flex-direction: column; gap: 1rem; }
.trade-list { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.trade-list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.link { background: none; border: none; padding: 0.25rem 0; text-align: left; cursor: pointer; color: #0b6bcb; }
.link.active { font-weight: 700; }
.empty { color: #777; }
@media (max-width: 900px) { 
  .layout { grid-template-columns: 1fr; } 
  .header-top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
