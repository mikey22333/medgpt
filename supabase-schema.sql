-- Note: auth.users table is managed by Supabase and already has RLS enabled
-- We don't need to (and can't) enable RLS on it manually

-- Create user_queries table for tracking usage
CREATE TABLE IF NOT EXISTS public.user_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('research', 'doctor', 'source-finder')),
    query_text TEXT NOT NULL,
    response_text TEXT,
    citations JSONB,
    confidence_score INTEGER,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_queries_user_id ON public.user_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_created_at ON public.user_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_user_queries_mode ON public.user_queries(mode);

-- Enable RLS for user_queries table
ALTER TABLE public.user_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with conditional creation to avoid duplicates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_queries' 
        AND policyname = 'Users can view their own queries'
    ) THEN
        CREATE POLICY "Users can view their own queries" ON public.user_queries
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_queries' 
        AND policyname = 'Users can insert their own queries'
    ) THEN
        CREATE POLICY "Users can insert their own queries" ON public.user_queries
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_queries' 
        AND policyname = 'Users can update their own queries'
    ) THEN
        CREATE POLICY "Users can update their own queries" ON public.user_queries
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email VARCHAR(255),
    profession VARCHAR(100),
    organization VARCHAR(255),
    query_limit INTEGER DEFAULT 3,
    queries_used INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add last_reset_date column if it doesn't exist (for existing installations)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Add email column if it doesn't exist (for existing installations)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Populate email field for existing users from auth.users table
UPDATE public.user_profiles 
SET email = auth.users.email
FROM auth.users 
WHERE public.user_profiles.id = auth.users.id 
AND public.user_profiles.email IS NULL;

-- Update existing free users to have the new query limit of 3
UPDATE public.user_profiles 
SET query_limit = 3 
WHERE subscription_tier = 'free' AND query_limit = 2;

-- Enable RLS for user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (with conditional creation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON public.user_profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON public.user_profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON public.user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, query_limit, queries_used, last_reset_date, subscription_tier)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 3, 0, CURRENT_DATE, 'free');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update query count with daily reset
DROP FUNCTION IF EXISTS public.increment_query_count(UUID);
CREATE OR REPLACE FUNCTION public.increment_query_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Reset count if it's a new day
    UPDATE public.user_profiles
    SET 
        queries_used = CASE 
            WHEN last_reset_date < CURRENT_DATE THEN 1 
            ELSE queries_used + 1 
        END,
        last_reset_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check query limits with daily reset
DROP FUNCTION IF EXISTS public.check_query_limit(UUID);
CREATE OR REPLACE FUNCTION public.check_query_limit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    profile_record RECORD;
    reset_needed BOOLEAN;
    can_chat BOOLEAN;
    time_until_reset INTERVAL;
BEGIN
    -- First check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_uuid) THEN
        -- Create profile if it doesn't exist, including email from auth.users
        INSERT INTO public.user_profiles (id, email, query_limit, queries_used, last_reset_date, subscription_tier)
        SELECT user_uuid, auth.users.email, 3, 0, CURRENT_DATE, 'free'
        FROM auth.users 
        WHERE auth.users.id = user_uuid;
    END IF;
    
    SELECT 
        query_limit, 
        queries_used, 
        last_reset_date,
        subscription_tier
    INTO profile_record
    FROM public.user_profiles
    WHERE id = user_uuid;
    
    -- Handle null case
    IF profile_record.last_reset_date IS NULL THEN
        profile_record.last_reset_date := CURRENT_DATE;
        UPDATE public.user_profiles
        SET last_reset_date = CURRENT_DATE
        WHERE id = user_uuid;
    END IF;
    
    -- Check if reset is needed (new day)
    reset_needed := profile_record.last_reset_date < CURRENT_DATE;
    
    -- Reset if needed
    IF reset_needed THEN
        UPDATE public.user_profiles
        SET 
            queries_used = 0,
            last_reset_date = CURRENT_DATE,
            updated_at = now()
        WHERE id = user_uuid;
        
        profile_record.queries_used := 0;
    END IF;
    
    -- Pro users have unlimited queries
    IF profile_record.subscription_tier = 'pro' THEN
        can_chat := TRUE;
    ELSE
        can_chat := profile_record.queries_used < profile_record.query_limit;
    END IF;
    
    -- Calculate time until reset (next midnight)
    time_until_reset := (CURRENT_DATE + 1) - NOW();
    
    RETURN jsonb_build_object(
        'can_chat', can_chat,
        'queries_used', profile_record.queries_used,
        'query_limit', profile_record.query_limit,
        'subscription_tier', profile_record.subscription_tier,
        'time_until_reset_hours', EXTRACT(EPOCH FROM time_until_reset) / 3600,
        'reset_needed', reset_needed,
        'user_id', user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Chat Messages table for conversation management
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

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages USING btree (created_at) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_chat_messages_updated_at BEFORE
UPDATE ON chat_messages FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can view their own chat messages'
    ) THEN
        CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can insert their own chat messages'
    ) THEN
        CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can update their own chat messages'
    ) THEN
        CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can delete their own chat messages'
    ) THEN
        CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
