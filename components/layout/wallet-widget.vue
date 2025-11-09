<template>
  <div class="wallet-widget">
    <!-- Wallet Toggle Button -->
    <button 
      @click="showWallet = !showWallet" 
      class="wallet-toggle"
      :class="{ active: showWallet }"
    >
      <Icon name="wallet" size="20" />
      <span class="wallet-balance">${{ formatNumber(totalBalance) }}</span>
      <div v-if="pendingTransactions > 0" class="pending-indicator">
        {{ pendingTransactions }}
      </div>
      <div v-if="hasNotifications" class="notification-dot"></div>
    </button>

    <!-- Wallet Dropdown -->
    <div v-if="showWallet" class="wallet-dropdown">
      <div class="wallet-header">
        <h3>My Wallet</h3>
        <div class="wallet-actions">
          <button @click="refreshBalances" class="refresh-btn" :disabled="refreshing">
            <Icon :name="refreshing ? 'loader' : 'refresh-cw'" size="16" />
          </button>
          <button @click="showWalletModal = true" class="expand-btn">
            <Icon name="external-link" size="16" />
          </button>
        </div>
      </div>

      <!-- Quick Balance Overview -->
      <div class="balance-overview">
        <div class="total-balance">
          <span class="balance-label">Total Balance</span>
          <span class="balance-amount">${{ formatNumber(totalBalance) }}</span>
        </div>
        <div class="balance-breakdown">
          <div class="balance-item">
            <span class="label">Available:</span>
            <span class="value">${{ formatNumber(availableBalance) }}</span>
          </div>
          <div class="balance-item">
            <span class="label">Locked:</span>
            <span class="value">${{ formatNumber(lockedBalance) }}</span>
          </div>
          <div class="balance-item">
            <span class="label">Gifts Received:</span>
            <span class="value positive">+${{ formatNumber(giftsReceived24h) }}</span>
          </div>
        </div>
      </div>

      <!-- Currency List -->
      <div class="currency-list">
        <div 
          v-for="wallet in topWallets" 
          :key="wallet.currency_code"
          class="currency-item"
        >
          <div class="currency-info">
            <div class="currency-icon">
              <img :src="`/crypto-icons/${wallet.currency_code.toLowerCase()}.png`" :alt="wallet.currency_code" />
            </div>
            <div class="currency-details">
              <span class="currency-name">{{ wallet.currency_name }}</span>
              <span class="currency-code">{{ wallet.currency_code }}</span>
            </div>
          </div>
          <div class="currency-balance">
            <span class="balance">${{ formatNumber(wallet.balance) }}</span>
            <div v-if="wallet.locked_balance > 0" class="locked-info">
              <Icon name="lock" size="10" />
              <span class="locked-amount">${{ formatNumber(wallet.locked_balance) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button @click="showDepositModal = true" class="action-btn deposit">
          <Icon name="plus" size="16" />
          Deposit
        </button>
        <button @click="showWithdrawModal = true" class="action-btn withdraw">
          <Icon name="minus" size="16" />
          Withdraw
        </button>
        <button @click="showGiftModal = true" class="action-btn gift">
          <Icon name="gift" size="16" />
          Send Gift
        </button>
        <button @click="navigateTo('/trade')" class="action-btn trade">
          <Icon name="repeat" size="16" />
          Trade
        </button>
      </div>

      <!-- Active Deals Summary -->
      <div v-if="hasActiveDeals" class="active-deals-summary">
        <div class="deals-header">
          <h4>Active Deals</h4>
          <span class="deals-count">{{ totalActiveDeals }}</span>
        </div>
        <div class="deals-grid">
          <div v-if="activeP2PCount > 0" class="deal-type p2p">
            <Icon name="users" size="14" />
            <span>{{ activeP2PCount }} P2P</span>
            <span class="deal-value">${{ formatNumber(p2pLockedAmount) }}</span>
          </div>
          <div v-if="activeEscrowCount > 0" class="deal-type escrow">
            <Icon name="shield" size="14" />
            <span>{{ activeEscrowCount }} Escrow</span>
            <span class="deal-value">${{ formatNumber(escrowLockedAmount) }}</span>
          </div>
          <div v-if="activeTradeCount > 0" class="deal-type trade">
            <Icon name="shopping-cart" size="14" />
            <span>{{ activeTradeCount }} Trade</span>
            <span class="deal-value">${{ formatNumber(tradeLockedAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <div class="activity-header">
          <h4>Recent Activity</h4>
          <button @click="showWalletModal = true; activeTab = 'transactions'" class="view-all-btn">
            View All
          </button>
        </div>
        <div class="activity-list">
          <div 
            v-for="activity in recentActivities.slice(0, 3)" 
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <Icon :name="getActivityIcon(activity.type)" size="16" />
            </div>
            <div class="activity-details">
              <span class="activity-type">{{ formatActivityType(activity.type) }}</span>
              <span class="activity-description">{{ activity.description }}</span>
              <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
            </div>
            <div class="activity-amount" :class="{ positive: activity.amount > 0, negative: activity.amount < 0 }">
              {{ activity.amount > 0 ? '+' : '' }}${{ formatNumber(Math.abs(activity.amount)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Gift Notifications -->
      <div v-if="recentGifts.length > 0" class="gift-notifications">
        <div class="gifts-header">
          <h4>Recent Gifts</h4>
          <Icon name="gift" size="16" />
        </div>
        <div class="gifts-list">
          <div 
            v-for="gift in recentGifts.slice(0, 2)" 
            :key="gift.id"
            class="gift-item"
          >
            <img :src="gift.sender_avatar || '/default-avatar.png'" :alt="gift.sender_name" class="gift-sender-avatar" />
            <div class="gift-details">
              <span class="gift-message">
                {{ gift.is_anonymous ? 'Anonymous' : gift.sender_name }} sent you a gift
              </span>
              <span class="gift-type">{{ gift.gift_name }}</span>
            </div>
            <div class="gift-value">+${{ formatNumber(gift.gift_value) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Wallet Modal -->
    <div v-if="showWalletModal" class="modal-overlay" @click="closeWalletModal">
      <div class="modal-content wallet-modal" @click.stop>
        <div class="modal-header">
          <h2>Wallet Management</h2>
          <button @click="closeWalletModal" class="close-btn">&times;</button>
        </div>
        
        <div class="wallet-tabs">
          <button 
            @click="activeTab = 'overview'"
            :class="['tab-btn', { active: activeTab === 'overview' }]"
          >
            <Icon name="pie-chart" size="16" />
            Overview
          </button>
          <button 
            @click="activeTab = 'transactions'"
            :class="['tab-btn', { active: activeTab === 'transactions' }]"
          >
            <Icon name="list" size="16" />
            Transactions
          </button>
          <button 
            @click="activeTab = 'gifts'"
            :class="['tab-btn', { active: activeTab === 'gifts' }]"
          >
            <Icon name="gift" size="16" />
            Gifts & Tips
          </button>
          <button 
            @click="activeTab = 'p2p'"
            :class="['tab-btn', { active: activeTab === 'p2p' }]"
          >
            <Icon name="users" size="16" />
            P2P Trading
          </button>
          <button 
            @click="activeTab = 'escrow'"
            :class="['tab-btn', { active: activeTab === 'escrow' }]"
          >
            <Icon name="shield" size="16" />
            Escrow
          </button>
          <button 
            @click="activeTab = 'marketplace'"
            :class="['tab-btn', { active: activeTab === 'marketplace' }]"
          >
            <Icon name="shopping-cart" size="16" />
            Marketplace
          </button>
        </div>

        <div class="wallet-content">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="overview-tab">
            <!-- Portfolio Summary -->
            <div class="portfolio-summary">
              <div class="portfolio-stats">
                <div class="stat-card">
                  <h4>Total Portfolio</h4>
                  <span class="stat-value">${{ formatNumber(totalBalance) }}</span>
                  <span class="stat-change" :class="{ positive: portfolioChange >= 0, negative: portfolioChange < 0 }">
                    {{ portfolioChange >= 0 ? '+' : '' }}{{ portfolioChange.toFixed(2) }}% (24h)
                  </span>
                </div>
                <div class="stat-card">
                  <h4>Available Balance</h4>
                  <span class="stat-value">${{ formatNumber(availableBalance) }}</span>
                  <span class="stat-label">Ready to use</span>
                </div>
                <div class="stat-card">
                  <h4>Locked in Deals</h4>
                  <span class="stat-value">${{ formatNumber(lockedBalance) }}</span>
                  <span class="stat-label">{{ totalActiveDeals }} active deals</span>
                </div>
                <div class="stat-card">
                  <h4>Gifts Received</h4>
                  <span class="stat-value">${{ formatNumber(totalGiftsReceived) }}</span>
                  <span class="stat-label">All time</span>
                </div>
              </div>
            </div>

            <!-- All Wallets -->
            <div class="all-wallets">
              <h3>Currency Wallets</h3>
              <div class="wallets-grid">
                <div 
                  v-for="wallet in wallets" 
                  :key="wallet.currency_code"
                  class="wallet-card"
                >
                  <div class="wallet-header">
                    <div class="currency-info">
                      <img :src="`/crypto-icons/${wallet.currency_code.toLowerCase()}.png`" :alt="wallet.currency_code" />
                      <div>
                        <h4>{{ wallet.currency_name }}</h4>
                        <span class="currency-code">{{ wallet.currency_code }}</span>
                      </div>
                    </div>
                    <div class="wallet-balance">
                      <span class="balance">${{ formatNumber(wallet.balance) }}</span>
                      <div v-if="wallet.locked_balance > 0" class="locked-info">
                        <Icon name="lock" size="12" />
                        <span class="locked-amount">Locked: ${{ formatNumber(wallet.locked_balance) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="wallet-actions">
                    <button @click="depositCurrency(wallet.currency_code)" class="btn-sm">
                      <Icon name="plus" size="12" />
                      Deposit
                    </button>
                    <button @click="withdrawCurrency(wallet.currency_code)" class="btn-sm">
                      <Icon name="minus" size="12" />
                      Withdraw
                    </button>
                    <button @click="transferCurrency(wallet.currency_code)" class="btn-sm">
                      <Icon name="send" size="12" />
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transactions Tab -->
          <div v-if="activeTab === 'transactions'" class="transactions-tab">
            <div class="transactions-filters">
              <select v-model="transactionFilter" class="filter-select">
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
                <option value="transfer">Transfers</option>
                <option value="gift_sent">Gifts Sent</option>
                <option value="gift_received">Gifts Received</option>
                <option value="pew_gift">Pew Tips</option>
                <option value="p2p">P2P Trades</option>
                <option value="escrow">Escrow</option>
                <option value="marketplace">Marketplace</option>
              </select>
              <select v-model="currencyFilter" class="filter-select">
                <option value="all">All Currencies</option>
                <option v-for="currency in currencies" :key="currency" :value="currency">
                  {{ currency }}
                </option>
              </select>
              <input 
                v-model="dateFilter" 
                type="date" 
                class="filter-input"
                placeholder="Filter by date"
              />
            </div>

            <div class="transactions-list">
              <div 
                v-for="transaction in filteredTransactions" 
                :key="transaction.id"
                class="transaction-row"
                @click="viewTransactionDetails(transaction)"
              >
                <div class="transaction-info">
                  <div class="transaction-icon">
                    <Icon :name="getTransactionIcon(transaction.type)" size="20" />
                  </div>
                  <div class="transaction-details">
                    <h4>{{ formatTransactionType(transaction.type) }}</h4>
                    <p>{{ transaction.description }}</p>
                    <div class="transaction-meta">
                      <span class="transaction-time">{{ formatDateTime(transaction.created_at) }}</span>
                      <span v-if="transaction.reference_id" class="transaction-ref">
                        Ref: {{ transaction.reference_id }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="transaction-amount" :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }">
                  <span class="amount">{{ transaction.amount > 0 ? '+' : '' }}${{ formatNumber(Math.abs(transaction.amount)) }}</span>
                  <span class="currency">{{ transaction.currency }}</span>
                  <span class="status" :class="transaction.status">{{ formatStatus(transaction.status) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Gifts & Tips Tab -->
          <div v-if="activeTab === 'gifts'" class="gifts-tab">
            <div class="gifts-header">
              <h3>Gifts & Tips Management</h3>
              <button @click="showGiftModal = true" class="btn-primary">
                <Icon name="gift" size="16" />
                Send Gift
              </button>
            </div>

            <!-- Gift Stats -->
            <div class="gift-stats">
              <div class="stat-row">
                <div class="stat-item">
                  <span class="stat-number">${{ formatNumber(totalGiftsSent) }}</span>
                  <span class="stat-label">Gifts Sent</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">${{ formatNumber(totalGiftsReceived) }}</span>
                  <span class="stat-label">Gifts Received</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">${{ formatNumber(totalPewTips) }}</span>
                  <span class="stat-label">Pew Tips</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ giftRanking }}</span>
                  <span class="stat-label">Gift Ranking</span>
                </div>
              </div>
            </div>

            <!-- Gift Tabs -->
            <div class="gift-subtabs">
              <button 
                @click="giftSubTab = 'received'"
                :class="['subtab-btn', { active: giftSubTab === 'received' }]"
              >
                Received ({{ giftsReceived.length }})
              </button>
              <button 
                @click="giftSubTab = 'sent'"
                :class="['subtab-btn', { active: giftSubTab === 'sent' }]"
              >
                Sent ({{ giftsSent.length }})
              </button>
              <button 
                @click="giftSubTab = 'pew-tips'"
                :class="['subtab-btn', { active: giftSubTab === 'pew-tips' }]"
              >
                Pew Tips ({{ pewTips.length }})
              </button>
            </div>

            <!-- Gift Lists -->
            <div class="gift-content">
              <div v-if="giftSubTab === 'received'" class="gifts-received">
                <div 
                  v-for="gift in giftsReceived" 
                  :key="gift.id"
                  class="gift-item-detailed"
                >
                  <div class="gift-sender">
                    <img :src="gift.sender_avatar || '/default-avatar.png'" :alt="gift.sender_name" />
                    <div class="sender-info">
                      <span class="sender-name">{{ gift.is_anonymous ? 'Anonymous' : gift.sender_name }}</span>
                      <span class="gift-time">{{ formatDateTime(gift.created_at) }}</span>
                    </div>
                  </div>
                  <div class="gift-details">
                    <div class="gift-type">{{ gift.gift_name }}</div>
                    <div v-if="gift.message" class="gift-message">{{ gift.message }}</div>
                    <div v-if="gift.post_id" class="gift-context">
                      <Icon name="message-square" size="12" />
                      <span>On your post</span>
                    </div>
                  </div>
                  <div class="gift-value positive">+${{ formatNumber(gift.gift_value) }}</div>
                </div>
              </div>

              <div v-if="giftSubTab === 'sent'" class="gifts-sent">
                <div 
                  v-for="gift in giftsSent" 
                  :key="gift.id"
                  class="gift-item-detailed"
                >
                  <div class="gift-recipient">
                    <img :src="gift.recipient_avatar || '/default-avatar.png'" :alt="gift.recipient_name" />
                    <div class="recipient-info">
                      <span class="recipient-name">{{ gift.recipient_name }}</span>
                      <span class="gift-time">{{ formatDateTime(gift.created_at) }}</span>
                    </div>
                  </div>
                  <div class="gift-details">
                    <div class="gift-type">{{ gift.gift_name }}</div>
                    <div v-if="gift.message" class="gift-message">{{ gift.message }}</div>
                  </div>
                  <div class="gift-value negative">-${{ formatNumber(gift.gift_value) }}</div>
                </div>
              </div>

              <div v-if="giftSubTab === 'pew-tips'" class="pew-tips">
                <div 
                  v-for="tip in pewTips" 
                  :key="tip.id"
                  class="tip-item"
                >
                  <div class="tip-info">
                    <div class="tip-type">
                      <Icon name="zap" size="16" />
                      <span>Pew Tip</span>
                    </div>
                    <div class="tip-split">
                      <span v-if="tip.split.toCommenter > 0">
                        To Commenter: ${{ formatNumber(tip.split.toCommenter) }}
                      </span>
                      <span v-if="tip.split.toPostOwner > 0">
                        To Post Owner: ${{ formatNumber(tip.split.toPostOwner) }}
                      </span>
                    </div>
                    <span class="tip-time">{{ formatDateTime(tip.timestamp) }}</span>
                  </div>
                  <div class="tip-amount">
                    <span class="total-amount">${{ formatNumber(tip.amount) }}</span>
                    <span class="tip-context">
                      {{ tip.commentId ? 'Comment tip' : 'Post tip' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- P2P Tab -->
          <div v-if="activeTab === 'p2p'" class="p2p-tab">
            <div class="p2p-header">
              <h3>P2P Trading</h3>
              <div class="p2p-actions">
                <button @click="navigateTo('/p2p')" class="btn-primary">Go to P2P</button>
                <button @click="createP2PProfile" class="btn-secondary" v-if="!p2pProfile">
                  Create P2P Profile
                </button>
              </div>
            </div>
            
            <div v-if="p2pProfile" class="p2p-status">
              <div class="status-card">
                <h4>P2P Profile Status</h4>
                <div class="status-info">
                  <span :class="['status-badge', p2pProfile?.verification_level || 'unverified']">
                    {{ formatVerificationLevel(p2pProfile?.verification_level) }}
                  </span>
                  <span v-if="p2pProfile?.is_active" class="active-indicator">
                    <Icon name="check-circle" size="14" />
                    Active
                  </span>
                </div>
                <div class="profile-stats">
                  <div class="stat">
                    <span class="stat-number">{{ p2pStats.totalTrades }}</span>
                    <span class="stat-label">Total Trades</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ p2pStats.successRate }}%</span>
                    <span class="stat-label">Success Rate</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">${{ formatNumber(p2pStats.volume) }}</span>
                    <span class="stat-label">Volume</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">${{ formatNumber(p2pLockedAmount) }}</span>
                    <span class="stat-label">Locked</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="active-p2p-trades">
              <h4>Active P2P Trades</h4>
              <div v-if="activeP2PTrades.length === 0" class="empty-state">
                <Icon name="users" size="48" />
                <p>No active P2P trades</p>
                <button @click="navigateTo('/p2p')" class="btn-primary">Start Trading</button>
              </div>
              <div v-else class="trades-list">
                <div 
                  v-for="trade in activeP2PTrades" 
                  :key="trade.id"
                  class="trade-item"
                >
                  <div class="trade-info">
                    <div class="trade-header">
                      <span class="trade-type">{{ trade.type }}</span>
                      <span :class="['trade-status', trade.status]">{{ formatTradeStatus(trade.status) }}</span>
                    </div>
                    <div class="trade-details">
                      <span class="trade-amount">${{ formatNumber(trade.amount) }} {{ trade.currency }}</span>
                      <span class="trade-counterparty">
                        {{ trade.buyer_id === user?.id ? 'Buying from' : 'Selling to' }} 
                        {{ trade.counterparty_name }}
                      </span>
                    </div>
                    <div class="trade-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: getTradeProgress(trade) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ getTradeProgressText(trade) }}</span>
                    </div>
                  </div>
                  <div class="trade-actions">
                    <button @click="viewP2PTrade(trade.id)" class="btn-sm">View</button>
                    <button 
                      v-if="canCompleteP2P(trade)"
                      @click="completeP2PTrade(trade.id)" 
                      class="btn-sm btn-success"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Escrow Tab -->
          <div v-if="activeTab === 'escrow'" class="escrow-tab">
            <div class="escrow-header">
              <h3>Escrow Services</h3>
              <div class="escrow-actions">
                <button @click="navigateTo('/escrow')" class="btn-primary">Go to Escrow</button>
                <button @click="createEscrowDeal" class="btn-secondary">Create Deal</button>
              </div>
            </div>
            
            <div class="escrow-stats">
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-number">{{ escrowStats.totalDeals }}</span>
                  <span class="stat-label">Total Deals</span>
                </div>
                <div class="stat">
                  <span class="stat-number">${{ formatNumber(escrowStats.totalValue) }}</span>
                  <span class="stat-label">Total Value</span>
                </div>
                <div class="stat">
                  <span class="stat-number">${{ formatNumber(escrowLockedAmount) }}</span>
                  <span class="stat-label">Currently Locked</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ escrowStats.successRate }}%</span>
                  <span class="stat-label">Success Rate</span>
                </div>
              </div>
            </div>

            <div class="active-escrow-deals">
              <h4>Active Escrow Deals</h4>
              <div v-if="activeEscrowDeals.length === 0" class="empty-state">
                <Icon name="shield" size="48" />
                <p>No active escrow deals</p>
                <button @click="navigateTo('/escrow')" class="btn-primary">Create Deal</button>
              </div>
              <div v-else class="deals-list">
                <div 
                  v-for="deal in activeEscrowDeals" 
                  :key="deal.id"
                  class="deal-item"
                >
                  <div class="deal-info">
                    <div class="deal-header">
                      <h5>{{ deal.description || 'Escrow Deal' }}</h5>
                      <span :class="['deal-status', deal.status]">{{ formatEscrowStatus(deal.status) }}</span>
                    </div>
                    <div class="deal-details">
                      <span class="deal-amount">${{ formatNumber(deal.amount) }} {{ deal.currency }}</span>
                      <span class="deal-parties">
                        {{ deal.buyer_id === user?.id ? 'Buying from' : 'Selling to' }} 
                        {{ deal.counterparty_name }}
                      </span>
                      <div class="deal-timeline">
                        <Icon name="clock" size="12" />
                        <span>{{ getEscrowTimeRemaining(deal) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="deal-actions">
                    <button @click="viewEscrowDeal(deal.id)" class="btn-sm">View</button>
                    <button 
                      v-if="canReleaseEscrow(deal)"
                      @click="releaseEscrow(deal.id)" 
                      class="btn-sm btn-success"
                    >
                      Release
                    </button>
                    <button 
                      v-if="canDisputeEscrow(deal)"
                      @click="disputeEscrow(deal.id)" 
                      class="btn-sm btn-warning"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

                    <!-- Marketplace Tab -->
          <div v-if="activeTab === 'marketplace'" class="marketplace-tab">
            <div class="marketplace-header">
              <h3>Marketplace Trading</h3>
              <div class="marketplace-actions">
                <button @click="navigateTo('/trade')" class="btn-primary">Go to Marketplace</button>
                <button @click="createListing" class="btn-secondary">Create Listing</button>
              </div>
            </div>
            
            <div class="marketplace-stats">
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-number">{{ marketplaceStats.totalSales }}</span>
                  <span class="stat-label">Total Sales</span>
                </div>
                <div class="stat">
                  <span class="stat-number">${{ formatNumber(marketplaceStats.totalRevenue) }}</span>
                  <span class="stat-label">Revenue</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ marketplaceStats.activeListings }}</span>
                  <span class="stat-label">Active Listings</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ marketplaceStats.rating }}/5</span>
                  <span class="stat-label">Seller Rating</span>
                </div>
              </div>
            </div>

            <div class="marketplace-sections">
              <!-- Active Purchases -->
              <div class="marketplace-section">
                <h4>Active Purchases</h4>
                <div v-if="activePurchases.length === 0" class="empty-state-small">
                  <p>No active purchases</p>
                </div>
                <div v-else class="purchases-list">
                  <div 
                    v-for="purchase in activePurchases" 
                    :key="purchase.id"
                    class="purchase-item"
                  >
                    <img :src="purchase.item_image" :alt="purchase.item_name" class="item-image" />
                    <div class="purchase-info">
                      <h5>{{ purchase.item_name }}</h5>
                      <span class="purchase-seller">From {{ purchase.seller_name }}</span>
                      <span :class="['purchase-status', purchase.status]">{{ formatPurchaseStatus(purchase.status) }}</span>
                    </div>
                    <div class="purchase-amount">
                      <span class="amount">${{ formatNumber(purchase.amount) }}</span>
                      <button @click="viewPurchase(purchase.id)" class="btn-sm">View</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active Sales -->
              <div class="marketplace-section">
                <h4>Active Sales</h4>
                <div v-if="activeSales.length === 0" class="empty-state-small">
                  <p>No active sales</p>
                </div>
                <div v-else class="sales-list">
                  <div 
                    v-for="sale in activeSales" 
                    :key="sale.id"
                    class="sale-item"
                  >
                    <img :src="sale.item_image" :alt="sale.item_name" class="item-image" />
                    <div class="sale-info">
                      <h5>{{ sale.item_name }}</h5>
                      <span class="sale-buyer">To {{ sale.buyer_name }}</span>
                      <span :class="['sale-status', sale.status]">{{ formatSaleStatus(sale.status) }}</span>
                    </div>
                    <div class="sale-amount">
                      <span class="amount">+${{ formatNumber(sale.amount) }}</span>
                      <button @click="viewSale(sale.id)" class="btn-sm">View</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Gift Modal -->
    <div v-if="showGiftModal" class="modal-overlay" @click="closeGiftModal">
      <div class="modal-content gift-modal" @click.stop>
        <div class="modal-header">
          <h3>Send Gift</h3>
          <button @click="closeGiftModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="sendGift" class="gift-form">
          <div class="form-section">
            <h4>Recipient</h4>
            <div class="form-group">
              <label for="recipient">Search User</label>
              <input 
                id="recipient"
                v-model="giftForm.recipientSearch" 
                type="text"
                placeholder="Enter username or email"
                class="form-input"
                @input="searchUsers"
              />
              <div v-if="userSearchResults.length > 0" class="search-results">
                <div 
                  v-for="user in userSearchResults" 
                  :key="user.id"
                  @click="selectRecipient(user)"
                  class="search-result-item"
                >
                  <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-username">@{{ user.username }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="giftForm.recipient" class="selected-recipient">
              <img :src="giftForm.recipient.avatar || '/default-avatar.png'" :alt="giftForm.recipient.name" />
              <div class="recipient-info">
                <span class="recipient-name">{{ giftForm.recipient.name }}</span>
                <span class="recipient-username">@{{ giftForm.recipient.username }}</span>
              </div>
              <button @click="clearRecipient" class="clear-btn">
                <Icon name="x" size="14" />
              </button>
            </div>
          </div>

          <div class="form-section">
            <h4>Gift Type</h4>
            <div class="gift-types">
              <div 
                v-for="giftType in availableGifts" 
                :key="giftType.id"
                @click="selectGiftType(giftType)"
                :class="['gift-type-card', { selected: giftForm.giftType?.id === giftType.id }]"
              >
                <div class="gift-icon">{{ giftType.emoji }}</div>
                <div class="gift-info">
                  <span class="gift-name">{{ giftType.name }}</span>
                  <span class="gift-value">${{ formatNumber(giftType.value) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Message (Optional)</h4>
            <div class="form-group">
              <textarea 
                v-model="giftForm.message" 
                placeholder="Add a personal message..."
                rows="3"
                maxlength="200"
                class="form-textarea"
              ></textarea>
              <small class="char-count">{{ giftForm.message?.length || 0 }}/200</small>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label class="checkbox-option">
                <input type="checkbox" v-model="giftForm.isAnonymous" />
                <span>Send anonymously</span>
              </label>
            </div>
          </div>

          <div class="gift-summary">
            <div class="summary-row">
              <span>Gift Value:</span>
              <span>${{ formatNumber(giftForm.giftType?.value || 0) }}</span>
            </div>
            <div class="summary-row">
              <span>Platform Fee:</span>
              <span>${{ formatNumber(giftFee) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>${{ formatNumber(giftTotal) }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeGiftModal" class="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="!canSendGift || sendingGift"
            >
              {{ sendingGift ? 'Sending...' : 'Send Gift' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Deposit Modal -->
    <div v-if="showDepositModal" class="modal-overlay" @click="closeDepositModal">
      <div class="modal-content deposit-modal" @click.stop>
        <div class="modal-header">
          <h3>Deposit Funds</h3>
          <button @click="closeDepositModal" class="close-btn">&times;</button>
        </div>
        
        <div class="deposit-content">
          <div class="currency-selection">
            <h4>Select Currency</h4>
            <div class="currency-grid">
              <div 
                v-for="currency in availableCurrencies" 
                :key="currency.code"
                @click="selectedDepositCurrency = currency"
                :class="['currency-option', { selected: selectedDepositCurrency?.code === currency.code }]"
              >
                <img :src="`/crypto-icons/${currency.code.toLowerCase()}.png`" :alt="currency.code" />
                <div class="currency-info">
                  <span class="currency-name">{{ currency.name }}</span>
                  <span class="currency-code">{{ currency.code }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedDepositCurrency" class="deposit-details">
            <div class="deposit-address">
              <h4>Deposit Address</h4>
              <div class="address-container">
                <input 
                  :value="getDepositAddress(selectedDepositCurrency.code)" 
                  readonly 
                  class="address-input"
                />
                <button @click="copyAddress" class="copy-btn">
                  <Icon name="copy" size="16" />
                </button>
              </div>
              <div class="qr-code">
                <!-- QR code would be generated here -->
                <div class="qr-placeholder">
                  <Icon name="qr-code" size="48" />
                  <p>QR Code</p>
                </div>
              </div>
            </div>

            <div class="deposit-instructions">
              <h4>Important Instructions</h4>
              <ul>
                <li>Only send {{ selectedDepositCurrency.code }} to this address</li>
                <li>Minimum deposit: ${{ selectedDepositCurrency.minDeposit }}</li>
                <li>Deposits require {{ selectedDepositCurrency.confirmations }} confirmations</li>
                <li>Processing time: {{ selectedDepositCurrency.processingTime }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Withdraw Modal -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="closeWithdrawModal">
      <div class="modal-content withdraw-modal" @click.stop>
        <div class="modal-header">
          <h3>Withdraw Funds</h3>
          <button @click="closeWithdrawModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="processWithdraw" class="withdraw-form">
          <div class="form-section">
            <h4>Currency & Amount</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="withdrawCurrency">Currency</label>
                <select id="withdrawCurrency" v-model="withdrawForm.currency" class="form-select">
                  <option value="">Select Currency</option>
                  <option 
                    v-for="wallet in wallets.filter(w => w.balance > 0)" 
                    :key="wallet.currency_code"
                    :value="wallet.currency_code"
                  >
                    {{ wallet.currency_name }} ({{ wallet.currency_code }}) - ${{ formatNumber(wallet.balance) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="withdrawAmount">Amount</label>
                <div class="amount-input">
                  <span class="currency-symbol">$</span>
                  <input 
                    id="withdrawAmount"
                    v-model.number="withdrawForm.amount" 
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                  />
                  <button 
                    type="button"
                    @click="setMaxWithdraw"
                    class="max-btn"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Withdrawal Address</h4>
            <div class="form-group">
              <label for="withdrawAddress">Address</label>
              <input 
                id="withdrawAddress"
                v-model="withdrawForm.address" 
                type="text"
                placeholder="Enter withdrawal address"
                class="form-input"
              />
            </div>
          </div>

          <div class="withdraw-summary">
            <div class="summary-row">
              <span>Amount:</span>
              <span>${{ formatNumber(withdrawForm.amount || 0) }}</span>
            </div>
            <div class="summary-row">
              <span>Network Fee:</span>
              <span>${{ formatNumber(withdrawFee) }}</span>
            </div>
            <div class="summary-row total">
              <span>You'll Receive:</span>
              <span>${{ formatNumber(withdrawTotal) }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeWithdrawModal" class="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="!canWithdraw || processingWithdraw"
            >
              {{ processingWithdraw ? 'Processing...' : 'Withdraw' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div v-if="showTransferModal" class="modal-overlay" @click="closeTransferModal">
      <div class="modal-content transfer-modal" @click.stop>
        <div class="modal-header">
          <h3>Transfer Funds</h3>
          <button @click="closeTransferModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="processTransfer" class="transfer-form">
          <div class="form-section">
            <h4>Recipient</h4>
            <div class="form-group">
              <label for="transferRecipient">Search User</label>
              <input 
                id="transferRecipient"
                v-model="transferForm.recipientSearch" 
                type="text"
                placeholder="Enter username or email"
                class="form-input"
                @input="searchTransferUsers"
              />
              <div v-if="transferUserResults.length > 0" class="search-results">
                <div 
                  v-for="user in transferUserResults" 
                  :key="user.id"
                  @click="selectTransferRecipient(user)"
                  class="search-result-item"
                >
                  <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-username">@{{ user.username }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Transfer Details</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="transferCurrency">Currency</label>
                <select id="transferCurrency" v-model="transferForm.currency" class="form-select">
                  <option value="">Select Currency</option>
                  <option 
                    v-for="wallet in wallets.filter(w => w.balance > 0)" 
                    :key="wallet.currency_code"
                    :value="wallet.currency_code"
                  >
                    {{ wallet.currency_name }} - ${{ formatNumber(wallet.balance) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="transferAmount">Amount</label>
                <div class="amount-input">
                  <span class="currency-symbol">$</span>
                  <input 
                    id="transferAmount"
                    v-model.number="transferForm.amount" 
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="transferNote">Note (Optional)</label>
              <input 
                id="transferNote"
                v-model="transferForm.note" 
                type="text"
                placeholder="Add a note for this transfer"
                class="form-input"
                maxlength="100"
              />
            </div>
          </div>

          <div class="transfer-summary">
            <div class="summary-row">
              <span>Amount:</span>
              <span>${{ formatNumber(transferForm.amount || 0) }}</span>
            </div>
            <div class="summary-row">
              <span>Transfer Fee:</span>
              <span>${{ formatNumber(transferFee) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>${{ formatNumber(transferTotal) }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeTransferModal" class="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="!canTransfer || processingTransfer"
            >
              {{ processingTransfer ? 'Processing...' : 'Transfer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Page meta and composables
const supabase = useSupabase()
const user = ref(null) 
  
// Reactive data
const showWallet = ref(false)
const showWalletModal = ref(false)
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showGiftModal = ref(false)
const refreshing = ref(false)
const activeTab = ref('overview')
const giftSubTab = ref('received')

// Wallet data
const wallets = ref([])
const recentActivities = ref([])
const recentGifts = ref([])
const p2pProfile = ref(null)
const activeP2PTrades = ref([])
const activeEscrowDeals = ref([])
const activePurchases = ref([])
const activeSales = ref([])
const giftsReceived = ref([])
const giftsSent = ref([])
const pewTips = ref([])

// Filters and search
const transactionFilter = ref('all')
const currencyFilter = ref('all')
const dateFilter = ref('')
const userSearchResults = ref([])
const transferUserResults = ref([])

// Stats
const balanceChange = ref(0)
const portfolioChange = ref(0)
const pendingTransactions = ref(0)
const giftsReceived24h = ref(0)
const totalGiftsSent = ref(0)
const totalGiftsReceived = ref(0)
const totalPewTips = ref(0)
const giftRanking = ref(0)

const p2pStats = ref({
  totalTrades: 0,
  successRate: 0,
  volume: 0
})

const escrowStats = ref({
  totalDeals: 0,
  totalValue: 0,
  lockedAmount: 0,
  successRate: 0
})

const marketplaceStats = ref({
  totalSales: 0,
  totalRevenue: 0,
  activeListings: 0,
  rating: 0
})

// Form data
const giftForm = ref({
  recipient: null,
  recipientSearch: '',
  giftType: null,
  message: '',
  isAnonymous: false
})

const withdrawForm = ref({
  currency: '',
  amount: 0,
  address: ''
})

const transferForm = ref({
  recipient: null,
  recipientSearch: '',
  currency: '',
  amount: 0,
  note: ''
})

// Loading states
const sendingGift = ref(false)
const processingWithdraw = ref(false)
const processingTransfer = ref(false)

// Available options
const availableGifts = [
  { id: 1, name: 'Coffee', emoji: '☕', value: 5 },
  { id: 2, name: 'Pizza', emoji: '🍕', value: 15 },
  { id: 3, name: 'Beer', emoji: '🍺', value: 8 },
  { id: 4, name: 'Flower', emoji: '🌹', value: 12 },
  { id: 5, name: 'Trophy', emoji: '🏆', value: 25 },
  { id: 6, name: 'Diamond', emoji: '💎', value: 100 }
]

const availableCurrencies = [
  { code: 'USDT', name: 'Tether', minDeposit: 10, confirmations: 3, processingTime: '5-10 minutes' },
  { code: 'USDC', name: 'USD Coin', minDeposit: 10, confirmations: 3, processingTime: '5-10 minutes' },
  { code: 'BTC', name: 'Bitcoin', minDeposit: 50, confirmations: 6, processingTime: '30-60 minutes' },
  { code: 'ETH', name: 'Ethereum', minDeposit: 20, confirmations: 12, processingTime: '10-20 minutes' }
]

const selectedDepositCurrency = ref(null)

// Computed properties
const totalBalance = computed(() => 
  wallets.value.reduce((sum, wallet) => sum + wallet.balance, 0)
)

const availableBalance = computed(() => 
  wallets.value.reduce((sum, wallet) => sum + (wallet.balance - wallet.locked_balance), 0)
)

const lockedBalance = computed(() => 
  wallets.value.reduce((sum, wallet) => sum + wallet.locked_balance, 0)
)

const topWallets = computed(() => 
  wallets.value
    .filter(wallet => wallet.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 4)
)

const currencies = computed(() => 
  [...new Set(wallets.value.map(w => w.currency_code))]
)

const filteredTransactions = computed(() => {
  let filtered = recentActivities.value

  if (transactionFilter.value !== 'all') {
    filtered = filtered.filter(t => t.type === transactionFilter.value)
  }

  if (currencyFilter.value !== 'all') {
    filtered = filtered.filter(t => t.currency === currencyFilter.value)
  }

  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value)
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.created_at)
      return transactionDate.toDateString() === filterDate.toDateString()
    })
  }

  return filtered
})

// Active deals computed
const hasActiveDeals = computed(() => 
  activeP2PCount.value > 0 || activeEscrowCount.value > 0 || activeTradeCount.value > 0
)

const totalActiveDeals = computed(() => 
  activeP2PCount.value + activeEscrowCount.value + activeTradeCount.value
)

const activeP2PCount = computed(() => activeP2PTrades.value.length)
const activeEscrowCount = computed(() => activeEscrowDeals.value.length)
const activeTradeCount = computed(() => activePurchases.value.length + activeSales.value.length)

const p2pLockedAmount = computed(() => 
  activeP2PTrades.value.reduce((sum, trade) => sum + trade.amount, 0)
)

const escrowLockedAmount = computed(() => 
  activeEscrowDeals.value
    .filter(deal => deal.status === 'funded')
    .reduce((sum, deal) => sum + deal.amount, 0)
)

const tradeLockedAmount = computed(() => 
  activePurchases.value.reduce((sum, purchase) => sum + purchase.amount, 0)
)

const hasNotifications = computed(() => 
  recentGifts.value.some(gift => !gift.is_read) ||
  activeP2PTrades.value.some(trade => trade.requires_action) ||
  activeEscrowDeals.value.some(deal => deal.requires_action)
)

// Gift form computed
const giftFee = computed(() => {
  const baseValue = giftForm.value.giftType?.value || 0
  return baseValue * 0.05 // 5% platform fee
})

const giftTotal = computed(() => {
  const baseValue = giftForm.value.giftType?.value || 0
  return baseValue + giftFee.value
})

const canSendGift = computed(() => 
  giftForm.value.recipient && 
  giftForm.value.giftType && 
  availableBalance.value >= giftTotal.value
)

// Withdraw form computed
const withdrawFee = computed(() => {
  const amount = withdrawForm.value.amount || 0
  return Math.max(amount * 0.01, 1) // 1% fee, minimum $1
})

const withdrawTotal = computed(() => {
  const amount = withdrawForm.value.amount || 0
  return Math.max(amount - withdrawFee.value, 0)
})

const canWithdraw = computed(() => {
  const selectedWallet = wallets.value.find(w => w.currency_code === withdrawForm.value.currency)
  return withdrawForm.value.currency && 
         withdrawForm.value.amount > 0 && 
         withdrawForm.value.address && 
         selectedWallet && 
         selectedWallet.balance >= withdrawForm.value.amount
})

// Transfer form computed
const transferFee = computed(() => {
  const amount = transferForm.value.amount || 0
  return amount * 0.005 // 0.5% transfer fee
})

const transferTotal = computed(() => {
  const amount = transferForm.value.amount || 0
  return amount + transferFee.value
})

const canTransfer = computed(() => {
  const selectedWallet = wallets.value.find(w => w.currency_code === transferForm.value.currency)
  return transferForm.value.recipient && 
         transferForm.value.currency && 
         transferForm.value.amount > 0 && 
         selectedWallet && 
         selectedWallet.balance >= transferTotal.value
})

// Methods
const loadWalletData = async () => {
  if (!user.value) return

  try {
    // Load wallets
    const { data: walletsData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.value.id)

    wallets.value = walletsData || []

    // Load recent activities (all transaction types)
    const { data: activitiesData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(20)

    recentActivities.value = activitiesData || []

    // Load recent gifts
    const { data: giftsData } = await supabase
      .from('gifts')
      .select(`
        *,
        sender:sender_id(name, username, avatar_url),
        recipient:receiver_id(name, username, avatar_url)
      `)
      .eq('receiver_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(10)

    recentGifts.value = giftsData || []

    // Load P2P profile and trades
    await loadP2PData()
    
    // Load escrow deals
    await loadEscrowData()
    
    // Load marketplace data
    await loadMarketplaceData()
    
    // Load gift data
    await loadGiftData()

    // Calculate stats
    calculateStats()

  } catch (error) {
    console.error('Error loading wallet data:', error)
  }
}

const loadP2PData = async () => {
  try {
    // Load P2P profile
    const { data: p2pData } = await supabase
      .from('p2p_profiles')
      .select('*')
      .eq('user_id', user.value.id)
      .single()

    p2pProfile.value = p2pData

    // Load active P2P trades
    const { data: p2pTrades } = await supabase
      .from('p2p_trades')
      .select(`
        *,
        counterparty:buyer_id(name, username)
      `)
      .or(`buyer_id.eq.${user.value.id},seller_id.eq.${user.value.id}`)
      .in('status', ['pending', 'in_progress', 'payment_pending'])

    activeP2PTrades.value = p2pTrades || []
  } catch (error) {
    console.error('Error loading P2P data:', error)
  }
}

const loadEscrowData = async () => {
  try {
    const { data: escrowDeals } = await supabase
      .from('escrows')
      .select(`
        *,
        counterparty:buyer_id(name, username)
      `)
      .or(`buyer_id.eq.${user.value.id},seller_id.eq.${user.value.id}`)
      .in('status', ['pending', 'funded', 'in_progress'])

    activeEscrowDeals.value = escrowDeals || []
  } catch (error) {
    console.error('Error loading escrow data:', error)
  }
}
const loadMarketplaceData = async () => {
  try {
    // Load active purchases
    const { data: purchasesData } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        item:item_id(name, image_url),
        seller:seller_id(name, username, avatar_url)
      `)
      .eq('buyer_id', user.value.id)
      .in('status', ['pending', 'processing', 'shipped'])

    activePurchases.value = purchasesData || []

    // Load active sales
    const { data: salesData } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        item:item_id(name, image_url),
        buyer:buyer_id(name, username, avatar_url)
      `)
      .eq('seller_id', user.value.id)
      .in('status', ['pending', 'processing', 'shipped'])

    activeSales.value = salesData || []
  } catch (error) {
    console.error('Error loading marketplace data:', error)
  }
}

const loadGiftData = async () => {
  try {
    // Load gifts received
    const { data: receivedData } = await supabase
      .from('gifts')
      .select(`
        *,
        sender:sender_id(name, username, avatar_url),
        post:post_id(title)
      `)
      .eq('receiver_id', user.value.id)
      .order('created_at', { ascending: false })

    giftsReceived.value = receivedData || []

    // Load gifts sent
    const { data: sentData } = await supabase
      .from('gifts')
      .select(`
        *,
        recipient:receiver_id(name, username, avatar_url)
      `)
      .eq('sender_id', user.value.id)
      .order('created_at', { ascending: false })

    giftsSent.value = sentData || []

    // Load pew tips
    const { data: pewTipsData } = await supabase
      .from('pew_gifts')
      .select('*')
      .eq('senderId', user.value.id)
      .order('timestamp', { ascending: false })

    pewTips.value = pewTipsData || []
  } catch (error) {
    console.error('Error loading gift data:', error)
  }
}

const calculateStats = () => {
  // Calculate gift stats
  totalGiftsReceived.value = giftsReceived.value.reduce((sum, gift) => sum + gift.gift_value, 0)
  totalGiftsSent.value = giftsSent.value.reduce((sum, gift) => sum + gift.gift_value, 0)
  totalPewTips.value = pewTips.value.reduce((sum, tip) => sum + tip.amount, 0)
  
  // Calculate 24h gifts received
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  giftsReceived24h.value = giftsReceived.value
    .filter(gift => new Date(gift.created_at) > yesterday)
    .reduce((sum, gift) => sum + gift.gift_value, 0)

  // Calculate P2P stats
  p2pStats.value = {
    totalTrades: activeP2PTrades.value.length,
    successRate: 95, // Calculate from completed trades
    volume: activeP2PTrades.value.reduce((sum, trade) => sum + trade.amount, 0)
  }

  // Calculate escrow stats
  escrowStats.value = {
    totalDeals: activeEscrowDeals.value.length,
    totalValue: activeEscrowDeals.value.reduce((sum, deal) => sum + deal.amount, 0),
    lockedAmount: escrowLockedAmount.value,
    successRate: 98 // Calculate from completed deals
  }

  // Calculate marketplace stats
  marketplaceStats.value = {
    totalSales: activeSales.value.length,
    totalRevenue: activeSales.value.reduce((sum, sale) => sum + sale.amount, 0),
    activeListings: activePurchases.value.length + activeSales.value.length,
    rating: 4.8 // Calculate from reviews
  }
}

const refreshBalances = async () => {
  refreshing.value = true
  await loadWalletData()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// Gift methods
const searchUsers = async () => {
  if (!giftForm.value.recipientSearch || giftForm.value.recipientSearch.length < 2) {
    userSearchResults.value = []
    return
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .or(`name.ilike.%${giftForm.value.recipientSearch}%,username.ilike.%${giftForm.value.recipientSearch}%`)
      .neq('id', user.value.id)
      .limit(5)

    userSearchResults.value = data || []
  } catch (error) {
    console.error('Error searching users:', error)
  }
}

const selectRecipient = (selectedUser) => {
  giftForm.value.recipient = selectedUser
  giftForm.value.recipientSearch = selectedUser.name
  userSearchResults.value = []
}

const clearRecipient = () => {
  giftForm.value.recipient = null
  giftForm.value.recipientSearch = ''
}

const selectGiftType = (giftType) => {
  giftForm.value.giftType = giftType
}

const sendGift = async () => {
  if (!canSendGift.value) return

  sendingGift.value = true
  try {
    // Create gift transaction
    const { data: gift, error } = await supabase
      .from('gifts')
      .insert({
        sender_id: user.value.id,
        receiver_id: giftForm.value.recipient.id,
        gift_type: giftForm.value.giftType.name,
        gift_name: giftForm.value.giftType.name,
        gift_value: giftForm.value.giftType.value,
        message: giftForm.value.message,
        is_anonymous: giftForm.value.isAnonymous
      })
      .select()
      .single()

    if (error) throw error

    // Update wallet balances
    await updateWalletBalance(user.value.id, 'USDT', -giftTotal.value)
    await updateWalletBalance(giftForm.value.recipient.id, 'USDT', giftForm.value.giftType.value)

    // Create transaction records
    await createTransaction({
      user_id: user.value.id,
      type: 'gift_sent',
      amount: -giftTotal.value,
      currency: 'USDT',
      description: `Gift sent to ${giftForm.value.recipient.name}`,
      reference_id: gift.id
    })

    await createTransaction({
      user_id: giftForm.value.recipient.id,
      type: 'gift_received',
      amount: giftForm.value.giftType.value,
      currency: 'USDT',
      description: `Gift received from ${giftForm.value.isAnonymous ? 'Anonymous' : user.value.user_metadata?.name || 'Someone'}`,
      reference_id: gift.id
    })

    // Refresh data
    await loadWalletData()
    closeGiftModal()

    // Show success message
    showNotification('Gift sent successfully!', 'success')

  } catch (error) {
    console.error('Error sending gift:', error)
    showNotification('Failed to send gift. Please try again.', 'error')
  } finally {
    sendingGift.value = false
  }
}

// Withdraw methods
const setMaxWithdraw = () => {
  const selectedWallet = wallets.value.find(w => w.currency_code === withdrawForm.value.currency)
  if (selectedWallet) {
    withdrawForm.value.amount = selectedWallet.balance
  }
}

const processWithdraw = async () => {
  if (!canWithdraw.value) return

  processingWithdraw.value = true
  try {
    // Create withdrawal request
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.value.id,
        currency: withdrawForm.value.currency,
        amount: withdrawForm.value.amount,
        address: withdrawForm.value.address,
        fee: withdrawFee.value,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Update wallet balance (lock funds)
    await updateWalletBalance(user.value.id, withdrawForm.value.currency, -withdrawForm.value.amount, true)

    // Create transaction record
    await createTransaction({
      user_id: user.value.id,
      type: 'withdraw',
      amount: -withdrawForm.value.amount,
      currency: withdrawForm.value.currency,
      description: `Withdrawal to ${withdrawForm.value.address.substring(0, 10)}...`,
      reference_id: withdrawal.id,
      status: 'pending'
    })

    await loadWalletData()
    closeWithdrawModal()
    showNotification('Withdrawal request submitted successfully!', 'success')

  } catch (error) {
    console.error('Error processing withdrawal:', error)
    showNotification('Failed to process withdrawal. Please try again.', 'error')
  } finally {
    processingWithdraw.value = false
  }
}

// Transfer methods
const searchTransferUsers = async () => {
  if (!transferForm.value.recipientSearch || transferForm.value.recipientSearch.length < 2) {
    transferUserResults.value = []
    return
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .or(`name.ilike.%${transferForm.value.recipientSearch}%,username.ilike.%${transferForm.value.recipientSearch}%`)
      .neq('id', user.value.id)
      .limit(5)

    transferUserResults.value = data || []
  } catch (error) {
    console.error('Error searching transfer users:', error)
  }
}

const selectTransferRecipient = (selectedUser) => {
  transferForm.value.recipient = selectedUser
  transferForm.value.recipientSearch = selectedUser.name
  transferUserResults.value = []
}

const processTransfer = async () => {
  if (!canTransfer.value) return

  processingTransfer.value = true
  try {
    // Create transfer record
    const { data: transfer, error } = await supabase
      .from('transfers')
      .insert({
        sender_id: user.value.id,
        receiver_id: transferForm.value.recipient.id,
        currency: transferForm.value.currency,
        amount: transferForm.value.amount,
        fee: transferFee.value,
        note: transferForm.value.note,
        status: 'completed'
      })
      .select()
      .single()

    if (error) throw error

    // Update wallet balances
    await updateWalletBalance(user.value.id, transferForm.value.currency, -transferTotal.value)
    await updateWalletBalance(transferForm.value.recipient.id, transferForm.value.currency, transferForm.value.amount)

    // Create transaction records
    await createTransaction({
      user_id: user.value.id,
      type: 'transfer',
      amount: -transferTotal.value,
      currency: transferForm.value.currency,
      description: `Transfer to ${transferForm.value.recipient.name}`,
      reference_id: transfer.id
    })

    await createTransaction({
      user_id: transferForm.value.recipient.id,
      type: 'transfer',
      amount: transferForm.value.amount,
      currency: transferForm.value.currency,
      description: `Transfer from ${user.value.user_metadata?.name || 'Someone'}`,
      reference_id: transfer.id
    })

    await loadWalletData()
    closeTransferModal()
    showNotification('Transfer completed successfully!', 'success')

  } catch (error) {
    console.error('Error processing transfer:', error)
    showNotification('Failed to process transfer. Please try again.', 'error')
  } finally {
    processingTransfer.value = false
  }
}

// Utility methods
const updateWalletBalance = async (userId, currency, amount, isLocked = false) => {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, locked_balance')
    .eq('user_id', userId)
    .eq('currency_code', currency)
    .single()

  if (wallet) {
    const updateData = isLocked 
      ? { locked_balance: wallet.locked_balance + Math.abs(amount) }
      : { balance: wallet.balance + amount }

    await supabase
      .from('wallets')
      .update(updateData)
      .eq('user_id', userId)
      .eq('currency_code', currency)
  }
}

const createTransaction = async (transactionData) => {
  await supabase
    .from('wallet_transactions')
    .insert({
      ...transactionData,
      status: transactionData.status || 'completed',
      created_at: new Date().toISOString()
    })
}

const getDepositAddress = (currency) => {
  // Generate or retrieve deposit address for currency
  return `${currency.toLowerCase()}_${user.value?.id}_deposit_address`
}

const copyAddress = async () => {
  if (selectedDepositCurrency.value) {
    const address = getDepositAddress(selectedDepositCurrency.value.code)
    await navigator.clipboard.writeText(address)
    showNotification('Address copied to clipboard!', 'success')
  }
}

// Activity helpers
const getActivityIcon = (type) => {
  const icons = {
    deposit: 'plus-circle',
    withdraw: 'minus-circle',
    transfer: 'send',
    gift_sent: 'gift',
    gift_received: 'gift',
    pew_gift: 'zap',
    p2p: 'users',
    escrow: 'shield',
    marketplace: 'shopping-cart'
  }
  return icons[type] || 'circle'
}

const formatActivityType = (type) => {
  const types = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    transfer: 'Transfer',
    gift_sent: 'Gift Sent',
    gift_received: 'Gift Received',
    pew_gift: 'Pew Tip',
    p2p: 'P2P Trade',
    escrow: 'Escrow',
    marketplace: 'Marketplace'
  }
  return types[type] || type
}

const getTransactionIcon = (type) => getActivityIcon(type)
const formatTransactionType = (type) => formatActivityType(type)

const formatStatus = (status) => {
  const statuses = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  }
  return statuses[status] || status
}

const formatVerificationLevel = (level) => {
  const levels = {
    unverified: 'Unverified',
    basic: 'Basic',
    advanced: 'Advanced',
    premium: 'Premium'
  }
  return levels[level] || 'Unverified'
}

const formatEscrowStatus = (status) => {
  const statuses = {
    pending: 'Pending',
    funded: 'Funded',
    in_progress: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled'
  }
  return statuses[status] || status
}

const formatTradeStatus = (status) => {
  const statuses = {
    pending: 'Pending',
    in_progress: 'In Progress',
    payment_pending: 'Payment Pending',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return statuses[status] || status
}

const formatPurchaseStatus = (status) => {
  const statuses = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered'
  }
  return statuses[status] || status
}

const formatSaleStatus = (status) => formatPurchaseStatus(status)

// Progress and time helpers
const getTradeProgress = (trade) => {
  const progressMap = {
    pending: 25,
    in_progress: 50,
    payment_pending: 75,
    completed: 100
  }
  return progressMap[trade.status] || 0
}

const getTradeProgressText = (trade) => {
  const textMap = {
    pending: 'Waiting for acceptance',
    in_progress: 'Trade in progress',
    payment_pending: 'Payment pending',
    completed: 'Completed'
  }
  return textMap[trade.status] || trade.status
}

const getEscrowTimeRemaining = (deal) => {
  if (!deal.auto_release_hours) return 'No auto-release'
  
  const releaseTime = new Date(deal.created_at)
  releaseTime.setHours(releaseTime.getHours() + deal.auto_release_hours)
  
  const now = new Date()
  const diff = releaseTime - now
  
  if (diff <= 0) return 'Auto-release available'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m remaining`
}

// Action helpers
const canCompleteP2P = (trade) => {
  return trade.status === 'payment_pending' && trade.seller_id === user.value?.id
}

const canReleaseEscrow = (deal) => {
  return deal.status === 'funded' && deal.seller_id === user.value?.id
}

const canDisputeEscrow = (deal) => {
  return ['funded', 'in_progress'].includes(deal.status)
}

// Navigation methods
const viewTransactionDetails = (transaction) => {
  // Implement transaction detail view
  console.log('View transaction:', transaction)
}

const viewP2PTrade = (tradeId) => {
  navigateTo(`/p2p/trade/${tradeId}`)
}

const viewEscrowDeal = (dealId) => {
  navigateTo(`/escrow/deal/${dealId}`)
}

const viewPurchase = (purchaseId) => {
  navigateTo(`/trade/purchase/${purchaseId}`)
}

const viewSale = (saleId) => {
  navigateTo(`/trade/sale/${saleId}`)
}

// Action methods
const completeP2PTrade = async (tradeId) => {
  try {
    await supabase
      .from('p2p_trades')
      .update({ status: 'completed' })
      .eq('id', tradeId)
    
    await loadP2PData()
    showNotification('P2P trade completed!', 'success')
  } catch (error) {
    console.error('Error completing P2P trade:', error)
    showNotification('Failed to complete trade', 'error')
  }
}

const releaseEscrow = async (dealId) => {
  try {
    await supabase
      .from('escrows')
      .update({ status: 'completed' })
      .eq('id', dealId)
    
    await loadEscrowData()
    showNotification('Escrow funds released!', 'success')
  } catch (error) {
    console.error('Error releasing escrow:', error)
    showNotification('Failed to release escrow', 'error')
  }
}

const disputeEscrow = async (dealId) => {
  try {
    await supabase
      .from('escrows')
      .update({ status: 'disputed' })
      .eq('id', dealId)
    
    await loadEscrowData()
    showNotification('Escrow dispute initiated', 'info')
  } catch (error) {
    console.error('Error disputing escrow:', error)
    showNotification('Failed to initiate dispute', 'error')
  }
}

// Profile creation methods
const createP2PProfile = () => {
  navigateTo('/p2p/setup')
}

const createEscrowDeal = () => {
  navigateTo('/escrow/create')
}

const createListing = () => {
  navigateTo('/trade/create')
}

// Currency actions
const depositCurrency = (currency) => {
  selectedDepositCurrency.value = availableCurrencies.find(c => c.code === currency)
  showDepositModal.value = true
}

const withdrawCurrency = (currency) => {
  withdrawForm.value.currency = currency
  showWithdrawModal.value = true
}

const transferCurrency = (currency) => {
  transferForm.value.currency = currency
  showTransferModal.value = true
}

// Modal handlers
const closeWalletModal = () => {
  showWalletModal.value = false
  activeTab.value = 'overview'
}

const closeGiftModal = () => {
  showGiftModal.value = false
  giftForm.value = {
    recipient: null,
    recipientSearch: '',
    giftType: null,
    message: '',
    isAnonymous: false
  }
  userSearchResults.value = []
}

const closeDepositModal = () => {
  showDepositModal.value = false
  selectedDepositCurrency.value = null
}

const closeWithdrawModal = () => {
  showWithdrawModal.value = false
  withdrawForm.value = {
    currency: '',
    amount: 0,
    address: ''
  }
}

const closeTransferModal = () => {
  showTransferModal.value = false
  transferForm.value = {
    recipient: null,
    recipientSearch: '',
    currency: '',
    amount: 0,
    note: ''
  }
  transferUserResults.value = []
}

// Utility functions
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const showNotification = (message, type = 'info') => {
  // Implement notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}

// Click outside to close
const handleClickOutside = (event) => {
  if (!event.target.closest('.wallet-widget')) {
    showWallet.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadWalletData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for user changes
watch(() => user.value, (newUser) => {
  if (newUser) {
    loadWalletData()
  } else {
    // Clear all data when user logs out
    wallets.value = []
    recentActivities.value = []
    recentGifts.value = []
    activeP2PTrades.value = []
    activeEscrowDeals.value = []
    activePurchases.value = []
    activeSales.value = []
    giftsReceived.value = []
    giftsSent.value = []
    pewTips.value = []
  }
})
</script>

<style scoped>
.wallet-widget {
  position: relative;
}

.wallet-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  font-weight: 500;
}

.wallet-toggle:hover,
.wallet-toggle.active {
  background: #e2e8f0;
  border-color: #cbd5e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.wallet-balance {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.pending-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e53e3e;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 18px;
  text-align: center;
}

.notification-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  border: 2px solid white;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 420px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 0.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.wallet-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
}

.wallet-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn,
.expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  transition: all 0.2s;
}

.refresh-btn:hover,
.expand-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.balance-overview {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f7fafc;
}

.total-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.balance-label {
  font-size: 0.875rem;
  color: #4a5568;
}

.balance-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.balance-breakdown {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.balance-item .label {
  font-size: 0.75rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.balance-item .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
}

.balance-item .value.positive {
  color: #38a169;
}

.currency-list {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f7fafc;
}

.currency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f7fafc;
}

.currency-item:last-child {
  border-bottom: none;
}

.currency-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.currency-icon img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.currency-details {
  display: flex;
  flex-direction: column;
}

.currency-name {
  font-weight: 500;
  color: #2d3748;
  font-size: 0.875rem;
}

.currency-code {
  font-size: 0.75rem;
  color: #718096;
}

.currency-balance {
  text-align: right;
}

.currency-balance .balance {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.locked-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.locked-amount {
  font-size: 0.75rem;
  color: #e53e3e;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f7fafc;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4a5568;
}

.action-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}
</style>

