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
