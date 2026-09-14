import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

export interface VerificationDocumentView {
  name: string
  type: string
  url: string
  description: string
  uploadDate: string
}

export interface VerificationRequestView {
  id: string
  userId: string
  username: string
  displayName: string
  email: string
  avatar: string | null
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'revoked'
  verificationType: string
  requestDate: string
  verificationDate?: string
  reason?: string
  isVerified: boolean
  postCount: number
  followerCount: number
  followingCount: number
  joinDate: string
  documents: VerificationDocumentView[]
}

const STATUS_MAP: Record<string, VerificationRequestView['verificationStatus']> = {
  pending: 'pending',
  approved: 'verified',
  verified: 'verified',
  rejected: 'rejected',
  revoked: 'revoked'
}

interface EvidenceDocument {
  name?: string
  type?: string
  url?: string
  description?: string
  uploadDate?: string
}

const toDocuments = (evidence: unknown): VerificationDocumentView[] => {
  const list = Array.isArray(evidence)
    ? evidence
    : evidence && typeof evidence === 'object' && Array.isArray((evidence as { documents?: unknown }).documents)
      ? (evidence as { documents: unknown[] }).documents
      : []

  return list
    .filter((item): item is EvidenceDocument => Boolean(item) && typeof item === 'object')
    .map(item => ({
      name: item.name ?? 'Document',
      type: item.type ?? 'file',
      url: item.url ?? '',
      description: item.description ?? '',
      uploadDate: item.uploadDate ?? ''
    }))
}

export default defineEventHandler(async (event): Promise<VerificationRequestView[]> => {
  await requireAdmin(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data: requests, error } = await client
    .from('badge_requests')
    .select('id, user_id, status, reason, evidence, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const userIds = Array.from(new Set((requests ?? []).map(row => row.user_id)))
  if (!userIds.length) return []

  const { data: profiles, error: profileError } = await client
    .from('user')
    .select('user_id, username, display_name, full_name, email, avatar_url, is_verified, followers_count, following_count, posts_count, created_at')
    .in('user_id', userIds)

  if (profileError) throw createError({ statusCode: 500, statusMessage: profileError.message })

  const profileById = new Map((profiles ?? []).map(row => [row.user_id, row]))

  return (requests ?? []).map((request) => {
    const profile = profileById.get(request.user_id)
    const status = STATUS_MAP[request.status] ?? 'pending'

    return {
      id: request.id,
      userId: request.user_id,
      username: profile?.username ?? 'unknown',
      displayName: profile?.display_name || profile?.full_name || profile?.username || 'Unknown user',
      email: profile?.email ?? '',
      avatar: profile?.avatar_url ?? null,
      verificationStatus: status,
      verificationType: 'Identity',
      requestDate: request.created_at,
      verificationDate: status === 'verified' ? request.updated_at : undefined,
      reason: request.reason ?? undefined,
      isVerified: Boolean(profile?.is_verified),
      postCount: profile?.posts_count ?? 0,
      followerCount: profile?.followers_count ?? 0,
      followingCount: profile?.following_count ?? 0,
      joinDate: profile?.created_at ?? request.created_at,

      documents: toDocuments(request.evidence)
    }
  })
})
