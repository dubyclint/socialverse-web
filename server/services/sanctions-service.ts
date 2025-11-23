// server/services/sanctions-service.ts
// ============================================================================
// SANCTIONS SERVICE - TYPESCRIPT CONVERSION
// ============================================================================

import axios from 'axios'
import { supabase } from '~/server/utils/database'

export interface SanctionedEntity {
  id: string
  name: string
  type: 'individual' | 'organization'
  country: string
  reason: string
  listSource: string
  addedDate: string
}

export interface SanctionCheckResult {
  isSanctioned: boolean
  matches: SanctionedEntity[]
  confidence: number
}

export class SanctionsService {
  private sanctionsLists: Map<string, Set<string>> = new Map()
  private lastUpdate: Date | null = null
  private updateInterval: number = 24 * 60 * 60 * 1000 // 24 hours
  private updateTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeSanctionsData()
  }

  /**
   * Initialize sanctions data
   */
  private async initializeSanctionsData(): Promise<void> {
    try {
      await this.loadSanctionsLists()

      // Set up periodic updates
      this.updateTimer = setInterval(() => {
        this.updateSanctionsLists()
      }, this.updateInterval)

      console.log('Sanctions service initialized')
    } catch (error: any) {
      console.error('Failed to initialize sanctions service:', error)
    }
  }

  /**
   * Load sanctions lists from various sources
   */
  private async loadSanctionsLists(): Promise<void> {
    try {
      // Load from database
      const { data: entities, error } = await supabase
        .from('sanctioned_entities')
        .select('name, list_source')

      if (error) throw error

      // Build in-memory index
      ;(entities || []).forEach(entity => {
        const source = entity.list_source || 'CUSTOM'
        if (!this.sanctionsLists.has(source)) {
          this.sanctionsLists.set(source, new Set())
        }
        this.sanctionsLists.get(source)?.add(entity.name.toLowerCase())
      })

      this.lastUpdate = new Date()
      console.log(`Loaded ${entities?.length || 0} sanctioned entities`)
    } catch (error: any) {
      console.error('Error loading sanctions lists:', error)
    }
  }

  /**
   * Update sanctions lists
   */
  private async updateSanctionsLists(): Promise<void> {
    try {
      console.log('Updating sanctions lists...')
      await this.loadSanctionsLists()
      console.log('Sanctions lists updated')
    } catch (error: any) {
      console.error('Error updating sanctions lists:', error)
    }
  }

  /**
   * Check if entity is sanctioned
   */
  async checkSanctions(name: string, country?: string): Promise<SanctionCheckResult> {
    try {
      const normalizedName = name.toLowerCase().trim()
      const matches: SanctionedEntity[] = []

      // Search in all lists
      for (const [source, entities] of this.sanctionsLists) {
        if (entities.has(normalizedName)) {
          // Get full entity data
          const { data: entity, error } = await supabase
            .from('sanctioned_entities')
            .select('*')
            .eq('name', name)
            .eq('list_source', source)
            .single()

          if (!error && entity) {
            matches.push(entity)
          }
        }
      }

      // Check for partial matches
      const partialMatches = this.findPartialMatches(normalizedName)
      matches.push(...partialMatches)

      return {
        isSanctioned: matches.length > 0,
        matches,
        confidence: matches.length > 0 ? 0.95 : 0
      }
    } catch (error: any) {
      console.error('Error checking sanctions:', error)
      return {
        isSanctioned: false,
        matches: [],
        confidence: 0
      }
    }
  }

  /**
   * Find partial matches
   */
  private findPartialMatches(name: string): SanctionedEntity[] {
    const matches: SanctionedEntity[] = []
    const nameParts = name.split(' ')

    for (const [source, entities] of this.sanctionsLists) {
      for (const entity of entities) {
        const entityParts = entity.split(' ')
        const commonParts = nameParts.filter(part => entityParts.includes(part))

        if (commonParts.length >= 2) {
          matches.push({
            id: `${source}:${entity}`,
            name: entity,
            type: 'individual',
            country: '',
            reason: 'Partial match',
            listSource: source,
            addedDate: new Date().toISOString()
          })
        }
      }
    }

    return matches
  }

  /**
   * Check user against sanctions
   */
  async checkUser(userId: string): Promise<SanctionCheckResult> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('username, full_name, country')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return {
          isSanctioned: false,
          matches: [],
          confidence: 0
        }
      }

      // Check username and full name
      const usernameCheck = await this.checkSanctions(user.username, user.country)
      const nameCheck = await this.checkSanctions(user.full_name, user.country)

      const allMatches = [...usernameCheck.matches, ...nameCheck.matches]

      return {
        isSanctioned: allMatches.length > 0,
        matches: allMatches,
        confidence: allMatches.length > 0 ? 0.95 : 0
      }
    } catch (error: any) {
      console.error('Error checking user sanctions:', error)
      return {
        isSanctioned: false,
        matches: [],
        confidence: 0
      }
    }
  }

  /**
   * Add sanctioned entity
   */
  async addSanctionedEntity(entity: Partial<SanctionedEntity>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sanctioned_entities')
        .insert({
          name: entity.name,
          type: entity.type,
          country: entity.country,
          reason: entity.reason,
          list_source: entity.listSource,
          added_date: new Date().toISOString()
        })

      if (error) throw error

      // Reload lists
      await this.loadSanctionsLists()
      return true
    } catch (error: any) {
      console.error('Error adding sanctioned entity:', error)
      return false
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }
  }
}

export const sanctionsService = new SanctionsService()
