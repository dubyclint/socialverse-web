 
<!-- components/GroupMessage.vue -->
<template>
  <div class="group-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.text" 
      :content-id="message.id"
    />
  </div>
</template>
 
