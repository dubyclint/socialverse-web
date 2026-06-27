// FILE: /server/models/ab-test.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface ABTest {
  id: string
  name: string
  description?: string
  feature: string
  startDate: string
  endDate: string
  targetCriteria: Record<string, any>
  variants: Array<{
    name: string
    percentage: number
    config: Record<string, any>
  }>
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED'
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ABTestAssignment {
  id: string
  testId: string
  userId: string
  variant: string
  assignedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ABTestModel {
  static async getTest(id: string): Promise<ABTest | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[ABTestModel] Test not found:', id)
        return null
      }

      return data as ABTest
    } catch (error) {
      console.error('[ABTestModel] Error fetching test:', error)
      throw error
    }
  }

  static async getActiveTests(): Promise<ABTest[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'RUNNING')
        .lte('startDate', now)
        .gte('endDate', now)

      if (error) throw error
      return (data || []) as ABTest[]
    } catch (error) {
      console.error('[ABTestModel] Error fetching active tests:', error)
      throw error
    }
  }

  static async createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          ...test,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ABTest
    } catch (error) {
      console.error('[ABTestModel] Error creating test:', error)
      throw error
    }
  }

  static async assignUserToVariant(testId: string, userId: string, variant: string): Promise<ABTestAssignment> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ab_test_assignments')
        .insert({
          testId,
          userId,
          variant,
          assignedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ABTestAssignment
    } catch (error) {
      console.error('[ABTestModel] Error assigning user:', error)
      throw error
    }
  }

  static async getUserVariant(testId: string, userId: string): Promise<string | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ab_test_assignments')
        .select('variant')
        .eq('testId', testId)
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[ABTestModel] No assignment found')
        return null
      }

      return data?.variant || null
    } catch (error) {
      console.error('[ABTestModel] Error fetching user variant:', error)
      throw error
    }
  }
}
