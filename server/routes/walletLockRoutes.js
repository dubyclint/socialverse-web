// server/routes/walletLockRoutes.js
// Nuxt 3 Consolidated Route Handler - Wallet Lock Management
import { WalletLockController } from '../api/controllers/walletLockController'
import { authenticateUser } from '../api/middleware/auth'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract wallet ID from path
  const walletIdMatch = path.match(/\/wallet-lock\/([^/]+)/)
  const walletId = walletIdMatch?.[1]

  try {
    // Apply authentication middleware to all routes
    await authenticateUser(event)

    // Lock wallet balance
    if (method === 'POST' && path.endsWith('/wallet-lock/lock')) {
      return await WalletLockController.lockWallet(event)
    }

    // Unlock wallet balance
    if (method === 'POST' && path.endsWith('/wallet-lock/unlock')) {
      return await WalletLockController.unlockWallet(event)
    }

    // Schedule wallet unlock
    if (method === 'POST' && path.endsWith('/wallet-lock/schedule-unlock')) {
      return await WalletLockController.scheduleUnlock(event)
    }

    // Toggle wallet lock status
    if (method === 'POST' && path.includes('/toggle-lock')) {
      return await WalletLockController.toggleLock(event, walletId)
    }

    // Get wallet lock status and history
    if (method === 'GET' && path.includes('/lock-status')) {
      return await WalletLockController.getLockStatus(event, walletId)
    }

    // Get all locked wallets (admin only)
    if (method === 'GET' && path.endsWith('/wallet-lock/locked')) {
      return await WalletLockController.getLockedWallets(event)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Wallet Lock Route Error:', error)
    throw error
  }
})
