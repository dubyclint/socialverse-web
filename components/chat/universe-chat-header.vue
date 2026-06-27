<!-- components/chat/universe-chat-header.vue -->
<!-- ============================================================================
     UNIVERSE CHAT HEADER - Header with filters and search
     ============================================================================ -->

<template>
  <div class="universe-chat-header">
    <!-- Title & Status -->
    <div class="header-top">
      <div class="title-section">
        <h2>🌍 Universe Chat</h2>
        <p class="subtitle">Connect with people worldwide</p>
      </div>
      <div class="status-section">
        <div class="online-indicator">
          <span class="dot"></span>
          <span class="count">{{ onlineCount }} online</span>
        </div>
        <div v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-container">
        <input 
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="🔍 Search messages..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <select 
        v-model="selectedCountry"
        @change="emitFilterChange"
        class="filter-select"
        title="Filter by country"
      >
        <option value="">🌐 All Countries</option>
        <option value="US">🇺🇸 United States</option>
        <option value="UK">🇬🇧 United Kingdom</option>
        <option value="CA">🇨🇦 Canada</option>
        <option value="AU">🇦🇺 Australia</option>
        <option value="IN">🇮🇳 India</option>
        <option value="BR">🇧🇷 Brazil</option>
        <option value="DE">🇩🇪 Germany</option>
        <option value="FR">🇫🇷 France</option>
        <option value="JP">🇯🇵 Japan</option>
        <option value="CN">🇨🇳 China</option>
        <option value="MX">🇲🇽 Mexico</option>
      </select>

      <select 
        v-model="selectedInterest"
        @change="emitFilterChange"
        class="filter-select"
        title="Filter by interest"
      >
        <option value="">💡 All Interests</option>
        <option value="tech">💻 Technology</option>
        <option value="gaming">🎮 Gaming</option>
        <option value="sports">⚽ Sports</option>
        <option value="music">🎵 Music</option>
        <option value="art">🎨 Art</option>
        <option value="travel">✈️ Travel</option>
        <option value="food">🍕 Food</option>
        <option value="fitness">💪 Fitness</option>
        <option value="business">💼 Business</option>
        <option value="education">📚 Education</option>
      </select>

      <select 
        v-model="selectedLanguage"
        @change="emitFilterChange"
        class="filter-select"
        title="Filter by language"
      >
        <option value="en">🇬🇧 English</option>
        <option value="es">🇪🇸 Spanish</option>
        <option value="fr">🇫🇷 French</option>
        <option value="de">🇩🇪 German</option>
        <option value="it">🇮🇹 Italian</option>
        <option value="pt">🇵🇹 Portuguese</option>
        <option value="ru">🇷🇺 Russian</option>
        <option value="ja">🇯🇵 Japanese</option>
        <option value="zh">🇨🇳 Chinese</option>
        <option value="ko">🇰🇷 Korean</option>
      </select>

      <button 
        @click="clearFilters"
        class="clear-btn"
        title="Clear all filters"
      >
        ✕ Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  onlineCount: number
  unreadCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  search: [query: string]
  'filter-change': [filters: any]
}>()

// State
const searchQuery = ref('')
const selectedCountry = ref('')
const selectedInterest = ref('')
const selectedLanguage = ref('en')

// Methods
const handleSearch = (): void => {
  emit('search', searchQuery.value)
}

const emitFilterChange = (): void => {
  emit('filter-change', {
    country: selectedCountry.value,
    interest: selectedInterest.value,
    language: selectedLanguage.value
  })
}

const clearFilters = (): void => {
  searchQuery.value = ''
  selectedCountry.value = ''
  selectedInterest.value = ''
  selectedLanguage.value = 'en'
  emitFilterChange()
}
</script>

<style scoped>
.universe-chat-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header Top */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.unread-badge {
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

/* Search Section */
.search-section {
  display: flex;
}

.search-container {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Filters Section */
.filters-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  min-width: 140px;
}

.filter-select:hover {
  border-color: #667eea;
  background: #f9f9f9;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-btn {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #e0e0e0;
  border-color: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .universe-chat-header {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .filters-section {
    gap: 6px;
  }

  .filter-select {
    min-width: 120px;
    font-size: 12px;
  }

  .title-section h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filters-section {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: 100px;
  }
}
</style>
