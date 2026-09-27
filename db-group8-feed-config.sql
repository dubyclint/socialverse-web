-- Group 8: algorithmic feed configuration + trending hashtag maintenance.
-- Additive and re-runnable.

insert into public.platform_configurations (config_key, config_values)
values (
  'feed_ranking',
  jsonb_build_object(
    'like_weight', 3,
    'comment_weight', 4,
    'share_weight', 5,
    'view_weight', 0.2,
    'following_boost', 2.5,
    'interest_boost', 2.0,
    'affinity_boost', 1.8,
    'gravity', 1.5,
    'candidate_pool', 300
  )
)
on conflict (config_key) do nothing;

insert into public.platform_configurations (config_key, config_values)
values (
  'ad_serving',
  jsonb_build_object(
    'enabled', true,
    'first_slot', 0,
    'every_n_items', 5,
    'max_in_app_ads', 3,
    'external_fallback', true,
    'external_provider', 'adsense',
    'external_client_id', '',
    'external_slot_id', ''
  )
)
on conflict (config_key) do nothing;

-- Trending hashtags are derived from posts rather than written by clients.
create or replace function public.refresh_trending_hashtags(p_window interval default interval '7 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  with counted as (
    select lower(tag) as hashtag, count(*)::integer as tag_count
    from public.posts p
    cross join lateral unnest(coalesce(p.hashtags, array[]::text[])) as tag
    where p.created_at >= now() - p_window
      and coalesce(p.is_draft, false) = false
      and coalesce(p.privacy, 'public') = 'public'
      and length(trim(tag)) > 0
    group by 1
  )
  insert into public.trending_hashtags (hashtag, count, last_updated)
  select hashtag, tag_count, now() from counted
  on conflict (hashtag) do update
    set count = excluded.count,
        last_updated = excluded.last_updated;

  get diagnostics affected = row_count;

  delete from public.trending_hashtags
  where last_updated < now() - interval '30 days';

  return affected;
end;
$$;

grant execute on function public.refresh_trending_hashtags(interval) to authenticated, service_role;

-- Ad interaction accounting: charge the campaign atomically and pause it when
-- the budget runs out.
create or replace function public.record_ad_interaction(
  p_campaign_id uuid,
  p_viewer_id uuid,
  p_interaction ad_action_type
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign record;
  v_cost numeric := 0;
begin
  select id, billing_model, bid_per_unit, remaining_budget, status
    into v_campaign
  from public.ads_campaigns
  where id = p_campaign_id
  for update;

  if not found or v_campaign.status <> 'ACTIVE' then
    return 0;
  end if;

  if p_interaction = 'IMPRESSION' and v_campaign.billing_model = 'CPM' then
    v_cost := coalesce(v_campaign.bid_per_unit, 0) / 1000;
  elsif p_interaction = 'CLICK' and v_campaign.billing_model = 'CPC' then
    v_cost := coalesce(v_campaign.bid_per_unit, 0);
  end if;

  insert into public.ad_interactions (campaign_id, viewer_id, interaction_type, cost_incurred)
  values (p_campaign_id, p_viewer_id, p_interaction, v_cost);

  if v_cost > 0 then
    update public.ads_campaigns
      set remaining_budget = greatest(0, remaining_budget - v_cost),
          status = case when remaining_budget - v_cost <= 0 then 'BUDGET_EXHAUSTED'::ad_campaign_lifecycle_status else status end,
          updated_at = now()
    where id = p_campaign_id;
  end if;

  return v_cost;
end;
$$;

grant execute on function public.record_ad_interaction(uuid, uuid, ad_action_type) to authenticated, service_role;
