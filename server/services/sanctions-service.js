const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const redis = require('../config/redis');
const logger = require('../config/logger');

class SanctionsService {
  
  constructor() {
    this.sanctionsLists = new Map();
    this.lastUpdate = null;
    this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.initializeSanctionsData();
  }
  
  /**
   * Initialize sanctions data
   */
  async initializeSanctionsData() {
    try {
      await this.loadSanctionsLists();
      
      // Set up periodic updates
      setInterval(() => {
        this.updateSanctionsLists();
      }, this.updateInterval);
      
      logger.info('Sanctions service initialized');
    } catch (error) {
      logger.error('Failed to initialize sanctions service:', error);
    }
  }
  
  /**
   * Load sanctions lists from various sources
   */
  async loadSanctionsLists() {
    try {
      // Load OFAC SDN List
      await this.loadOFACSanctions();
      
      // Load UN Sanctions List
      await this.loadUNSanctions();
      
      // Load EU Sanctions List
      await this.loadEUSanctions();
      
      // Load custom sanctions list
      await this.loadCustomSanctions();
      
      this.lastUpdate = new Date();
      logger.info('Sanctions lists loaded successfully');
      
    } catch (error) {
      logger.error('Error loading sanctions lists:', error);
    }
  }
  
  /**
   * Load OFAC SDN (Specially Designated Nationals) List
   */
  async loadOFACSanctions() {
    try {
      const response = await axios.get(
        'https://www.treasury.gov/ofac/downloads/sdn.csv',
        { timeout: 30000 }
      );
      
      const sanctions = [];
      const lines = response.data.split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const fields = this.parseCSVLine(line);
        if (fields.length >= 2) {
          sanctions.push({
            id: fields[0],
            name: fields[1],
            type: 'INDIVIDUAL',
            source: 'OFAC_SDN',
            addedDate: new Date().toISOString()
          });
        }
      }
      
      this.sanctionsLists.set('OFAC_SDN', sanctions);
      logger.info(`Loaded ${sanctions.length} OFAC SDN entries`);
      
    } catch (error) {
      logger.error('Error loading OFAC sanctions:', error);
    }
  }
  
  /**
   * Load UN Sanctions List
   */
  async loadUNSanctions() {
    try {
      const response = await axios.get(
        'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
        { timeout: 30000 }
      );
      
      // Parse XML and extract sanctions data
      // This is a simplified version - you'd want proper XML parsing
      const sanctions = [];
      this.sanctionsLists.set('UN_SANCTIONS', sanctions);
      
      logger.info(`Loaded ${sanctions.length} UN sanctions entries`);
      
    } catch (error) {
      logger.error('Error loading UN sanctions:', error);
    }
  }
  
  /**
   * Load EU Sanctions List
   */
  async loadEUSanctions() {
    try {
      // EU sanctions would be loaded from their official API/files
      const sanctions = [];
      this.sanctionsLists.set('EU_SANCTIONS', sanctions);
      
      logger.info(`Loaded ${sanctions.length} EU sanctions entries`);
      
    } catch (error) {
      logger.error('Error loading EU sanctions:', error);
    }
  }
  
  /**
   * Load custom sanctions list
   */
  async loadCustomSanctions() {
    try {
      const customPath = path.join(__dirname, '../data/custom-sanctions.json');
      
      try {
        const data = await fs.readFile(customPath, 'utf8');
        const sanctions = JSON.parse(data);
        this.sanctionsLists.set('CUSTOM', sanctions);
        logger.info(`Loaded ${sanctions.length} custom sanctions entries`);
      } catch (fileError) {
        // File doesn't exist, create empty list
        this.sanctionsLists.set('CUSTOM', []);
        logger.info('No custom sanctions file found, using empty list');
      }
      
    } catch (error) {
      logger.error('Error loading custom sanctions:', error);
    }
  }
  
  /**
   * Check if user is on sanctions list
   */
  async checkUser(userId, context = {}) {
    try {
      // Get user data (you'll need to integrate with your user system)
      const userData = await this.getUserData(userId);
      
      if (!userData) {
        return {
          allowed: true,
          reason: 'USER_NOT_FOUND',
          confidence: 0
        };
      }
      
      // Check against all sanctions lists
      const results = [];
      
      for (const [listName, sanctions] of this.sanctionsLists) {
        const match = await this.checkAgainstList(userData, sanctions, listName);
        if (match.found) {
          results.push(match);
        }
      }
      
      // If any matches found, block access
      if (results.length > 0) {
        const highestConfidence = Math.max(...results.map(r => r.confidence));
        
        return {
          allowed: false,
          reason: 'SANCTIONS_MATCH',
          matches: results,
          confidence: highestConfidence,
          message: 'Access denied due to sanctions compliance'
        };
      }
      
      return {
        allowed: true,
        reason: 'NO_SANCTIONS_MATCH',
        confidence: 1
      };
      
    } catch (error) {
      logger.error('Sanctions check error:', error);
      
      // Fail-safe: block access on error for high-risk operations
      return {
        allowed: false,
        reason: 'SANCTIONS_CHECK_ERROR',
        confidence: 0,
        message: 'Unable to verify sanctions status'
      };
    }
  }
  
  /**
   * Check user data against a specific sanctions list
   */
  async checkAgainstList(userData, sanctions, listName) {
    try {
      const matches = [];
      
      for (const sanctionEntry of sanctions) {
        const match = this.fuzzyMatch(userData, sanctionEntry);
        if (match.confidence > 0.8) {
          matches.push({
            entry: sanctionEntry,
            confidence: match.confidence,
            matchedFields: match.fields
          });
        }
      }
      
      if (matches.length > 0) {
        return {
          found: true,
          listName,
          matches,
          confidence: Math.max(...matches.map(m => m.confidence))
        };
      }
      
      return { found: false };
      
    } catch (error) {
      logger.error('Error checking against sanctions list:', error);
      return { found: false };
    }
  }
  
  /**
   * Fuzzy matching algorithm for sanctions screening
   */
  fuzzyMatch(userData, sanctionEntry) {
    const matches = {
      name: 0,
      email: 0,
      phone: 0,
      address: 0
    };
    
    // Name matching
    if (userData.name && sanctionEntry.name) {
      matches.name = this.calculateSimilarity(
        userData.name.toLowerCase(),
        sanctionEntry.name.toLowerCase()
      );
    }
    
    // Email matching
    if (userData.email && sanctionEntry.email) {
      matches.email = userData.email.toLowerCase() === sanctionEntry.email.toLowerCase() ? 1 : 0;
    }
    
    // Phone matching
    if (userData.phone && sanctionEntry.phone) {
      matches.phone = this.normalizePhone(userData.phone) === this.normalizePhone(sanctionEntry.phone) ? 1 : 0;
    }
    
    // Calculate overall confidence
    const weights = { name: 0.6, email: 0.3, phone: 0.1 };
    let confidence = 0;
    let totalWeight = 0;
    
    for (const [field, score] of Object.entries(matches)) {
      if (score > 0) {
        confidence += score * weights[field];
        totalWeight += weights[field];
      }
    }
    
    confidence = totalWeight > 0 ? confidence / totalWeight : 0;
    
    return {
      confidence,
      fields: Object.keys(matches).filter(field => matches[field] > 0.5)
    };
  }
  
  /**
   * Calculate string similarity using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  }
  
  /**
   * Normalize phone number for comparison
   */
  normalizePhone(phone) {
    return phone.replace(/\D/g, '');
  }
  
  /**
   * Parse CSV line handling quoted fields
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  /**
   * Get user data for sanctions checking
   */
  async getUserData(userId) {
    try {
      // This should integrate with your main app's user system
      // For now, return mock data
      return {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };
    } catch (error) {
      logger.error('Error getting user data:', error);
      return null;
    }
  }
  
  /**
   * Update sanctions lists
   */
  async updateSanctionsLists() {
    try {
      logger.info('Updating sanctions lists...');
      await this.loadSanctionsLists();
      logger.info('Sanctions lists updated successfully');
    } catch (error) {
      logger.error('Error updating sanctions lists:', error);
    }
  }
  
  /**
   * Add custom sanctions entry
   */
  async addCustomSanction(entry) {
    try {
      const customSanctions = this.sanctionsLists.get('CUSTOM') || [];
      customSanctions.push({
        ...entry,
        id: require('uuid').v4(),
        addedDate: new Date().toISOString(),
        source: 'CUSTOM'
      });
      
      this.sanctionsLists.set('CUSTOM', customSanctions);
      
      // Save to file
      const customPath = path.join(__dirname, '../data/custom-sanctions.json');
      await fs.writeFile(customPath, JSON.stringify(customSanctions, null, 2));
      
      logger.info('Custom sanctions entry added');
      return true;
      
    } catch (error) {
      logger.error('Error adding custom sanction:', error);
      return false;
    }
  }
  
  /**
   * Get sanctions statistics
   */
  getSanctionsStats() {
    const stats = {};
    
    for (const [listName, sanctions] of this.sanctionsLists) {
      stats[listName] = {
        count: sanctions.length,
        lastUpdate: this.lastUpdate
      };
    }
    
    return stats;
  }
}

module.exports = new SanctionsService();
