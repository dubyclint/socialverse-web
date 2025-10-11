<template>
  <div class="admin-verified">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">✅ Verified Badge Management</h1>
        <p class="page-description">Manage user verification status and badge assignments</p>
      </div>
      <div class="header-actions">
        <button @click="showBulkActions = !showBulkActions" class="btn-secondary">
          <Icon name="settings" />
          Bulk Actions
        </button>
        <button @click="exportVerifiedUsers" class="btn-primary">
          <Icon name="download" />
          Export List
        </button>
      </div>
    </div>

    <!-- Bulk Actions Panel -->
    <div v-if="showBulkActions" class="bulk-actions-panel">
      <div class="bulk-actions-content">
        <h3>Bulk Actions</h3>
        <div class="bulk-actions-buttons">
          <button @click="bulkVerify" class="btn-success" :disabled="selectedUsers.length === 0">
            Verify Selected ({{ selectedUsers.length }})
          </button>
          <button @click="bulkUnverify" class="btn-warning" :disabled="selectedUsers.length === 0">
            Unverify Selected ({{ selectedUsers.length }})
          </button>
          <button @click="bulkReject" class="btn-danger" :disabled="selectedUsers.length === 0">
            Reject Selected ({{ selectedUsers.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>Verified Users</h3>
          <p class="stat-value">{{ verifiedCount }}</p>
          <span class="stat-change positive">+{{ newVerificationsThisMonth }} this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <h3>Pending Requests</h3>
          <p class="stat-value">{{ pendingCount }}</p>
          <span class="stat-
