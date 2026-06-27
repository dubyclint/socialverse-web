// ============================================================================
// FILE: /server/utils/cdn-manager.ts - FIXED WITH LAZY LOADING
// ============================================================================

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

// Lazy load AWS SDK only when needed
let AWS: any = null
let S3: any = null
let CloudFront: any = null

async function loadAWS() {
  if (!AWS) {
    const awsSdk = await import('aws-sdk')
    AWS = awsSdk.default
    S3 = awsSdk.S3
    CloudFront = awsSdk.CloudFront
  }
  return { AWS, S3, CloudFront }
}

export class CDNManager {
  private s3Client: any = null
  private cloudFrontClient: any = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      const { S3, CloudFront } = await loadAWS()
      
      this.s3Client = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      })

      this.cloudFrontClient = new CloudFront({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      })

      this.initialized =console.log('[CDN Manager] Initialized successfully')
    } catch (error) {
      console.error('[CDN Manager] Failed to initialize:', error)
      throw error
    }
  }

  async uploadFile(file: Buffer, key: string): Promise<CDNUploadResult> {
    try {
      await this.initialize()

      const params = {
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: key,
        Body: file,
        ACL: 'public-read'
      }

      const result = await this.s3Client.upload(params).promise()

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
      await this.initialize()

      const params = {
        DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
        InvalidationBatch: {
          CallerReference: `${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      }

      const result = await this.cloudFrontClient.createInvalidation(params).promise()

      return {
        success: true,
        invalidationId: result.Invalidation.Id
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
