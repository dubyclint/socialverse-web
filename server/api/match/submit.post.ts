// server/api/match/submit.post.ts
import { requirePermission } from '~/server/gateway/auth/auth-bouncer'

// Permissive stubs for helpers that may live elsewhere; replace with canonical imports later.
async function checkTermsCompliance(_userId: string): Promise<boolean> {
  // Default to false (requires admin approval) — safe and reversible.
  return false
}

async function matchUserToInterest(_userId: string, _interestId: string) {
  // Minimal placeholder: caller will replace with real logic.
  return { success: false, reason: 'stub' }
}

async function queueForAdminApproval(_userId: string, _interestId: string) {
  // Minimal placeholder: returns queued response.
  return { queued: true }
}

export default defineEventHandler(async (event) => {
  // 1. The Bouncer: Enforcement of Verification/Premium requirements
  // We use the helper to ensure only authorized users reach the logic
  const user = await requirePermission(event, 'verified')
  
  const { interestId } = await readBody(event) as { interestId: string }
  
  // 2. Business Rule: Additional T&C Compliance check
  // Even if 'verified', we check if they meet specific platform rules
  const hasMetTerms = await checkTermsCompliance(user.id)
  
  if (hasMetTerms) {
    // Immediate Auto-Match Logic
    return await matchUserToInterest(user.id, interestId)
  } else {
    // Await Admin Approval
    return await queueForAdminApproval(user.id, interestId)
  }
})
