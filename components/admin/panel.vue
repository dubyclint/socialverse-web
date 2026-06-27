<template>
  <div class="admin-panel">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1>🛡️ Admin Dashboard</h1>
        <div class="admin-actions">
          <button @click="refreshAllData" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">🔄</span>
            <span v-else>↻</span>
            Refresh
          </button>
          <div class="admin-status">
            <span class="status-indicator" :class="systemStatus"></span>
            System {{ systemStatus }}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats Dashboard -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ stats.totalUsers.toLocaleString() }}</h3>
          <p>Total Users</p>
          <span class="stat-change positive">+{{ stats.newUsersToday }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <h3>{{ stats.totalPews.toLocaleString() }}</h3>
          <p>Total Pews</p>
          <span class="stat-change positive">+{{ stats.newPewsToday }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>{{ stats.totalPewBalance.toLocaleString() }}</h3>
          <p>Total Pew Balance</p>
          <span class="stat-change">{{ stats.balanceChange }}%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎁</div>
        <div class="stat-content">
          <h3>{{ stats.totalGifts.toLocaleString() }}</h3>
          <p>Gifts Sent</p>
          <span class="stat-change positive">+{{ stats.giftsToday }}</span>
        </div>
      </div>
    </div>

    <!-- Management Sections -->
    <div class="management-grid">
      <!-- User Management -->
      <section class="management-card">
        <div class="card-header">
          <h2>👥 User Management</h2>
          <button @click="showUserModal = true" class="btn btn-sm btn-outline">
            Add User
          </button>
        </div>
        <div class="card-content">
          <div class="quick-actions">
            <button @click="viewAllUsers" class="action-btn">
              <span>📋</span> View All Users
            </button>
            <button @click="viewReportedUsers" class="action-btn">
              <span>⚠️</span> Reported Users ({{ reportedUsersCount }})
            </button>
            <button @click="viewVerificationRequests" class="action-btn">
              <span>✅</span> Verification Requests ({{ verificationRequestsCount }})
            </button>
          </div>
          <div class="recent-activity">
            <h4>Recent User Activity</h4>
            <ul class="activity-list">
              <li v-for="activity in recentUserActivity" :key="activity.id" class="activity-item">
                <span class="activity-icon">{{ activity.icon }}</span>
                <span class="activity-text">{{ activity.text }}</span>
                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Pew Balance Management -->
      <section class="management-card">
        <div class="card-header">
          <h2>💰 Pew Balance Management</h2>
          <button @click="showBalanceModal = true" class="btn btn-sm btn-outline">
            Adjust Balance
          </button>
        </div>
        <div class="card-content">
          <div class="balance-overview">
            <div class="balance-stat">
              <span class="label">Total Circulation:</span>
              <span class="value">{{ stats.totalPewBalance.toLocaleString() }} PEW</span>
            </div>
            <div class="balance-stat">
              <span class="label">Daily Transactions:</span>
              <span class="value">{{ stats.dailyTransactions.toLocaleString() }}</span>
            </div>
            <div class="balance-stat">
              <span class="label">Average Balance:</span>
              <span class="value">{{ stats.averageBalance.toLocaleString() }} PEW</span>
            </div>
          </div>
          <div class="quick-actions">
            <button @click="viewTransactionHistory" class="action-btn">
              <span>📊</span> Transaction History
            </button>
            <button @click="viewTopBalances" class="action-btn">
              <span>🏆</span> Top Balances
            </button>
            <button @click="generateBalanceReport" class="action-btn">
              <span>📈</span> Generate Report
            </button>
          </div>
        </div>
      </section>

      <!-- Manager Privileges -->
      <section class="management-card">
        <div class="card-header">
          <h2>🔐 Manager Privileges</h2>
          <button @click="showManagerModal = true" class="btn btn-sm btn-outline">
            Assign Manager
          </button>
        </div>
        <div class="card-content">
          <div class="manager-stats">
            <div class="manager-count">
              <span class="count">{{ stats.totalManagers }}</span>
              <span class="label">Active Managers</span>
            </div>
            <div class="manager-count">
              <span class="count">{{ stats.pendingRequests }}</span>
              <span class="label">Pending Requests</span>
            </div>
          </div>
          <div class="quick-actions">
            <button @click="viewAllManagers" class="action-btn">
              <span>👨‍💼</span> View All Managers
            </button>
            <button @click="viewManagerActivity" class="action-btn">
              <span>📋</span> Manager Activity
            </button>
            <button @click="configurePermissions" class="action-btn">
              <span>⚙️</span> Configure Permissions
            </button>
          </div>
        </div>
      </section>

      <!-- Content Moderation -->
      <section class="management-card">
        <div class="card-header">
          <h2>🛡️ Content Moderation</h2>
          <button @click="showModerationQueue" class="btn btn-sm btn-outline">
            View Queue
          </button>
        </div>
        <div class="card-content">
          <div class="moderation-stats">
            <div class="mod-stat urgent">
              <span class="count">{{ stats.flaggedContent }}</span>
              <span class="label">Flagged Content</span>
            </div>
            <div class="mod-stat">
              <span class="count">{{ stats.pendingReviews }}</span>
              <span class="label">Pending Reviews</span>
            </div>
          </div>
          <div class="quick-actions">
            <button @click="reviewFlaggedPosts" class="action-btn">
              <span>🚩</span> Flagged Posts ({{ stats.flaggedContent }})
            </button>
            <button @click="reviewReportedUsers" class="action-btn">
              <span>⚠️</span> Reported Users
            </button>
            <button @click="viewModerationLog" class="action-btn">
              <span>📝</span> Moderation Log
            </button>
          </div>
        </div>
      </section>

      <!-- System Analytics -->
      <section class="management-card">
        <div class="card-header">
          <h2>📊 System Analytics</h2>
          <button @click="exportAnalytics" class="btn btn-sm btn-outline">
            Export Data
          </button>
        </div>
        <div class="card-content">
          <div class="analytics-chart">
            <canvas ref="analyticsChart" width="300" height="150"></canvas>
          </div>
          <div class="quick-actions">
            <button @click="viewEngagementMetrics" class="action-btn">
              <span>📈</span> Engagement Metrics
            </button>
            <button @click="viewUserGrowth" class="action-btn">
              <span>📊</span> User Growth
            </button>
            <button @click="viewSystemHealth" class="action-btn">
              <span>💚</span> System Health
            </button>
          </div>
        </div>
      </section>

      <!-- Quick Tools -->
      <section class="management-card">
        <div class="card-header">
          <h2>🔧 Quick Tools</h2>
        </div>
        <div class="card-content">
          <div class="tools-grid">
            <button @click="sendBroadcast" class="tool-btn">
              <span>📢</span>
              <span>Send Broadcast</span>
            </button>
            <button @click="systemMaintenance" class="tool-btn">
              <span>🔧</span>
              <span>Maintenance Mode</span>
            </button>
            <button @click="backupDatabase" class="tool-btn">
              <span>💾</span>
              <span>Backup Database</span>
            </button>
            <button @click="clearCache" class="tool-btn">
              <span>🗑️</span>
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Modals -->
    <!-- User Management Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="showUserModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>User Management</h3>
          <button @click="showUserModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="user-search">
            <input v-model="userSearch" placeholder="Search users..." class="search-input">
            <button @click="searchUsers" class="btn btn-primary">Search</button>
          </div>
          <div class="user-actions">
            <button @click="banUser" class="btn btn-danger">Ban User</button>
            <button @click="verifyUser" class="btn btn-success">Verify User</button>
            <button @click="adjustUserBalance" class="btn btn-warning">Adjust Balance</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Balance Management Modal -->
    <div v-if="showBalanceModal" class="modal-overlay" @click="showBalanceModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Pew Balance Management</h3>
          <button @click="showBalanceModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="balance-form">
            <input v-model="balanceUserId" placeholder="User ID" class="form-input">
            <input v-model="balanceAmount" type="number" placeholder="Amount" class="form-input">
            <select v-model="balanceAction" class="form-select">
              <option value="add">Add Balance</option>
              <option value="subtract">Subtract Balance</option>
              <option value="set">Set Balance</option>
            </select>
            <textarea v-model="balanceReason" placeholder="Reason for adjustment" class="form-textarea"></textarea>
            <button @click="processBalanceAdjustment" class="btn btn-primary">Process Adjustment</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manager Assignment Modal -->
    <div v-if="showManagerModal" class="modal-overlay" @click="showManagerModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Manager Assignment</h3>
          <button @click="showManagerModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="manager-form">
            <input v-model="managerUserId" placeholder="User ID" class="form-input">
            <select v-model="managerRole" class="form-select">
              <option value="content_moderator">Content Moderator</option>
              <option value="user_manager">User Manager</option>
              <option value="balance_manager">Balance Manager</option>
              <option value="super_manager">Super Manager</option>
            </select>
            <div class="permissions-grid">
              <label v-for="permission in availablePermissions" :key="permission.id" class="permission-item">
                <input type="checkbox" v-model="selectedPermissions" :value="permission.id">
                <span>{{ permission.name }}</span>
              </label>
            </div>
            <button @click="assignManager" class="btn btn-primary">Assign Manager</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { supabase } from '~/utils/supabase';

// Reactive data
const loading = ref(false);
const systemStatus = ref('healthy');

// Modal states
const showUserModal = ref(false);
const showBalanceModal = ref(false);
const showManagerModal = ref(false);

// Form data
const userSearch = ref('');
const balanceUserId = ref('');
const balanceAmount = ref(0);
const balanceAction = ref('add');
const balanceReason = ref('');
const managerUserId = ref('');
const managerRole = ref('content_moderator');
const selectedPermissions = ref([]);

// Stats data
const stats = ref({
  totalUsers: 0,
  newUsersToday: 0,
  totalPews: 0,
  newPewsToday: 0,
  totalPewBalance: 0,
  balanceChange: 0,
  totalGifts: 0,
  giftsToday: 0,
  totalManagers: 0,
  pendingRequests: 0,
  flaggedContent: 0,
  pendingReviews: 0,
  dailyTransactions: 0,
  averageBalance: 0
});

// Activity data
const recentUserActivity = ref([
  { id: 1, icon: '👤', text: 'New user registered: @johndoe', timestamp: new Date() },
  { id: 2, icon: '✅', text: 'User verified: @janedoe', timestamp: new Date() },
  { id: 3, icon: '⚠️', text: 'User reported: @spammer', timestamp: new Date() }
]);

// Computed properties
const reportedUsersCount = computed(() => 5); // This would come from API
const verificationRequestsCount = computed(() => 12); // This would come from API

// Available permissions for managers
const availablePermissions = ref([
  { id: 'ban_users', name: 'Ban Users' },
  { id: 'verify_users', name: 'Verify Users' },
  { id: 'moderate_content', name: 'Moderate Content' },
  { id: 'adjust_balances', name: 'Adjust Balances' },
  { id: 'view_analytics', name: 'View Analytics' },
  { id: 'manage_ads', name: 'Manage Ads' },
  { id: 'system_settings', name: 'System Settings' }
]);

// Methods
const refreshAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadUserStats(),
      loadPewStats(),
      loadBalanceStats(),
      loadManagerStats(),
      loadModerationStats()
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    loading.value = false;
  }
};

const loadUserStats = async () => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    stats.value.totalUsers = users?.length || 0;
    
    const today = new Date().toDateString();
    stats.value.newUsersToday = users?.filter(user => 
      new Date(user.created_at).toDateString() === today
    ).length || 0;
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
};

const loadPewStats = async () => {
  try {
    const { data: pews, error } = await supabase
      .from('pews')
      .select('id, created_at');

    if (error) throw error;

    stats.value.totalPews = pews?.length || 0;
    
    const today = new Date().toDateString();
    stats.value.newPewsToday = pews?.filter(pew => 
      new Date(pew.created_at).toDateString() === today
    ).length || 0;
  } catch (error) {
    console.error('Error loading pew stats:', error);
  }
};

const loadBalanceStats = async () => {
  try {
    const { data: balances, error } = await supabase
      .from('user_balances')
      .select('balance');

    if (error) throw error;

    const totalBalance = balances?.reduce((sum, b) => sum + (b.balance || 0), 0) || 0;
    stats.value.totalPewBalance = totalBalance;
    stats.value.averageBalance = balances?.length ? Math.round(totalBalance / balances.length) : 0;
  } catch (error) {
    console.error('Error loading balance stats:', error);
  }
};

const loadManagerStats = async () => {
  try {
    const { data: managers, error } = await supabase
      .from('user_roles')
      .select('*')
      .in('role', ['manager', 'admin', 'moderator']);

    if (error) throw error;

    stats.value.totalManagers = managers?.length || 0;
  } catch (error) {
    console.error('Error loading manager stats:', error);
  }
};

const loadModerationStats = async () => {
  try {
    const { data: flagged, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('status', 'pending');

    if (error) throw error;

    stats.value.flaggedContent = flagged?.length || 0;
    stats.value.pendingReviews = flagged?.length || 0;
  } catch (error) {
    console.error('Error loading moderation stats:', error);
  }
};

// User Management Methods
const viewAllUsers = () => {
  navigateTo('/admin/users');
};

const viewReportedUsers = () => {
  navigateTo('/admin/users?filter=reported');
};

const viewVerificationRequests = () => {
  navigateTo('/admin/verification-requests');
};

const searchUsers = async () => {
  // Implement user search logic
  console.log('Searching for users:', userSearch.value);
};

const banUser = async () => {
  // Implement ban user logic
  console.log('Banning user');
};

const verifyUser = async () => {
  // Implement verify user logic
  console.log('Verifying user');
};

const adjustUserBalance = async () => {
  // Implement balance adjustment logic
  console.log('Adjusting user balance');
};

// Balance Management Methods
const viewTransactionHistory = () => {
  navigateTo('/admin/transactions');
};

const viewTopBalances = () => {
  navigateTo('/admin/balances?sort=highest');
};

const generateBalanceReport = async () => {
  // Implement report generation
  console.log('Generating balance report');
};

const processBalanceAdjustment = async () => {
  try {
    const { data, error } = await supabase
      .from('balance_adjustments')
      .insert({
        user_id: balanceUserId.value,
        amount: balanceAmount.value,
        action: balanceAction.value,
        reason: balanceReason.value,
        admin_id: 'current_admin_id', // Get from auth
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update user balance
    const adjustment = balanceAction.value === 'add' ? balanceAmount.value : 
                     balanceAction.value === 'subtract' ? -balanceAmount.value : 
                     balanceAmount.value;

    await supabase.rpc('adjust_user_balance', {
      user_id: balanceUserId.value,
      adjustment: adjustment,
      set_balance: balanceAction.value === 'set'
    });

    showBalanceModal.value = false;
    await refreshAllData();
  } catch (error) {
    console.error('Error processing balance adjustment:', error);
  }
};

// Manager Methods
const viewAllManagers = () => {
  navigateTo('/admin/managers');
};

const viewManagerActivity = () => {
  navigateTo('/admin/manager-activity');
};

const configurePermissions = () => {
  navigateTo('/admin/permissions');
};

const assignManager = async () => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: managerUserId.value,
        role: managerRole.value,
        permissions: selectedPermissions.value,
        assigned_by: 'current_admin_id', // Get from auth
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    showManagerModal.value = false;
    await refreshAllData();
  } catch (error) {
    console.error('Error assigning manager:', error);
  }
};

// Content Moderation Methods
const showModerationQueue = () => {
  navigateTo('/admin/moderation-queue');
};

const reviewFlaggedPosts = () => {
  navigateTo('/admin/flagged-posts');
};

const reviewReportedUsers = () => {
  navigateTo('/admin/reported-users');
};

const viewModerationLog = () => {
  navigateTo('/admin/moderation-log');
};

// Analytics Methods
const exportAnalytics = async () => {
  // Implement analytics export
  console.log('Exporting analytics data');
};

const viewEngagementMetrics = () => {
  navigateTo('/admin/engagement');
};

const viewUserGrowth = () => {
  navigateTo('/admin/user-growth');
};

const viewSystemHealth = () => {
  navigateTo('/admin/system-health');
};

// Quick Tools Methods
const sendBroadcast = () => {
  navigateTo('/admin/broadcast');
};

const systemMaintenance = async () => {
  // Implement maintenance mode toggle
  console.log('Toggling maintenance mode');
};

const backupDatabase = async () => {
  // Implement database backup
  console.log('Starting database backup');
};

const clearCache = async () => {
  // Implement cache clearing
  console.log('Clearing cache');
};

// Utility Methods
const formatTime = (timestamp: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    .format(Math.round((timestamp.getTime() - Date.now()) / (1000 * 60)), 'minute');
};

// Lifecycle
onMounted(async () => {
  await refreshAllData();
});
</script>

<style scoped>
.admin-panel {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
}

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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: #1f2937;
}

.stat-content p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.stat-change {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.stat-change.positive {
  background: #dcfce7;
  color: #16a34a;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.management-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: #f8fafc;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-content {
  padding: 1.5rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.balance-overview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.balance-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.balance-stat .label {
  color: #6b7280;
  font-size: 0.9rem;
}

.balance-stat .value {
  font-weight: 600;
  color: #1f2937;
}

.manager-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.manager-count {
  text-align: center;
}

.manager-count .count {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.manager-count .label {
  font-size: 0.8rem;
  color: #6b7280;
}

.moderation-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.mod-stat {
  text-align: center;
}

.mod-stat .count {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.mod-stat.urgent .count {
  color: #ef4444;
}

.mod-stat .label {
  font-size: 0.8rem;
  color: #6b7280;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.tool-btn span:first-child {
  font-size: 1.5rem;
}

.tool-btn span:last-child {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.recent-activity {
  margin-top: 1.5rem;
}*
<style scoped>
/* ... previous styles ... */

.recent-activity h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #374151;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.activity-text {
  flex: 1;
  font-size: 0.9rem;
  color: #374151;
}

.activity-time {
  font-size: 0.8rem;
  color: #9ca3af;
}

.analytics-chart {
  height: 150px;
  margin-bottom: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

/* Modal Styles */
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

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
  font-size: 1.25rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 1.5rem;
}

/* Form Styles */
.user-search {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.balance-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.manager-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.permission-item input[type="checkbox"] {
  margin: 0;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-panel {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .management-grid {
    grid-template-columns: 1fr;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .manager-stats,
  .moderation-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .balance-overview {
    font-size: 0.9rem;
  }
  
  .user-actions {
    flex-direction: column;
  }
  
  .permissions-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
}

@media (max-width: 480px) {
  .admin-header {
    padding: 1.5rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .user-search {
    flex-direction: column;
  }
}

/* Loading States */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #667eea;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Animations */
.stat-card,
.management-card {
  animation: fadeInUp 0.5s ease-out;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hover Effects */
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.management-card:hover {
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

/* Status Indicators */
.status-healthy { background: #10b981; }
.status-warning { background: #f59e0b; }
.status-error { background: #ef4444; }

/* Notification Badges */
.notification-badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .admin-panel {
    background: #111827;
    color: #f9fafb;
  }
  
  .stat-card,
  .management-card,
  .modal {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .card-header {
    background: #374151;
    border-color: #4b5563;
  }
  
  .action-btn,
  .tool-btn {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .action-btn:hover,
  .tool-btn:hover {
    background: #4b5563;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .permissions-grid {
    background: #374151;
    border-color: #4b5563;
  }
}
</style>
