// server/services/geo-service.ts
// ============================================================================
// GEO SERVICE - FIXED SYNTAX
// ============================================================================

interface IpApiResponse {
  ip: string
  country_name: string
  country_code: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  org?: string
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
  private cacheEnabled: boolean;
  private cache: Map<string, LocationData>;

  constructor(_apiKey: string = '', cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
    this.cache = new Map();
  }

  /**
   * Get location data by IP address
   */
  async getLocationByIP(ip: string): Promise<LocationData | null> {
    try {
      if (this.cacheEnabled && this.cache.has(ip)) {
        return this.cache.get(ip)!;
      }

      const url = `https://ipapi.co/${ip}/json/`;
      const data = await $fetch<IpApiResponse>(url);

      const locationData: LocationData = {
        ip: data.ip,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.org,
        organization: data.org
      };

      if (this.cacheEnabled) {
        this.cache.set(ip, locationData);
      }

      return locationData;
    } catch (error) {
      console.error(`[GeoService] Failed to get location for IP ${ip}:`, error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const geoService = new GeoService();
