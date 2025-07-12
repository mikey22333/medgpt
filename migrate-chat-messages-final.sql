-- Migration script to update chat_messages table structure
-- This will drop and recreate the table with the correct schema

-- First, backup any existing data (optional)
-- CREATE TABLE chat_messages_backup AS SELECT * FROM public.chat_messages;

-- Drop the existing table and recreate with correct schema
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- Create the updated table with exact schema
CREATE TABLE public.chat_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  session_id uuid not null,
  mode text not null,
  role text not null,
  content text not null,
  citations jsonb null,
  confidence_score integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_chat_messages_updated_at BEFORE
UPDATE ON chat_messages FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);
