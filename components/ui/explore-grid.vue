<template>
  <div class="explore-grid">
    <h2>🔍 Explore</h2>
    <div class="search-bar">
      <input v-model="searchQuery" placeholder="Search users, posts, topics..." />
    </div>
    <div class="categories">
      <button 
        v-for="category in categories" 
        :key="category"
        @click="selectedCategory = category"
        :class="{ active: selectedCategory === category }"
        class="category-btn"
      >
        {{ category }}
      </button>
    </div>
    <div class="content-grid">
      <div v-for="item in filteredContent" :key="item.id" class="content-card">
        <img :src="item.image" :alt="item.title" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <div class="engagement">
          <span>❤️ {{ item.likes }}</span>
          <span>💬 {{ item.comments }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedCategory = ref('All')

const categories = ['All', 'Users', 'Posts', 'Topics', 'Groups']

const mockContent = ref([
  {
    id: 1,
    title: 'Sample Post',
    description: 'This is a sample post description',
    image: 'https://via.placeholder.com/300x200',
    likes: 45,
    comments: 12
  }
])

const filteredContent = computed(() => {
  let content = mockContent.value
  
  if (selectedCategory.value !== 'All') {
    // Filter by category logic here
  }
  
  if (searchQuery.value) {
    content = content.filter(item => 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return content
})
</script>

<style scoped>
.explore-grid {
  padding: 2rem;
}
.search-bar {
  margin-bottom: 2rem;
}
.search-bar input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}
.categories {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.category-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.category-btn:hover, .category-btn.active {
  background: #2563eb;
  color: white;
}
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
.content-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}
.content-card:hover {
  transform: translateY(-4px);
}
.content-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.content-card h3 {
  padding: 1rem 1rem 0.5rem;
  margin: 0;
}
.content-card p {
  padding: 0 1rem;
  color: #666;
}
.engagement {
  padding: 1rem;
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}
</style>
