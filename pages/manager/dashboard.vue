<template>
  <div class="manager-dashboard">
    <!-- Header Section -->
    <div class="manager-header">
      <div class="header-content">
        <h1 class="page-title">📊 Manager Dashboard</h1>
        <p class="page-description">Moderate content and manage users in your assigned areas</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <div class="stat-number">{{ pendingReports }}</div>
          <div class="stat-label">Pending Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ moderatedToday }}</div>
          <div class="stat-label">Moderated Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ activeUsers }}</div>
          <div class="stat-label">Active Users</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="action-grid">
        <NuxtLink to="/manager/reports" class="action-card urgent">
          <Icon name="alert-triangle" />
          <h3>Review Reports</h3>
          <p>{{ pendingReports }} pending reports</p>
          <span class="badge urgent" v-if="pendingReports > 0">{{ pendingReports }}</span>
        </NuxtLink>
        
        <NuxtLink to="/manager/posts" class="action-card">
          <Icon name="file-text" />
          <h3>Moderate Posts</h3>
          <p>Review flagged content</p>
        </NuxtLink>
        
        <NuxtLink to="/manager/users" class="action-card">
          <Icon name="users" />
          <h3>Manage Users</h3>
          <p>View and moderate users</p>
        </NuxtLink>
        
        <NuxtLink to="/manager/analytics" class="action-card">
          <Icon name="bar-chart" />
          <h3>View Analytics</h3>
          <p>Moderation statistics</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h2>Recent Moderation Activity</h2>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            <Icon :name="getActivityIcon(activity.type)" />
          </div>
          <div class="activity-content">
            <p class="activity-description">{{ activity.description }}</p>
            <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
          </div>
          <div class="activity-status" :class="activity.status">
            {{ activity.status }}
          </div>
        </div>
      </div>
    </div>

    <!-- Manager Permissions Info -->
    <div class="permissions-info">
      <h3>Your Manager Permissions</h3>
      <div class="permissions-grid">
        <div class="permission-item" v-for="permission in managerPermissions" :key="permission">
          <Icon name="check" class="permission-icon" />
          <span>{{ formatPermission(permission) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'manager'
})
 
const { $i18n } = useNuxtApp()
const { hasPermission, getUserPermissions } = useRBAC()
const authStore = useAuthStore()
const supabase = useSupabaseClient()

// Reactive data
const pendingReports = ref(0)
const moderatedToday = ref(0)
const activeUsers = ref(0)
const recentActivities = ref([])
const managerPermissions = ref([])

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    // Fetch pending reports count
    const { count: reportsCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    pendingReports.value = reportsCount || 0

    // Fetch today's moderation actions
    const today = new Date().toISOString().split('T')[0]
    const { count: moderatedCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.profile.id)
      .gte('created_at', today)
      .in('action', ['post_moderated', 'user_suspended', 'report_resolved'])
    
    moderatedToday.value = moderatedCount || 0

    // Fetch active users count
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    activeUsers.value = usersCount || 0

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', authStore.profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    recentActivities.value = activities || []

    // Get manager permissions
    managerPermissions.value = getUserPermissions(authStore.profile)
      .filter(p => p.startsWith('posts.') || p.startsWith('users.') || p.startsWith('reports.'))

  } catch (error) {
    console.error('Dashboard data fetch error:', error)
  }
}

// Helper functions
const getActivityIcon = (type) => {
  const icons = {
    post_moderated: 'file-text',
    user_suspended: 'user-x',
    report_resolved: 'check-circle',
    comment_deleted: 'message-square'
  }
  return icons[type] || 'activity'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const formatPermission = (permission) => {
  return permission.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
})

// Auto-refresh every 5 minutes
const refreshInterval = setInterval(fetchDashboardData, 5 * 60 * 1000)

onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<style scoped>
.manager-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.page-description {
  color: #6b7280;
  margin: 0.5rem 0 0 0;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
  min-width: 120px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #059669;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.action-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.action-card.urgent {
  border-left: 4px solid #ef4444;
}

.action-card h3 {
  margin: 0.5rem 0;
  color: #1f2937;
}

.action-card p {
  color: #6b7280;
  margin: 0;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.activity-list {
  margin-top: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.activity-icon.post_moderated {
  background: #dbeafe;
  color: #3b82f6;
}

.activity-icon.user_suspended {
  background: #fee2e2;
  color: #ef4444;
}

.activity-icon.report_resolved {
  background: #d1fae5;
  color: #059669;
}

.activity-content {
  flex: 1;
}

.activity-description {
  margin: 0;
  color: #1f2937;
}

.activity-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.activity-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.activity-status.completed {
  background: #d1fae5;
  color: #059669;
}

.activity-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.permissions-info {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
}

.permission-icon {
  width: 16px;
  height: 16px;
}
</style>
