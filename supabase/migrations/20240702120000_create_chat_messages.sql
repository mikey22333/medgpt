-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp" with schema public;

-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  mode text not null,
  role text not null,
  content text not null,
  citations jsonb,
  confidence_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

-- Create RLS policies
alter table public.chat_messages enable row level security;

-- Users can only see their own messages
create policy "Users can view their own messages"
on public.chat_messages
for select
using (auth.uid() = user_id);

-- Users can insert their own messages
create policy "Users can create their own messages"
on public.chat_messages
for insert
with check (auth.uid() = user_id);

-- Users can update their own messages
create policy "Users can update their own messages"
on public.chat_messages
for update
using (auth.uid() = user_id);

-- Users can delete their own messages
create policy "Users can delete their own messages"
on public.chat_messages
for delete
using (auth.uid() = user_id);

-- Create function to update updated_at column
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to update updated_at column
create trigger update_chat_messages_updated_at
before update on public.chat_messages
for each row
execute function public.update_updated_at_column();

-- Create function to get user conversations
create or replace function public.get_user_conversations(user_id_param uuid)
returns table (
  session_id uuid,
  title text,
  mode text,
  last_message text,
  message_count bigint,
  updated_at timestamptz
) as $$
begin
  return query
  with latest_messages as (
    select 
      cm1.session_id,
      cm1.mode,
      cm1.content as last_message,
      cm1.updated_at,
      (select count(*) from public.chat_messages cm2 where cm2.session_id = cm1.session_id) as message_count,
      row_number() over (partition by cm1.session_id order by cm1.created_at) as rn
    from public.chat_messages cm1
    where cm1.user_id = user_id_param
  )
  select 
    lm.session_id,
    case 
      when lm.rn = 1 then split_part(lm.last_message, E'\n', 1)
      else 'New Conversation'
    end as title,
    lm.mode,
    lm.last_message,
    lm.message_count,
    lm.updated_at
  from latest_messages lm
  where lm.updated_at = (
    select max(updated_at) 
    from public.chat_messages 
    where session_id = lm.session_id
  )
  order by lm.updated_at desc;
end;
$$ language plpgsql security definer;
