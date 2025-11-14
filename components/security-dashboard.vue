<!-- components/security-dashboard.vue -->
<!-- ============================================================================
     SECURITY DASHBOARD - Comprehensive security management interface
     ============================================================================ -->

<template>
  <div class="security-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>🔒 Security Dashboard</h1>
        <p class="header-subtitle">Monitor and manage your account security</p>
      </div>
      <button 
        @click="refreshAll" 
        class="btn btn-primary" 
        :disabled="loading"
        title="Refresh all security data"
      >
        <span v-if="loading" class="spinner">⏳</span>
        <span v-else>🔄</span>
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Security Score Card -->
    <div class="security-score-card">
      <div class="score-display">
        <div class="score-circle">
          <span class="score-value">{{ securityScore }}</span>
          <span class="score-label">Score</span>
        </div>
        <div class="score-info">
          <h3>{{ getSecurityStatus() }}</h3>
          <p>{{ getSecurityMessage() }}</p>
          <div class="score-recommendations">
            <span v-for="rec in getRecommendations()" :key="rec" class="recommendation">
              {{ rec }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Statistics Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon active">🖥️</div>
        <div class="stat-content">
          <h3>{{ statistics?.sessions?.active || 0 }}</h3>
          <p>Active Sessions</p>
          <span class="stat-change">{{ statistics?.sessions?.change || 0 }} today</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">⚠️</div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.total || 0 }}</h3>
          <p>Security Events (24h)</p>
          <span class="stat-change">{{ statistics?.events?.change || 0 }} new</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon info">ℹ️</div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.bySeverity?.WARNING || 0 }}</h3>
          <p>Warnings</p>
          <span class="stat-change">Review recommended</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon critical">🚨</div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.bySeverity?.CRITICAL || 0 }}</h3>
          <p>Critical Events</p>
          <span class="stat-change" v-if="statistics?.events?.bySeverity?.CRITICAL > 0">Action required</span>
          <span class="stat-change" v-else>All clear</span>
        </div>
      </div>
    </div>

    <!-- Active Sessions Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>🖥️ Active Sessions</h2>
          <p class="section-subtitle">Manage your logged-in devices</p>
        </div>
        <div class="section-actions">
          <button 
            v-if="activeSessions.length > 1"
            @click="showTerminateAllModal = true" 
            class="btn btn-danger btn-sm"
            title="Terminate all other sessions"
          >
            🚪 Terminate All Others
          </button>
        </div>
      </div>

      <div class="sessions-list">
        <div 
          v-for="session in activeSessions" 
          :key="session.id"
          class="session-card"
          :class="{ 'current-session': session.is_current }"
        >
          <div class="session-header">
            <div class="device-info">
              <span class="device-icon">{{ getDeviceEmoji(getSessionInfo(session)) }}</span>
              <div class="device-details">
                <span class="device-name">
                  {{ getSessionInfo(session).browser }} on {{ getSessionInfo(session).os }}
                </span>
                <span v-if="session.is_current" class="current-badge">Current Device</span>
              </div>
            </div>
            <button 
              v-if="!session.is_current"
              @click="terminateSessionConfirm(session)"
              class="btn btn-danger btn-sm"
              title="Terminate this session"
            >
              ✕
            </button>
          </div>
          
          <div class="session-details">
            <div class="detail-item">
              <span class="detail-icon">📍</span>
              <span>{{ getSessionInfo(session).ip }} - {{ getSessionInfo(session).location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">⏱️</span>
              <span>Last active: {{ getSessionInfo(session).lastActivity }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📅</span>
              <span>Created: {{ getSessionInfo(session).created }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeSessions.length === 0" class="empty-state">
          <span class="empty-icon">🖥️</span>
          <p>No active sessions found</p>
        </div>
      </div>
    </div>

    <!-- Recent Security Events Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>📋 Recent Security Events</h2>
          <p class="section-subtitle">Last 24 hours activity</p>
        </div>
        <div class="section-actions">
          <select v-model="eventFilter" @change="loadSecurityEvents({ severity: eventFilter })" class="filter-select">
            <option value="">All Events</option>
            <option value="INFO">ℹ️ Info</option>
            <option value="WARNING">⚠️ Warning</option>
            <option value="CRITICAL">🚨 Critical</option>
          </select>
        </div>
      </div>

      <div class="events-list">
        <div 
          v-for="event in securityEvents.slice(0, 15)" 
          :key="event.id"
          class="event-card"
          :class="`severity-${event.severity.toLowerCase()}`"
        >
          <div class="event-icon">
            {{ getEventEmoji(event.event_type) }}
          </div>
          <div class="event-content">
            <div class="event-header">
              <span class="event-type">{{ formatEventType(event.event_type) }}</span>
              <span class="event-time">{{ formatEventTime(event.created_at) }}</span>
            </div>
            <div class="event-details">
              <p v-if="event.event_data?.ip_address">
                <strong>IP:</strong> {{ event.event_data.ip_address }}
              </p>
              <p v-if="event.event_data?.reason">
                <strong>Reason:</strong> {{ event.event_data.reason }}
              </p>
              <p v-if="event.event_data?.patterns">
                <strong>Patterns:</strong> {{ event.event_data.patterns.join(', ') }}
              </p>
            </div>
          </div>
          <div class="event-severity">
            <span 
              class="severity-badge" 
              :class="`severity-${event.severity.toLowerCase()}`"
            >
              {{ event.severity }}
            </span>
          </div>
        </div>

        <div v-if="securityEvents.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <p>No security events found</p>
        </div>
      </div>
    </div>

    <!-- Security Settings Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>⚙️ Security Settings</h2>
          <p class="section-subtitle">Configure your security preferences</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="setting-card">
          <div class="setting-header">
            <h3>🔐 Two-Factor Authentication</h3>
            <span class="status-badge" :class="{ enabled: settings?.twoFactorEnabled }">
              {{ settings?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p>Add an extra layer of security to your account</p>
          <button 
            @click="toggleTwoFactor"
            class="btn btn-sm"
            :class="settings?.twoFactorEnabled ? 'btn-secondary' : 'btn-primary'"
          >
            {{ settings?.twoFactorEnabled ? 'Disable' : 'Enable' }} 2FA
          </button>
        </div>

        <div class="setting-card">
          <div class="setting-header">
            <h3>🔔 Security Alerts</h3>
            <span class="status-badge" :class="{ enabled: settings?.securityAlertsEnabled }">
              {{ settings?.securityAlertsEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p>Get notified of suspicious activity</p>
          <button 
            @click="toggleSecurityAlerts"
            class="btn btn-sm"
            :class="settings?.securityAlertsEnabled ? 'btn-secondary' : 'btn-primary'"
          >
            {{ settings?.securityAlertsEnabled ? 'Disable' : 'Enable' }} Alerts
          </button>
        </div>

        <div class="setting-card">
          <div class="setting-header">
            <h3>🔑 Change Password</h3>
            <span class="status-badge">Last changed {{ getPasswordAge() }}</span>
          </div>
          <p>Update your password regularly for better security</p>
          <button @click="showChangePasswordModal = true" class="btn btn-primary btn-sm">
            Change Password
          </button>
        </div>

        <div class="setting-card">
          <div class="setting-header">
            <h3>📱 Trusted Devices</h3>
            <span class="status-badge">{{ trustedDevices?.length || 0 }} devices</span>
          </div>
          <p>Manage devices that don't require 2FA</p>
          <button @click="showTrustedDevicesModal = true" class="btn btn-primary btn-sm">
            Manage Devices
          </button>
        </div>
      </div>
    </div>

    <!-- Terminate All Sessions Modal -->
    <div v-if="showTerminateAllModal" class="modal-overlay" @click="showTerminateAllModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🚪 Terminate All Other Sessions</h3>
          <button @click="showTerminateAllModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p>This will log you out of all other devices and browsers. Your current session will remain active.</p>
          <p class="warning-text">⚠️ <strong>{{ activeSessions.length - 1 }}</strong> sessions will be terminated.</p>
        </div>
        <div class="modal-actions">
          <button @click="showTerminateAllModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmTerminateAll" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'Terminating...' : 'Terminate All' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Terminate Session Modal -->
    <div v-if="sessionToTerminate" class="modal-overlay" @click="sessionToTerminate = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🚪 Terminate Session</h3>
          <button @click="sessionToTerminate = null" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to terminate this session?</p>
          <div class="session-preview">
            <div class="device-info">
              <span class="device-icon">{{ getDeviceEmoji(getSessionInfo(sessionToTerminate)) }}</span>
              <span>{{ getSessionInfo(sessionToTerminate).browser }} on {{ getSessionInfo(sessionToTerminate).os }}</span>
            </div>
            <div class="session-location">
              {{ getSessionInfo(sessionToTerminate).ip }} - {{ getSessionInfo(sessionToTerminate).location }}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="sessionToTerminate = null" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmTerminateSession" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'Terminating...' : 'Terminate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click="showChangePasswordModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🔑 Change Password</h3>
          <button @click="showChangePasswordModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Password</label>
            <input 
              v-model="passwordForm.current" 
              type="password" 
              placeholder="Enter current password"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input 
              v-model="passwordForm.new" 
              type="password" 
              placeholder="Enter new password"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input 
              v-model="passwordForm.confirm" 
              type="password" 
              placeholder="Confirm new password"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showChangePasswordModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="changePassword" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Changing...' : 'Change Password' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Trusted Devices Modal -->
    <div v-if="showTrustedDevicesModal" class="modal-overlay" @click="showTrustedDevicesModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📱 Trusted Devices</h3>
          <button @click="showTrustedDevicesModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="trustedDevices && trustedDevices.length > 0" class="devices-list">
            <div v-for="device in trustedDevices" :key="device.id" class="device-item">
              <div class="device-info">
                <span class="device-icon">{{ getDeviceEmoji(device) }}</span>
                <div>
                  <p class="device-name">{{ device.name }}</p>
                  <p class="device-meta">{{ device.browser }} on {{ device.os }}</p>
                </div>
              </div>
              <button 
                @click="removeTrustedDevice(device.id)"
                class="btn btn-danger btn-sm"
              >
                Remove
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No trusted devices yet</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showTrustedDevicesModal = false" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSecurity } from '~/composables/use-security'

// Composables
const {
  sessions,
  securityEvents,
  statistics,
  loading,
  error,
  activeSessions,
  currentSession,
  loadSessions,
  terminateSession,
  terminateAllSessions,
  loadSecurityEvents,
  loadStatistics
} = useSecurity()

// Local state
const showTerminateAllModal = ref(false)
const showChangePasswordModal = ref(false)
const showTrustedDevicesModal = ref(false)
const sessionToTerminate = ref<any>(null)
const eventFilter = ref('')
const trustedDevices = ref<any[]>([])
const settings = ref({
  twoFactorEnabled: false,
  securityAlertsEnabled: true
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

// Computed
const securityScore = computed(() => {
  let score = 100
  if (!settings.value.twoFactorEnabled) score -= 20
  if (statistics.value?.events?.bySeverity?.CRITICAL > 0) score -= 15
  if (statistics.value?.events?.bySeverity?.WARNING > 0) score -= 10
  return Math.max(0, score)
})

// Methods
const getSecurityStatus = (): string => {
  if (securityScore.value >= 80) return '✅ Excellent'
  if (securityScore.value >= 60) return '⚠️ Good'
  if (securityScore.value >= 40) return '⚠️ Fair'
  return '🚨 Poor'
}

const getSecurityMessage = (): string => {
  if (securityScore.value >= 80) return 'Your account is well protected'
  if (securityScore.value >= 60) return 'Consider enabling 2FA for better security'
  if (securityScore.value >= 40) return 'Review your security settings'
  return 'Immediate action required'
}

const getRecommendations = (): string[] => {
  const recs: string[] = []
  if (!settings.value.twoFactorEnabled) recs.push('Enable 2FA')
  if (statistics.value?.events?.bySeverity?.CRITICAL > 0) recs.push('Review critical events')
  if (activeSessions.value.length > 5) recs.push('Terminate unused sessions')
  return recs
}

const getSessionInfo = (session: any): any => {
  return session || {}
}

const getDeviceEmoji = (sessionInfo: any): string => {
  const { os } = sessionInfo
  if (os?.includes('Android') || os?.includes('iOS')) return '📱'
  if (os?.includes('Mac')) return '🍎'
  if (os?.includes('Windows')) return '🪟'
  if (os?.includes('Linux')) return '🐧'
  return '🖥️'
}

const getEventEmoji = (eventType: string): string => {
  const emojis: Record<string, string> = {
    'SESSION_CREATED': '✅',
    'SESSION_TERMINATED': '🚪',
    'SUSPICIOUS_ACTIVITY_DETECTED': '⚠️',
    'FAILED_LOGIN': '❌',
    'RATE_LIMIT_EXCEEDED': '⏱️',
    'FORCE_DISCONNECT': '🚫',
    'BANNED_IP_ACCESS_ATTEMPT': '🔒'
  }
  return emojis[eventType] || 'ℹ️'
}

const formatEventType = (eventType: string): string => {
  return eventType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

const formatEventTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

const getPasswordAge = (): string => {
  // Implement actual password age logic
  return '30 days ago'
}

const refreshAll = async (): Promise<void> => {
  try {
    await Promise.all([
      loadSessions(),
      loadSecurityEvents({ limit: 20 }),
      loadStatistics()
    ])
  } catch (err) {
    console.error('Error refreshing security data:', err)
  }
}

const terminateSessionConfirm = (session: any): void => {
  sessionToTerminate.value = session
}

const confirmTerminateSession = async (): Promise<void> => {
  if (!sessionToTerminate.value) return

  try {
    await terminateSession(sessionToTerminate.value.id)
    sessionToTerminate.value = null
  } catch (err) {
    console.error('Error terminating session:', err)
  }
}

const confirmTerminateAll = async (): Promise<void> => {
  try {
    await terminateAllSessions()
    showTerminateAllModal.value = false
  } catch (err) {
    console.error('Error terminating all sessions:', err)
  }
}

const toggleTwoFactor = async (): Promise<void> => {
  settings.value.twoFactorEnabled = !settings.value.twoFactorEnabled
}

const toggleSecurityAlerts = async (): Promise<void> => {
  settings.value.securityAlertsEnabled = !settings.value.securityAlertsEnabled
}

const changePassword = async (): Promise<void> => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    alert('Passwords do not match')
    return
  }

  try {
    // Implement password change API call
    showChangePasswordModal.value = false
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (err) {
    console.error('Error changing password:', err)
  }
}

const removeTrustedDevice = async (deviceId: string): Promise<void> => {
  trustedDevices.value = trustedDevices.value.filter(d => d.id !== deviceId)
}

// Lifecycle
onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.security-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.header-subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* Security Score Card */
.security-score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.score-display {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid white;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  opacity: 0.9;
}

.score-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 20px;
}

.score-info p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.score-recommendations {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommendation {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f0f0f0;
}

.stat-icon.active {
  background: #e0f2fe;
}

.stat-icon.warning {
  background: #fef3c7;
}

.stat-icon.info {
  background: #dbeafe;
}

.stat-icon.critical {
  background: #fee2e2;
}

.stat-content h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-content p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.stat-change {
  font-size: 12px;
  color: #999;
}

/* Section */
.section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title h2 {
  margin: 0 0 0.25rem 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.section-subtitle {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

/* Sessions List */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.session-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.session-card.current-session {
  border-color: #10b981;
  background: #f0fdf4;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  font-size: 24px;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-name {
  font-weight: 600;
  color: #1f2937;
}

.current-badge {
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.detail-icon {
  font-size: 16px;
}

/* Events List */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  background: #f9fafb;
}

.event-card.severity-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.event-card.severity-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.event-card.severity-critical {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.event-icon {
  font-size: 24px;
  min-width: 32px;
}

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-type {
  font-weight: 600;
  color: #1f2937;
}

.event-time {
  color: #999;
  font-size: 13px;
}

.event-details p {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.severity-info {
  background: #dbeafe;
  color: #1e40af;
}

.severity-badge.severity-warning {
  background: #fef3c7;
  color: #92400e;
}

.severity-badge.severity-critical {
  background: #fee2e2;
  color: #991b1b;
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.setting-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.setting-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  background: #e5e7eb;
  color: #666;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.enabled {
  background: #d1fae5;
  color: #065f46;
}

.setting-card p {
  margin: 0.5rem 0 1rem 0;
  color: #666;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.6;
}

.warning-text {
  background: #fef3c7;
  color: #92400e;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
}

.session-preview {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
}

.session-location {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Form */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.devices-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.device-meta {
  margin: 0;
  color: #999;
  font-size: 12px;
}

/* Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .security-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .score-display {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
  }
}
</style>
