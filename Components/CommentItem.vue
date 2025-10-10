
<template>
  <div class="comment">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="comment.text" 
      :content-id="comment.id"
    />
  </div>
</template>
 
