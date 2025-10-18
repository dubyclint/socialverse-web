<template>
  <div class="homepage">
    <!-- Header Component -->
    <ModernHeader />
    
    <!-- Main Content -->
    <MainFeed />
    
    <!-- Footer Component -->
    <ModernFooter />
  </div>
</template>

<script setup>
// Set page meta
useHead({
  title: 'SocialVerse - Your Decentralized Social Hub',
  meta: [
    { name: 'description', content: 'Connect, share, and discover on SocialVerse - the modern decentralized social platform with P2P trading, escrow services, and more.' },
    { name: 'keywords', content: 'social media, decentralized, P2P trading, escrow, blockchain, web3' },
    { property: 'og:title', content: 'SocialVerse - Your Decentralized Social Hub' },
    { property: 'og:description', content: 'Connect, share, and discover on the decentralized social web' },
    { property: 'og:type', content: 'website' }
  ]
})

// Check authentication
const { $auth } = useNuxtApp()

onMounted(() => {
  // Redirect to login if not authenticated
  if (!$auth.user) {
    navigateTo('/login')
  }
})
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Global responsive adjustments */
@media (max-width: 768px) {
  .homepage {
    background: #f8f9fa;
  }
}
</style>

