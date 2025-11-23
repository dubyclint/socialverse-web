// server/services/geo-service.ts
// ============================================================================
// GEO SERVICE - TYPESCRIPT CONVERSION
// ============================================================================

import axios from 'axios'

export interface LocationData {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  isp?: string
  organization?: string
}

export class GeoService {
  private cache: Map<string, LocationData> = new Map()
  private cacheTimeout: number = 60 * 60 * 1000 // 1 hour
  private ipStackApiKey: string = process.env.IPSTACK_API_KEY || ''

  /**
   * Get location data for an IP address
   */
  async getLocationData(ip: string): Promise<LocationData | null> {
    try {
      if (!ip || ip === '127.0.0.1' || ip === '::1') {
        return this.getLocalhost()
      }

      // Check cache
      if (this.cache.has(ip)) {
        const cached = this.cache.get(ip)
        if (cached && Date.now() - (cached as any).timestamp < this.cacheTimeout) {
          return cached
        }
      }

      // Try IPStack API first
      if (this.ipStackApiKey) {
        const location = await this.getLocationFromIPStack(ip)
        if (location) {
          this.cache.set(ip, location)
          return location
        }
      }

      // Fallback to IP API
      const location = await this.getLocationFromIPAPI(ip)
      if (location) {
        this.cache.set(ip, location)
        return location
      }

      return null
    } catch (error: any) {
      console.error('Error getting location data:', error)
      return null
    }
  }

  /**
   * Get location from IPStack API
   */
  private async getLocationFromIPStack(ip: string): Promise<LocationData | null> {
    try {
      const response = await axios.get(`http://api.ipstack.com/${ip}`, {
        params: {
          access_key: this.ipStackApiKey,
          format: 'json'
        }
      })

      const data = response.data

      return {
        ip,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region_name,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.time_zone?.id || 'UTC',
        isp: data.connection?.isp_name
      }
    } catch (error: any) {
      console.error('Error getting location from IPStack:', error)
      return null
    }
  }

  /**
   * Get location from IP API
   */
  private async getLocationFromIPAPI(ip: string): Promise<LocationData | null> {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`)

      const data = response.data

      return {
        ip,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        organization: data.org
      }
    } catch (error: any) {
      console.error('Error getting location from IP API:', error)
      return null
    }
  }

  /**
   * Get localhost location
   */
  private getLocalhost(): LocationData {
    return {
      ip: '127.0.0.1',
      country: 'Local',
      countryCode: 'LOCAL',
      region: 'Local',
      city: 'Local',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC'
    }
  }

  /**
   * Check if IP is in country
   */
  async isInCountry(ip: string, countryCode: string): Promise<boolean> {
    try {
      const location = await this.getLocationData(ip)
      return location?.countryCode === countryCode
    } catch (error: any) {
      console.error('Error checking country:', error)
      return false
    }
  }

  /**
   * Check if IP is in region
   */
  async isInRegion(ip: string, region: string): Promise<boolean> {
    try {
      const location = await this.getLocationData(ip)
      return location?.region === region
    } catch (error: any) {
      console.error('Error checking region:', error)
      return false
    }
  }

  /**
   * Get distance between two coordinates
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const geoService = new GeoService()
