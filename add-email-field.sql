-- Add email field to user_profiles table
-- This script can be run on existing databases to add the email field

-- Add email column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Populate email field for existing users from auth.users table
UPDATE public.user_profiles 
SET email = auth.users.email
FROM auth.users 
WHERE public.user_profiles.id = auth.users.id 
AND public.user_profiles.email IS NULL;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_query_limit function to include email when creating profiles
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
