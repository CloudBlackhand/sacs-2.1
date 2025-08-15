-- Tabela de usuários (whitelist)
create table if not exists public.users (
  username text primary key,
  password text not null,
  whitelist integer not null default 0,
  admin integer not null default 0
);

-- Tabela de mensagens classificadas
create table if not exists public.messages (
  id bigserial primary key,
  "from" text not null,
  body text not null,
  sentiment text not null check (sentiment in ('positive','negative','neutral')),
  matched_pattern text,
  direction text not null default 'inbound' check (direction in ('inbound','outbound')),
  chat_id text,
  "to" text,
  created_at timestamp with time zone default now()
);

-- Função de resumo por sentimento
create or replace function public.messages_summary()
returns table (sentiment text, qty bigint) as $$
  select sentiment, count(*) as qty
  from public.messages
  group by sentiment
  order by qty desc;
$$ language sql stable;

-- Índices úteis
create index if not exists idx_messages_created_at on public.messages (created_at);
create index if not exists idx_messages_chat_id on public.messages (chat_id);
create index if not exists idx_messages_sentiment on public.messages (sentiment);


