// server/utils/pewgift-utils.ts - UTILITY FUNCTIONS FOR PEWGIFT SYSTEM
// ============================================================================

export interface FeeStructure {
  platformFee: number
  streamerFee: number
  senderFee: number
  totalFee: number
}

export interface GiftSplit {
  senderCost: number
  recipientEarnings: number
  platformEarnings: number
}

/**
 * Calculate fees for gift transaction
 */
export function calculateGiftFees(amount: number, giftType: string = 'standard'): FeeStructure {
  const feePercentages = {
    standard: { platform: 0.15, sender: 0.05 },
    premium: { platform: 0.10, sender: 0.03 },
    legendary: { platform: 0.20, sender: 0.08 }
  }

  const fees = feePercentages[giftType as keyof typeof feePercentages] || feePercentages.standard

  const platformFee = Math.ceil(amount * fees.platform)
  const senderFee = Math.ceil(amount * fees.sender)
  const streamerFee = amount - platformFee - senderFee

  return {
    platformFee,
    streamerFee,
    senderFee,
    totalFee: platformFee + senderFee
  }
}

/**
 * Calculate gift split between sender, recipient, and platform
 */
export function calculateGiftSplit(amount: number, giftType: string = 'standard'): GiftSplit {
  const fees = calculateGiftFees(amount, giftType)

  return {
    senderCost: amount + fees.senderFee,
    recipientEarnings: fees.streamerFee,
    platformEarnings: fees.platformFee
  }
}

/**
 * Validate gift amount
 */
export function validateGiftAmount(amount: number, minAmount: number = 1): { valid: boolean; error?: string } {
  if (amount < minAmount) {
    return {
      valid: false,
      error: `Minimum gift amount is ${minAmount} PEW`
    }
  }

  if (amount > 10000) {
    return {
      valid: false,
      error: 'Maximum gift amount is 10000 PEW'
    }
  }

  if (!Number.isInteger(amount)) {
    return {
      valid: false,
      error: 'Gift amount must be a whole number'
    }
  }

  return { valid: true }
}

/**
 * Format gift amount for display
 */
export function formatGiftAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}

/**
 * Get gift rarity color
 */
export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#666666',
    rare: '#4CAF50',
    epic: '#2196F3',
    legendary: '#FF6B6B'
  }
  return colors[rarity] || '#666666'
}

/**
 * Check if user can send gift (rate limiting)
 */
export function canSendGift(lastGiftTime: number, cooldownMs: number = 1000): boolean {
  return Date.now() - lastGiftTime >= cooldownMs
}

/**
 * Generate gift transaction ID
 */
export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate gift message
 */
export function validateGiftMessage(message: string, maxLength: number = 200): { valid: boolean; error?: string } {
  if (message.length > maxLength) {
    return {
      valid: false,
      error: `Message must be ${maxLength} characters or less`
    }
  }

  // Check for spam patterns
  const spamPatterns = [/(.)\1{10,}/, /[A-Z]{20,}/]
  for (const pattern of spamPatterns) {
    if (pattern.test(message)) {
      return {
        valid: false,
        error: 'Message contains spam patterns'
      }
    }
  }

  return { valid: true }
}
