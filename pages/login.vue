<!-- FILE: /pages/login.vue - AUTHENTICATION PAGE -->
<!-- AUTH FORM - Sign In / Sign Up -->

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <NuxtLink to="/" class="logo-link">
          <span class="logo-icon">🌐</span>
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
      </div>

      <h1>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h1>
      <p class="subtitle">{{ isSignUp ? 'Join SocialVerse today' : 'Sign in to your account' }}</p>
      
      <form @submit.prevent="handleAuth" class="auth-form">
        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            required 
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>
        
        <!-- Password Field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required 
            :placeholder="isSignUp ? 'Create a password' : 'Enter your password'"
            :disabled="loading"
            minlength="6"
          />
        </div>
        
        <!-- Sign-Up Only Fields -->
        <template v-if="isSignUp">
          <!-- Username Field -->
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              id="username"
              v-model="username" 
              type="text" 
              required 
              placeholder="Choose a username (3-30 characters)"
              :disabled="loading"
              minlength="3"
              maxlength="30"
              pattern="[a-z0-9_-]+"
              title="Only lowercase letters, numbers, underscores, and hyphens"
            />
          </div>
          
          <!-- Full Name Field -->
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input 
              id="fullName"
              v-model="fullName" 
              type="text" 
              required 
              placeholder="Enter your full name"
              :disabled="loading"
            />
          </div>
          
          <!-- Phone Field -->
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input 
              id="phone"
              v-model="phone" 
              type="tel" 
              required 
              placeholder="Enter your phone number"
              :disabled="loading"
            />
          </div>
          
          <!-- Bio Field (Optional) -->
          <div class="form-group">
            <label for="bio">Bio (Optional)</label>
            <textarea 
              id="bio"
              v-model="bio" 
              placeholder="Tell us about yourself"
              :disabled="loading"
              rows="3"
            ></textarea>
          </div>
          
          <!-- Location Field (Optional) -->
          <div class="form-group">
            <label for="location">Location (Optional)</label>
            <input 
              id="location"
              v-model="location" 
              type="text" 
              placeholder="Your location"
              :disabled="loading"
            />
          </div>
        </template>
        
        <!-- Submit Button -->
        <button type="submit" :disabled="loading" class="auth-button">
          {{ loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In') }}
        </button>
        
        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
        
        <!-- Success Message -->
        <div v-if="success" class="success-message">
          <span class="success-icon">✅</span>
          {{ success }}
        </div>
      </form>
      
      <!-- Toggle Sign-Up/Sign-In -->
      <div class="auth-toggle">
        <p>
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <button @click="toggleMode" type="button" class="toggle-button">
            {{ isSignUp ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>

      <!-- Divider -->
      <div class="divider">
        <span>or</span>
      </div>

      <!-- Social Auth (Optional) -->
      <div class="social-auth">
        <button type="button" class="social-button google-button" :disabled="loading">
          <span>🔵</span> Google
        </button>
        <button type="button" class="social-button github-button" :disabled="loading">
          <span>⚫</span> GitHub
        </button>
      </div>

      <!-- Footer Links -->
      <div class="auth-footer">
        <NuxtLink to="/terms-and-policy" class="footer-link">Terms</NuxtLink>
        <span class="separator">•</span>
        <a href="#privacy" class="footer-link">Privacy</a>
        <span class="separator">•</span>
        <a href="#support" class="footer-link">Support</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// No middleware needed - public page
definePageMeta({
  layout: 'blank'
})

const { login, signup } = useAuth()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const username = ref('')
const fullName = ref('')
const phone = ref('')
const bio = ref('')
const location = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleAuth = async () => {
  // Validate required fields
  if (!email.value || !password.value) {
    error.value = 'Email and password are required'
    return
  }
  
  if (isSignUp.value) {
    if (!username.value || !fullName.value || !phone.value) {
      error.value = 'Username, full name, and phone number are required'
      return
    }
    
    // Validate username format
    if (!/^[a-z0-9_-]+$/.test(username.value.toLowerCase())) {
      error.value = 'Username can only contain letters, numbers, underscores, and hyphens'
      return
    }
    
    if (username.value.length < 3 || username.value.length > 30) {
      error.value = 'Username must be between 3 and 30 characters'
      return
    }
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    let result
    
    if (isSignUp.value) {
      // ✅ FIX: Pass all required fields to signup
      result = await signup({
        email: email.value,
        password: password.value,
        username: username.value,
        fullName: fullName.value,
        phone: phone.value,
        bio: bio.value,
        location: location.value
      })
      
      if (result.success) {
        if (result.needsConfirmation) {
          success.value = 'Account created! Please check your email to verify your account.'
          // Don't redirect - wait for email verification
        } else {
          success.value = 'Account created successfully!'
          setTimeout(() => navigateTo('/feed'), 1500)
        }
      }
    } else {
      result = await login(email.value, password.value)
      
      if (result.success) {
        success.value = 'Signed in successfully!'
        setTimeout(() => navigateTo('/feed'), 1000)
      }
    }
    
    if (!result.success) {
      error.value = result.error || 'Authentication failed'
    }
    
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = ''
  success.value = ''
  // Reset form fields
  email.value = ''
  password.value = ''
  username.value = ''
  fullName.value = ''
  phone.value = ''
  bio.value = ''
  location.value = ''
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 1.3rem;
}

.logo-icon {
  font-size: 1.8rem;
}

.auth-card h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.8rem;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.auth-button {
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 0.5rem;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.875rem;
  background-color: #fee;
  color: #c33;
  border-radius: 6px;
  font-size: 0.9rem;
  border-left: 4px solid #c33;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.1rem;
}

.success-message {
  padding: 0.875rem;
  background-color: #efe;
  color: #3c3;
  border-radius: 6px;
  font-size: 0.9rem;
  border-left: 4px solid #3c3;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-icon {
  font-size: 1.1rem;
}

.auth-toggle {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.toggle-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.25rem;
  transition: color 0.3s;
}

.toggle-button:hover {
  color: #764ba2;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #ccc;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider span {
  color: #999;
  font-size: 0.85rem;
}

.social-auth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.social-button {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.social-button:hover:not(:disabled) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button:hover:not(:disabled) {
  border-color: #ea4335;
}

.github-button:hover:not(:disabled) {
  border-color: #333;
}

.auth-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
}

.footer-link {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.separator {
  color: #ddd;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }

  .auth-card h1 {
    font-size: 1.5rem;
  }

  .social-auth {
    grid-template-columns: 1fr;
  }
}
</style>

