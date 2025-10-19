<template>
  <div class="create-ad-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>✨ Create New Advertisement</h1>
        <p>Launch your campaign and reach your target audience</p>
      </div>
      <NuxtLink to="/ads" class="btn-secondary">
        <Icon name="arrow-left" size="18" />
        Back to Ad Center
      </NuxtLink>
    </div>

    <!-- Ad Creation Form -->
    <div class="create-ad-container">
      <!-- Step Indicator -->
      <div class="step-indicator">
        <div v-for="(step, index) in steps" :key="index" 
             class="step" 
             :class="{ active: currentStep === index, completed: currentStep > index }">
          <div class="step-number">{{ index + 1 }}</div>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>

      <!-- Form Steps -->
      <form @submit.prevent="handleSubmit" class="ad-form">
        <!-- Step 1: Ad Content -->
        <div v-if="currentStep === 0" class="form-step">
          <h2>📝 Ad Content</h2>
          
          <div class="form-group">
            <label class="form-label">Campaign Title *</label>
            <input 
              v-model="adData.title" 
              type="text" 
              class="form-input"
              placeholder="Enter a descriptive title for your campaign"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Ad Description *</label>
            <textarea 
              v-model="adData.description" 
              class="form-textarea"
              placeholder="Write a compelling description that will attract your audience"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Call-to-Action Text *</label>
            <input 
              v-model="adData.ctaText" 
              type="text" 
              class="form-input"
              placeholder="e.g., Learn More, Shop Now, Sign Up"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Destination URL *</label>
            <input 
              v-model="adData.destinationUrl" 
              type="url" 
              class="form-input"
              placeholder="https://your-website.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Ad Image/Video</label>
            <div class="media-upload">
              <input 
                ref="mediaInput"
                type="file" 
                accept="image/*,video/*"
                @change="handleMediaUpload"
                class="file-input"
              />
              <div v-if="!adData.mediaUrl" class="upload-placeholder" @click="$refs.mediaInput.click()">
                <Icon name="upload" size="48" />
                <p>Click to upload image or video</p>
                <span>Recommended: 1200x630px, max 5MB</span>
              </div>
              <div v-else class="media-preview">
                <img v-if="adData.mediaType === 'image'" :src="adData.mediaUrl" alt="Ad preview" />
                <video v-else :src="adData.mediaUrl" controls></video>
                <button type="button" @click="removeMedia" class="remove-media">
                  <Icon name="x" size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Targeting -->
        <div v-if="currentStep === 1" class="form-step">
          <h2>🎯 Audience Targeting</h2>
          
          <div class="form-group">
            <label class="form-label">Target Locations</label>
            <div class="checkbox-group">
              <label v-for="location in availableLocations" :key="location.code" class="checkbox-label">
                <input 
                  type="checkbox" 
                  :value="location.code"
                  v-model="adData.targetLocations"
                />
                <span>{{ location.name }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Age Range</label>
            <div class="range-inputs">
              <input 
                v-model="adData.ageRange.min" 
                type="number" 
                min="13" 
                max="100"
                placeholder="Min age"
                class="form-input"
              />
              <span>to</span>
              <input 
                v-model="adData.ageRange.max" 
                type="number" 
                min="13" 
                max="100"
                placeholder="Max age"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Interests</label>
            <div class="interests-selector">
              <div v-for="interest in availableInterests" :key="interest.id" 
                   class="interest-tag"
                   :class="{ selected: adData.interests.includes(interest.id) }"
                   @click="toggleInterest(interest.id)">
                {{ interest.name }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Device Targeting</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" value="mobile" v-model="adData.deviceTargets" />
                <span>📱 Mobile</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="desktop" v-model="adData.deviceTargets" />
                <span>💻 Desktop</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="tablet" v-model="adData.deviceTargets" />
                <span>📱 Tablet</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: Budget & Schedule -->
        <div v-if="currentStep === 2" class="form-step">
          <h2>💰 Budget & Schedule</h2>
          
          <div class="form-group">
            <label class="form-label">Campaign Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" value="daily" v-model="adData.budgetType" />
                <span>Daily Budget</span>
                <small>Spend up to a set amount each day</small>
              </label>
              <label class="radio-label">
                <input type="radio" value="lifetime" v-model="adData.budgetType" />
                <span>Lifetime Budget</span>
                <small>Spend up to a set amount over the campaign duration</small>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ adData.budgetType === 'daily' ? 'Daily Budget' : 'Total Budget' }} *
            </label>
            <div class="budget-input">
              <span class="currency">$</span>
              <input 
                v-model="adData.budget" 
                type="number" 
                min="5" 
                step="0.01"
                class="form-input"
                placeholder="0.00"
                required
              />
            </div>
            <small class="form-help">
              Minimum: $5.00 {{ adData.budgetType === 'daily' ? 'per day' : 'total' }}
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Bidding Strategy</label>
            <select v-model="adData.biddingStrategy" class="form-select">
              <option value="automatic">Automatic - Let us optimize for best results</option>
              <option value="manual_cpc">Manual CPC - Set your own cost per click</option>
              <option value="manual_cpm">Manual CPM - Set your own cost per 1000 impressions</option>
            </select>
          </div>

          <div v-if="adData.biddingStrategy !== 'automatic'" class="form-group">
            <label class="form-label">
              {{ adData.biddingStrategy === 'manual_cpc' ? 'Max Cost Per Click' : 'Max Cost Per 1000 Impressions' }}
            </label>
            <div class="budget-input">
              <span class="currency">$</span>
              <input 
                v-model="adData.bidAmount" 
                type="number" 
                min="0.01" 
                step="0.01"
                class="form-input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Campaign Duration</label>
            <div class="date-range">
              <div class="date-input">
                <label>Start Date</label>
                <input 
                  v-model="adData.startDate" 
                  type="date" 
                  class="form-input"
                  :min="today"
                />
              </div>
              <div class="date-input">
                <label>End Date (Optional)</label>
                <input 
                  v-model="adData.endDate" 
                  type="date" 
                  class="form-input"
                  :min="adData.startDate || today"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Schedule</label>
            <div class="schedule-options">
              <label class="radio-label">
                <input type="radio" value="always" v-model="adData.schedule" />
                <span>Run ads all the time</span>
              </label>
              <label class="radio-label">
                <input type="radio" value="custom" v-model="adData.schedule" />
                <span>Run ads on a schedule</span>
              </label>
            </div>
            
            <div v-if="adData.schedule === 'custom'" class="schedule-details">
              <div class="days-selector">
                <label>Days of the week:</label>
                <div class="days-grid">
                  <label v-for="day in daysOfWeek" :key="day.value" class="day-checkbox">
                    <input type="checkbox" :value="day.value" v-model="adData.scheduleDays" />
                    <span>{{ day.label }}</span>
                  </label>
                </div>
              </div>
              
              <div class="time-range">
                <label>Time range:</label>
                <div class="time-inputs">
                  <input v-model="adData.scheduleStartTime" type="time" class="form-input" />
                  <span>to</span>
                  <input v-model="adData.scheduleEndTime" type="time" class="form-input" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Review & Launch -->
        <div v-if="currentStep === 3" class="form-step">
          <h2>👀 Review & Launch</h2>
          
          <!-- Ad Preview -->
          <div class="ad-preview-section">
            <h3>Ad Preview</h3>
            <div class="ad-preview">
              <div class="preview-ad">
                <div class="ad-header">
                  <span class="sponsored-label">Sponsored</span>
                </div>
                <div v-if="adData.mediaUrl" class="ad-media">
                  <img v-if="adData.mediaType === 'image'" :src="adData.mediaUrl" alt="Ad preview" />
                  <video v-else :src="adData.mediaUrl" muted></video>
                </div>
                <div class="ad-content">
                  <h4>{{ adData.title || 'Your Ad Title' }}</h4>
                  <p>{{ adData.description || 'Your ad description will appear here...' }}</p>
                  <button class="preview-cta">{{ adData.ctaText || 'Call to Action' }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Campaign Summary -->
          <div class="campaign-summary">
            <h3>Campaign Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <label>Campaign Title:</label>
                <span>{{ adData.title }}</span>
              </div>
              <div class="summary-item">
                <label>Budget:</label>
                <span>${{ adData.budget }} {{ adData.budgetType === 'daily' ? 'per day' : 'total' }}</span>
              </div>
              <div class="summary-item">
                <label>Target Locations:</label>
                <span>{{ getLocationNames(adData.targetLocations).join(', ') || 'All locations' }}</span>
              </div>
              <div class="summary-item">
                <label>Age Range:</label>
                <span>{{ adData.ageRange.min || 13 }} - {{ adData.ageRange.max || 65 }} years</span>
              </div>
              <div class="summary-item">
                <label>Devices:</label>
                <span>{{ adData.deviceTargets.join(', ') || 'All devices' }}</span>
              </div>
              <div class="summary-item">
                <label>Duration:</label>
                <span>
                  {{ formatDate(adData.startDate) }} 
                  {{ adData.endDate ? `- ${formatDate(adData.endDate)}` : '(ongoing)' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Estimated Reach -->
          <div class="estimated-reach">
            <h3>Estimated Performance</h3>
            <div class="reach-metrics">
              <div class="reach-metric">
                <div class="metric-icon">👁️</div>
                <div class="metric-info">
                  <span class="metric-value">{{ estimatedReach.impressions }}</span>
                  <span class="metric-label">Daily Impressions</span>
                </div>
              </div>
              <div class="reach-metric">
                <div class="metric-icon">🎯</div>
                <div class="metric-info">
                  <span class="metric-value">{{ estimatedReach.clicks }}</span>
                  <span class="metric-label">Daily Clicks</span>
                </div>
              </div>
              <div class="reach-metric">
                <div class="metric-icon">💰</div>
                <div class="metric-info">
                  <span class="metric-value">${{ estimatedReach.cost }}</span>
                  <span class="metric-label">Est. Daily Cost</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms-section">
            <label class="checkbox-label">
              <input type="checkbox" v-model="acceptedTerms" required />
              <span>I agree to the <a href="/terms/advertising" target="_blank">Advertising Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
            </label>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="form-navigation">
          <button 
            v-if="currentStep > 0" 
            type="button" 
            @click="previousStep" 
            class="btn-secondary"
          >
            <Icon name="arrow-left" size="18" />
            Previous
          </button>
          
          <button 
            v-if="currentStep < steps.length - 1" 
            type="button" 
            @click="nextStep" 
            class="btn-primary"
            :disabled="!canProceed"
          >
            Next
            <Icon name="arrow-right" size="18" />
          </button>
          
          <button 
            v-if="currentStep === steps.length - 1" 
            type="submit" 
            class="btn-primary"
            :disabled="!canSubmit || isSubmitting"
          >
            <Icon v-if="isSubmitting" name="loader" size="18" class="spinning" />
            <Icon v-else name="rocket" size="18" />
            {{ isSubmitting ? 'Creating...' : 'Launch Campaign' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Page meta
useHead({
  title: 'Create Advertisement - SocialVerse',
  meta: [
    { name: 'description', content: 'Create and launch your advertising campaign on SocialVerse' }
  ]
})

// Form steps
const steps = [
  { label: 'Content' },
  { label: 'Targeting' },
  { label: 'Budget' },
  { label: 'Review' }
]

const currentStep = ref(0)
const isSubmitting = ref(false)
const acceptedTerms = ref(false)

// Form data
const adData = ref({
  title: '',
  description: '',
  ctaText: '',
  destinationUrl: '',
  mediaUrl: '',
  mediaType: '',
  targetLocations: [],
  ageRange: { min: '', max: '' },
  interests: [],
  deviceTargets: ['mobile', 'desktop'],
  budgetType: 'daily',
  budget: '',
  biddingStrategy: 'automatic',
  bidAmount: '',
  startDate: '',
  endDate: '',
  schedule: 'always',
  scheduleDays: [],
  scheduleStartTime: '',
  scheduleEndTime: ''
})

// Available options
const availableLocations = ref([
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' }
])

const availableInterests = ref([
  { id: 'tech', name: 'Technology' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'food', name: 'Food & Dining' },
  { id: 'travel', name: 'Travel' },
  { id: 'fitness', name: 'Fitness & Health' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'music', name: 'Music' },
  { id: 'movies', name: 'Movies & TV' },
  { id: 'sports', name: 'Sports' },
  { id: 'business', name: 'Business' },
  { id: 'education', name: 'Education' },
  { id: 'art', name: 'Art & Design' }
])

const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
]

// Computed properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return adData.value.title && adData.value.description && adData.value.ctaText && adData.value.destinationUrl
    case 1:
      return true // Targeting is optional
    case 2:
      return adData.value.budget && parseFloat(adData.value.budget) >= 5
    case 3:
      return acceptedTerms.value
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return canProceed.value && !isSubmitting.value
})

const estimatedReach = computed(() => {
  const budget = parseFloat(adData.value.budget) || 0
  const baseImpressions = budget * 100 // Rough estimate
  const baseClicks = Math.floor(baseImpressions * 0.02) // 2% CTR estimate
  
  return {
    impressions: baseImpressions.toLocaleString(),
    clicks: baseClicks.toLocaleString(),
    cost: budget.toFixed(2)
  }
})

// Methods
const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const toggleInterest = (interestId) => {
  const index = adData.value.interests.indexOf(interestId)
  if (index > -1) {
    adData.value.interests.splice(index, 1)
  } else {
    adData.value.interests.push(interestId)
  }
}

const handleMediaUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }

  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    adData.value.mediaUrl = e.target.result
    adData.value.mediaType = file.type.startsWith('video/') ? 'video' : 'image'
  }
  reader.readAsDataURL(file)
}

const removeMedia = () => {
  adData.value.mediaUrl = ''
  adData.value.mediaType = ''
}

const getLocationNames = (codes) => {
  return codes.map(code => {
    const location = availableLocations.value.find(loc => loc.code === code)
    return location ? location.name : code
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  
  try {
    // Submit ad data to API
    const response = await $fetch('/api/ads/submit', {
      method: 'POST',
      body: adData.value
    })

    if (response.success) {
      // Redirect to ad center with success message
      await navigateTo('/ads?created=true')
    }
  } catch (error) {
    console.error('Error creating ad:', error)
    alert('Failed to create advertisement. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form
onMounted(() => {
  // Set default start date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  adData.value.startDate = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.create-ad-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3436;
  margin: 0 0 0.5rem 0;
}

.header-content p {
  color: #636e72;
  margin: 0;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.create-ad-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.step-indicator {
  display: flex;
  background: #f8f9fa;
  padding: 2rem;
  border-bottom: 1px solid #e1e5e9;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -50%;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: 2px;
  background: #e1e5e9;
  z-index: 1;
}

.step.completed:not(:last-child)::after {
  background: #00b894;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e1e5e9;
  color: #636e72;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}

.step.active .step-number {
  background: #667eea;
  color: white;
}

.step.completed .step-number {
  background: #00b894;
  color: white;
}

.step-label {
  font-weight: 600;
  color: #636e72;
}

.step.active .step-label {
  color: #2d3436;
}

.ad-form {
  padding: 2rem;
}

.form-step h2 {
  color: #2d3436;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #2d3436;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-help {
  display: block;
  margin-top: 0.5rem;
  color: #636e72;
  font-size: 0.85rem;
}

.media-upload {
  border: 2px dashed #e1e5e9;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.file-input {
  display: none;
}

.upload-placeholder {
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.upload-placeholder p {
  margin: 1rem 0 0.5rem 0;
  font-weight: 600;
  color: #2d3436;
}

.upload-placeholder span {
  color: #636e72;
  font-size: 0.9rem;
}

.media-preview {
  position: relative;
}

.media-preview img,
.media-preview video {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.remove-media {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.remove-media:hover {
  background: rgba(0, 0, 0, 0.9);
}

.checkbox-group,
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.checkbox-label:hover,
.radio-label:hover {
  background: #f8f9fa;
}

.checkbox-label input,
.radio-label input {
  margin: 0;
  width: auto;
}

.radio-label small {
  display: block;
  color: #636e72;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-inputs .form-input {
  flex: 1;
}

.interests-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.interest-tag {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 2px solid #e1e5e9;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.interest-tag:hover {
  border-color: #667eea;
}

.interest-tag.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.budget-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 1rem;
  color: #636e72;
  font-weight: 600;
  z-index: 1;
}

.budget-input .form-input {
  padding-left: 2.5rem;
}

.date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #636e72;
}

.schedule-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.days-grid {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.day-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.day-checkbox:hover {
  border-color: #667eea;
}

.day-checkbox:has(input:checked) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.day-checkbox input {
  display: none;
}

.time-range {
  margin-top: 1rem;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.time-inputs .form-input {
  flex: 1;
}

.ad-preview-section {
  margin-bottom: 2rem;
}

.ad-preview-section h3 {
  color: #2d3436;
  margin-bottom: 1rem;
}

.ad-preview {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  justify-content: center;
}

.preview-ad {
  max-width: 400px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.ad-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e1e5e9;
}

.sponsored-label {
  font-size: 0.8rem;
  color: #636e72;
  text-transform: uppercase;
  font-weight: 600;
}

.ad-media img,
.ad-media video {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.ad-content {
  padding: 1rem;
}

.ad-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2d3436;
  font-size: 1.1rem;
}

.ad-content p {
  margin: 0 0 1rem 0;
  color: #636e72;
  line-height: 1.5;
}

.preview-cta {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.campaign-summary {
  margin-bottom: 2rem;
}

.campaign-summary h3 {
  color: #2d3436;
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item label {
  font-weight: 600;
  color: #636e72;
}

.summary-item span {
  color: #2d3436;
}

.estimated-reach {
  margin-bottom: 2rem;
}

.estimated-reach h3 {
  color: #2d3436;
  margin-bottom: 1rem;
}

.reach-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.reach-metric {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.metric-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3436;
}

.metric-label {
  display: block;
  font-size: 0.85rem;
  color: #636e72;
  margin-top: 0.25rem;
}

.terms-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.terms-section a {
  color: #667eea;
  text-decoration: none;
}

.terms-section a:hover {
  text-decoration: underline;
}

.form-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #e1e5e9;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-ad-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .step-indicator {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step:not(:last-child)::after {
    display: none;
  }
  
  .range-inputs {
    flex-direction: column;
  }
  
  .date-range {
    grid-template-columns: 1fr;
  }
  
  .time-inputs {
    flex-direction: column;
  }
  
  .days-grid {
    flex-wrap: wrap;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .reach-metrics {
    grid-template-columns: 1fr;
  }
  
  .form-navigation {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
