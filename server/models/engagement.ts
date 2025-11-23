// server/models/engagement.ts - Consolidated Engagement Model
// ============================================================================
// Consolidates: engagement/posts-processor.js, engagement/preprocessor.js

import { supabase } from '../utils/supabase.js'

export interface EngagementPrediction {
  engagementProbability: number
  rawScore: number
  confidence: number
  engagementCategory: string
  expectedActions: string[]
}

export interface EngagementFeatures {
  userAgeGroup: number
  userFollowerCount: number
  userAvgSessionLength: number
  userPostsPerWeek: number
  userLikesPerWeek: number
  itemAgeHours: number
  itemLikeRate: number
  itemCommentRate: number
  itemShareRate: number
  itemAuthorFollowerCount: number
  [key: string]: any
}

export class EngagementModel {
  // ============ PREPROCESSING METHODS ============
  
  static preprocess(inputData: EngagementFeatures): number[] {
    const features = new Array(50).fill(0)
    
    // User demographic features (0-4)
    features[0] = this.encodeAgeGroup(inputData.userAgeGroup)
    features[1] = this.normalizeLog(inputData.userFollowerCount)
    features[2] = this.normalizeMinMax(inputData.userAvgSessionLength, 0, 10800)
    features[3] = this.normalizeMinMax(inputData.userPostsPerWeek, 0, 50)
    features[4] = this.normalizeMinMax(inputData.userLikesPerWeek, 0, 500)
    
    // Item features (5-14)
    features[5] = this.normalizeMinMax(inputData.itemAgeHours, 0, 168)
    features[6] = this.normalizeMinMax(inputData.itemLikeRate, 0, 1000)
    features[7] = this.normalizeMinMax(inputData.itemCommentRate, 0, 100)
    features[8] = this.normalizeMinMax(inputData.itemShareRate, 0, 50)
    features[9] = this.normalizeLog(inputData.itemAuthorFollowerCount)
    
    return features
  }

  // ============ POSTPROCESSING METHODS ============
  
  static postprocess(outputData: number | number[], options: Record<string, any> = {}): EngagementPrediction {
    const rawScore = Array.isArray(outputData) ? outputData[0] : outputData
    
    // Apply sigmoid activation if not already applied
    const probability = 1 / (1 + Math.exp(-rawScore))
    
    // Apply calibration if available
    const calibratedProbability = this.calibrateEngagementProbability(probability)
    
    return {
      engagementProbability: calibratedProbability,
      rawScore: rawScore,
      confidence: this.calculateConfidence(probability),
      engagementCategory: this.categorizeEngagement(calibratedProbability),
      expectedActions: this.predictExpectedActions(calibratedProbability)
    }
  }

  // ============ NORMALIZATION HELPERS ============
  
  private static normalizeMinMax(value: number, min: number, max: number): number {
    if (max === min) return 0
    return (value - min) / (max - min)
  }

  private static normalizeLog(value: number): number {
    return Math.log1p(value) / Math.log1p(10000)
  }

  private static encodeAgeGroup(ageGroup: number): number {
    const ageGroupMap: Record<number, number> = {
      1: 0.1,
      2: 0.3,
      3: 0.5,
      4: 0.7,
      5: 0.9
    }
    return ageGroupMap[ageGroup] || 0.5
  }

  // ============ CALIBRATION METHODS ============
  
  private static calibrateEngagementProbability(probability: number): number {
    // Apply Platt scaling calibration
    const calibrationParams = {
      a: 1.2,
      b: -0.1
    }
    const logOdds = Math.log(probability / (1 - probability))
    const calibratedLogOdds = calibrationParams.a * logOdds + calibrationParams.b
    return 1 / (1 + Math.exp(-calibratedLogOdds))
  }

  private static calculateConfidence(probability: number): number {
    // Confidence based on distance from 0.5
    const distance = Math.abs(probability - 0.5)
    return Math.min(1, distance * 2)
  }

  private static categorizeEngagement(probability: number): string {
    if (probability < 0.2) return 'very_low'
    if (probability < 0.4) return 'low'
    if (probability < 0.6) return 'medium'
    if (probability < 0.8) return 'high'
    return 'very_high'
  }

  private static predictExpectedActions(probability: number): string[] {
    const actions: string[] = []
    
    if (probability > 0.3) actions.push('like')
    if (probability > 0.5) actions.push('comment')
    if (probability > 0.7) actions.push('share')
    if (probability > 0.8) actions.push('follow')
    
    return actions
  }

  // ============ DATABASE METHODS ============
  
  static async saveEngagementPrediction(
    userId: string,
    contentId: string,
    prediction: EngagementPrediction
  ) {
    try {
      const { data, error } = await supabase
        .from('engagement_predictions')
        .insert({
          user_id: userId,
          content_id: contentId,
          engagement_probability: prediction.engagementProbability,
          raw_score: prediction.rawScore,
          confidence: prediction.confidence,
          engagement_category: prediction.engagementCategory,
          expected_actions: prediction.expectedActions,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving engagement prediction:', error)
      throw error
    }
  }

  static async getEngagementStats(contentId: string) {
    try {
      const { data, error } = await supabase
        .from('engagement_predictions')
        .select('engagement_category, COUNT(*) as count')
        .eq('content_id', contentId)
        .group_by('engagement_category')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching engagement stats:', error)
      throw error
    }
  }

  static async getUserEngagementTrends(userId: string, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('engagement_predictions')
        .select('created_at, engagement_probability, engagement_category')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching engagement trends:', error)
      throw error
    }
  }

  static async getAverageEngagementByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('engagement_predictions')
        .select('engagement_probability')
        .eq('engagement_category', category)
      
      if (error) throw error
      
      if (!data || data.length === 0) return 0
      const sum = data.reduce((acc, item) => acc + item.engagement_probability, 0)
      return sum / data.length
    } catch (error) {
      console.error('Error calculating average engagement:', error)
      throw error
    }
  }
}
