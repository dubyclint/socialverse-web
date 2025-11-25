import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AWS from 'aws-sdk';
import { CloudFront, S3 } from 'aws-sdk';

interface CDNUploadResult {
  success: boolean;
  s3Url?: string;
  cdnUrl?: string;
  key?: string;
  error?: string;
}

interface InvalidationResult {
  success: boolean;
  invalidationId?: string;
  error?: string;
}

interface EdgeLocationMap {
  [key: string]: string[];
}

export class CDNManager {
  private cloudfront: CloudFront;
  private s3: S3;
  private supabase: SupabaseClient;
  private distributionId: string;
  private bucketName: string;
  private cdnDomain: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.cloudfront = new CloudFront({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID!;
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.cdnDomain = process.env.CDN_DOMAIN!;
  }

  generateCDNUrl(path: string, contentType: string = 'video'): string {
    const baseUrl = `https://${this.cdnDomain}`;

    switch (contentType) {
      case 'video':
        return `${baseUrl}/streams/${path}`;
      case 'thumbnail':
        return `${baseUrl}/thumbnails/${path}`;
      case 'avatar':
        return `${baseUrl}/avatars/${path}`;
      case 'static':
        return `${baseUrl}/static/${path}`;
      default:
        return `${baseUrl}/${path}`;
    }
  }

  async uploadStreamSegment(
    streamId: string,
    segmentData: Buffer,
    segmentNumber: number
  ): Promise<CDNUploadResult> {
    try {
      const key = `streams/${streamId}/segment_${segmentNumber}.ts`;

      const uploadParams: S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: segmentData,
        ContentType: 'video/mp2t',
        CacheControl: 'max-age=86400, public',
        Metadata: {
          streamId,
          segmentNumber: segmentNumber.toString(),
          uploadTime: new Date().toISOString()
        }
      };

      const result = await this.s3.upload(uploadParams).promise();
      const cdnUrl = this.generateCDNUrl(`${streamId}/segment_${segmentNumber}.ts`, 'video');

      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      };
    } catch (error) {
      console.error('Failed to upload stream segment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async uploadPlaylist(
    streamId: string,
    playlistContent: string,
    isLive: boolean = true
  ): Promise<CDNUploadResult> {
    try {
      const key = `streams/${streamId}/playlist.m3u8`;

      const uploadParams: S3.PutObjectRequest = {
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
      };

      const result = await this.s3.upload(uploadParams).promise();

      if (isLive) {
        await this.invalidateCache([`/streams/${streamId}/playlist.m3u8`]);
      }

      const cdnUrl = this.generateCDNUrl(`${streamId}/playlist.m3u8`, 'video');

      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      };
    } catch (error) {
      console.error('Failed to upload playlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async uploadThumbnail(
    streamId: string,
    thumbnailBuffer: Buffer,
    timestamp: number
  ): Promise<CDNUploadResult> {
    try {
      const key = `thumbnails/${streamId}/${timestamp}.jpg`;

      const uploadParams: S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=2592000, public',
        Metadata: {
          streamId,
          timestamp: timestamp.toString(),
          uploadTime: new Date().toISOString()
        }
      };

      const result = await this.s3.upload(uploadParams).promise();
      const cdnUrl = this.generateCDNUrl(`${streamId}/${timestamp}.jpg`, 'thumbnail');

      return {
        success: true,
        s3Url: result.Location,
        cdnUrl,
        key
      };
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async invalidateCache(paths: string[]): Promise<InvalidationResult> {
    try {
      const params: CloudFront.CreateInvalidationRequest = {
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      };

      const result = await this.cloudfront.createInvalidation(params).promise();

      console.log('Cache invalidation created:', result.Invalidation.Id);
      return {
        success: true,
        invalidationId: result.Invalidation.Id
      };
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getOptimalEdgeLocation(userIP: string, userCountry: string): Promise<string[]> {
    try {
      const edgeLocations: EdgeLocationMap = {
        'US': ['us-east-1', 'us-west-1', 'us-west-2'],
        'EU': ['eu-west-1', 'eu-central-1', 'eu-west-2'],
        'ASIA': ['ap-southeast-1', 'ap-northeast-1', 'ap-south-1'],
        'AU': ['ap-southeast-2'],
        'SA': ['sa-east-1']
      };

      let region = 'US';
      if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'].includes(userCountry)) {
        region = 'EU';
      } else if (['JP', 'KR', 'SG', 'IN', 'CN', 'TH', 'VN'].includes(userCountry)) {
        region = 'ASIA';
      } else if (['AU', 'NZ'].includes(userCountry)) {
        region = 'AU';
      } else if (['BR', 'AR', 'CL'].includes(userCountry)) {
        region = 'SA';
      }

      return edgeLocations[region] || edgeLocations['US'];
    } catch (error) {
      console.error('Error getting optimal edge location:', error);
      return edgeLocations['US'];
    }
  }
}
