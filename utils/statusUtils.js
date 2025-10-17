// utils/statusUtils.js
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');

class StatusUtils {
  // Validate status content
  static validateStatusContent(content, mediaType) {
    const errors = [];

    switch (mediaType) {
      case 'text':
        if (!content || content.trim().length === 0) {
          errors.push('Text content is required');
        } else if (content.length > 500) {
          errors.push('Text must be 500 characters or less');
        }
        break;

      case 'image':
        // Image validation handled by multer and file processing
        break;

      case 'video':
        // Video validation handled during processing
        break;

      case 'audio':
        // Audio validation handled during processing
        break;

      default:
        errors.push('Invalid media type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Process video file for status
  static async processVideoStatus(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('720x1280') // 9:16 aspect ratio
        .duration(10) // Max 10 seconds
        .fps(30)
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .output(outputPath)
        .on('end', () => {
          resolve({
            success: true,
            outputPath,
            duration: 10 // Will be updated with actual duration
          });
        })
        .on('error', (err) => {
          reject(new Error(`Video processing failed: ${err.message}`));
        })
        .run();
    });
  }

  // Process audio file for status
  static async processAudioStatus(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .duration(30) // Max 30 seconds
        .output(outputPath)
        .on('end', () => {
          resolve({
            success: true,
            outputPath,
            duration: 30 // Will be updated with actual duration
          });
        })
        .on('error', (err) => {
          reject(new Error(`Audio processing failed: ${err.message}`));
        })
        .run();
    });
  }

  // Process image for status
  static async processImageStatus(inputPath, outputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      
      await sharp(inputPath)
        .resize(1080, 1920, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return {
        success: true,
        outputPath,
        width: 1080,
        height: 1920,
        originalWidth: metadata.width,
        originalHeight: metadata.height
      };

    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // Get media duration
  static async getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(Math.round(duration));
        }
      });
    });
  }

  // Generate video thumbnail
  static async generateVideoThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '360x640'
        })
        .on('end', () => {
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail generation failed: ${err.message}`));
        });
    });
  }

  // Validate file size limits
  static validateFileSize(fileSize, mediaType) {
    const limits = {
      image: 10 * 1024 * 1024,  // 10MB
      video: 50 * 1024 * 1024,  // 50MB
      audio: 10 * 1024 * 1024   // 10MB
    };

    const limit = limits[mediaType];
    if (!limit) {
      return { valid: false, error: 'Invalid media type' };
    }

    if (fileSize > limit) {
      return { 
        valid: false, 
        error: `File size exceeds ${limit / (1024 * 1024)}MB limit` 
      };
    }

    return { valid: true };
  }

  // Format status for API response
  static formatStatusResponse(status, hasViewed = false, viewCount = null) {
    return {
      id: status.id,
      userId: status.userId,
      content: status.content,
      mediaUrl: status.mediaUrl,
      mediaType: status.mediaType,
      mediaMetadata: status.mediaMetadata,
      backgroundColor: status.backgroundColor,
      textColor: status.textColor,
      viewCount: viewCount !== null ? viewCount : status.viewCount,
      createdAt: status.createdAt,
      expiresAt: status.expiresAt,
      hasViewed,
      timeRemaining: this.getTimeRemaining(status.expiresAt)
    };
  }

  // Get time remaining until status expires
  static getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return { expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      expired: false,
      hours,
      minutes,
      totalMinutes: Math.floor(diff / (1000 * 60))
    };
  }

  // Generate status colors for text statuses
  static getStatusColorPalettes() {
    return [
      { background: '#FF6B6B', text: '#FFFFFF' }, // Red
      { background: '#4ECDC4', text: '#FFFFFF' }, // Teal
      { background: '#45B7D1', text: '#FFFFFF' }, // Blue
      { background: '#96CEB4', text: '#FFFFFF' }, // Green
      { background: '#FFEAA7', text: '#2D3436' }, // Yellow
      { background: '#DDA0DD', text: '#FFFFFF' }, // Plum
      { background: '#98D8C8', text: '#2D3436' }, // Mint
      { background: '#F7DC6F', text: '#2D3436' }, // Gold
      { background: '#BB8FCE', text: '#FFFFFF' }, // Purple
      { background: '#85C1E9', text: '#FFFFFF' }, // Light Blue
      { background: '#F8C471', text: '#2D3436' }, // Orange
      { background: '#82E0AA', text: '#2D3436' }, // Light Green
    ];
  }

  // Check if status is about to expire (within 1 hour)
  static isStatusExpiringSoon(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;

    return diff > 0 && diff <= oneHour;
  }
}

module.exports = StatusUtils;
