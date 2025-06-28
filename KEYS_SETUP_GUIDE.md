# 🔑 **AUTHENTICATION KEYS SETUP CHECKLIST**

## **STEP 1: Create Supabase Project (5 minutes)**

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** → Sign up with GitHub/Google
3. Click **"New Project"**
4. Fill in:
   - **Name**: `medgpt-scholar`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"** (takes 2-3 minutes)

## **STEP 2: Get Supabase Keys (1 minute)**

1. In your new project dashboard, go to **Settings** → **API**
2. Copy these 3 values to your `.env.local` file:

```bash
# Copy "Project URL" here:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Copy "anon public" key here:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Copy "service_role" key here (keep secret!):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## **STEP 3: Set Up Database Schema (2 minutes)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy ALL content from `supabase-schema.sql` file in this project
4. Paste into the editor and click **"Run"**
5. You should see: "Success. No rows returned"

## **STEP 4: Set Up Google OAuth (5 minutes)**

### A. Create Google Cloud Project
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Name: `medgpt-scholar` → **"Create"**

### B. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** → **"Create"**
3. Fill in:
   - **App name**: `MedGPT Scholar`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"** through all steps

### C. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client IDs"**
3. Fill in:
   - **Application type**: Web application
   - **Name**: `MedGPT Scholar`
   - **Authorized redirect URIs**: Add BOTH of these:
     ```
     http://localhost:3000/auth/callback
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
     (Replace `your-project-ref` with your actual Supabase project reference)

4. Click **"Create"**
5. Copy the **Client ID** and **Client Secret** to your `.env.local`:

```bash
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

## **STEP 5: Configure Google OAuth in Supabase (1 minute)**

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click the toggle to enable it
3. Enter your Google credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
4. Click **"Save"**

## **STEP 6: Test Your Setup (1 minute)**

1. Make sure all keys are filled in your `.env.local` file
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Go to [http://localhost:3000](http://localhost:3000)
4. You should be redirected to the login page
5. Try signing in with Google!

---

## **🚨 COMMON ISSUES & FIXES**

### "Authentication required" error
- ✅ Check Supabase URL and keys are correct
- ✅ Make sure no extra spaces in environment variables
- ✅ Restart server after changing `.env.local`

### Google OAuth not working
- ✅ Verify redirect URIs match exactly in Google Cloud Console
- ✅ Make sure OAuth consent screen is configured
- ✅ Check Google credentials are added to Supabase

### Database errors
- ✅ Run the SQL schema from `supabase-schema.sql`
- ✅ Check if tables were created in Supabase → Table Editor

---

## **📋 FINAL CHECKLIST**

- [ ] Supabase project created
- [ ] 3 Supabase keys added to `.env.local`
- [ ] SQL schema executed successfully
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created with correct redirect URIs
- [ ] Google keys added to `.env.local`
- [ ] Google OAuth enabled and configured in Supabase
- [ ] Development server restarted
- [ ] Authentication tested and working

Once all items are checked, your authentication system is ready! 🎉
