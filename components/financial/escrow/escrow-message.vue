<!-- components/EscrowMessage.vue -->
<template>
  <div class="escrow-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.text" 
      :content-id="message.id"
    />
  </div>
</template>
 
