<template>
  <div class="settings-page">
    <h1>⚙️ Stream Settings</h1>
    <!-- Stream settings form -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check', 'status-middleware'],
  layout: 'default'
})
</script>
