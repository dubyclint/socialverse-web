// server/utils/cdnManager.js
import { createClient } from '@supabase/supabase-js'
import AWS from 'aws-sdk'
import { CloudFront } from 'aws-sdk'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class CDNManager {
  constructor() {
    // Configure AWS CloudFront
    this.cloudfront = new CloudFront({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    })
    
    // Configure S3 for origin storage
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    })
    
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
    this.bucketName = process.env.S3_BUCKET_NAME
    this.cdnDomain = process.env.CDN_DOMAIN
  }

  // Generate CDN URLs for different content types
  generateCDNUrl(path, contentType = 'video') {
    const baseUrl = `https://${this.cdnDomain}`
    
    switch (contentType) {
      case 'video':
        return `${baseUrl}/streams/${path}`
      case 'thumbnail':
        return `${baseUrl}/thumbnails/${path}`
      case 'avatar':
        return `${baseUrl}/avatars/${path}`
      case 'static':
        return `${baseUrl}/static/${path}`
      default:
        return `${baseUrl}/${path}`
    }
  }

  // Upload stream segments to S3 with proper caching headers
  async uploadStreamSegment(streamId, segmentData, segmentNumber) {
    try {
      const key = `streams/${streamId}/segment_${segmentNumber}.ts`
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: segmentData,
        ContentType: 'video/mp2t',
        CacheControl: 'max-age=86400, public', // 24 hours
        Metadata: {
          streamId,
          segmentNumber: segmentNumber.toString(),
          uploadTime: new Date().toISOString()
        }
      }

      const result = await this.s3.upload(uploadParams).promise()
      
      // Generate CDN URL
      const cdnUrl = this.generateCDNUrl(`${streamId}/segment_${segmentNumber}.ts`, 'video')
      
      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      }
    } catch (error) {
      console.error('Failed to upload stream segment:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload HLS playlist with short cache duration
  async uploadPlaylist(streamId, playlistContent, isLive = true) {
    try {
      const key = `streams/${streamId}/playlist.m3u8`
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: playlistContent,
        ContentType: 'application/vnd.apple.mpegurl',
        CacheControl: isLive ? 'max-age=2, no-cache' : 'max-age=3600, public',
        Metadata: {
          streamId,
          isLive: isLive.toString(),
          updateTime: new Date().toISOString()
        }
      }

      const result = await this.s3.upload(uploadParams).promise()
      
      // Invalidate CloudFront cache for live playlists
      if (isLive) {
        await this.invalidateCache([`/streams/${streamId}/playlist.m3u8`])
      }
      
      const cdnUrl = this.generateCDNUrl(`${streamId}/playlist.m3u8`, 'video')
      
      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      }
    } catch (error) {
      console.error('Failed to upload playlist:', error)
      return { success: false, error: error.message }
    }
  }

  // Upload thumbnails with long cache duration
  async uploadThumbnail(streamId, thumbnailBuffer, timestamp) {
    try {
      const key = `thumbnails/${streamId}/${timestamp}.jpg`
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=2592000, public', // 30 days
        Metadata: {
          streamId,
          timestamp: timestamp.toString(),
          uploadTime: new Date().toISOString()
        }
      }

      const result = await this.s3.upload(uploadParams).promise()
      const cdnUrl = this.generateCDNUrl(`${streamId}/${timestamp}.jpg`, 'thumbnail')
      
      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      }
    } catch (error) {
      console.error('Failed to upload thumbnail:', error)
      return { success: false, error: error.message }
    }
  }

  // Invalidate CloudFront cache
  async invalidateCache(paths) {
    try {
      const params = {
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      }

      const result = await this.cloudfront.createInvalidation(params).promise()
      
      console.log('Cache invalidation created:', result.Invalidation.Id)
      return { success: true, invalidationId: result.Invalidation.Id }
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
      return { success:_
      return { success: false, error: error.message }
    }
  }

  // Get optimal CDN edge location for user
  async getOptimalEdgeLocation(userIP, userCountry) {
    try {
      // CloudFront edge locations mapping
      const edgeLocations = {
        'US': ['us-east-1', 'us-west-1', 'us-west-2'],
        'EU': ['eu-west-1', 'eu-central-1', 'eu-west-2'],
        'ASIA': ['ap-southeast-1', 'ap-northeast-1', 'ap-south-1'],
        'AU': ['ap-southeast-2'],
        'SA': ['sa-east-1']
      }

      // Determine region based on country
      let region = 'US' // Default
      if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'].includes(userCountry)) {
        region = 'EU'
      } else if (['JP', 'KR', 'SG', 'IN', 'CN', 'TH', 'VN'].includes(userCountry)) {
        region = 'ASIA'
      } else if (['AU', 'NZ'].includes(userCountry)) {
        region = 'AU'
      } else if (['BR', 'AR', 'CL', 'CO'].includes(userCountry)) {
        region = 'SA'
      }

      const locations = edgeLocations[region] || edgeLocations['US']
      
      // For now, return the first location. In production, you'd implement
      // latency-based routing or use CloudFront's automatic edge selection
      return {
        success: true,
        region,
        edgeLocation: locations[0],
        cdnDomain: this.cdnDomain
      }
    } catch (error) {
      console.error('Failed to get optimal edge location:', error)
      return { success: false, error: error.message }
    }
  }

  // Preload content to edge caches
  async preloadContent(streamId, contentPaths) {
    try {
      const preloadPromises = contentPaths.map(async (path) => {
        const cdnUrl = this.generateCDNUrl(path, 'video')
        
        // Make HEAD request to warm up the cache
        try {
          const response = await fetch(cdnUrl, { method: 'HEAD' })
          return { path, success: response.ok, status: response.status }
        } catch (error) {
          return { path, success: false, error: error.message }
        }
      })

      const results = await Promise.all(preloadPromises)
      
      return {
        success: true,
        results,
        preloadedCount: results.filter(r => r.success).length
      }
    } catch (error) {
      console.error('Failed to preload content:', error)
      return { success: false, error: error.message }
    }
  }

  // Clean up old stream files
  async cleanupOldStreams(olderThanDays = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'streams/'
      }

      const objects = await this.s3.listObjectsV2(listParams).promise()
      const objectsToDelete = objects.Contents.filter(obj => 
        obj.LastModified < cutoffDate
      )

      if (objectsToDelete.length === 0) {
        return { success: true, deletedCount: 0 }
      }

      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: objectsToDelete.map(obj => ({ Key: obj.Key }))
        }
      }

      const deleteResult = await this.s3.deleteObjects(deleteParams).promise()
      
      // Invalidate cache for deleted objects
      const pathsToInvalidate = objectsToDelete.map(obj => `/${obj.Key}`)
      if (pathsToInvalidate.length > 0) {
        await this.invalidateCache(pathsToInvalidate)
      }

      return {
        success: true,
        deletedCount: deleteResult.Deleted.length,
        errors: deleteResult.Errors
      }
    } catch (error) {
      console.error('Failed to cleanup old streams:', error)
      return { success: false, error: error.message }
    }
  }

  // Get CDN analytics
  async getCDNAnalytics(streamId, timeRange = '24h') {
    try {
      // This would integrate with CloudFront analytics API
      // For now, return mock data structure
      return {
        success: true,
        analytics: {
          streamId,
          timeRange,
          totalRequests: 0,
          totalBytes: 0,
          cacheHitRate: 0,
          edgeLocations: [],
          topCountries: [],
          bandwidth: {
            peak: 0,
            average: 0,
            total: 0
          }
        }
      }
    } catch (error) {
      console.error('Failed to get CDN analytics:', error)
      return { success: false, error: error.message }
    }
  }
}

export default CDNManager
