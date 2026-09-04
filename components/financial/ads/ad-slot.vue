<template>
  <div class="ad-slot" v-if="showAd && ad">
    <div class="ad-header">
      <span class="ad-label">Sponsored</span>
      <button @click="closeAd" class="close-btn" aria-label="Close ad">×</button>
    </div>
    <div class="ad-content" @click="trackClick">
      <img :src="ad.image" :alt="ad.title" class="ad-image" />
      <div class="ad-text">
        <h4 class="ad-title">{{ ad.title }}</h4>
        <p class="ad-description">{{ ad.description }}</p>
        <a :href="ad.link" class="ad-cta" target="_blank" rel="noopener noreferrer">
          {{ ad.cta }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({
  page: {
    type: String,
    default: 'General'
  },
  position: {
    type: String,
    default: 'sidebar'
  }
});

const showAd = ref(true);
const ad = ref(null);

// Sample ads data - in production, this would come from an ad server
const adsDatabase = {
  'Explore': [
    {
      id: 1,
      title: 'Discover New Places',
      description: 'Find amazing destinations with our travel guide app.',
      image: 'https://via.placeholder.com/300x150/2563eb/ffffff?text=Travel+App',
      link: '#travel-app',
      cta: 'Download Now'
    }
  ],
  'Trade Listings': [
    {
      id: 2,
      title: 'Secure Trading Platform',
      description: 'Trade with confidence using our escrow service.',
      image: 'https://via.placeholder.com/300x150/10b981/ffffff?text=Secure+Trade',
      link: '#secure-trade',
      cta: 'Learn More'
    }
  ],
  'General': [
    {
      id: 3,
      title: 'Join SocialVerse Pro',
      description: 'Unlock exclusive features and enhanced privacy.',
      image: 'https://via.placeholder.com/300x150/8b5cf6/ffffff?text=SocialVerse+Pro',
      link: '#pro-upgrade',
      cta: 'Upgrade Now'
    }
  ]
};

function closeAd() {
  showAd.value = false;
  // Track ad dismissal
  trackEvent('ad_dismissed', {
    ad_id: ad.value?.id,
    page: props.page
  });
}

function trackClick() {
  // Track ad click
  trackEvent('ad_clicked', {
    ad_id: ad.value?.id,
    page: props.page
  });
}

function trackEvent(eventName, data) {
  // In production, send to analytics service
  console.log('Ad Event:', eventName, data);
}

onMounted(() => {
  // Load appropriate ad for the page
  const pageAds = adsDatabase[props.page] || adsDatabase['General'];
  ad.value = pageAds[Math.floor(Math.random() * pageAds.length)];
  
  // Track ad impression
  trackEvent('ad_impression', {
    ad_id: ad.value?.id,
    page: props.page
  });
});
</script>

<style scoped>
.ad-slot {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ad-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
}

.close-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.ad-content {
  cursor: pointer;
  transition: transform 0.2s;
}

.ad-content:hover {
  transform: translateY(-1px);
}

.ad-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.ad-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.ad-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.ad-cta {
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.ad-cta:hover {
  background: #1d4ed8;
  text-decoration: none;
}
</style>
