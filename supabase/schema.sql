-- Brokly schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Money is stored as bigint RUPEES (no paise). JSONB holds the flexible/commercial bits.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- brokers
create table if not exists brokers (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  phone        text unique,                 -- WhatsApp number, digits only e.g. 919812345678
  email        text,
  slug         text unique,                 -- yourname => storefront /b/[slug]
  city         text,
  wa_connected boolean default false,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------- properties (listings)
create table if not exists properties (
  id            uuid primary key default gen_random_uuid(),
  broker_id     uuid references brokers(id) on delete cascade,
  slug          text unique not null,
  status        text not null default 'published',  -- draft | published | under_offer | sold | rented | archived

  category         text,        -- residential | commercial | land | other
  subtype          text,        -- apartment | villa | plot | office_space | pub_bar_fnb | ...
  transaction_type text,        -- sale | lease | sale_or_lease

  title         text,
  headline      text,
  description   text,
  highlights    text[] default '{}',

  area_sqft     integer,
  floor         text,
  bedrooms      integer,
  bathrooms     integer,
  furnishing    text,
  availability  text,

  layout          jsonb default '[]',   -- [{item,count}]
  capacity        jsonb default '[]',   -- [{metric,value}]
  amenities       text[] default '{}',
  licenses        jsonb default '[]',   -- [{type,fee_inr,deposit_inr}]
  pricing_options jsonb default '[]',   -- [{option,price_inr,monthly_inr,...}]
  location        jsonb default '{}',   -- {area,city,maps_url,city_inferred}
  needs_clarification text[] default '{}',

  media         jsonb default '[]',   -- [{type:'image'|'video', url, mimetype}]
  cover_url     text,

  raw_source    text,                 -- original WhatsApp dump
  parsed        jsonb,                -- full parser output (audit / re-render)

  views         integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists properties_broker_idx on properties(broker_id);
create index if not exists properties_status_idx on properties(status);

-- ------------------------------------------------------------- collections
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  broker_id   uuid references brokers(id) on delete cascade,
  slug        text unique not null,
  name        text not null,
  listing_ids uuid[] default '{}',
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------- leads (enquiries)
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  broker_id   uuid references brokers(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  name        text,
  phone       text,
  source      text,                         -- listing_whatsapp | portal | manual | collection
  message     text,
  stage       text default 'new',           -- new | contacted | site_visit | negotiation | closed | lost
  heat        text default 'warm',          -- hot | warm | cold
  score       integer default 50,
  created_at  timestamptz default now(),
  last_msg_at timestamptz default now()
);
create index if not exists leads_broker_idx on leads(broker_id);
create index if not exists leads_property_idx on leads(property_id);

-- ------------------------------------------------------------- messages (WA thread)
create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id) on delete cascade,
  broker_id     uuid references brokers(id) on delete cascade,
  direction     text not null,              -- in | out
  body          text,
  media         jsonb default '[]',
  wa_message_id text,
  created_at    timestamptz default now()
);
create index if not exists messages_lead_idx on messages(lead_id);

-- ------------------------------------------------- wa_sessions (bot draft-listing builder)
create table if not exists wa_sessions (
  broker_phone text primary key,
  broker_id    uuid references brokers(id) on delete cascade,
  status       text default 'collecting',   -- collecting | parsing | done
  buffer_text  text default '',
  media        jsonb default '[]',
  updated_at   timestamptz default now()
);

-- ------------------------------------------------- wa_processed (webhook idempotency)
create table if not exists wa_processed (
  message_id text primary key,
  created_at timestamptz default now()
);
alter table wa_processed enable row level security;

-- ------------------------------------------------------------- realtime
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table properties;

-- ------------------------------------------------------------- RLS
alter table properties  enable row level security;
alter table collections enable row level security;
alter table brokers     enable row level security;

drop policy if exists "public reads published listings" on properties;
create policy "public reads published listings" on properties
  for select using (status in ('published','under_offer','sold','rented'));

drop policy if exists "public reads collections" on collections;
create policy "public reads collections" on collections for select using (true);

drop policy if exists "public reads broker storefront" on brokers;
create policy "public reads broker storefront" on brokers for select using (true);

-- leads, messages, wa_sessions: NO anon policy => only the service role can touch them.
alter table leads       enable row level security;
alter table messages    enable row level security;
alter table wa_sessions enable row level security;
