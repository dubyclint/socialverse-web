<template>
  <div class="admin-ranks">
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">🏆 User Ranks Management</h1>
        <p class="page-description">Point thresholds that promote users between ranks</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openForm()">Add New Rank</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div v-if="showForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingRank ? 'Edit Rank' : 'Add New Rank' }}</h3>
          <button class="close-btn" @click="closeForm">&times;</button>
        </div>

        <form class="rank-form" @submit.prevent="saveRank">
          <div class="form-group">
            <label for="rank-name">Rank Name *</label>
            <input
              id="rank-name"
              v-model="form.rank"
              :disabled="Boolean(editingRank)"
              placeholder="e.g. Homie, Elite, Legend"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="rank-points">Points Required *</label>
            <input
              id="rank-points"
              v-model.number="form.points"
              type="number"
              min="0"
              required
              class="form-input"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeForm">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : (editingRank ? 'Update Rank' : 'Create Rank') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="ranks-container">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h3>Total Ranks</h3>
            <p class="stat-value">{{ ranks.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Users with Ranks</h3>
            <p class="stat-value">{{ totalRankedUsers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <h3>Avg Threshold</h3>
            <p class="stat-value">{{ averagePoints }}</p>
          </div>
        </div>
      </div>

      <div class="ranks-grid">
        <div v-for="rank in ranks" :key="rank.rank" class="rank-card">
          <div class="rank-header">
            <div class="rank-level">Level {{ rank.level }}</div>
          </div>

          <div class="rank-body">
            <h3 class="rank-name">{{ rank.rank }}</h3>
            <div class="rank-requirements">
              <div class="requirement">
                <span class="requirement-label">Points Required:</span>
                <span class="requirement-value">{{ formatNumber(rank.points) }}</span>
              </div>
              <div class="requirement">
                <span class="requirement-label">Current Users:</span>
                <span class="requirement-value">{{ rank.userCount }}</span>
              </div>
            </div>
          </div>

          <div class="rank-actions">
            <button class="btn-sm btn-outline" @click="openForm(rank)">Edit</button>
            <button class="btn-sm btn-danger" @click="deleteRank(rank)">Delete</button>
          </div>
        </div>
      </div>

      <div v-if="!loading && ranks.length === 0" class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>No ranks configured yet</h3>
        <button class="btn-primary" @click="openForm()">Create First Rank</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { RankConfigRow } from '~/server/api/rank/config'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})

const ranks = ref<RankConfigRow[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const showForm = ref(false)
const editingRank = ref<RankConfigRow | null>(null)
const form = ref<{ rank: string, points: number }>({ rank: '', points: 0 })

const totalRankedUsers = computed(() => ranks.value.reduce((total, rank) => total + rank.userCount, 0))

const averagePoints = computed(() => {
  if (!ranks.value.length) return 0
  return Math.round(ranks.value.reduce((total, rank) => total + rank.points, 0) / ranks.value.length)
})

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Request failed')

const loadRanks = async () => {
  loading.value = true
  try {
    ranks.value = await $fetch<RankConfigRow[]>('/api/rank/config')
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    loading.value = false
  }
}

const openForm = (rank?: RankConfigRow) => {
  editingRank.value = rank ?? null
  form.value = rank ? { rank: rank.rank, points: rank.points } : { rank: '', points: 0 }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingRank.value = null
}

const saveRank = async () => {
  if (!form.value.rank.trim()) return
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/rank/config', {
      method: 'POST',
      body: {
        action: editingRank.value ? 'update' : 'add',
        rank: form.value.rank.trim(),
        points: form.value.points
      }
    })
    closeForm()
    await loadRanks()
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    saving.value = false
  }
}

const deleteRank = async (rank: RankConfigRow) => {
  if (!confirm(`Delete rank "${rank.rank}"? Users holding it keep their points but lose the rank.`)) return
  error.value = ''
  try {
    await $fetch('/api/rank/config', {
      method: 'POST',
      body: { action: 'remove', rank: rank.rank }
    })
    await loadRanks()
  } catch (err) {
    error.value = messageOf(err)
  }
}

onMounted(loadRanks)
</script>

<style scoped>
.admin-ranks {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
}

.page-description {
  color: var(--text-muted, #6b7280);
}

.form-error {
  color: #dc2626;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.75rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.ranks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.rank-card {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rank-level {
  font-size: 0.8rem;
  color: var(--text-muted, #6b7280);
}

.rank-name {
  font-size: 1.25rem;
  font-weight: 600;
}

.requirement {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.rank-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-sm {
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
}

.btn-secondary,
.btn-outline {
  background: transparent;
  border-color: var(--border-color, #d1d5db);
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: var(--surface-color, #fff);
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: min(420px, 92vw);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.form-input {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 2.5rem;
}
</style>
