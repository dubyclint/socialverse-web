import { supabase } from '~/server/db'

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
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export class ABTestModel {
  static async create(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('ab_tests')
      .insert([
        {
          name: testData.name,
          description: testData.description,
          feature: testData.feature,
          start_date: testData.startDate,
          end_date: testData.endDate,
          target_criteria: testData.targetCriteria,
          variants: testData.variants,
          status: testData.status || 'ACTIVE',
          created_by: testData.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as ABTest
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as ABTest | null
  }

  static async getByFeature(feature: string) {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('feature', feature)
      .eq('status', 'ACTIVE')

    if (error) throw error
    return data as ABTest[]
  }

  static async update(id: string, updates: Partial<ABTest>) {
    const { data, error } = await supabase
      .from('ab_tests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ABTest
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('ab_tests')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
