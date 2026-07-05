export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { interestId } = await readBody(event)
  
  // 1. Constraint Check
  const isEligible = user.is_verified || user.is_premium || await checkTermsCompliance(user.id)
  
  if (isEligible) {
    // Immediate Auto-Match Logic (Redis Sorted Set for quick lookups)
    return await matchUserToInterest(user.id, interestId)
  } else {
    // Await Admin Approval
    return await queueForAdminApproval(user.id, interestId)
  }
})
