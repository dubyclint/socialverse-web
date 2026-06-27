// FILE 3: /server/api/middleware/cdn-upload.ts
// ============================================================================
// CDN upload middleware for media files
// ============================================================================

import { H3Event } from 'h3';
import { CDNManager } from '../../utils/cdn-manager';

export interface CDNUploadOptions {
  contentType: 'video' | 'thumbnail' | 'avatar' | 'static' | 'post';
  maxSize?: number;
}

export async function uploadToCDN(
  event: H3Event,
  buffer: Buffer,
  filename: string,
  options: CDNUploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const cdnManager = event.context.cdnManager as CDNManager;
    
    if (!cdnManager) {
      throw new Error('CDN Manager not initialized');
    }

    // Validate file size
    const maxSize = options.maxSize || 500 * 1024 * 1024; // 500MB default
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`
      };
    }

    let result;

    switch (options.contentType) {
      case 'video':
        result = await cdnManager.uploadStreamSegment(
          filename.split('/')[0],
          buffer,
          parseInt(filename.split('_')[1]) || 0
        );
        break;

      case 'thumbnail':
        result = await cdnManager.uploadThumbnail(
          filename.split('/')[0],
          buffer,
          Date.now()
        );
        break;

      case 'avatar':
      case 'static':
      case 'post':
        const key = `${options.contentType}/${filename}`;
        result = await cdnManager.uploadPlaylist(filename, buffer.toString(), false);
        break;

      default:
        return {
          success: false,
          error: 'Invalid content type'
        };
    }

    return result;
  } catch (error) {
    console.error('CDN upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function invalidateCDNCache(
  event: H3Event,
  paths: string[]
): Promise<{ success: boolean; invalidationId?: string; error?: string }> {
  try {
    const cdnManager = event.context.cdnManager as CDNManager;
    
    if (!cdnManager) {
      throw new Error('CDN Manager not initialized');
    }

    return await cdnManager.invalidateCache(paths);
  } catch (error) {
    console.error('CDN invalidation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalidation failed'
    };
  }
}
