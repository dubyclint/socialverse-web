 
<!-- components/TradeMessage.vue -->
<template>
  <div class="trade-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.content" 
      :content-id="message.id"
    />
  </div>
</template>
 
