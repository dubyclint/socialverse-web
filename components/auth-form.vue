<template>
  <div class="auth-container">
    <form @submit.prevent="handleSubmit" class="auth-form">
      <!-- Error display -->
      <div v-if="error" class="error-message">{{ error }}</div>
      
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email" 
        required 
        class="form-input"
        :disabled="loading"
      />
      
      <input 
        v-if="needsPassword" 
        v-model="password" 
        type="password" 
        placeholder="Password" 
        required 
        class="form-input"
        :disabled="loading"
      />
      
      <button type="submit" class="submit-button" :disabled="loading">
        {{ loading ? 'Processing...' : buttonLabel }}
      </button>
      
      <p v-if="mode === 'signin'" class="forgot-password">
        <NuxtLink to="/recover" class="forgot-link">Forgot Password?</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ mode: String });
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const needsPassword = computed(() => ['signup', 'signin', 'admin'].includes(props.mode));
const buttonLabel = computed(() => ({
  signup: 'Create Account',
  signin: 'Sign In',
  recover: 'Send Recovery Link',
  admin: 'Admin Login'
}[props.mode]));

async function handleSubmit() {
  // Clear previous errors
  error.value = '';
  
  // Validate inputs
  if (!email.value.trim()) {
    error.value = 'Email is required';
    return;
  }
  
  if (needsPassword.value && !password.value.trim()) {
    error.value = 'Password is required';
    return;
  }
  
  loading.value = true;
  
  try {
    // Call backend route based on mode
    console.log(`${props.mode} attempt:`, { email: email.value });
    
    // TODO: Replace with actual authentication logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Success handling would go here
  } catch (err) {
    error.value = err.message || 'An error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.submit-button {
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background: #0056b3;
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.forgot-password {
  text-align: center;
  margin-top: 1rem;
}

.forgot-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
}

.forgot-link:hover {
  text-decoration: underline;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #fcc;
  margin-bottom: 1rem;
}
</style>


