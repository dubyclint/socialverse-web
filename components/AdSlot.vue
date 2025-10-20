<template>
  <div class="ad-slot" v-if="showAd">
    <div class="ad-header">
      <span class="ad-label">Sponsored</span>
      <button @click="closeAd" class="close-btn">×</button>
    </div>
    <div class="ad-content">
      <img :src="ad.image" :alt="ad.title" />
      <div class="ad-text">
        <h4>{{ ad.title }}</h4>
        <p>{{ ad.description }}</p>
        <a :href="ad.link" class="ad-cta" target="_blank">{{ ad.cta }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  page: {
    type: String,
    default: 'General'
  }
});

const showAd = ref(true);

const ad = ref({
  title: 'Sample Advertisement',
  description: 'This is a placeholder ad for the ' + props.page + ' page.',
  image: 'https://via.placeholder.com/300x150',
  link: '#',
  cta: 'Learn More'
});

function closeAd() {
  showAd.value = false;
}

onMounted(() => {
  // In a real app, you'd fetch ad content based on the page
  console.log('Loading ad for page:', props.page);
});
</script>

<style scoped>
.ad-slot {
  border: 2px solid #f3f4f6;
  border-radius: 8px;
  margin: 1rem 0;
  background: #fafafa;
}
.ad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.ad-label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}
.ad-content {
  display: flex;
  padding: 1rem;
  gap: 1rem;
}
.ad-content img {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
.ad-text {
  flex: 1;
}
.ad-text h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.ad-text p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #6b7280;
}
.ad-cta {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
