-- Migration script to fix chat_messages table
-- This script will update the session_id column type and add missing columns

-- First, drop the existing table if it exists (for development only)
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- Recreate the table with the correct schema
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  mode VARCHAR(50) NOT NULL DEFAULT 'research' CHECK (mode IN ('research', 'doctor', 'source-finder')),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB,
  confidence_score INTEGER,
  reasoning_steps JSONB,
  multi_agent_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mode ON public.chat_messages(mode);

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_messages
DO $$
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can view their own chat messages'
    ) THEN
        CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy for INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can insert their own chat messages'
    ) THEN
        CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy for UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can update their own chat messages'
    ) THEN
        CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy for DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can delete their own chat messages'
    ) THEN
        CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create an updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
