import { supabase } from '~/server/utils/database';

export default defineEventHandler(async () => {
  try {
    const now = new Date();
    const months = [];
    const volume = [];
    const releaseTime = [];

    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const { data: deals, error } = await supabase
        .from('escrow_deals')
        .select('*')
        .gte('timestamp', start.toISOString())
        .lt('timestamp', end.toISOString());
        
      if (error) throw error;

      const totalVolume = deals?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
      const avgReleaseTime = deals
        ?.filter(d => d.is_released && d.released_at)
        ?.map(d => {
          const releaseTime = new Date(d.released_at).getTime();
          const createTime = new Date(d.timestamp).getTime();
          return (releaseTime - createTime) / 3600000; // Convert to hours
        }) || [];

      months.push(start.toLocaleString('default', { month: 'short' }));
      volume.push(Math.round(totalVolume));
      releaseTime.push(
        avgReleaseTime.length
          ? parseFloat((avgReleaseTime.reduce((a, b) => a + b, 0) / avgReleaseTime.length).toFixed(2))
          : 0
      );
    }

    return { months, volume, releaseTime };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch escrow analytics'
    });
  }
});

