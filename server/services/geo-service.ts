// server/services/geo-service.ts
// ============================================================================
// GEO SERVICE - FIXED WITH LAZY LOADING
// ============================================================================

// Lazy load axios
let axios: any = null;

async function getAxios() {
  if (!axios) {
    const module = await import('axios');
    axios = module.default;
  }
  return axios;
}

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
  private apiKey: string |
  private cacheEnabled: boolean
  private cache: Map<string, LocationData>

  constructor(apiKey?: string, cacheEnabled: boolean = true) {
    this.apiKey = apiKey ||
    this.cacheEnabled = cacheEnabled
    this.cache = new Map()
  }

  /**
   * Get location data by IP address
   */
  async getLocationByIP(ip: string): Promise<LocationData | null> {
    try {
      // Check cache first
      if (this.cacheEnabled && this.cache.has(ip)) {
        console.log(`[GeoService] Cache hit for IP: ${ip}`)
        return this.cache.get(ip)!
      }

      const axiosLib = await getAxios();

      // Use ipapi.co (free tier: requests/day)
      const url = `https://ipapi.co/${ip}/json/`
      const response = await axiosLib.get(url)

      const locationData: LocationData = {
        ip: response.data.ip,
        country: response.data.country_name,
        countryCode: response.data.country_code,
        region: response.data.region,
        city: response.data.city,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.timezone,
        isp: response.data.org,
        organization: response.data.org
      }

      // Cache the result
      if (this.cacheEnabled) {
        this.cache.set(ip, locationData)
      }

      return locationData
    } catch (error) {
      console.error(`[GeoService] Failed to get location for IP ${ip}:`, error)
      return null
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[GeoService] Cache cleared')
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const geoService = new GeoService();
