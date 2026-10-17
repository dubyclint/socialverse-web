-- Ads Manager: campaign objective, one ad set (audience, placement, schedule)
-- and one creative per campaign. The whole budget is held from the
-- advertiser's (or Page's) wallet at publish time and spent per impression
-- (CPM). Unspent budget is returned when a campaign is rejected, ends or is
-- deleted.
alter table public.ads_campaigns
  add column if not exists objective text not null default 'ENGAGEMENT'
    check (objective in ('ENGAGEMENT', 'LEADS', 'SALES')),
  add column if not exists goal text not null default 'AWARENESS'
    check (goal in ('AWARENESS', 'ENGAGEMENT', 'TRAFFIC', 'MESSAGES', 'APP_INSTALLS', 'INSTANT_FORM', 'CATALOG_SALES', 'WEBSITE_CONVERSIONS')),
  add column if not exists special_category text
    check (special_category in ('FINANCIAL', 'EMPLOYMENT', 'HOUSING', 'SOCIAL_ISSUES_ELECTIONS_POLITICS')),
  add column if not exists page_id uuid references public.pages(id) on delete set null,
  add column if not exists adset_name text,
  add column if not exists conversion_location text not null default 'WEBSITE'
    check (conversion_location in ('POST', 'CHAT', 'WEBSITE', 'PAGE', 'APP', 'INSTANT_FORM', 'CATALOG')),
  add column if not exists post_id uuid references public.posts(id) on delete set null,
  add column if not exists ad_format text not null default 'SINGLE' check (ad_format in ('SINGLE', 'CAROUSEL')),
  add column if not exists media jsonb not null default '[]'::jsonb,
  add column if not exists primary_text text,
  add column if not exists headline text,
  add column if not exists cta_label text not null default 'LEARN_MORE',
  add column if not exists lead_form jsonb,
  add column if not exists catalog jsonb not null default '[]'::jsonb,
  add column if not exists schedule jsonb not null default '{}'::jsonb,
  add column if not exists daily_min_spend numeric not null default 0 check (daily_min_spend >= 0),
  add column if not exists daily_max_spend numeric check (daily_max_spend is null or daily_max_spend > 0),
  add column if not exists bid_strategy text not null default 'HIGHEST_VOLUME',
  add column if not exists funding_source text not null default 'USER' check (funding_source in ('USER', 'PAGE')),
  add column if not exists impressions_count integer not null default 0,
  add column if not exists clicks_count integer not null default 0,
  add column if not exists results_count integer not null default 0,
  add column if not exists spent numeric not null default 0,
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references public."user"(user_id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.ad_interactions add column if not exists metadata jsonb not null default '{}'::jsonb;
create index if not exists ad_interactions_viewer_recent_idx on public.ad_interactions (viewer_id, campaign_id, created_at desc);
create index if not exists ad_interactions_campaign_day_idx on public.ad_interactions (campaign_id, created_at desc);

create table if not exists public.ad_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ads_campaigns(id) on delete cascade,
  user_id uuid not null references public."user"(user_id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);
alter table public.ad_leads enable row level security;
revoke all on public.ad_leads from anon, authenticated;

-- Campaign rows are written only through the server API.
drop policy if exists ads_campaigns_advertiser_all on public.ads_campaigns;
drop policy if exists ads_campaigns_public_view on public.ads_campaigns;
create policy ads_campaigns_advertiser_read on public.ads_campaigns for select to authenticated using (advertiser_id = auth.uid());
revoke insert, update, delete on public.ads_campaigns from anon, authenticated;
drop policy if exists ad_interactions_insert on public.ad_interactions;
revoke insert, update, delete on public.ad_interactions from anon, authenticated;

/** Moves PEW from the funding wallet into a campaign budget. */
create or replace function public.ad_budget_hold(p_campaign_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
  v_balance numeric;
  v_locked boolean;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'budget must be positive' using errcode = '22023';
  end if;
  select * into v_c from ads_campaigns where id = p_campaign_id and deleted_at is null for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;

  if v_c.funding_source = 'PAGE' then
    insert into page_wallets (page_id) values (v_c.page_id) on conflict do nothing;
    select balance, is_locked into v_balance, v_locked from page_wallets where page_id = v_c.page_id for update;
    if v_locked then raise exception 'wallet is locked' using errcode = '55006'; end if;
    if v_balance < p_amount then raise exception 'insufficient balance' using errcode = '23514'; end if;
    update page_wallets set balance = balance - p_amount,
      withdrawable_balance = least(withdrawable_balance, balance - p_amount), updated_at = now()
    where page_id = v_c.page_id;
    insert into page_wallet_ledger (page_id, amount, transaction_type, operator_id, reference_id, metadata)
    values (v_c.page_id, -p_amount, 'AD_BUDGET_HOLD', v_c.advertiser_id, p_campaign_id, jsonb_build_object('campaign', v_c.title));
  else
    perform ensure_wallet(v_c.advertiser_id);
    select balance, is_locked into v_balance, v_locked from wallets where user_id = v_c.advertiser_id and currency = 'PEW' for update;
    if v_locked then raise exception 'wallet is locked' using errcode = '55006'; end if;
    if v_balance < p_amount then raise exception 'insufficient balance' using errcode = '23514'; end if;
    update wallets set balance = balance - p_amount,
      withdrawable_balance = least(withdrawable_balance, balance - p_amount), updated_at = now()
    where user_id = v_c.advertiser_id and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (v_c.advertiser_id, -p_amount, 'AD_BUDGET_HOLD', p_campaign_id, jsonb_build_object('campaign', v_c.title));
  end if;

  update ads_campaigns set total_budget = total_budget + p_amount, remaining_budget = remaining_budget + p_amount,
    status = case when status = 'BUDGET_EXHAUSTED' then 'ACTIVE'::ad_campaign_lifecycle_status else status end,
    updated_at = now()
  where id = p_campaign_id;
  return p_amount;
end $$;

/** Returns a campaign's unspent budget to its funding wallet as spendable PEW. */
create or replace function public.ad_budget_refund(p_campaign_id uuid, p_final_status ad_campaign_lifecycle_status)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
  v_amount numeric;
begin
  select * into v_c from ads_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;
  v_amount := coalesce(v_c.remaining_budget, 0);
  if v_amount > 0 then
    if v_c.funding_source = 'PAGE' and v_c.page_id is not null then
      update page_wallets set balance = balance + v_amount, updated_at = now() where page_id = v_c.page_id;
      insert into page_wallet_ledger (page_id, amount, transaction_type, operator_id, reference_id, metadata)
      values (v_c.page_id, v_amount, 'AD_BUDGET_REFUND', v_c.advertiser_id, p_campaign_id, jsonb_build_object('campaign', v_c.title));
    else
      perform ensure_wallet(v_c.advertiser_id);
      update wallets set balance = balance + v_amount, updated_at = now() where user_id = v_c.advertiser_id and currency = 'PEW';
      insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
      values (v_c.advertiser_id, v_amount, 'AD_BUDGET_REFUND', p_campaign_id, jsonb_build_object('campaign', v_c.title));
    end if;
  end if;
  update ads_campaigns set remaining_budget = 0, total_budget = total_budget - v_amount, status = p_final_status, updated_at = now()
  where id = p_campaign_id;
  return v_amount;
end $$;

/**
 * Records an ad event. Impressions are charged at the campaign's CPM, once
 * per viewer per campaign every 30 minutes, never for the advertiser's own
 * views and never past the daily cap. Other events are free and counted.
 */
drop function if exists public.record_ad_interaction(uuid, uuid, ad_action_type);
create or replace function public.record_ad_interaction(
  p_campaign_id uuid, p_viewer_id uuid, p_interaction ad_action_type,
  p_metadata jsonb default '{}'::jsonb
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
  v_cost numeric := 0;
  v_today numeric;
begin
  select * into v_c from ads_campaigns where id = p_campaign_id for update;
  if not found or v_c.status <> 'ACTIVE' or v_c.deleted_at is not null then return 0; end if;

  if p_interaction = 'IMPRESSION' then
    if p_viewer_id = v_c.advertiser_id then return 0; end if;
    if exists (select 1 from ad_interactions where campaign_id = p_campaign_id and viewer_id = p_viewer_id
               and interaction_type = 'IMPRESSION' and created_at > now() - interval '30 minutes') then
      return 0;
    end if;
    v_cost := least(coalesce(v_c.bid_per_unit, 0) / 1000, v_c.remaining_budget);
    if v_c.daily_max_spend is not null then
      select coalesce(sum(cost_incurred), 0) into v_today from ad_interactions
      where campaign_id = p_campaign_id and created_at >= date_trunc('day', now());
      if v_today >= v_c.daily_max_spend then return 0; end if;
      v_cost := least(v_cost, v_c.daily_max_spend - v_today);
    end if;
  end if;

  insert into ad_interactions (campaign_id, viewer_id, interaction_type, cost_incurred, metadata)
  values (p_campaign_id, p_viewer_id, p_interaction, v_cost, coalesce(p_metadata, '{}'::jsonb));

  update ads_campaigns set
    remaining_budget = greatest(0, remaining_budget - v_cost),
    spent = spent + v_cost,
    impressions_count = impressions_count + case when p_interaction = 'IMPRESSION' then 1 else 0 end,
    clicks_count = clicks_count + case when p_interaction = 'CLICK' then 1 else 0 end,
    results_count = results_count + case when p_interaction in ('LEAD', 'MESSAGE', 'CONVERSION') then 1 else 0 end,
    status = case when remaining_budget - v_cost <= 0 then 'BUDGET_EXHAUSTED'::ad_campaign_lifecycle_status else status end,
    updated_at = now()
  where id = p_campaign_id;

  return v_cost;
end $$;

revoke all on function public.ad_budget_hold(uuid, numeric) from public, anon, authenticated;
revoke all on function public.ad_budget_refund(uuid, ad_campaign_lifecycle_status) from public, anon, authenticated;
revoke all on function public.record_ad_interaction(uuid, uuid, ad_action_type, jsonb) from public, anon, authenticated;

-- Verification requests can be for a person or for a Page.
alter table public.pages add column if not exists is_verified boolean not null default false;
alter table public.pages add column if not exists verified_at timestamptz;
alter table public.badge_requests
  add column if not exists page_id uuid references public.pages(id) on delete cascade,
  add column if not exists category text,
  add column if not exists review_note text;
alter table public.badge_requests drop constraint if exists badge_requests_status_check;
alter table public.badge_requests add constraint badge_requests_status_check check (status in ('pending', 'approved', 'rejected', 'revoked'));

insert into platform_configurations (config_key, config_values)
values ('ad_pricing', '{"cpm_pew": 2, "min_budget_pew": 5, "min_daily_pew": 1}'::jsonb)
on conflict (config_key) do nothing;
insert into platform_configurations (config_key, config_values)
values ('external_ads', '{"monetag_enabled": true, "monetag_domain": "3nbf4.com", "monetag_zone_id": "12030144", "monetag_social_bar_src": "", "monetag_smartlink_url": "", "appodeal_enabled": true, "appodeal_app_key": "", "transition_cooldown_minutes": 15}'::jsonb)
on conflict (config_key) do nothing;
update platform_configurations set config_values = config_values || '{"every_n_items": 6, "first_slot": 3}'::jsonb where config_key = 'ad_serving';
