// utils/contact-utils.ts

export class ContactUtils {
  // Normalize phone number
  static normalizePhone(phone: string | null): string | null {
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
    } else if (digits.length >) {
      // International number
      return `+${digits}`;
    }
    
    return null;
  }

  // Normalize email
  static normalizeEmail(email: string | null): string | null {
    if (!email) return null;
    return email.toLowerCase().trim();
  }

  // Format phone for display
  static formatPhone(phone: string): string {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length ===  && cleaned.startsWith('1')) {
      // US format: +1 (XXX) XXX-XXXX
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  }
}
