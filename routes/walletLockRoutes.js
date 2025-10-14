// routes/walletLockRoutes.js - Wallet Lock Management Routes
import express from 'express';
import { WalletLockController } from '../controllers/walletLockController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Lock wallet balance
router.post('/lock', WalletLockController.lockWallet);

// Unlock wallet balance
router.post('/unlock', WalletLockController.unlockWallet);

// Schedule wallet unlock
router.post('/schedule-unlock', WalletLockController.scheduleUnlock);

// Toggle wallet lock status
router.post('/:walletId/toggle-lock', WalletLockController.toggleLock);

// Get wallet lock status and history
router.get('/:walletId/lock-status', WalletLockController.getLockStatus);

// Get all locked wallets (admin only)
router.get('/locked', WalletLockController.getLockedWallets);

export default router;
