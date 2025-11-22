// server/models/rank.js - Supabase PostgreSQL Rank Model
import { supabase } from '../utils/supabase.js';

export class Rank {
  static async initializeUserRanks(userId) {
    const categories = ['trading', 'social', 'content', 'overall'];
    
    const rankInserts = categories.map(category => ({
      user_id: userId,
      category,
      current_rank: 'Bronze I',
      rank_level: 1,
      points: 0,
      next_rank: 'Bronze II',
      points_to_next: 100,
      achievements: [],
      season_start: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('ranks')
      .insert(rankInserts)
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `);

    if (error) throw error;
    return data;
  }

  static async addPoints(userId, category, points, reason = null) {
    const { data: currentRank } = await supabase
      .from('ranks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (!currentRank) {
      throw new Error('User rank not found');
    }

    const newPoints = currentRank.points + points;
    const rankInfo = this.calculateRankFromPoints(newPoints);

    const { data, error } = await supabase
      .from('ranks')
      .update({
        points: newPoints,
        current_rank: rankInfo.rank,
        rank_level: rankInfo.level,
        next_rank: rankInfo.nextRank,
        points_to_next: rankInfo.pointsToNext,
        last_activity_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('category', category)
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Check for achievements
    if (rankInfo.level > currentRank.rank_level) {
      await this.awardRankUpAchievement(userId, category, rankInfo.rank);
    }

    return data;
  }

  static calculateRankFromPoints(points) {
    const ranks = [
      { name: 'Bronze I', level: 1, minPoints: 0, nextRank: 'Bronze II' },
      { name: 'Bronze II', level: 2, minPoints: 100, nextRank: 'Bronze III' },
      { name: 'Bronze III', level: 3, minPoints: 250, nextRank: 'Silver I' },
      { name: 'Silver I', level: 4, minPoints: 500, nextRank: 'Silver II' },
      { name: 'Silver II', level: 5, minPoints: 750, nextRank: 'Silver III' },
      { name: 'Silver III', level: 6, minPoints: 1000, nextRank: 'Gold I' },
      { name: 'Gold I', level: 7, minPoints: 1500, nextRank: 'Gold II' },
      { name: 'Gold II', level: 8, minPoints: 2000, nextRank: 'Gold III' },
      { name: 'Gold III', level: 9, minPoints: 2500, nextRank: 'Platinum I' },
      { name: 'Platinum I', level: 10, minPoints: 3500, nextRank: 'Platinum II' },
      { name: 'Platinum II', level: 11, minPoints: 5000, nextRank: 'Platinum III' },
      { name: 'Platinum III', level: 12, minPoints: 7500, nextRank: 'Diamond I' },
      { name: 'Diamond I', level: 13, minPoints: 10000, nextRank: 'Diamond II' },
      { name: 'Diamond II', level: 14, minPoints: 15000, nextRank: 'Diamond III' },
      { name: 'Diamond III', level: 15, minPoints: 25000, nextRank: 'Master' },
      { name: 'Master', level: 16, minPoints: 50000, nextRank: 'Grandmaster' },
      { name: 'Grandmaster', level: 17, minPoints: 100000, nextRank: null }
    ];

    for (let i = ranks.length - 1; i >= 0; i--) {
      if (points >= ranks[i].minPoints) {
        const nextRankPoints = ranks[i + 1]?.minPoints || ranks[i].minPoints + 100000;
        return {
          rank: ranks[i].name,
          level: ranks[i].level,
          nextRank: ranks[i].nextRank,
          pointsToNext: nextRankPoints - points
        };
      }
    }

    return ranks[0];
  }

  static async getUserRanks(userId) {
    const { data, error } = await supabase
      .from('ranks')
      .select('*')
      .eq('user_id', userId)
      .order('category');

    if (error) throw error;
    return data;
  }

  static async getLeaderboard(category, limit = 20) {
    const { data, error } = await supabase
      .from('ranks')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('category', category)
      .order('points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async awardAchievement(userId, category, achievementName) {
    const { data: currentRank } = await supabase
      .from('ranks')
      .select('achievements')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (!currentRank.achievements.includes(achievementName)) {
      const updatedAchievements = [...currentRank.achievements, achievementName];
      
      const { data, error } = await supabase
        .from('ranks')
        .update({ achievements: updatedAchievements })
        .eq('user_id', userId)
        .eq('category', category)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async awardRankUpAchievement(userId, category, newRank) {
    return await this.awardAchievement(userId, category, `Reached ${newRank}`);
  }

  static async updateStreakDays(userId, category) {
    const { data: currentRank } = await supabase
      .from('ranks')
      .select('streak_days, last_activity_at')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    const lastActivity = new Date(currentRank.last_activity_at);
    const today = new Date();
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    let newStreak = 1;
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = currentRank.streak_days + 1;
    } else if (daysDiff === 0) {
      // Same day
      newStreak = currentRank.streak_days;
    }
    // If daysDiff > 1, streak is broken (reset to 1)

    const { data, error } = await supabase
      .from('ranks')
      .update({ streak_days: newStreak })
      .eq('user_id', userId)
      .eq('category', category)
      .select()
      .single();

    if (error) throw error;

    // Award streak achievements
    if (newStreak >= 7 && newStreak % 7 === 0) {
      await this.awardAchievement(userId, category, `${newStreak} Day Streak`);
    }

    return data;
  }

  static async getGlobalRankings(limit = 100) {
    const { data, error } = await supabase
      .from('ranks')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('category', 'overall')
      .order('points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
