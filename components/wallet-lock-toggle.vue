<template>
  <div class="wallet-lock-toggle">
    <div class="lock-status-card">
      <div class="status-header">
        <h3>Wallet Lock Status</h3>
        <div class="status-indicator" :class="{ 'locked': wallet.is_locked, 'unlocked': !wallet.is_locked }">
          <i :class="wallet.is_locked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
          <span>{{ wallet.is_locked ? 'Locked' : 'Unlocked' }}</span>
        </div>
      </div>

      <div class="wallet-info">
        <p><strong>Currency:</strong> {{ wallet.currency_code }}</p>
        <p><strong>Balance:</strong> {{ formatBalance(wallet.balance) }}</p>
        <p><strong>Locked Balance:</strong> {{ formatBalance(wallet.locked_balance) }}</p>
      </div>

      <div v-if="wallet.is_locked" class="lock-details">
        <p><strong>Lock Reason:</strong> {{ wallet.lock_reason || 'No reason provided' }}</p>
        <p><strong>Locked At:</strong> {{ formatDate(wallet.locked_at) }}</p>
        <p v-if="wallet.unlock_scheduled_at"><strong>Scheduled Unlock:</strong> {{ formatDate(wallet.unlock_scheduled_at) }}</p>
      </div>

      <div class="action-buttons">
        <button 
          v-if="!wallet.is_locked" 
          @click="showLockModal = true"
          class="btn btn-warning"
          :disabled="loading"
        >
          <i class="fas fa-lock"></i>
          Lock Wallet
        </button>

        <button 
          v-if="wallet.is_locked" 
          @click="showUnlockModal = true"
          class="btn btn-success"
          :disabled="loading"
        >
          <i class="fas fa-lock-open"></i>
          Unlock Wallet
        </button>

        <button 
          v-if="wallet.is_locked" 
          @click="showScheduleModal = true"
          class="btn btn-info"
          :disabled="loading"
        >
          <i class="fas fa-clock"></i>
          Schedule Unlock
        </button>

        <button 
          @click="showHistory = !showHistory"
          class="btn btn-secondary"
        >
          <i class="fas fa-history"></i>
          {{ showHistory ? 'Hide' : 'Show' }} History
        </button>
      </div>
    </div>

    <!-- Lock History -->
    <div v-if="showHistory" class="lock-history">
      <h4>Lock History</h4>
      <div v-if="lockHistory.length === 0" class="no-history">
        No lock history available
      </div>
      <div v-else class="history-list">
        <div 
          v-for="entry in lockHistory" 
          :key="entry.id"
          class="history-entry"
          :class="entry.action.toLowerCase()"
        >
          <div class="action-info">
            <i :class="getActionIcon(entry.action)"></i>
            <span class="action-text">{{ entry.action }}</span>
          </div>
          <div class="entry-details">
            <p><strong>Reason:</strong> {{ entry.reason || 'No reason provided' }}</p>
            <p><strong>Date:</strong> {{ formatDate(entry.created_at) }}</p>
            <p v-if="entry.performed_by_profile">
              <strong>By:</strong> {{ entry.performed_by_profile.username || entry.performed_by_profile.email }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lock Modal -->
    <div v-if="showLockModal" class="modal-overlay" @click="showLockModal = false">
      <div class="modal-content" @click.stop>
        <h3>Lock Wallet</h3>
        <form @submit.prevent="lockWallet">
          <div class="form-group">
            <label for="lockReason">Reason for locking:</label>_
            <textarea 
              id="lockReason"
              v-model="lockForm.reason"
              class="form-control"
              rows="3"
              placeholder="Enter reason for locking this wallet..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="lockForm.scheduleUnlock"
              >
              Schedule automatic unlock
            </label>
          </div>

          <div v-if="lockForm.scheduleUnlock" class="form-group">
            <label for="unlockTime">Unlock at:</label>
            <input 
              type="datetime-local"
              id="unlockTime"
              v-model="lockForm.unlockTime"
              class="form-control"
              :min="minDateTime"
              required
            >
          </div>

          <div class="modal-actions">
            <button type="button" @click="showLockModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-warning" :disabled="loading">
              <i class="fas fa-lock"></i>
              {{ loading ? 'Locking...' : 'Lock Wallet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Unlock Modal -->
    <div v-if="showUnlockModal" class="modal-overlay" @click="showUnlockModal = false">
      <div class="modal-content" @click.stop>
        <h3>Unlock Wallet</h3>
        <form @submit.prevent="unlockWallet">
          <div class="form-group">
            <label for="unlockReason">Reason for unlocking:</label>
            <textarea 
              id="unlockReason"
              v-model="unlockForm.reason"
              class="form-control"
              rows="3"
              placeholder="Enter reason for unlocking this wallet..."
              required
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showUnlockModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-success" :disabled="loading">
              <i class="fas fa-lock-open"></i>
              {{ loading ? 'Unlocking...' : 'Unlock Wallet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Schedule Unlock Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click="showScheduleModal = false">
      <div class="modal-content" @click.stop>
        <h3>Schedule Unlock</h3>
        <form @submit.prevent="scheduleUnlock">
          <div class="form-group">
            <label for="scheduleTime">Unlock at:</label>
            <input 
              type="datetime-local"
              id="scheduleTime"
              v-model="scheduleForm.unlockTime"
              class="form-control"
              :min="minDateTime"
              required
            >
          </div>

          <div class="form-group">
            <label for="scheduleReason">Reason:</label>
            <textarea 
              id="scheduleReason"
              v-model="scheduleForm.reason"
              class="form-control"
              rows="2"
              placeholder="Reason for scheduled unlock..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showScheduleModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-info" :disabled="loading">
              <i class="fas fa-clock"></i>
              {{ loading ? 'Scheduling...' : 'Schedule Unlock' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WalletLockToggle',
  props: {
    wallet: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      showHistory: false,
      showLockModal: false,
      showUnlockModal: false,
      showScheduleModal: false,
      lockHistory: [],
      lockForm: {
        reason: '',
        scheduleUnlock: false,
        unlockTime: ''
      },
      unlockForm: {
        reason: ''
      },
      scheduleForm: {
        unlockTime: '',
        reason: ''
      }
    }
  },
  computed: {
    minDateTime() {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
      return now.toISOString().slice(0, 16);
    }
  },
  methods: {
    async lockWallet() {
      this.loading = true;
      try {
        const payload = {
          walletId: this.wallet.id,
          reason: this.lockForm.reason
        };

        if (this.lockForm.scheduleUnlock && this.lockForm.unlockTime) {
          payload.scheduledUnlock = this.lockForm.unlockTime;
        }

        const response = await fetch('/api/wallet/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$auth.token}`
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          this.$emit('wallet-updated', result.wallet);
          this.showLockModal = false;
          this.resetForms();
          this.$toast.success('Wallet locked successfully');
        } else {
          this.$toast.error(result.message || 'Failed to lock wallet');
        }
      } catch (error) {
        console.error('Error locking wallet:', error);
        this.$toast.error('An error occurred while locking the wallet');
      } finally {
        this.loading = false;
      }
    },

    async unlockWallet() {
      this.loading = true;
      try {
        const response = await fetch('/api/wallet/unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$auth.token}`
          },
          body: JSON.stringify({
            walletId: this.wallet.id,
            reason: this.unlockForm.reason
          })
        });

        const result = await response.json();

        if (result.success) {
          this.$emit('wallet-updated', result.wallet);
          this.showUnlockModal = false;
          this.resetForms();
          this.$toast.success('Wallet unlocked successfully');
        } else {
          this.$toast.error(result.message || 'Failed to unlock wallet');
        }
      } catch (error) {
        console.error('Error unlocking wallet:', error);
        this.$toast.error('An error occurred while unlocking the wallet');
      } finally {
        this.loading = false;
      }
    },

    async scheduleUnlock() {
      this.loading = true;
      try {
        const response = await fetch('/api/wallet/schedule-unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$auth.token}`
          },
          body: JSON.stringify({
            walletId: this.wallet.id,
            unlockTime: this.scheduleForm.unlockTime,
            reason: this.scheduleForm.reason || 'Scheduled unlock'
          })
        });

        const result = await response.json();

        if (result.success) {
          this.$emit('wallet-updated', result.wallet);
          this.showScheduleModal = false;
          this.resetForms();
          this.$toast.success('Unlock scheduled successfully');
        } else {
          this.$toast.error(result.message || 'Failed to schedule unlock');
        }
      } catch (error) {
        console.error('Error scheduling unlock:', error);
        this.$toast.error('An error occurred while scheduling unlock');
      } finally {
        this.loading = false;
      }
    },

    async loadLockHistory() {
      if (!this.showHistory) return;

      try {
        const response = await fetch(`/api/wallet/${this.wallet.id}/lock-status`, {
          headers: {
            'Authorization': `Bearer ${this.$auth.token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          this.lockHistory = result.history || [];
        } else {
          console.error('Failed to load lock history:', result.message);
        }
      } catch (error) {
        console.error('Error loading lock history:', error);
      }
    },

    formatBalance(balance) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(balance || 0);
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
    },

    getActionIcon(action) {
      const icons = {
        'LOCK': 'fas fa-lock text-warning',
        'UNLOCK': 'fas fa-lock-open text-success',
        'SCHEDULE_UNLOCK': 'fas fa-clock text-info'
      };
      return icons[action] || 'fas fa-question-circle';
    },

    resetForms() {
      this.lockForm = {
        reason: '',
        scheduleUnlock: false,
        unlockTime: ''
      };
      this.unlockForm = {
        reason: ''
      };
      this.scheduleForm = {
        unlockTime: '',
        reason: ''
      };
    }
  },
  watch: {
    showHistory(newVal) {
      if (newVal) {
        this.loadLockHistory();
      }
    }
  }
}
</script>

<style scoped>
.wallet-lock-toggle {
  max-width: 600px;
  margin: 0 auto;
}

.lock-status-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.status-indicator.locked {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-indicator.unlocked {
  background: #d1edff;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.wallet-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.wallet-info p {
  margin: 8px 0;
  color: #555;
}

.lock-details {
  background: #fff3cd;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #ffc107;
}

.lock-details p {
  margin: 8px 0;
  color: #856404;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.lock-history {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.lock-history h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.no-history {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-entry {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.history-entry:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-entry.lock {
  border-left: 4px solid #ffc107;
}

.history-entry.unlock {
  border-left: 4px solid #28a745;
}

.history-entry.schedule_unlock {
  border-left: 4px solid #17a2b8;
}

.action-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.action-text {
  font-weight: 600;
  text-transform: capitalize;
}

.entry-details p {
  margin: 4px 0;
  color: #555;
  font-size: 14px;
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
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
  
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
