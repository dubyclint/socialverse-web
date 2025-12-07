// server/services/sanctions-service.ts
// ============================================================================
// SANCTIONS SERVICE - FIXED WITH LAZY LOADING
// ============================================================================

import { supabase } from '~/server/utils/database'

// Lazy load axios
let axios: any = null;

async function getAxios() {
  if (!axios) {
    const module = await import('axios');
    axios = module.default;
  }
  return axios;
}

export interface SanctionedEntity {
  id: string
  name: string
  type: 'individual' | 'organization'
  country: string
  reason: string
  listSource: string
  addedDate: string
}

export class SanctionsService {
  private cache: Map<string, SanctionedEntity>
  private lastUpdate: Date | null

  constructor() {
    this.cache = new Map()
    this.lastUpdate = null
  }

  /**
   * Check if entity is sanctioned
   */
  async checkSanction(name: string, country?: string): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `${name}:${country || 'any'}`
      if (this.cache.has(cacheKey)) {
        return
      }

      // Check database
      const { data, error } = await supabase
        .from('sanctioned_entities')
        .select('*')
        .ilike('name', `%${name}%`)

      if (error) throw error

      if (data && data.length > 0) {
        // Cache the result
        data.forEach((entity: any) => {
          this.cache.set(`${entity.name}:${entity.country}`, entity)
        })
        return true
      }

      return false
    } catch (error) {
      console.error('[Sanctions] Check failed:', error)
      return false
    }
  }

  /**
   * Fetch sanctions list from external API
   */
  async updateSanctionsList(): Promise<void> {
    try {
      const axiosLib = await getAxios();

      // Example: Fetch from OFAC or UN sanctions list
      const response = await axiosLib.get('https://api.sanctions-list.com/v1/entities')

      const entities: SanctionedEntity[] = response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        country: item.country,
        reason: item.reason,
        listSource: item.source,
        addedDate: item.date
      }))

      // Update database
      for (const entity of entities) {
        await supabase
          .from('sanctioned_entities')
          .upsert(entity, { onConflict: 'id' })
      }

      this.lastUpdate = new Date()
      console.log(`[Sanctions] Updated ${entities.length} entities`)
    } catch (error) {
      console.error('[Sanctions] Update failed:', error)
      throw error
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get last update time
   */
  getLastUpdate(): Date | null {
    return this.lastUpdate
  }
}

// Export singleton instance
export const sanctionsService = new SanctionsService();
