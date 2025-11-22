<template>
  <div class="trade-listings">
    <div class="listings-header">
      <h2>🏪 Trade Listings</h2>
      <button @click="showCreateModal = true" class="create-btn">+ Create Listing</button>
    </div>

    <div class="filters">
      <select v-model="selectedCategory" class="filter-select">
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Clothing">Clothing</option>
        <option value="Books">Books</option>
        <option value="Collectibles">Collectibles</option>
        <option value="Other">Other</option>
      </select>
      
      <select v-model="sortBy" class="filter-select">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>

    <div class="listings-grid">
      <div 
        v-for="listing in filteredListings" 
        :key="listing.id"
        class="listing-card"
        @click="viewListing(listing)"
      >
        <div class="listing-image">
          <img :src="listing.image" :alt="listing.title" />
          <div class="listing-status" :class="listing.status">{{ listing.status }}</div>
        </div>
        
        <div class="listing-content">
          <h3 class="listing-title">{{ listing.title }}</h3>
          <p class="listing-description">{{ listing.description }}</p>
          
          <div class="listing-details">
            <span class="listing-price">${{ listing.price }}</span>
            <span class="listing-category">{{ listing.category }}</span>
          </div>
          
          <div class="listing-footer">
            <div class="seller-info">
              <img :src="listing.seller.avatar" :alt="listing.seller.name" class="seller-avatar" />
              <span class="seller-name">{{ listing.seller.name }}</span>
            </div>
            <span class="listing-date">{{ formatDate(listing.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Listing Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>Create New Listing</h3>
        <form @submit.prevent="createListing">
          <input v-model="newListing.title" placeholder="Item Title" required />
          <textarea v-model="newListing.description" placeholder="Description" required></textarea>
          <input v-model="newListing.price" type="number" placeholder="Price" required />
          <select v-model="newListing.category" required>
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Other">Other</option>
          </select>
          <input v-model="newListing.image" placeholder="Image URL" />
          
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false">Cancel</button>
            <button type="submit">Create Listing</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
  
import { ref, computed, onMounted } from 'vue';

const selectedCategory = ref('');
const sortBy = ref('newest');
const showCreateModal = ref(false);

const newListing = ref({
  title: '',
  description: '',
  price: '',
  category: '',
  image: ''
});

const listings = ref([
  {
    id: 1,
    title: 'iPhone 13 Pro Max',
    description: 'Excellent condition, barely used. Comes with original box and charger.',
    price: 899,
    category: 'Electronics',
    image: 'https://via.placeholder.com/300x200',
    status: 'active',
    seller: {
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/32'
    },
    createdAt: Date.now() - 86400000
  },
  {
    id: 2,
    title: 'Vintage Leather Jacket',
    description: 'Authentic vintage leather jacket from the 80s. Size M.',
    price: 150,
    category: 'Clothing',
    image: 'https://via.placeholder.com/300x200',
    status: 'active',
    seller: {
      name: 'Alice Smith',
      avatar: 'https://via.placeholder.com/32'
    },
    createdAt: Date.now() - 172800000
  },
  {
    id: 3,
    title: 'Programming Books Set',
    description: 'Collection of programming books including Clean Code, Design Patterns.',
    price: 75,
    category: 'Books',
    image: 'https://via.placeholder.com/300x200',
    status: 'sold',
    seller: {
      name: 'Bob Wilson',
      avatar: 'https://via.placeholder.com/32'
    },
    createdAt: Date.now() - 259200000
  }
]);

const filteredListings = computed(() => {
  let filtered = listings.value;
  
  if (selectedCategory.value) {
    filtered = filtered.filter(l => l.category === selectedCategory.value);
  }
  
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest': return b.createdAt - a.createdAt;
      case 'oldest': return a.createdAt - b.createdAt;
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      default: return 0;
    }
  });
  
  return filtered;
});

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

function viewListing(listing) {
  console.log('Viewing listing:', listing);
  // Navigate to listing detail page
}

function createListing() {
  const listing = {
    id: Date.now(),
    ...newListing.value,
    price: parseFloat(newListing.value.price),
    status: 'active',
    seller: {
      name: 'Current User',
      avatar: 'https://via.placeholder.com/32'
    },
    createdAt: Date.now()
  };
  
  listings.value.unshift(listing);
  showCreateModal.value = false;
  
  // Reset form
  newListing.value = {
    title: '',
    description: '',
    price: '',
    category: '',
    image: ''
  };
}

onMounted(() => {
  console.log('Loading trade listings...');
});
</script>

<style scoped>
.trade-listings {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.listings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.create-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.listing-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.listing-image {
  position: relative;
  height: 200px;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.listing-status {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.listing-status.active {
  background: #28a745;
  color: white;
}

.listing-status.sold {
  background: #dc3545;
  color: white;
}

.listing-content {
  padding: 1rem;
}

.listing-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.listing-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.listing-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.listing-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #28a745;
}

.listing-category {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.listing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seller-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.seller-name {
  font-size: 0.875rem;
  color: #666;
}

.listing-date {
  font-size: 0.75rem;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-content input, 
.modal-content textarea, 
.modal-content select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-content textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.modal-actions button[type="submit"] {
  background: #28a745;
  color: white;
}
</style>
