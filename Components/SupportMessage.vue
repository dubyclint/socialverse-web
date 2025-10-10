 
<!-- components/SupportMessage.vue -->
<template>
  <div class="support-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.content" 
      :content-id="message.id"
    />
  </div>
</template>
 
