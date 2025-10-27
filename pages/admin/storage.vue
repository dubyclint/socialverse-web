<!-- pages/admin/storage.vue -->
<!-- ============================================================================
     STORAGE MANAGEMENT DASHBOARD - Admin panel for storage monitoring
     ============================================================================ -->

<template>
  <div class="storage-dashboard">
    <div class="dashboard-header">
      <h1>Storage Management</h1>
      <button @click="refreshStats" class="refresh-btn" :disabled="loading">
        <Icon name="refresh" size="20" />
        Refresh
      </button>
    </div>

    <!-- Storage Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Storage Used</div>
        <div class="stat-value">{{ formatBytes(totalStorageUsed) }}</div>
        <div class="stat-bar">
          <div class="stat-fill" :style="{ width: storagePercentage + '%' }"></div>
        </div>
        <div class="stat-info">{{ storagePercentage }}% of 1TB</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Files</div>
        <div class="stat-value">{{ totalFiles }}</div>
        <div class="stat-info">Across all buckets</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Active Users</div>
        <div class="stat-value">{{ activeUsers }}</div>
        <div class="stat-info">With uploaded files</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Average File Size</div>
        <div class="stat-value">{{ formatBytes(averageFileSize) }}</div>
        <div class="stat-info">Across all files</div>
      </div>
    </div>

    <!-- Bucket Breakdown -->
    <div class="section">
      <h2>Storage by Bucket</h2>
      <div class="bucket-grid">
        <div
          v-for="(bucket, name) in bucketStats"
          :key="name"
          class="bucket-card"
        >
          <div class="bucket-header">
            <h3>{{ name }}</h3>
            <span class="bucket-size">{{ formatBytes(bucket.total_size || 0) }}</span>
          </div>
          <div class="bucket-info">
            <div class="info-row">
              <span>Files:</span>
              <strong>{{ bucket.file_count || 0 }}</strong>
            </div>
            <div class="info-row">
              <span>Avg Size:</span>
              <strong>{{ formatBytes(bucket.avg_size || 0) }}</strong>
            </div>
            <div class="info-row">
              <span>Max Size:</span>
              <strong>{{ formatBytes(bucket.max_size || 0) }}</strong>
            </div>
            <div class="info-row">
              <span>Users:</span>
              <strong>{{ bucket.unique_users || 0 }}</strong>
            </div>
          </div>
          <div class="bucket-bar">
            <div
              class="bucket-fill"
              :style="{ width: getBucketPercentage(bucket.total_size) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cleanup Section -->
    <div class="section">
      <h2>Maintenance</h2>
      <div class="maintenance-card">
        <div class="maintenance-info">
          <h3>Clean Up Old Temporary Files</h3>
          <p>Remove temporary files older than 48 hours</p>
        </div>
        <button
          @click="cleanupTempFiles"
          class="cleanup-btn"
          :disabled="loading"
        >
          {{ loading ? 'Cleaning...' : 'Run Cleanup' }}
        </button>
      </div>
    </div>

    <!-- Recent Uploads -->
    <div class="section">
      <h2>Recent Uploads</h2>
      <div v-if="recentUploads.length > 0" class="uploads-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Bucket</th>
              <th>File</th>
              <th>Size</th>
              <th>Type</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="upload in recentUploads" :key="upload.id">
              <td>{{ upload.user_id }}</td>
              <td><span class="badge">{{ upload.bucket_id }}</span></td>
              <td class="file-name">{{ getFileName(upload.file_path) }}</td>
              <td>{{ formatBytes(upload.file_size) }}</td>
              <td>{{ upload.file_type }}</td>
              <td>{{ formatDate(upload.uploaded_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        No uploads yet
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const bucketStats = ref<any>({})
const recentUploads = ref<any[]>([])

const totalStorageUsed = computed(() => {
  return Object.values(bucketStats.value).reduce((sum: number, bucket: any) => {
    return sum + (bucket.total_size || 0)
  }, 0)
})

const totalFiles = computed(() => {
  return Object.values(bucketStats.value).reduce((sum: number, bucket: any) => {
    return sum + (bucket.file_count || 0)
  }, 0)
})

const activeUsers = computed(() => {
  return Object.values(bucketStats.value).reduce((sum: number, bucket: any) => {
    return sum + (bucket.unique_users || 0)
  }, 0)
})

const averageFileSize = computed(() => {
  if (totalFiles.value === 0) return 0
  return Math.round(totalStorageUsed.value / totalFiles.value)
})

const storagePercentage = computed(() => {
  const maxStorage = 1024 * 1024 * 1024 * 1024 // 1TB
  return Math.round((totalStorageUsed.value / maxStorage) * 100)
})

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format date
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString()
}

/**
 * Get file name from path
 */
const getFileName = (path: string): string => {
  return path.split('/').pop() || path
}

/**
 * Get bucket percentage
 */
const getBucketPercentage = (size: number): number => {
  if (totalStorageUsed.value === 0) return 0
  return Math.round((size / totalStorageUsed.value) * 100)
}

/**
 * Refresh stats
 */
const refreshStats = async () => {
  loading.value = true
  try {
    const response = await $fetch<any>('/api/storage')
    if (response.success) {
      bucketStats.value = response.data.stats || {}
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

/**
 * Cleanup temp files
 */
const cleanupTempFiles = async () => {
  if (!confirm('Are you sure you want to delete old temporary files?')) return

  loading.value = true
  try {
    const response = await $fetch<any>('/api/storage/cleanup', {
      method: 'POST'
    })

    if (response.success) {
      successMessage.value = response.data.message
      setTimeout(() => {
        successMessage.value = ''
        refreshStats()
      }, 3000)
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Cleanup failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.storage-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.stat-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 0.3s;
}

.stat-info {
  font-size: 12px;
  color: #999;
}

.section {
  margin-bottom: 32px;
}

.section h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.bucket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.bucket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bucket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bucket-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.bucket-size {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.bucket-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  color: #666;
}

.info-row strong {
  color: #1f2937;
  font-weight: 600;
}

.bucket-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.bucket-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s;
}

.maintenance-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.maintenance-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.maintenance-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.cleanup-btn {
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cleanup-btn:hover:not(:disabled) {
  background: #d97706;
}

.cleanup-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.uploads-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #1f2937;
}

tbody tr:hover {
  background: #f9fafb;
}

.file-name {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e3f2fd;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.success-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 20px;
  background: #10b981;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 20px;
  background: #ef4444;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .bucket-grid {
    grid-template-columns: 1fr;
  }

  .maintenance-card {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .uploads-table {
    overflow-x: auto;
  }
}
</style>
