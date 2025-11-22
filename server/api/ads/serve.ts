import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const location = user.location || 'Nigeria';
    const rank = user.rank || 'Homie';
    const interests = user.interests || [];
    const page = getQuery(event).page || 'Home Feed';

    // Get internal ads
    const { data: internalAds, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'approved')
      .eq('location', location)
      .contains('target_ranks', [rank])
      .overlaps('target_interests', interests);
      
    if (adsError) throw adsError;

    // Get page rules
    const { data: pageRules, error: rulesError } = await supabase
      .from('ad_page_rules')
      .select('*');
      
    if (rulesError) throw rulesError;

    const pageRule = pageRules?.find(p => p.name === page);

    // Get external ad sources
    const { data: externalSources, error: sourcesError } = await supabase
      .from('external_ad_sources')
      .select('*');
      
    if (sourcesError) throw sourcesError;

    const externalAds = [];
    for (const source of externalSources || []) {
      const allowed = pageRule?.allowed?.external;
      const valid = source.config && source.config.length > 10;
      if (allowed && valid) {
        externalAds.push({
          id: `external-${source.platform}`,
          type: 'external',
          html: source.config,
          status: 'approved'
        });
      }
    }

    const allAds = [...(internalAds || []), ...externalAds];
    const allowedAds = allAds.filter(ad => pageRule?.allowed?.[ad.type]);

    if (pageRule?.auto_boost_enabled) {
      // Get metrics for auto-boost
      const { data: metrics, error: metricsError } = await supabase
        .from('ad_metrics')
        .select('*')
        .eq('action', 'variant')
        .eq('page', page);
        
      if (metricsError) throw metricsError;

      const formats = ['image', 'video', 'text', 'audio', 'external'];
      const formatStats = formats.map(format => {
        const filtered = metrics?.filter(m => m.variant === format) || [];
        const clicks = filtered.filter(m => m.action === 'click').length;
        const impressions = filtered.length;
        const ctr = impressions ? clicks / impressions : 0;
        return { format, ctr };
      });

      const topFormat = formatStats.sort((a, b) => b.ctr - a.ctr)[0]?.format;
      const boostedAds = allowedAds.filter(ad => ad.type === topFormat);
      const sorted = boostedAds.sort((a, b) => (b.bid || 0) - (a.bid || 0));
      return sorted.slice(0, 1);
    }

    const sorted = allowedAds.sort((a, b) => (b.bid || 0) - (a.bid || 0));
    return sorted.slice(0, 1);
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve ads'
    });
  }
});
