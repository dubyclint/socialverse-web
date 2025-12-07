// utils/group-utils.ts

export class GroupUtils {
  // Generate group invite link
  static async generateInviteLink(groupId: string, inviterId: string, expiresIn: string = '7d'): Promise<string> {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Return invite URL
    const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app';
    return `${baseUrl}/groups/join/${groupId}?token=${token}`;
  }

  // Validate group name
  static validateGroupName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Group name is required' };
    }
    
    if (name.length < 3) {
      return { valid: false, error: 'Group name must be at least 3 characters' };
    }
    
    if (name.length > 50) {
      return { valid: false, error: 'Group name must be 50 characters or less' };
    }
    
    return { valid: true };
  }

  // Format group member count
  static formatMemberCount(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }
}
