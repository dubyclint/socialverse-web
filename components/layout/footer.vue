<template>
  <footer class="modern-footer">
    <div class="footer-container">
      <!-- Footer Content -->
      <div class="footer-content">
        <!-- Logo and Description -->
        <div class="footer-section">
          <div class="footer-logo">
            <img src="/logo.svg" alt="SocialVerse" />
            <span>SocialVerse</span>
          </div>
          <p class="footer-description">
            Connect, share, and discover on the decentralized social web. 
            Your privacy, your data, your community.
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <Icon name="twitter" size="20" />
            </a>
            <a href="#" class="social-link">
              <Icon name="facebook" size="20" />
            </a>
            <a href="#" class="social-link">
              <Icon name="instagram" size="20" />
            </a>
            <a href="#" class="social-link">
              <Icon name="linkedin" size="20" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/about">About Us</NuxtLink></li>
            <li><NuxtLink to="/features">Features</NuxtLink></li>
            <li><NuxtLink to="/pricing">Pricing</NuxtLink></li>
            <li><NuxtLink to="/blog">Blog</NuxtLink></li>
          </ul>
        </div>

        <!-- Support -->
        <div class="footer-section">
          <h4>Support</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/help">Help Center</NuxtLink></li>
            <li><NuxtLink to="/contact">Contact Us</NuxtLink></li>
            <li><NuxtLink to="/community">Community</NuxtLink></li>
            <li><NuxtLink to="/feedback">Feedback</NuxtLink></li>
          </ul>
        </div>

        <!-- Legal -->
        <div class="footer-section">
          <h4>Legal</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/cookies">Cookie Policy</NuxtLink></li>
            <li><NuxtLink to="/dmca">DMCA</NuxtLink></li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p>&copy; 2024 SocialVerse. All rights reserved.</p>
          
          <!-- User Actions -->
          <div class="user-actions">
            <div class="user-info">
              <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" class="user-avatar" />
              <span>{{ user.name }}</span>
            </div>
            
            <button @click="logout" class="logout-btn">
              <Icon name="log-out" size="18" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'

// User data (would come from your auth store)
const user = ref({
  name: 'John Doe',
  avatar: '/default-avatar.png'
})

const logout = async () => {
  try {
    // Implement logout logic
    // await $fetch('/api/auth/logout', { method: 'POST' })
    
    // Clear user session
    // await clearNuxtData()
    
    // Redirect to login page
    await navigateTo('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.modern-footer {
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  color: white;
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  padding: 3rem 2rem 2rem;
}

.footer-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ddd;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.footer-logo img {
  width: 32px;
  height: 32px;
}

.footer-description {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: #b2bec3;
  max-width: 300px;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.75rem;
}

.footer-links a {
  color: #b2bec3;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
}

.footer-bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ddd;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(231, 76, 60, 0.2);
  color: #ff7675;
  border: 1px solid rgba(231, 76, 60, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: rgba(231, 76, 60, 0.5);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem 1rem;
  }
  
  .footer-bottom-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .user-actions {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .footer-content {
    padding: 1.5rem 1rem;
  }
  
  .footer-bottom {
    padding: 1rem;
  }
  
  .logout-btn span {
    display: none;
  }
}
</style>

