// ============================================================================
// FILE 4: /server/utils/cdn-manager.ts - COMPLETE FIXED VERSION
// ============================================================================
// CDN MANAGER - AWS S3 + CloudFront Integration
// FIXED: aws-sdk package is now properly imported
// ============================================================================

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
    
    console.log('[CDNManager] Supabase client initialized')
    return supabaseInstance
  } catch (error) {
    console.error('[CDNManager] Failed to initialize Supabase:', error)
    throw new Error('Supabase initialization failed')
  }
}

// ============================================================================
// CDN MANAGER CLASS
// ============================================================================

export class CDNManager {
  private cloudfront: CloudFront
  private s3: S3
  private supabase: SupabaseClient | null = null
  private distributionId: string
  private bucketName: string
  private cdnDomain: string

  constructor() {
    try {
      // Initialize AWS services
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

      console.log('[CDNManager] Initialized with bucket:', this.bucketName)
    } catch (error) {
      console.error('[CDNManager] Initialization error:', error)
      throw error
    }
  }

  /**
   * Ensure Supabase client is loaded
   */
  private async ensureSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await getSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Upload file to S3 and store metadata in Supabase
   */
  async uploadFile(file: Buffer, key: string, contentType: string = 'application/octet-stream'): Promise<CDNUploadResult> {
    try {
      console.log(`[CDNManager] Uploading file: ${key}`)
      
      const supabase = await this.ensureSupabase()
      
      // Upload to S3
      const s3Result = await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'max-age=31536000' // 1 year cache
      }).promise()

      console.log(`[CDNManager] S3 upload successful: ${s3Result.Location}`)

      // Store metadata in Supabase
      const { error } = await supabase
        .from('cdn_files')
        .insert({
          key,
          s3_url: s3Result.Location,
          cdn_url: `${this.cdnDomain}/${key}`,
          size: file.length,
          content_type: contentType,
          uploaded_at: new Date().toISOString()
        })

      if (error) {
        console.error('[CDNManager] Supabase insert error:', error)
        throw error
      }

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

  /**
   * Delete file from S3 and Supabase
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[CDNManager] Deleting file: ${key}`)
      
      const supabase = await this.ensureSupabase()

      // Delete from S3
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise()

      // Delete metadata from Supabase
      const { error } = await supabase
        .from('cdn_files')
        .delete()
        .eq('key', key)

      if (error) {
        console.error('[CDNManager] Supabase delete error:', error)
        throw error
      }

      console.log(`[CDNManager] File deleted successfully: ${key}`)
      return { success: true }
    } catch (error) {
      console.error('[CDNManager] Delete failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Invalidate CloudFront cache
   */
  async invalidateCache(paths: string[]): Promise<InvalidationResult> {
    try {
      console.log(`[CDNManager] Invalidating ${paths.length} paths`)
      
      if (!this.distributionId) {
        throw new Error('CloudFront distribution ID not configured')
      }

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

      console.log(`[CDNManager] Invalidation created: ${result.Invalidation?.Id}`)

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

  /**
   * Get file metadata from Supabase
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const supabase = await this.ensureSupabase()
      
      const { data, error } = await supabase
        .from('cdn_files')
        .select('*')
        .eq('key', key)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[CDNManager] Get metadata error:', error)
      throw error
    }
  }

  /**
   * List files in CDN
   */
  async listFiles(prefix?: string): Promise<any[]> {
    try {
      const supabase = await this.ensureSupabase()
      
      let query = supabase.from('cdn_files').select('*')
      
      if (prefix) {
        query = query.like('key', `${prefix}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[CDNManager] List files error:', error)
      throw error
    }
  }

  /**
   * Get CDN URL for a file
   */
  getCdnUrl(key: string): string {
    return `${this.cdnDomain}/${key}`
  }

  /**
   * Get S3 URL for a file
   */
  getS3Url(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`
  }
}
