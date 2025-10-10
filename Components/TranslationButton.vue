 
<!-- components/TranslationButton.vue -->
<template>
  <button 
    v-if="showButton"
    @click="translateText"
    class="translation-btn"
  >
    {{ $t('translate') }}
  </button>
</template>

<script setup>
const props = defineProps({
  originalText: String,
  contentId: String
})

const { showTranslationButton, targetLanguage } = useTranslation()
const showButton = computed(() => showTranslationButton.value)

const translateText = async () => {
  const { data } = await useFetch('/api/translate', {
    method: 'POST',
    body: {
      text: props.originalText,
      targetLang: targetLanguage.value,
      contentId: props.contentId
    }
  })
  
  // Update the displayed text (implementation depends on your state management)
}
</script>

<style scoped>
.translation-btn {
  font-size: 10px;
  padding: 2px 5px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-top: 2px;
  cursor: pointer;
}
</style>
 
