// ============================================================================
// COMPLETE FILE 1: /pages/stream/settings.vue
// ============================================================================
// Stream Settings Page - Configure streaming preferences and quality
// ============================================================================

<template>
  <div class="stream-settings-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>⚙️ Stream Settings</h1>
      <p class="subtitle">Configure your streaming preferences and quality settings</p>
    </div>

    <ClientOnly>
      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button 
          v-for="tab in settingsTabs" 
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- General Settings Tab -->
      <div v-if="activeTab === 'general'" class="settings-section">
        <div class="settings-card">
          <h2>General Settings</h2>
          
          <div class="form-group">
            <label>Stream Title</label>
            <input 
              v-model="settings.title" 
              type="text" 
              placeholder="Enter stream title"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Stream Description</label>
            <textarea 
              v-model="settings.description" 
              placeholder="Describe your stream"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Category</label>
            <select v-model="settings.category" class="form-select">
              <option value="">Select a category</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="creative">Creative</option>
              <option value="education">Education</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.isPublic" />
              <span>Make stream public</span>
            </label>
          </div>

          <button @click="saveSettings" class="btn btn-primary">
            Save Settings
          </button>
        </div>
      </div>

      <!-- Quality Settings Tab -->
      <div v-if="activeTab === 'quality'" class="settings-section">
        <div class="settings-card">
          <h2>Quality Settings</h2>
          
          <div class="form-group">
            <label>Resolution</label>
            <select v-model="settings.resolution" class="form-select">
              <option value="720p">720p (Recommended)</option>
              <option value="1080p">1080p (High)</option>
              <option value="480p">480p (Low)</option>
              <option value="360p">360p (Very Low)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Bitrate (Mbps)</label>
            <input 
              v-model.number="settings.bitrate" 
              type="number" 
              min="1" 
              max="50"
              class="form-input"
            />
            <small>Recommended: 4-6 Mbps for 720p</small>
          </div>

          <div class="form-group">
            <label>Frame Rate (FPS)</label>
            <select v-model="settings.fps" class="form-select">
              <option value="30">30 FPS</option>
              <option value="60">60 FPS (Recommended)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Encoder</label>
            <select v-model="settings.encoder" class="form-select">
              <option value="h264">H.264 (Compatible)</option>
              <option value="h265">H.265 (Better Quality)</option>
              <option value="vp9">VP9 (Experimental)</option>
            </select>
          </div>

          <button @click="saveSettings" class="btn btn-primary">
            Save Quality Settings
          </button>
        </div>
      </div>

      <!-- Audio Settings Tab -->
      <div v-if="activeTab === 'audio'" class="settings-section">
        <div class="settings-card">
          <h2>Audio Settings</h2>
          
          <div class="form-group">
            <label>Microphone</label>
            <select v-model="settings.microphone" class="form-select">
              <option value="">Select microphone</option>
              <option value="default">Default Microphone</option>
              <option value="usb">USB Microphone</option>
              <option value="headset">Headset</option>
            </select>
          </div>

          <div class="form-group">
            <label>Audio Bitrate (kbps)</label>
            <input 
              v-model.number="settings.audioBitrate" 
              type="number" 
              min="32" 
              max="320"
              class="form-input"
            />
            <small>Recommended: 128 kbps</small>
          </div>

          <div class="form-group">
            <label>Volume Level</label>
            <input 
              v-model.number="settings.volume" 
              type="range" 
              min="0" 
              max="100"
              class="form-range"
            />
            <span>{{ settings.volume }}%</span>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.enableNoiseSuppression" />
              <span>Enable Noise Suppression</span>
            </label>
          </div>

          <button @click="saveSettings" class="btn btn-primary">
            Save Audio Settings
          </button>
        </div>
      </div>

      <!-- Stream Key Tab -->
      <div v-if="activeTab === 'keys'" class="settings-section">
        <div class="settings-card">
          <h2>Stream Keys</h2>
          
          <div class="stream-key-display">
            <div class="key-item">
              <label>Primary Stream Key</label>
              <div class="key-input-group">
                <input 
                  :type="showPrimaryKey ? 'text' : 'password'" 
                  :value="settings.primaryKey"
                  readonly
                  class="form-input"
                />
                <button @click="showPrimaryKey = !showPrimaryKey" class="btn-icon">
                  {{ showPrimaryKey ? '👁️' : '👁️‍🗨️' }}
                </button>
                <button @click="copyToClipboard(settings.primaryKey)" class="btn-icon">
                  📋
                </button>
              </div>
            </div>

            <div class="key-item">
              <label>Secondary Stream Key</label>
              <div class="key-input-group">
                <input 
                  :type="showSecondaryKey ? 'text' : 'password'" 
                  :value="settings.secondaryKey"
                  readonly
                  class="form-input"
                />
                <button @click="showSecondaryKey = !showSecondaryKey" class="btn-icon">
                  {{ showSecondaryKey ? '👁️' : '👁️‍🗨️' }}
                </button>
                <button @click="copyToClipboard(settings.secondaryKey)" class="btn-icon">
                  📋
                </button>
              </div>
            </div>
          </div>

          <div class="key-actions">
            <button @click="regeneratePrimaryKey" class="btn btn-warning">
              Regenerate Primary Key
            </button>
            <button @click="regenerateSecondaryKey" class="btn btn-warning">
              Regenerate Secondary Key
            </button>
          </div>

          <div class="warning-box">
            <p>⚠️ Keep your stream keys private. Never share them publicly.</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ============================================================================
// PAGE META - MIDDLEWARE & LAYOUT
// ============================================================================
definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

// ============================================================================
// REACTIVE STATE
// ============================================================================
const activeTab = ref('general')

const settingsTabs = [
  { id: 'general', label: 'General' },
  { id: 'quality', label: 'Quality' },
  { id: 'audio', label: 'Audio' },
  { id: 'keys', label: 'Stream Keys' }
]

const settings = ref({
  // General
  title: 'My Awesome Stream',
  description: 'Welcome to my stream!',
  category: 'gaming',
  isPublic: true,
  
  // Quality
  resolution: '720p',
  bitrate: 6,
  fps: '60',
  encoder: 'h264',
  
  // Audio
  microphone: 'default',
  audioBitrate: 128,
  volume: 80,
  enableNoiseSuppression: true,
  
  // Keys
  primaryKey: 'live_abc123def456ghi789jkl',
  secondaryKey: 'live_xyz789uvw456rst123opq'
})

const showPrimaryKey = ref(false)
const showSecondaryKey = ref(false)

// ============================================================================
// METHODS
// ============================================================================
const saveSettings = () => {
  console.log('Saving stream settings:', settings.value)
  alert('Settings saved successfully!')
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  alert('Copied to clipboard!')
}

const regeneratePrimaryKey = () => {
  if (confirm('Are you sure? This will invalidate your current primary key.')) {
    settings.value.primaryKey = 'live_' + Math.random().toString(36).substring(2, 26)
    console.log('Primary key regenerated')
  }
}

const regenerateSecondaryKey = () => {
  if (confirm('Are you sure? This will invalidate your current secondary key.')) {
    settings.value.secondaryKey = 'live_' + Math.random().toString(36).substring(2, 26)
    console.log('Secondary key regenerated')
  }
}

// ============================================================================
// SEO
// ============================================================================
useHead({
  title: 'Stream Settings - SocialVerse',
  meta: [
    { name: 'description', content: 'Configure your streaming settings and preferences' }
  ]
})
</script>

<style scoped>
.stream-settings-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 0;
}

.settings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  padding: 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-button:hover {
  color: #333;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-card h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea,
.form-select,
.form-range {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus,
.form-range:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #999;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input {
  width: auto;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.stream-key-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.key-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.key-input-group {
  display: flex;
  gap: 0.5rem;
}

.key-input-group .form-input {
  flex: 1;
  font-family: monospace;
}

.btn-icon {
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.key-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.warning-box {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  padding: 1rem;
  color: #92400e;
}

.warning-box p {
  margin: 0;
}

@media (max-width: 768px) {
  .stream-settings-container {
    padding: 1rem;
  }

  .settings-tabs {
    flex-wrap: wrap;
  }

  .key-actions {
    flex-direction: column;
  }

  .key-actions .btn {
    width: 100%;
  }
}
</style>

