// models/SocialLinks.js - User Social Media Links Model
import { supabase } from '../utils/supabase.js';

export class SocialLinks {
  // Get user's social links
  static async getUserSocialLinks(userId, includePrivate = false) {
    let query = supabase
      .from('user_social_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Add or update social link
  static async upsertSocialLink(userId, linkData) {
    const { data, error } = await supabase
      .from('user_social_links')
      .upsert([{
        user_id: userId,
        platform: linkData.platform,
        username: linkData.username,
        url: linkData.url,
        is_public: linkData.isPublic !== false, // Default to public
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete social link
  static async deleteSocialLink(userId, platform) {
    const { error } = await supabase
      .from('user_social_links')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;
    return true;
  }

  // Get supported platforms
  static getSupportedPlatforms() {
    return [
      { key: 'twitter', name: 'Twitter/X', icon: 'twitter', baseUrl: 'https://twitter.com/' },
      { key: 'instagram', name: 'Instagram', icon: 'instagram', baseUrl: 'https://instagram.com/' },
      { key: 'linkedin', name: 'LinkedIn', icon: 'linkedin', baseUrl: 'https://linkedin.com/in/' },
      { key: 'facebook', name: 'Facebook', icon: 'facebook', baseUrl: 'https://facebook.com/' },
      { key: 'github', name: 'GitHub', icon: 'github', baseUrl: 'https://github.com/' },
      { key: 'youtube', name: 'YouTube', icon: 'youtube', baseUrl: 'https://youtube.com/@' },
      { key: 'tiktok', name: 'TikTok', icon: 'tiktok', baseUrl: 'https://tiktok.com/@' },
      { key: 'discord', name: 'Discord', icon: 'discord', baseUrl: '' },
      { key: 'telegram', name: 'Telegram', icon: 'telegram', baseUrl: 'https://t.me/' },
      { key: 'website', name: 'Website', icon: 'globe', baseUrl: '' }
    ];
  }
}
// models/Verification.js - Enhanced Verification System Model
import { supabase } from '../utils/supabase.js';

export class Verification {
  // Submit verification application
  static async submitApplication(userId, applicationData) {
    const { data, error } = await supabase
      .from('verification_applications')
      .insert([{
        user_id: userId,
        application_type: applicationData.type,
        full_name: applicationData.fullName,
        government_id_type: applicationData.idType,
        government_id_number: applicationData.idNumber,
        government_id_document_url: applicationData.idDocumentUrl,
        // K2 Level fields
        address_line_1: applicationData.addressLine1,
        address_line_2: applicationData.addressLine2,
        city: applicationData.city,
        state_province: applicationData.stateProvince,
        postal_code: applicationData.postalCode,
        country: applicationData.country,
        proof_of_address_url: applicationData.proofOfAddressUrl,
        // Business fields
        business_name: applicationData.businessName,
        business_registration_number: applicationData.businessRegNumber,
        business_document_url: applicationData.businessDocumentUrl,
        additional_documents_urls: applicationData.additionalDocuments || []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user's verification applications
  static async getUserApplications(userId) {
    const { data, error } = await supabase
      .from('verification_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's verification badges
  static async getUserBadges(userId, includeInactive = false) {
    let query = supabase
      .from('user_verification_badges')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Check verification status
  static async getVerificationStatus(userId) {
    const badges = await this.getUserBadges(userId);
    const applications = await this.getUserApplications(userId);
    
    const activeApplication = applications.find(app => 
      ['pending', 'under_review'].includes(app.status)
    );

    return {
      isVerified: badges.length > 0,
      badges: badges,
      hasActiveApplication: !!activeApplication,
      activeApplication: activeApplication,
      allApplications: applications
    };
  }

  // Get verification requirements by type
  static getVerificationRequirements(type) {
    const requirements = {
      basic: {
        name: 'Basic Verification',
        description: 'Verify your identity with government ID',
        required: ['fullName', 'idType', 'idNumber', 'idDocument'],
        optional: []
      },
      k2_level_1: {
        name: 'K2 Level 1 Verification',
        description: 'Enhanced verification with address proof',
        required: ['fullName', 'idType', 'idNumber', 'idDocument', 'address', 'proofOfAddress'],
        optional: []
      },
      k2_level_2: {
        name: 'K2 Level 2 Verification',
        description: 'Highest level verification with additional documents',
        required: ['fullName', 'idType', 'idNumber', 'idDocument', 'address', 'proofOfAddress'],
        optional: ['additionalDocuments']
      },
      business: {
        name: 'Business Verification',
        description: 'Verify your business entity',
        required: ['businessName', 'businessRegNumber', 'businessDocument'],
        optional: ['additionalDocuments']
      }
    };

    return requirements[type] || requirements.basic;
  }
}
