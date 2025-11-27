// /server/utils/cdn-manager.ts
import AWS from 'aws-sdk'
import { CloudFront, S3 } from 'aws-sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CDNUploadResult {
  success: boolean
  s3Url?: string
  cdnUrl?: string
  key?: string
  error?: string
}

interface InvalidationResult {
  success: boolean
  invalidationId?: string
  error?: string
}

interface EdgeLocationMap {
  [key: string]: string[]
}

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    return supabaseInstance
  } catch (error) {
    console.error('[CDNManager] Failed to initialize Supabase:', error)
    throw new Error('Supabase initialization failed')
  }
}

export class CDNManager {
  private cloudfront: CloudFront
  private s3: S3
  private supabase: SupabaseClient | null = null
  private distributionId: string
  private bucketName: string
  private cdnDomain: string

  constructor() {
    this.cloudfront = new CloudFront({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    })

    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    })

    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || ''
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || ''
    this.cdnDomain = process.env.CDN_DOMAIN || ''
  }

  private async ensureSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await getSupabaseClient()
    }
    return this.supabase
  }

  async uploadFile(file: Buffer, key: string): Promise<CDNUploadResult> {
    try {
      const supabase = await this.ensureSupabase()
      
      // Upload to S3
      const s3Result = await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: 'application/octet-stream'
      }).promise()

      // Store metadata in Supabase
      const { error } = await supabase
        .from('cdn_files')
        .insert({
          key,
          s3_url: s3Result.Location,
          cdn_url: `${this.cdnDomain}/${key}`,
          size: file.length,
          uploaded_at: new Date().toISOString()
        })

      if (error) throw error

      return {
        success: true,
        s3Url: s3Result.Location,
        cdnUrl: `${this.cdnDomain}/${key}`,
        key
      }
    } catch (error) {
      console.error('[CDNManager] Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async invalidateCache(paths: string[]): Promise<InvalidationResult> {
    try {
      const result = await this.cloudfront.createInvalidation({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths
          },
          CallerReference: Date.now().toString()
        }
      }).promise()

      return {
        success: true,
        invalidationId: result.Invalidation?.Id
      }
    } catch (error) {
      console.error('[CDNManager] Invalidation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
