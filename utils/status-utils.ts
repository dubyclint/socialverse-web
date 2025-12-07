// utils/status-utils.ts

export class StatusUtils {
  // Validate status content
  static validateStatusContent(content: string, mediaType: 'text' | 'image' | 'video'): string[] {
    const errors: string[] = [];

    switch (mediaType) {
      case 'text':
        if (!content || content.trim().length === 0) {
          errors.push('Text content is required');
        } else if (content.length > 500) {
          errors.push('Text must be 500 characters or less');
        }
        break;
        
      case 'image':
        // Image validation would be done on upload
        break;
        
      case 'video':
        // Video validation would be done on upload
        break;
    }

    return errors;
  }

  // Calculate status expiry time
  static getExpiryTime(hours: number = 24): Date {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now;
  }

  // Check if status is expired
  static isExpired(expiryDate: Date | string): boolean {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return expiry < new Date();
  }

  // Format time remaining
  static formatTimeRemaining(expiryDate: Date | string): string {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
