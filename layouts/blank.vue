<!-- FILE: /layouts/blank.vue - AUTHENTICATION LAYOUT -->
<!-- ============================================================================
     BLANK LAYOUT - Used for auth pages (login, signup, etc.)
     No header, footer, or navigation - just page content
     ============================================================================ -->

<template>
  <div class="blank-layout">
    <!-- Error Boundary for Auth Pages -->
    <ErrorBoundary>
      <slot />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
// Blank layout - no header, footer, or navigation
// Used for auth pages (login, signin, signup)
// This layout renders only the page content without any wrapper elements
</script>

<style scoped>
.blank-layout {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
