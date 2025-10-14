<template>
  <div class="security-dashboard">
    <div class="dashboard-header">
      <h2>Security Dashboard</h2>
      <div class="header-actions">
        <button @click="refreshAll" class="btn btn-primary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Security Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-desktop"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics?.sessions?.active || 0 }}</h3>
          <p>Active Sessions</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.total || 0 }}</h3>
          <p>Security Events (24h)</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.bySeverity?.WARNING || 0 }}</h3>
          <p>Warnings</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ban"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics?.events?.bySeverity?.CRITICAL || 0 }}</h3>
          <p>Critical Events</p>
        </div>
      </div>
    </div>

    <!-- Active Sessions -->
    <div class="section">
      <div class="section-header">
        <h3>Active Sessions</h3>
        <div class="section-actions">
          <button 
            @click="showTerminateAllModal = true" 
            class="btn btn-danger btn-sm"
            :disabled="activeSessions.length <= 1"
          >
            <i class="fas fa-sign-out-alt"></i>
            Terminate All Others
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
          <div class="session-info">
            <div class="session-header">
              <div class="device-info">
                <i :class="getDeviceIcon(getSessionInfo(session))"></i>
                <span class="device-name">
                  {{ getSessionInfo(session).browser }} on {{ getSessionInfo(session).os }}
                </span>
                <span v-if="session.is_current" class="current-badge">Current</span>
              </div>
              <div class="session-actions">
                <button 
                  v-if="!session.is_current"
                  @click="terminateSessionConfirm(session)"
                  class="btn btn-danger btn-sm"
                >
                  <i class="fas fa-times"></i>
                  Terminate
                </button>
              </div>
            </div>
            
            <div class="session-details">
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ getSessionInfo(session).ip }} - {{ getSessionInfo(session).location }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>Last active: {{ getSessionInfo(session).lastActivity }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <span>Created: {{ getSessionInfo(session).created }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeSessions.length === 0" class="no-sessions">
          <i class="fas fa-desktop"></i>
          <p>No active sessions found</p>
        </div>
      </div>
    </div>

    <!-- Recent Security Events -->
    <div class="section">
      <div class="section-header">
        <h3>Recent Security Events</h3>
        <div class="section-actions">
          <select v-model="eventFilter" @change="loadSecurityEvents({ severity: eventFilter })">
            <option value="">All Events</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div class="events-list">
        <div 
          v-for="event in securityEvents.slice(0, 10)" 
          :key="event.id"
          class="event-card"
          :class="`severity-${event.severity.toLowerCase()}`"
        >
          <div class="event-icon">
            <i :class="getEventIcon(event.event_type)"></i>
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

        <div v-if="securityEvents.length === 0" class="no-events">
          <i class="fas fa-shield-alt"></i>
          <p>No security events found</p>
        </div>
      </div>
    </div>

    <!-- Terminate All Sessions Modal -->
    <div v-if="showTerminateAllModal" class="modal-overlay" @click="showTerminateAllModal = false">
      <div class="modal-content" @click.stop>
        <h3>Terminate All Other Sessions</h3>
        <p>This will log you out of all other devices and browsers. Your current session will remain active.</p>
        <p><strong>{{ activeSessions.length - 1 }}</strong> sessions will be terminated.</p>
        
        <div class="modal-actions">
          <button @click="showTerminateAllModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmTerminateAll" class="btn btn-danger" :disabled="loading">
            <i class="fas fa-sign-out-alt"></i>
            {{ loading ? 'Terminating...' : 'Terminate All' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Terminate Session Modal -->
    <div v-if="sessionToTerminate" class="modal-overlay" @click="sessionToTerminate = null">
      <div class="modal-content" @click.stop>
        <h3>Terminate Session</h3>
        <p>Are you sure you want to terminate this session?</p>
        
        <div class="session-preview">
          <div class="device-info">
            <i :class="getDeviceIcon(getSessionInfo(sessionToTerminate))"></i>
            <span>{{ getSessionInfo(sessionToTerminate).browser }} on {{ getSessionInfo(sessionToTerminate).os }}</span>
          </div>
          <div class="session-location">
            {{ getSessionInfo(sessionToTerminate).ip }} - {{ getSessionInfo(sessionToTerminate).location }}
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="sessionToTerminate = null" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmTerminateSession" class="btn btn-danger" :disabled="loading">
            <i class="fas fa-times"></i>
            {{ loading ? 'Terminating...' : 'Terminate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useSecurity } from '~/composables/useSecurity'

export default {
  name: 'SecurityDashboard',
  setup() {
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
      loadStatistics,
      getSessionInfo,
      getEventSeverityColor,
      formatEventType
    } = useSecurity()

    return {
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
      loadStatistics,
      getSessionInfo,
      getEventSeverityColor,
      formatEventType
    }
  },
  data() {
    return {
      showTerminateAllModal: false,
      sessionToTerminate: null,
      eventFilter: ''
    }
  },
  async mounted() {
    await this.refreshAll()
  },
  methods: {
    async refreshAll() {
      try {
        await Promise.all([
          this.loadSessions(),
          this.loadSecurityEvents({ limit: 20 }),
          this.loadStatistics()
        ])
      } catch (error) {
        console.error('Error refreshing security data:', error)
        this.$toast.error('Failed to refresh security data')
      }
    },

    terminateSessionConfirm(session) {
      this.sessionToTerminate = session
    },

    async confirmTerminateSession() {
      if (!this.sessionToTerminate) return

      try {
        await this.terminateSession(this.sessionToTerminate.id)
        this.sessionToTerminate = null
        this.$toast.success('Session terminated successfully')
      } catch (error) {
        console.error('Error terminating session:', error)
        this.$toast.error('Failed to terminate session')
      }
    },

    async confirmTerminateAll() {
      try {
        const result = await this.terminateAllSessions()
        this.showTerminateAllModal = false
        this.$toast.success(result.message)
      } catch (error) {
        console.error('Error terminating all sessions:', error)
        this.$toast.error('Failed to terminate sessions')
      }
    },

    getDeviceIcon(sessionInfo) {
      const { browser, os } = sessionInfo
      
      if (os.includes('Android') || os.includes('iOS')) {
        return 'fas fa-mobile-alt'
      } else if (os.includes('Mac')) {
        return 'fab fa-apple'
      } else if (os.includes('Windows')) {
        return 'fab fa-windows'
      } else if (os.includes('Linux')) {
        return 'fab fa-linux'
      }
      
      return 'fas fa-desktop'
    },

    getEventIcon(eventType) {
      const icons = {
        'SESSION_CREATED': 'fas fa-sign-in-alt',
        'SESSION_TERMINATED': 'fas fa-sign-out-alt',
        'SUSPICIOUS_ACTIVITY_DETECTED': 'fas fa-exclamation-triangle',
        'FAILED_LOGIN': 'fas fa-times-circle',
        'RATE_LIMIT_EXCEEDED': 'fas fa-tachometer-alt',
        'FORCE_DISCONNECT': 'fas fa-ban',
        'BANNED_IP_ACCESS_ATTEMPT': 'fas fa-shield-alt'
      }
      return icons[eventType] || 'fas fa-info-circle'
    },

    formatEventTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.security-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h2 {
  margin: 0;
  color: #333;
}

.header-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-content h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.section-actions select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.sessions-list, .events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.session-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.session-card.current-session {
  border-color: #28a745;
  background: #f8fff9;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-info i {
  font-size: 20px;
  color: #666;
}

.device-name {
  font-weight: 600;
  color: #333;
}

.current-badge {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
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

.detail-item i {
  width: 16px;
  color: #999;
}

.event-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.event-card.severity-info {
  border-left-color: #17a2b8;
  background: #f7fdff;
}

.event-card.severity-warning {
  border-left-color: #ffc107;
  background: #fffdf7;
}

.event-card.severity-critical {
  border-left-color: #dc3545;
  background: #fff7f7;
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #666;
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
  color: #333;
}

.event-time {
  color: #666;
  font-size: 14px;
}

.event-details p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.severity-info {
  background: #d1ecf1;
  color: #0c5460;
}

.severity-badge.severity-warning {
  background: #fff3cd;
  color: #856404;
}

.severity-badge.severity-critical {
  background: #f8d7da;
  color: #721c24;
}

.no-sessions, .no-events {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-sessions i, .no-events i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

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
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.session-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.session-preview .device-info {
  margin-bottom: 8px;
}

.session-location {
  color: #666;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .security-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .session-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .event-card {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
