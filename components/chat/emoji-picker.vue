<template>
  <div :class="['emoji-picker-container', type]">
    <button v-if="type === 'popover'" @click="toggle" class="trigger-btn">
      <Icon name="smile" />
    </button>

    <div v-if="show" :class="['emoji-picker', type]" @click.stop>
      <div class="picker-header">
        <div class="categories">
          <button v-for="cat in categories" :key="cat.id" 
                  @click="activeCategory = cat.id"
                  :class="{ active: activeCategory === cat.id }">
            {{ cat.icon }}
          </button>
        </div>
        <button v-if="type === 'modal'" class="close-btn" @click="close">✕</button>
      </div>

      <div class="picker-content">
        <div class="emoji-grid">
          <button v-for="e in filteredEmojis" :key="e.char" @click="select(e.char)">
            {{ e.char }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
  // In ANY EmojiPicker component
import { emojiCategories, emojiMap } from '~/utils/emoji-data';

// You can now access the data directly
const categories = ref(emojiCategories);
const emojis = ref(emojiMap);

const props = defineProps({
  type: { type: String, default: 'popover' } // 'popover' | 'modal'
})

const emit = defineEmits(['select', 'close'])
const show = ref(false)
const activeCategory = ref('smileys')
const recent = ref<string[]>([])

// Logic for Emoji Data (consolidated from your two sources)
const categories = [
  { id: 'recent', icon: '🕒' },
  { id: 'smileys', icon: '😀' },
  { id: 'people', icon: '👋' },
  // ... add remaining categories
]

const filteredEmojis = computed(() => {
  if (activeCategory.value === 'recent') return recent.value.map(c => ({ char: c }))
  return // ... return category-filtered emojis
})

const select = (char: string) => {
  // Update recent list
  if (!recent.value.includes(char)) {
    recent.value = [char, ...recent.value].slice(0, 20)
    localStorage.setItem('recent-emojis', JSON.stringify(recent.value))
  }
  emit('select', char)
  if (props.type === 'popover') show.value = false
}

const toggle = () => { show.value = !show.value }
const close = () => { show.value = false; emit('close') }

onMounted(() => {
  const saved = localStorage.getItem('recent-emojis')
  if (saved) recent.value = JSON.parse(saved)
})
</script>

<style scoped>
.emoji-picker-container { position: relative; }

/* Popover Style */
.emoji-picker.popover {
  position: absolute;
  bottom: 100%; right: 0;
  width: 300px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

/* Modal/Overlay Style */
.emoji-picker.modal {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 10px;
}

.category-btn.active { background: #e3f2fd; }
</style>
