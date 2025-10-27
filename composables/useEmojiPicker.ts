// composables/useEmojiPicker.ts
// ============================================================================
// EMOJI PICKER COMPOSABLE
// ============================================================================

import { ref, computed } from 'vue'

export interface Emoji {
  emoji: string
  name: string
  category: string
}

// Comprehensive emoji list organized by category
const EMOJIS: Emoji[] = [
  // Smileys & Emotion
  { emoji: '😀', name: 'grinning', category: 'smileys' },
  { emoji: '😃', name: 'smiley', category: 'smileys' },
  { emoji: '😄', name: 'smile', category: 'smileys' },
  { emoji: '😁', name: 'beaming_face_with_smiling_eyes', category: 'smileys' },
  { emoji: '😆', name: 'grinning_face_with_sweat_drops', category: 'smileys' },
  { emoji: '😅', name: 'grinning_face_with_sweat', category: 'smileys' },
  { emoji: '🤣', name: 'rolling_on_the_floor_laughing', category: 'smileys' },
  { emoji: '😂', name: 'joy', category: 'smileys' },
  { emoji: '🙂', name: 'slightly_smiling_face', category: 'smileys' },
  { emoji: '🙃', name: 'upside_down_face', category: 'smileys' },
  { emoji: '😉', name: 'winking_face', category: 'smileys' },
  { emoji: '😊', name: 'smiling_face_with_smiling_eyes', category: 'smileys' },
  { emoji: '😇', name: 'smiling_face_with_halo', category: 'smileys' },
  { emoji: '🥰', name: 'smiling_face_with_hearts', category: 'smileys' },
  { emoji: '😍', name: 'heart_eyes', category: 'smileys' },
  { emoji: '🤩', name: 'star_struck', category: 'smileys' },
  { emoji: '😘', name: 'face_blowing_a_kiss', category: 'smileys' },
  { emoji: '😗', name: 'kissing_face', category: 'smileys' },
  { emoji: '😚', name: 'kissing_face_with_closed_eyes', category: 'smileys' },
  { emoji: '😙', name: 'kissing_face_with_smiling_eyes', category: 'smileys' },
  { emoji: '🥲', name: 'smiling_face_with_tear', category: 'smileys' },
  { emoji: '😋', name: 'face_savoring_food', category: 'smileys' },
  { emoji: '😛', name: 'face_with_tongue', category: 'smileys' },
  { emoji: '😜', name: 'winking_face_with_tongue', category: 'smileys' },
  { emoji: '🤪', name: 'zany_face', category: 'smileys' },
  { emoji: '😌', name: 'relieved_face', category: 'smileys' },
  { emoji: '😔', name: 'pensive_face', category: 'smileys' },
  { emoji: '😑', name: 'expressionless_face', category: 'smileys' },
  { emoji: '😐', name: 'neutral_face', category: 'smileys' },
  { emoji: '😶', name: 'face_with_mouth_covered', category: 'smileys' },
  { emoji: '🙁', name: 'slightly_frowning_face', category: 'smileys' },
  { emoji: '☹️', name: 'frowning_face', category: 'smileys' },
  { emoji: '😲', name: 'astonished_face', category: 'smileys' },
  { emoji: '😞', name: 'disappointed_face', category: 'smileys' },
  { emoji: '😖', name: 'confounded_face', category: 'smileys' },
  { emoji: '😢', name: 'crying_face', category: 'smileys' },
  { emoji: '😭', name: 'loudly_crying_face', category: 'smileys' },
  { emoji: '😤', name: 'face_with_steam_from_nose', category: 'smileys' },
  { emoji: '😠', name: 'angry_face', category: 'smileys' },
  { emoji: '😡', name: 'pouting_face', category: 'smileys' },
  { emoji: '🤬', name: 'face_with_symbols_on_mouth', category: 'smileys' },
  { emoji: '😈', name: 'smiling_face_with_horns', category: 'smileys' },
  { emoji: '👿', name: 'angry_face_with_horns', category: 'smileys' },
  { emoji: '💀', name: 'skull', category: 'smileys' },
  { emoji: '☠️', name: 'skull_and_crossbones', category: 'smileys' },
  { emoji: '💩', name: 'pile_of_poo', category: 'smileys' },
  { emoji: '🤡', name: 'clown_face', category: 'smileys' },
  { emoji: '👹', name: 'ogre', category: 'smileys' },
  { emoji: '👺', name: 'goblin', category: 'smileys' },
  { emoji: '👻', name: 'ghost', category: 'smileys' },
  { emoji: '👽', name: 'alien', category: 'smileys' },
  { emoji: '👾', name: 'alien_monster', category: 'smileys' },
  { emoji: '🤖', name: 'robot', category: 'smileys' },
  { emoji: '😺', name: 'grinning_cat', category: 'smileys' },
  { emoji: '😸', name: 'grinning_cat_with_smiling_eyes', category: 'smileys' },
  { emoji: '😹', name: 'cat_with_tears_of_joy', category: 'smileys' },
  { emoji: '😻', name: 'smiling_cat_with_heart_eyes', category: 'smileys' },
  { emoji: '😼', name: 'cat_with_wry_mouth', category: 'smileys' },
  { emoji: '😽', name: 'kissing_cat', category: 'smileys' },
  { emoji: '🙀', name: 'weary_cat', category: 'smileys' },
  { emoji: '😿', name: 'crying_cat', category: 'smileys' },
  { emoji: '😾', name: 'pouting_cat', category: 'smileys' },

  // Hand Gestures
  { emoji: '👋', name: 'waving_hand', category: 'hands' },
  { emoji: '🤚', name: 'raised_back_of_hand', category: 'hands' },
  { emoji: '🖐️', name: 'hand_with_fingers_splayed', category: 'hands' },
  { emoji: '✋', name: 'raised_hand', category: 'hands' },
  { emoji: '🖖', name: 'vulcan_salute', category: 'hands' },
  { emoji: '👌', name: 'ok_hand', category: 'hands' },
  { emoji: '🤌', name: 'pinched_fingers', category: 'hands' },
  { emoji: '🤏', name: 'pinching_hand', category: 'hands' },
  { emoji: '✌️', name: 'victory', category: 'hands' },
  { emoji: '🤞', name: 'crossed_fingers', category: 'hands' },
  { emoji: '🫰', name: 'hand_with_index_finger_and_thumb_crossed', category: 'hands' },
  { emoji: '🤟', name: 'love_you_gesture', category: 'hands' },
  { emoji: '🤘', name: 'sign_of_the_horns', category: 'hands' },
  { emoji: '🤙', name: 'call_me_hand', category: 'hands' },
  { emoji: '👈', name: 'backhand_index_pointing_left', category: 'hands' },
  { emoji: '👉', name: 'backhand_index_pointing_right', category: 'hands' },
  { emoji: '👆', name: 'backhand_index_pointing_up', category: 'hands' },
  { emoji: '👇', name: 'backhand_index_pointing_down', category: 'hands' },
  { emoji: '☝️', name: 'index_pointing_up', category: 'hands' },
  { emoji: '👍', name: '+1', category: 'hands' },
  { emoji: '👎', name: '-1', category: 'hands' },
  { emoji: '✊', name: 'fist', category: 'hands' },
  { emoji: '👊', name: 'oncoming_fist', category: 'hands' },
  { emoji: '🤛', name: 'left_facing_fist', category: 'hands' },
  { emoji: '🤜', name: 'right_facing_fist', category: 'hands' },
  { emoji: '👏', name: 'clapping_hands', category: 'hands' },
  { emoji: '🙌', name: 'raising_hands', category: 'hands' },
  { emoji: '👐', name: 'open_hands', category: 'hands' },
  { emoji: '🤲', name: 'open_hands_with_palms_up', category: 'hands' },
  { emoji: '🤝', name: 'handshake', category: 'hands' },
  { emoji: '🤜', name: 'right_facing_fist', category: 'hands' },
  { emoji: '💅', name: 'nail_polish', category: 'hands' },
  { emoji: '👂', name: 'ear', category: 'hands' },
  { emoji: '👃', name: 'nose', category: 'hands' },
  { emoji: '🧠', name: 'brain', category: 'hands' },
  { emoji: '🦷', name: 'tooth', category: 'hands' },
  { emoji: '🦴', name: 'bone', category: 'hands' },

  // Hearts & Love
  { emoji: '❤️', name: 'red_heart', category: 'hearts' },
  { emoji: '🧡', name: 'orange_heart', category: 'hearts' },
  { emoji: '💛', name: 'yellow_heart', category: 'hearts' },
  { emoji: '💚', name: 'green_heart', category: 'hearts' },
  { emoji: '💙', name: 'blue_heart', category: 'hearts' },
  { emoji: '💜', name: 'purple_heart', category: 'hearts' },
  { emoji: '🖤', name: 'black_heart', category: 'hearts' },
  { emoji: '🤍', name: 'white_heart', category: 'hearts' },
  { emoji: '🤎', name: 'brown_heart', category: 'hearts' },
  { emoji: '🤝', name: 'handshake', category: 'hearts' },
  { emoji: '💔', name: 'broken_heart', category: 'hearts' },
  { emoji: '💕', name: 'two_hearts', category: 'hearts' },
  { emoji: '💞', name: 'revolving_hearts', category: 'hearts' },
  { emoji: '💓', name: 'beating_heart', category: 'hearts' },
  { emoji: '💗', name: 'growing_heart', category: 'hearts' },
  { emoji: '💖', name: 'sparkling_heart', category: 'hearts' },
  { emoji: '💘', name: 'cupid', category: 'hearts' },
  { emoji: '💝', name: 'heart_with_ribbon', category: 'hearts' },
  { emoji: '💟', name: 'heart_decoration', category: 'hearts' },

  // Objects
  { emoji: '🎉', name: 'party_popper', category: 'objects' },
  { emoji: '🎊', name: 'confetti_ball', category: 'objects' },
  { emoji: '🎈', name: 'balloon', category: 'objects' },
  { emoji: '🎁', name: 'wrapped_gift', category: 'objects' },
  { emoji: '🎀', name: 'ribbon', category: 'objects' },
  { emoji: '🎂', name: 'birthday_cake', category: 'objects' },
  { emoji: '🍰', name: 'cake', category: 'objects' },
  { emoji: '🍾', name: 'bottle_with_popping_cork', category: 'objects' },
  { emoji: '🍷', name: 'wine_glass', category: 'objects' },
  { emoji: '🍸', name: 'cocktail_glass', category: 'objects' },
  { emoji: '🍹', name: 'tropical_drink', category: 'objects' },
  { emoji: '🍺', name: 'beer_mug', category: 'objects' },
  { emoji: '🍻', name: 'clinking_beer_mugs', category: 'objects' },
  { emoji: '🎂', name: 'birthday_cake', category: 'objects' },
  { emoji: '🎮', name: 'video_game', category: 'objects' },
  { emoji: '🎯', name: 'direct_hit', category: 'objects' },
  { emoji: '🎲', name: 'game_die', category: 'objects' },
  { emoji: '🎳', name: 'bowling', category: 'objects' },
  { emoji: '🎪', name: 'circus_tent', category: 'objects' },
  { emoji: '🎨', name: 'artist_palette', category: 'objects' },
  { emoji: '🎬', name: 'clapper_board', category: 'objects' },
  { emoji: '🎤', name: 'microphone', category: 'objects' },
  { emoji: '🎧', name: 'headphone', category: 'objects' },
  { emoji: '🎼', name: 'musical_score', category: 'objects' },
  { emoji: '🎹', name: 'musical_keyboard', category: 'objects' },
  { emoji: '🥁', name: 'drum', category: 'objects' },
  { emoji: '🎷', name: 'saxophone', category: 'objects' },
  { emoji: '🎺', name: 'trumpet', category: 'objects' },
  { emoji: '🎸', name: 'guitar', category: 'objects' },
  { emoji: '🎻', name: 'violin', category: 'objects' },
  { emoji: '🎲', name: 'game_die', category: 'objects' },

  // Nature
  { emoji: '🌟', name: 'glowing_star', category: 'nature' },
  { emoji: '⭐', name: 'star', category: 'nature' },
  { emoji: '✨', name: 'sparkles', category: 'nature' },
  { emoji: '⚡', name: 'high_voltage', category: 'nature' },
  { emoji: '🔥', name: 'fire', category: 'nature' },
  { emoji: '💥', name: 'collision', category: 'nature' },
  { emoji: '💫', name: 'dizzy', category: 'nature' },
  { emoji: '🌈', name: 'rainbow', category: 'nature' },
  { emoji: '☀️', name: 'sun', category: 'nature' },
  { emoji: '🌙', name: 'crescent_moon', category: 'nature' },
  { emoji: '⭐', name: 'star', category: 'nature' },
  { emoji: '🌟', name: 'glowing_star', category: 'nature' },
  { emoji: '🌠', name: 'shooting_star', category: 'nature' },
  { emoji: '🌌', name: 'milky_way', category: 'nature' },
  { emoji: '🌃', name: 'night_with_stars', category: 'nature' },
  { emoji: '🌆', name: 'sunset', category: 'nature' },
  { emoji: '🌇', name: 'sunset', category: 'nature' },
  { emoji: '🌉', name: 'bridge_at_night', category: 'nature' },
  { emoji: '🌁', name: 'foggy', category: 'nature' },
  { emoji: '🌄', name: 'sunrise_on_mountains', category: 'nature' },
  { emoji: '🌅', name: 'sunrise', category: 'nature' },
  { emoji: '🌆', name: 'sunset', category: 'nature' },
  { emoji: '🌇', name: 'sunset', category: 'nature' },
  { emoji: '🌉', name: 'bridge_at_night', category: 'nature' },
  { emoji: '🌁', name: 'foggy', category: 'nature' },
  { emoji: '🌋', name: 'volcano', category: 'nature' },
  { emoji: '⛰️', name: 'mountain', category: 'nature' },
  { emoji: '🏔️', name: 'mountain_snow', category: 'nature' },
  { emoji: '🗻', name: 'mount_fuji', category: 'nature' },
  { emoji: '🏕️', name: 'camping', category: 'nature' },
  { emoji: '⛺', name: 'tent', category: 'nature' },
  { emoji: '⛲', name: 'fountain', category: 'nature' },
  { emoji: '⛱️', name: 'umbrella_on_ground', category: 'nature' },
  { emoji: '🏖️', name: 'beach_with_umbrella', category: 'nature' },
  { emoji: '🏝️', name: 'desert_island', category: 'nature' },
  { emoji: '🌋', name: 'volcano', category: 'nature' },
  { emoji: '⛰️', name: 'mountain', category: 'nature' },
  { emoji: '🏔️', name: 'mountain_snow', category: 'nature' },
  { emoji: '🗻', name: 'mount_fuji', category: 'nature' },
  { emoji: '🌲', name: 'evergreen_tree', category: 'nature' },
  { emoji: '🌳', name: 'deciduous_tree', category: 'nature' },
  { emoji: '🌴', name: 'palm_tree', category: 'nature' },
  { emoji: '🌵', name: 'cactus', category: 'nature' },
  { emoji: '🌾', name: 'sheaf_of_rice', category: 'nature' },
  { emoji: '💐', name: 'bouquet', category: 'nature' },
  { emoji: '🌷', name: 'tulip', category: 'nature' },
  { emoji: '🌹', name: 'rose', category: 'nature' },
  { emoji: '🥀', name: 'wilted_flower', category: 'nature' },
  { emoji: '🌺', name: 'hibiscus', category: 'nature' },
  { emoji: '🌻', name: 'sunflower', category: 'nature' },
  { emoji: '🌞', name: 'sun_with_face', category: 'nature' },
  { emoji: '🌝', name: 'full_moon_with_face', category: 'nature' },
  { emoji: '🌛', name: 'first_quarter_moon_with_face', category: 'nature' },
  { emoji: '🌜', name: 'last_quarter_moon_with_face', category: 'nature' },
  { emoji: '🌚', name: 'new_moon_with_face', category: 'nature' },
  { emoji: '🌕', name: 'full_moon', category: 'nature' },
  { emoji: '🌖', name: 'waning_gibbous_moon', category: 'nature' },
  { emoji: '🌗', name: 'last_quarter_moon', category: 'nature' },
  { emoji: '🌘', name: 'waning_crescent_moon', category: 'nature' },
  { emoji: '🌑', name: 'new_moon', category: 'nature' },
  { emoji: '🌒', name: 'waxing_crescent_moon', category: 'nature' },
  { emoji: '🌓', name: 'first_quarter_moon', category: 'nature' },
  { emoji: '🌔', name: 'waxing_gibbous_moon', category: 'nature' },
  { emoji: '🌚', name: 'new_moon_with_face', category: 'nature' },
  { emoji: '🌝', name: 'full_moon_with_face', category: 'nature' },
  { emoji: '🌛', name: 'first_quarter_moon_with_face', category: 'nature' },
  { emoji: '🌜', name: 'last_quarter_moon_with_face', category: 'nature' },
  { emoji: '⭐', name: 'star', category: 'nature' },
  { emoji: '🌟', name: 'glowing_star', category: 'nature' },
  { emoji: '✨', name: 'sparkles', category: 'nature' },
  { emoji: '⚡', name: 'high_voltage', category: 'nature' },
  { emoji: '☄️', name: 'comet', category: 'nature' },
  { emoji: '💥', name: 'collision', category: 'nature' },
  { emoji: '🔥', name: 'fire', category: 'nature' },
  { emoji: '🌪️', name: 'tornado', category: 'nature' },
  { emoji: '🌈', name: 'rainbow', category: 'nature' },
  { emoji: '☀️', name: 'sun', category: 'nature' },
  { emoji: '🌤️', name: 'sun_small_cloud', category: 'nature' },
  { emoji: '⛅', name: 'sun_behind_small_cloud', category: 'nature' },
  { emoji: '🌥️', name: 'sun_behind_large_cloud', category: 'nature' },
  { emoji: '☁️', name: 'cloud', category: 'nature' },
  { emoji: '🌦️', name: 'sun_behind_rain_cloud', category: 'nature' },
  { emoji: '🌧️', name: 'cloud_with_rain', category: 'nature' },
  { emoji: '⛈️', name: 'cloud_with_lightning_and_rain', category: 'nature' },
  { emoji: '🌩️', name: 'cloud_with_lightning', category: 'nature' },
  { emoji: '🌨️', name: 'cloud_with_snow', category: 'nature' },
  { emoji: '❄️', name: 'snowflake', category: 'nature' },
  { emoji: '☃️', name: 'snowman', category: 'nature' },
  { emoji: '⛄', name: 'snowman_without_snow', category: 'nature' },
  { emoji: '🌬️', name: 'wind_face', category: 'nature' },
  { emoji: '💨', name: 'dashing_away', category: 'nature' },
  { emoji: '💧', name: 'droplet', category: 'nature' },
  { emoji: '💦', name: 'sweat_droplets', category: 'nature' },
  { emoji: '☔', name: 'umbrella_with_rain_drops', category: 'nature' }
]

export const useEmojiPicker = () => {
  const showPicker = ref(false)
  const selectedCategory = ref('smileys')
  const searchQuery = ref('')

  const categories = computed(() => {
    const cats = new Set(EMOJIS.map(e => e.category))
    return Array.from(cats)
  })

  const filteredEmojis = computed(() => {
    return EMOJIS.filter(emoji => {
      const matchesCategory = emoji.category === selectedCategory.value
      const matchesSearch = searchQuery.value === '' ||
        emoji.name.includes(searchQuery.value.toLowerCase()) ||
        emoji.emoji.includes(searchQuery.value)
      return matchesCategory && matchesSearch
    })
  })

  const togglePicker = () => {
    showPicker.value = !showPicker.value
  }

  const closePicker = () => {
    showPicker.value = false
  }

  const selectEmoji = (emoji: string): string => {
    return emoji
  }

  const selectCategory = (category: string) => {
    selectedCategory.value = category
  }

  return {
    showPicker,
    selectedCategory,
    searchQuery,
    categories,
    filteredEmojis,
    togglePicker,
    closePicker,
    selectEmoji,
    selectCategory,
    EMOJIS
  }
   }
   
