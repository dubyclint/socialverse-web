<template>
  <div>
    <matchrequestform />
    <matchresults />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
  
import matchrequestform from '@/components/match-request-form.vue'
import matchresults from '@/components/match-results.vue'
</script>
