// ============================================================================
// FILE: /server/utils/cdn-manager.ts - AWS SDK v3
// ============================================================================

import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import {
  CloudFrontClient,
  CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront'

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

export class CDNManager {
  private s3Client: S3Client | null = null
  private cloudFrontClient: CloudFrontClient | null = null
  private initialized = false

  initialize() {
    if (this.initialized) return

    const region = process.env.AWS_REGION || 'us-east-1'
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }

    this.s3Client = new S3Client({ region, credentials })
    this.cloudFrontClient = new CloudFrontClient({ region, credentials })

    this.initialized = true
    console.log('[CDN Manager] Initialized successfully')
  }

  async uploadFile(file: Buffer, key: string): Promise<CDNUploadResult> {
    try {
      this.initialize()

      const upload = new Upload({
        client: this.s3Client!,
        params: {
          Bucket: process.env.AWS_S3_BUCKET || '',
          Key: key,
          Body: file,
          ACL: 'public-read'
        }
      })

      const result = await upload.done()

      return {
        success: true,
        s3Url: result.Location,
        cdnUrl: `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`,
        key
      }
    } catch (error) {
      console.error('[CDN Manager] Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async invalidateCache(paths: string[]): Promise<InvalidationResult> {
    try {
      this.initialize()

      const command = new CreateInvalidationCommand({
        DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
        InvalidationBatch: {
          CallerReference: `${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      })

      const result = await this.cloudFrontClient!.send(command)

      return {
        success: true,
        invalidationId: result.Invalidation?.Id
      }
    } catch (error) {
      console.error('[CDN Manager] Invalidation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalidation failed'
      }
    }
  }
}
