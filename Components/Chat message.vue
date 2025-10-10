
<template>
  <div class="message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.content" 
      :content-id="message.id"
    />
  </div>
</template>
 
