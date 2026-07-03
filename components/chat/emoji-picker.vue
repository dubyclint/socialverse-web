<!-- components/chat/EmojiPicker.vue -->
<template>
  <div class="emoji-picker-overlay" @click="$emit('close')">
    <div class="emoji-picker" @click.stop>
      <div class="picker-header">
        <div class="emoji-categories">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-btn"
            :class="{ active: activeCategory === category.id }"
            @click="activeCategory = category.id"
            :title="category.name"
          >
            {{ category.icon }}
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
      </div>
      
      <div class="picker-content">
        <div class="emoji-grid">
          <button
            v-for="emoji in filteredEmojis"
            :key="emoji.char"
            class="emoji-btn"
            @click="selectEmoji(emoji.char)"
            :title="emoji.name"
          >
            {{ emoji.char }}
          </button>
        </div>
      </div>
      
      <div class="picker-footer">
        <div class="recent-emojis" v-if="recentEmojis.length > 0">
          <div class="recent-label">Recently used</div>
          <div class="recent-grid">
            <button
              v-for="emoji in recentEmojis"
              :key="emoji"
              class="emoji-btn recent"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/ui/icon.vue'

// Emits
const emit = defineEmits(['close', 'select'])

// Reactive data
const activeCategory = ref('smileys')
const recentEmojis = ref([])
  
const chatStore = useChatStore()
const recent = computed(() => chatStore.recentEmojis)
const onSelect = (e) => chatStore.addRecentEmoji(e)
  
// Emoji data
const categories = ref([
  { id: 'recent', name: 'Recently Used', icon: '🕒' },
  { id: 'smileys', name: 'Smileys & Emotion', icon: '😀' },
  { id: 'people', name: 'People & Body', icon: '👋' },
  { id: 'animals', name: 'Animals & Nature', icon: '🐶' },
  { id: 'food', name: 'Food & Drink', icon: '🍎' },
  { id: 'activities', name: 'Activities', icon: '⚽' },
  { id: 'travel', name: 'Travel & Places', icon: '🚗' },
  { id: 'objects', name: 'Objects', icon: '💡' },
  { id: 'symbols', name: 'Symbols', icon: '❤️' },
  { id: 'flags', name: 'Flags', icon: '🏁' }
])

const emojis = ref({
  smileys: [
    { char: '😀', name: 'grinning face' },
    { char: '😃', name: 'grinning face with big eyes' },
    { char: '😄', name: 'grinning face with smiling eyes' },
    { char: '😁', name: 'beaming face with smiling eyes' },
    { char: '😆', name: 'grinning squinting face' },
    { char: '😅', name: 'grinning face with sweat' },
    { char: '🤣', name: 'rolling on the floor laughing' },
    { char: '😂', name: 'face with tears of joy' },
    { char: '🙂', name: 'slightly smiling face' },
    { char: '🙃', name: 'upside-down face' },
    { char: '😉', name: 'winking face' },
    { char: '😊', name: 'smiling face with smiling eyes' },
    { char: '😇', name: 'smiling face with halo' },
    { char: '🥰', name: 'smiling face with hearts' },
    { char: '😍', name: 'smiling face with heart-eyes' },
    { char: '🤩', name: 'star-struck' },
    { char: '😘', name: 'face blowing a kiss' },
    { char: '😗', name: 'kissing face' },
    { char: '😚', name: 'kissing face with closed eyes' },
    { char: '😙', name: 'kissing face with smiling eyes' },
    { char: '😋', name: 'face savoring food' },
    { char: '😛', name: 'face with tongue' },
    { char: '😜', name: 'winking face with tongue' },
    { char: '🤪', name: 'zany face' },
    { char: '😝', name: 'squinting face with tongue' },
    { char: '🤑', name: 'money-mouth face' },
    { char: '🤗', name: 'hugging face' },
    { char: '🤭', name: 'face with hand over mouth' },
    { char: '🤫', name: 'shushing face' },
    { char: '🤔', name: 'thinking face' },
    { char: '🤐', name: 'zipper-mouth face' },
    { char: '🤨', name: 'face with raised eyebrow' },
    { char: '😐', name: 'neutral face' },
    { char: '😑', name: 'expressionless face' },
    { char: '😶', name: 'face without mouth' },
    { char: '😏', name: 'smirking face' },
    { char: '😒', name: 'unamused face' },
    { char: '🙄', name: 'face with rolling eyes' },
    { char: '😬', name: 'grimacing face' },
    { char: '🤥', name: 'lying face' },
    { char: '😔', name: 'pensive face' },
    { char: '😪', name: 'sleepy face' },
    { char: '🤤', name: 'drooling face' },
    { char: '😴', name: 'sleeping face' },
    { char: '😷', name: 'face with medical mask' },
    { char: '🤒', name: 'face with thermometer' },
    { char: '🤕', name: 'face with head-bandage' },
    { char: '🤢', name: 'nauseated face' },
    { char: '🤮', name: 'face vomiting' },
    { char: '🤧', name: 'sneezing face' },
    { char: '🥵', name: 'hot face' },
    { char: '🥶', name: 'cold face' },
    { char: '🥴', name: 'woozy face' },
    { char: '😵', name: 'dizzy face' },
    { char: '🤯', name: 'exploding head' },
    { char: '🤠', name: 'cowboy hat face' },
    { char: '🥳', name: 'partying face' },
    { char: '😎', name: 'smiling face with sunglasses' },
    { char: '🤓', name: 'nerd face' },
    { char: '🧐', name: 'face with monocle' }
  ],
  people: [
    { char: '👋', name: 'waving hand' },
    { char: '🤚', name: 'raised back of hand' },
    { char: '🖐️', name: 'hand with fingers splayed' },
    { char: '✋', name: 'raised hand' },
    { char: '🖖', name: 'vulcan salute' },
    { char: '👌', name: 'OK hand' },
    { char: '🤏', name: 'pinching hand' },
    { char: '✌️', name: 'victory hand' },
    { char: '🤞', name: 'crossed fingers' },
    { char: '🤟', name: 'love-you gesture' },
    { char: '🤘', name: 'sign of the horns' },
    { char: '🤙', name: 'call me hand' },
    { char: '👈', name: 'backhand index pointing left' },
    { char: '👉', name: 'backhand index pointing right' },
    { char: '👆', name: 'backhand index pointing up' },
    { char: '🖕', name: 'middle finger' },
    { char: '👇', name: 'backhand index pointing down' },
    { char: '☝️', name: 'index pointing up' },
    { char: '👍', name: 'thumbs up' },
    { char: '👎', name: 'thumbs down' },
    { char: '✊', name: 'raised fist' },
    { char: '👊', name: 'oncoming fist' },
    { char: '🤛', name: 'left-facing fist' },
    { char: '🤜', name: 'right-facing fist' },
    { char: '👏', name: 'clapping hands' },
    { char: '🙌', name: 'raising hands' },
    { char: '👐', name: 'open hands' },
    { char: '🤲', name: 'palms up together' },
    { char: '🤝', name: 'handshake' },
    { char: '🙏', name: 'folded hands' }
  ],
  animals: [
    { char: '🐶', name: 'dog face' },
    { char: '🐱', name: 'cat face' },
    { char: '🐭', name: 'mouse face' },
    { char: '🐹', name: 'hamster face' },
    { char: '🐰', name: 'rabbit face' },
    { char: '🦊', name: 'fox face' },
    { char: '🐻', name: 'bear face' },
    { char: '🐼', name: 'panda face' },
    { char: '🐨', name: 'koala' },
    { char: '🐯', name: 'tiger face' },
    { char: '🦁', name: 'lion face' },
    { char: '🐮', name: 'cow face' },
    { char: '🐷', name: 'pig face' },
    { char: '🐽', name: 'pig nose' },
    { char: '🐸', name: 'frog face' },
    { char: '🐵', name: 'monkey face' },
    { char: '🙈', name: 'see-no-evil monkey' },
    { char: '🙉', name: 'hear-no-evil monkey' },
    { char: '🙊', name: 'speak-no-evil monkey' },
    { char: '🐒', name: 'monkey' }
  ],
  food: [
    { char: '🍎', name: 'red apple' },
    { char: '🍊', name: 'tangerine' },
    { char: '🍋', name: 'lemon' },
    { char: '🍌', name: 'banana' },
    { char: '🍉', name: 'watermelon' },
    { char: '🍇', name: 'grapes' },
    { char: '🍓', name: 'strawberry' },
    { char: '🍈', name: 'melon' },
    { char: '🍒', name: 'cherries' },
    { char: '🍑', name: 'peach' },
    { char: '🥭', name: 'mango' },
    { char: '🍍', name: 'pineapple' },
    { char: '🥥', name: 'coconut' },
    { char: '🥝', name: 'kiwi fruit' },
    { char: '🍅', name: 'tomato' },
    { char: '🍆', name: 'eggplant' },
    { char: '🥑', name: 'avocado' },
    { char: '🥦', name: 'broccoli' },
    { char: '🥬', name: 'leafy greens' },
    { char: '🥒', name: 'cucumber' }
  ],
  activities: [
    { char: '⚽', name: 'soccer ball' },
    { char: '🏀', name: 'basketball' },
    { char: '🏈', name: 'american football' },
    { char: '⚾', name: 'baseball' },
    { char: '🥎', name: 'softball' },
    { char: '🎾', name: 'tennis' },
    { char: '🏐', name: 'volleyball' },
    { char: '🏉', name: 'rugby football' },
    { char: '🥏', name: 'flying disc' },
    { char: '🎱', name: 'pool 8 ball' },
    { char: '🪀', name: 'yo-yo' },
    { char: '🏓', name: 'ping pong' },
    { char: '🏸', name: 'badminton' },
    { char: '🥅', name: 'goal net' },
    { char: '⛳', name: 'flag in hole' },
    { char: '🪁', name: 'kite' },
    { char: '🏹', name: 'bow and arrow' },
    { char: '🎣', name: 'fishing pole' },
    { char: '🤿', name: 'diving mask' },
    { char: '🥊', name: 'boxing glove' }
  ],
  travel: [
    { char: '🚗', name: 'automobile' },
    { char: '🚕', name: 'taxi' },
    { char: '🚙', name: 'sport utility vehicle' },
    { char: '🚌', name: 'bus' },
    { char: '🚎', name: 'trolleybus' },
    { char: '🏎️', name: 'racing car' },
    { char: '🚓', name: 'police car' },
    { char: '🚑', name: 'ambulance' },
    { char: '🚒', name: 'fire engine' },
    { char: '🚐', name: 'minibus' },
    { char: '🛻', name: 'pickup truck' },
    { char: '🚚', name: 'delivery truck' },
    { char: '🚛', name: 'articulated lorry' },
    { char: '🚜', name: 'tractor' },
    { char: '🏍️', name: 'motorcycle' },
    { char: '🛵', name: 'motor scooter' },
    { char: '🚲', name: 'bicycle' },
    { char: '🛴', name: 'kick scooter' },
    { char: '🛹', name: 'skateboard' },
    { char: '🛼', name: 'roller skate' }
  ],
  objects: [
    { char: '💡', name: 'light bulb' },
    { char: '🔦', name: 'flashlight' },
    { char: '🕯️', name: 'candle' },
    { char: '🪔', name: 'diya lamp' },
    { char: '🧯', name: 'fire extinguisher' },
    { char: '🛢️', name: 'oil drum' },
    { char: '💸', name: 'money with wings' },
    { char: '💵', name: 'dollar banknote' },
    { char: '💴', name: 'yen banknote' },
    { char: '💶', name: 'euro banknote' },
    { char: '💷', name: 'pound banknote' },
    { char: '💰', name: 'money bag' },
    { char: '💳', name: 'credit card' },
    { char: '💎', name: 'gem stone' },
    { char: '⚖️', name: 'balance scale' },
    { char: '🧰', name: 'toolbox' },
    { char: '🔧', name: 'wrench' },
    { char: '🔨', name: 'hammer' },
    { char: '⚒️', name: 'hammer and pick' },
    { char: '🛠️', name: 'hammer and wrench' }
  ],
  symbols: [
    { char: '❤️', name: 'red heart' },
    { char: '🧡', name: 'orange heart' },
    { char: '💛', name: 'yellow heart' },
    { char: '💚', name: 'green heart' },
    { char: '💙', name: 'blue heart' },
    { char: '💜', name: 'purple heart' },
    { char: '🖤', name: 'black heart' },
    { char: '🤍', name: 'white heart' },
    { char: '🤎', name: 'brown heart' },
    { char: '💔', name: 'broken heart' },
    { char: '❣️', name: 'heart exclamation' },
    { char: '💕', name: 'two hearts' },
    { char: '💞', name: 'revolving hearts' },
    { char: '💓', name: 'beating heart' },
    { char: '💗', name: 'growing heart' },
    { char: '💖', name: 'sparkling heart' },
    { char: '💘', name: 'heart with arrow' },
    { char: '💝', name: 'heart with ribbon' },
    { char: '💟', name: 'heart decoration' },
    { char: '☮️', name: 'peace symbol' }
  ],
  flags: [
    { char: '🏁', name: 'chequered flag' },
    { char: '🚩', name: 'triangular flag' },
    { char: '🎌', name: 'crossed flags' },
    { char: '🏴', name: 'black flag' },
    { char: '🏳️', name: 'white flag' },
    { char: '🏳️‍🌈', name: 'rainbow flag' },
    { char: '🏳️‍⚧️', name: 'transgender flag' },
    { char: '🏴‍☠️', name: 'pirate flag' },
    { char: '🇺🇸', name: 'flag: United States' },
    { char: '🇬🇧', name: 'flag: United Kingdom' },
    { char: '🇨🇦', name: 'flag: Canada' },
    { char: '🇫🇷', name: 'flag: France' },
    { char: '🇩🇪', name: 'flag: Germany' },
    { char: '🇮🇹', name: 'flag: Italy' },
    { char: '🇪🇸', name: 'flag: Spain' },
    { char: '🇯🇵', name: 'flag: Japan' },
    { char: '🇰🇷', name: 'flag: South Korea' },
    { char: '🇨🇳', name: 'flag: China' },
    { char: '🇮🇳', name: 'flag: India' },
    { char: '🇧🇷', name: 'flag: Brazil' }
  ]
})

// Computed properties
const filteredEmojis = computed(() => {
  if (activeCategory.value === 'recent') {
    return recentEmojis.value.map(char => ({ char, name: 'recent emoji' }))
  }
  
  return emojis.value[activeCategory.value] || []
})

// Methods
const selectEmoji = (emoji) => {
  // Add to recent emojis
  if (!recentEmojis.value.includes(emoji)) {
    recentEmojis.value.unshift(emoji)
    if (recentEmojis.value.length > 20) {
      recentEmojis.value = recentEmojis.value.slice(0, 20)
    }
    
    // Save to localStorage
    localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis.value))
  }
  
  emit('select', emoji)
}

// Lifecycle
onMounted(() => {
  // Load recent emojis from localStorage
  const saved = localStorage.getItem('recentEmojis')
  if (saved) {
    try {
      recentEmojis.value = JSON.parse(saved)
    } catch (error) {
      console.error('Error loading recent emojis:', error)
    }
  }
})
</script>

<style scoped>
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.emoji-picker {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 400px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e0e0e0;
}

.emoji-categories {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.emoji-categories::-webkit-scrollbar {
  display: none;
}

.category-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.category-btn:hover {
  background: #f5f5f5;
}

.category-btn.active {
  background: #e3f2fd;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f5f5f5;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  transition: background-color 0.2s;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: #f5f5f5;
}

.emoji-btn:active {
  background: #e0e0e0;
}

.picker-footer {
  border-top: 1px solid #e0e0e0;
  padding: 12px 20px;
}

.recent-emojis {
  margin-bottom: 8px;
}

.recent-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.recent-grid {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.recent-grid::-webkit-scrollbar {
  display: none;
}

.emoji-btn.recent {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  font-size: 18px;
}

/* Desktop responsive */
@media (min-width: 769px) {
  .emoji-picker-overlay {
    align-items: center;
  }
  
  .emoji-picker {
    border-radius: 16px;
    max-width: 350px;
    max-height: 450px;
    animation: scaleIn 0.2s ease-out;
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .emoji-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}
</style>
