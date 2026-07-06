// server/api/match/submit.post.ts
export default defineEventHandler(async (event) => {
  // 1. The Bouncer: Enforcement of Verification/Premium requirements
  // We use the helper to ensure only authorized users reach the logic
  const user = await requirePermission(event, 'verified')
  
  const { interestId } = await readBody(event)
  
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
