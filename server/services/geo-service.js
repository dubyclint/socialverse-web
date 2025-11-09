const maxmind = require('maxmind');
const geoip = require('geoip-lite');
const axios = require('axios');
const redis = require('../config/redis');
const logger = require('../config/logger');

class GeoService {
  
  constructor() {
    this.maxmindReader = null;
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    this.initializeMaxMind();
  }
  
  /**
   * Initialize MaxMind database
   */
  async initializeMaxMind() {
    try {
      if (process.env.MAXMIND_LICENSE_KEY) {
        // Download and initialize MaxMind database
        this.maxmindReader = await maxmind.open('./data/GeoLite2-City.mmdb');
        logger.info('MaxMind GeoIP database initialized');
      } else {
        logger.warn('MaxMind license key not provided, using fallback GeoIP');
      }
    } catch (error) {
      logger.error('Failed to initialize MaxMind:', error);
    }
  }
  
  /**
   * Get location data for an IP address
   */
  async getLocationData(ip) {
    try {
      if (!ip || ip === '127.0.0.1' || ip === '::1') {
        return this.getDefaultLocation();
      }
      
      const cacheKey = `geo:${ip}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
      
      let locationData;
      
      // Try MaxMind first (more accurate)
      if (this.maxmindReader) {
        locationData = await this.getMaxMindLocation(ip);
      }
      
      // Fallback to geoip-lite
      if (!locationData) {
        locationData = this.getGeoIPLiteLocation(ip);
      }
      
      // Fallback to IP-API service
      if (!locationData) {
        locationData = await this.getIPAPILocation(ip);
      }
      
      // Default if all fail
      if (!locationData) {
        locationData = this.getDefaultLocation();
      }
      
      // Add risk assessment
      locationData.riskLevel = this.assessLocationRisk(locationData);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: locationData,
        timestamp: Date.now()
      });
      
      return locationData;
      
    } catch (error) {
      logger.error('Error getting location data:', error);
      return this.getDefaultLocation();
    }
  }
  
  /**
   * Get location using MaxMind
   */
  async getMaxMindLocation(ip) {
    try {
      const result = this.maxmindReader.get(ip);
      if (!result) return null;
      
      return {
        ip,
        country: result.country?.iso_code || 'UNKNOWN',
        countryName: result.country?.names?.en || 'Unknown',
        region: result.subdivisions?.[0]?.iso_code || 'UNKNOWN',
        regionName: result.subdivisions?.[0]?.names?.en || 'Unknown',
        city: result.city?.names?.en || 'Unknown',
        latitude: result.location?.latitude || 0,
        longitude: result.location?.longitude || 0,
        timezone: result.location?.time_zone || 'UTC',
        isp: result.traits?.isp || 'Unknown',
        source: 'maxmind'
      };
    } catch (error) {
      logger.error('MaxMind lookup error:', error);
      return null;
    }
  }
  
  /**
   * Get location using geoip-lite
   */
  getGeoIPLiteLocation(ip) {
    try {
      const result = geoip.lookup(ip);
      if (!result) return null;
      
      return {
        ip,
        country: result.country || 'UNKNOWN',
        countryName: result.country || 'Unknown',
        region: result.region || 'UNKNOWN',
        regionName: result.region || 'Unknown',
        city: result.city || 'Unknown',
        latitude: result.ll?.[0] || 0,
        longitude: result.ll?.[1] || 0,
        timezone: result.timezone || 'UTC',
        source: 'geoip-lite'
      };
    } catch (error) {
      logger.error('GeoIP-lite lookup error:', error);
      return null;
    }
  }
  
  /**
   * Get location using IP-API service
   */
  async getIPAPILocation(ip) {
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000
      });
      
      if (response.data.status !== 'success') return null;
      
      const data = response.data;
      return {
        ip,
        country: data.countryCode || 'UNKNOWN',
        countryName: data.country || 'Unknown',
        region: data.region || 'UNKNOWN',
        regionName: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || 'UTC',
        isp: data.isp || 'Unknown',
        source: 'ip-api'
      };
    } catch (error) {
      logger.error('IP-API lookup error:', error);
      return null;
    }
  }
  
  /**
   * Get default location for unknown IPs
   */
  getDefaultLocation() {
    return {
      ip: 'unknown',
      country: 'UNKNOWN',
      countryName: 'Unknown',
      region: 'UNKNOWN',
      regionName: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      riskLevel: 'MEDIUM',
      source: 'default'
    };
  }
  
  /**
   * Assess location risk level
   */
  assessLocationRisk(locationData) {
    const { country, isp } = locationData;
    
    // High-risk countries (sanctions, high fraud rates)
    const highRiskCountries = [
      'IR', 'KP', 'SY', 'CU', 'MM', 'AF', 'BY', 'RU'
    ];
    
    // Medium-risk countries
    const mediumRiskCountries = [
      'CN', 'VE', 'LB', 'IQ', 'LY', 'SO', 'SD', 'YE'
    ];
    
    if (highRiskCountries.includes(country)) {
      return 'HIGH';
    }
    
    if (mediumRiskCountries.includes(country)) {
      return 'MEDIUM';
    }
    
    // Check for VPN/Proxy indicators
    if (isp && (
      isp.toLowerCase().includes('vpn') ||
      isp.toLowerCase().includes('proxy') ||
      isp.toLowerCase().includes('tor')
    )) {
      return 'HIGH';
    }
    
    return 'LOW';
  }
  
  /**
   * Check if country is sanctioned
   */
  isSanctionedCountry(country) {
    const sanctionedCountries = [
      'IR', 'KP', 'SY', 'CU', 'MM', 'AF', 'BY'
    ];
    return sanctionedCountries.includes(country);
  }
  
  /**
   * Get jurisdiction-specific regulations
   */
  getJurisdictionRegulations(country) {
    const regulations = {
      'US': {
        crypto: ['FinCEN', 'SEC', 'CFTC'],
        privacy: ['CCPA'],
        kyc: 'REQUIRED',
        aml: 'STRICT'
      },
      'GB': {
        crypto: ['FCA'],
        privacy: ['UK-GDPR'],
        kyc: 'REQUIRED',
        aml: 'STRICT'
      },
      'EU': {
        crypto: ['MiCA'],
        privacy: ['GDPR'],
        kyc: 'REQUIRED',
        aml: 'STRICT'
      },
      'CN': {
        crypto: ['BANNED'],
        privacy: ['PIPL'],
        kyc: 'REQUIRED',
        aml: 'STRICT'
      },
      'SG': {
        crypto: ['MAS'],
        privacy: ['PDPA'],
        kyc: 'REQUIRED',
        aml: 'STRICT'
      }
    };
    
    return regulations[country] || {
      crypto: ['UNKNOWN'],
      privacy: ['UNKNOWN'],
      kyc: 'UNKNOWN',
      aml: 'UNKNOWN'
    };
  }
  
  /**
   * Validate location consistency
   */
  async validateLocationConsistency(userId, currentLocation) {
    try {
      // Get user's historical locations
      const historicalLocations = await this.getUserLocationHistory(userId);
      
      if (historicalLocations.length === 0) {
        return { consistent: true, risk: 'LOW' };
      }
      
      const lastLocation = historicalLocations[0];
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        lastLocation.latitude,
        lastLocation.longitude
      );
      
      // Check for impossible travel (more than 1000km in 1 hour)
      const timeDiff = Date.now() - new Date(lastLocation.timestamp).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const maxPossibleDistance = hoursDiff * 1000; // 1000km/hour max
      
      if (distance > maxPossibleDistance && hoursDiff < 1) {
        return {
          consistent: false,
          risk: 'HIGH',
          reason: 'IMPOSSIBLE_TRAVEL',
          distance,
          timeDiff: hoursDiff
        };
      }
      
      return { consistent: true, risk: 'LOW' };
      
    } catch (error) {
      logger.error('Location validation error:', error);
      return { consistent: true, risk: 'MEDIUM' };
    }
  }
  
  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Get user location history
   */
  async getUserLocationHistory(userId, limit = 10) {
    try {
      // This would query your audit logs or user location history
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting location history:', error);
      return [];
    }
  }
}

module.exports = new GeoService();
