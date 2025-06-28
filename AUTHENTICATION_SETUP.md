# MedGPT Scholar Authentication Setup Guide

This guide will help you set up secure authentication for MedGPT Scholar using Supabase Auth with Google OAuth and email authentication.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Google Cloud Console Account**: For Google OAuth setup
3. **Node.js and npm**: Ensure you have Node.js 18+ installed

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: `medgpt-scholar`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

## Step 2: Configure Supabase Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste into the SQL Editor and click **Run**
4. This will create:
   - `user_queries` table for tracking user interactions
   - `user_profiles` table for user data and limits
   - Row Level Security (RLS) policies
   - Functions for query counting and limits

## Step 3: Set Up Google OAuth

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure OAuth consent screen:
   - **Application type**: Web application
   - **Name**: `MedGPT Scholar`
   - **Authorized domains**: Add your domain
6. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Name**: `MedGPT Scholar Web Client`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-domain.com/auth/callback` (for production)

### Configure Supabase Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your environment variables:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Application URLs
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Together AI (existing)
   TOGETHER_API_KEY=your_together_ai_api_key_here
   ```

### Where to Find Supabase Keys

1. **Project URL & Anon Key**: 
   - Go to **Settings** > **API**
   - Copy **Project URL** and **anon public** key

2. **Service Role Key**: 
   - Same page, copy **service_role** key
   - ⚠️ Keep this secret and never expose it in client-side code

## Step 5: Configure Email Settings (Optional)

### For Magic Link Authentication

1. In Supabase dashboard, go to **Authentication** > **Settings**
2. Configure **SMTP Settings**:
   - Use your email provider (Gmail, SendGrid, etc.)
   - Or use Supabase's built-in email service

### Email Templates

1. Go to **Authentication** > **Email Templates**
2. Customize the confirmation and magic link emails
3. Update the redirect URLs to match your domain

## Step 6: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the login page
4. Test both Google OAuth and email authentication
5. After login, you should be redirected to the dashboard

## Step 7: Deploy Authentication (Production)

### Update Environment Variables for Production

1. Set production URLs in your hosting platform:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

### Configure Google OAuth for Production

1. In Google Cloud Console, add production redirect URI:
   ```
   https://your-domain.com/auth/callback
   ```

### Update Supabase Settings

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL**: `https://your-domain.com`
3. Add **Redirect URLs**: `https://your-domain.com/**`

## Authentication Features

### ✅ Implemented Features

- **Google OAuth 2.0** sign-in
- **Email/password** authentication
- **Magic link** authentication (passwordless)
- **Protected routes** with middleware
- **Session management** with automatic refresh
- **User query tracking** and limits
- **Row Level Security** for data protection
- **Automatic user profile** creation
- **Query limit enforcement** (1000 queries/month for free tier)

### 🔒 Security Features

- **JWT-based** authentication
- **Row Level Security** on all tables
- **Protected API routes** with auth checks
- **CSRF protection** via secure cookies
- **Query limit enforcement** to prevent abuse

### 📊 User Management

- **User profiles** with profession and organization
- **Query tracking** by mode (research, doctor, source-finder)
- **Usage analytics** and limits
- **Subscription tiers** support (ready for premium features)

## Troubleshooting

### Common Issues

1. **"Authentication required" error**:
   - Check if Supabase URL and keys are correct
   - Verify user is properly logged in
   - Check browser cookies and local storage

2. **Google OAuth not working**:
   - Verify redirect URLs match exactly
   - Check Google OAuth consent screen configuration
   - Ensure domain is authorized in Google Cloud Console

3. **Database errors**:
   - Run the SQL schema setup script
   - Check if RLS policies are enabled
   - Verify user has proper permissions

4. **Environment variables**:
   - Restart development server after changes
   - Check for typos in variable names
   - Ensure no trailing spaces in values

### Debug Authentication

1. Check browser developer console for errors
2. Monitor Supabase Auth logs in dashboard
3. Use Supabase's auth debug mode:
   ```typescript
   const { data, error } = await supabase.auth.getSession();
   console.log('Auth session:', data, error);
   ```

## Next Steps

1. **Customize user profiles** - Add fields for profession, organization
2. **Implement premium tiers** - Add paid plans with higher limits
3. **Add social logins** - GitHub, Twitter, LinkedIn
4. **Email notifications** - Welcome emails, usage alerts
5. **Admin dashboard** - User management and analytics

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check the project's GitHub issues
4. Verify all environment variables are set correctly

---

🎉 **Congratulations!** Your MedGPT Scholar authentication system is now secure and ready for production use.
