import { getSupabaseClient } from '~/server/utils/database';

// Rank thresholds
const RANK_THRESHOLDS = [
  { name: 'Homie', minPoints: 0 },
  { name: 'Pal', minPoints: 100 },
  { name: 'Buddy', minPoints: 500 },
  { name: 'Friend', minPoints: 1000 },
  { name: 'BestFriend', minPoints: 2500 },
  { name: 'Elite', minPoints: 5000 }
];

function calculateRank(points: number) {
  const rank = RANK_THRESHOLDS
    .reverse()
    .find(r => points >= r.minPoints);
  return rank || RANK_THRESHOLDS[0];
}

export default defineEventHandler(async (event) => {
  try {
    // Initialize Supabase client
    const supabase = await getSupabaseClient();
    
    const { userId, delta } = await readBody(event);

    if (!userId || delta === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId and delta'
      });
    }

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('rank_points')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    const currentPoints = user.rank_points || 0;
    const newPoints = Math.max(0, currentPoints + delta); // Prevent negative points
    const newRank = calculateRank(newPoints);

    // Update user's points and rank
    const { error: updateError } = await supabase
      .from('users')
      .update({
        rank_points: newPoints,
        rank: newRank.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;

    return { 
      success: true,
      rank: newRank.name,
      points: newPoints
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update rank'
    });
  }
});

