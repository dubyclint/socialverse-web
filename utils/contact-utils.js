// utils/contactUtils.js

class ContactUtils {
  // Normalize phone number
  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different country code formats
    if (digits.length === 10) {
      // Assume US number, add +1
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US number with country code
      return `+${digits}`;
    } else if (digits.length > 7) {
      // International number
      return `+${digits}`;
    }
    
    return digits;
  }

  // Normalize email
  static normalizeEmail(email) {
    if (!email) return null;
    return email.toLowerCase().trim();
  }

  // Validate contact data
  static validateContact(contact) {
    const errors = [];
    
    if (!contact.name || contact.name.trim().length === 0) {
      errors.push('Contact name is required');
    }
    
    if (!contact.phone && !contact.email) {
      errors.push('Either phone or email is required');
    }
    
    if (contact.phone && !this.isValidPhone(contact.phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate phone number
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const normalizedPhone = phone.replace(/\D/g, '');
    return phoneRegex.test(normalizedPhone) && normalizedPhone.length >= 7;
  }

  // Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate invitation message
  static generateInvitationMessage(senderName, customMessage) {
    const defaultMessage = `Hey! ${senderName} invited you to join SocialVerse - a private social platform where you can connect with friends securely. Download the app: [APP_LINK]`;
    
    return customMessage || defaultMessage;
  }

  // Parse contacts from various formats
  static parseContactsFromCSV(csvData) {
    const contacts = [];
    const lines = csvData.split('\n');
    
    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [name, phone, email] = line.split(',').map(field => field.trim());
      
      if (name) {
        contacts.push({
          name,
          phone: phone || null,
          email: email || null
        });
      }
    }
    
    return contacts;
  }
}

module.exports = ContactUtils;
