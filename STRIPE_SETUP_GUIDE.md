# Stripe Payment Integration Setup Guide

## 🎯 Quick Setup (Basic Configuration)

This is a simplified setup to get Stripe ready for future implementation.

## � Step 1: Create Stripe Account & Get API Keys

1. **Sign up for Stripe** at https://stripe.com
2. **Get your API keys** from the Stripe Dashboard:
   - Go to Dashboard → Developers → API keys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

## 💰 Step 2: Create Basic Product (Quick Setup)

1. **Go to Stripe Dashboard → Products**
2. **Create a new product**:
   - Name: "MedGPT Scholar Pro Plan"
   - Description: "Unlimited AI chats and premium features"
   
3. **Add one price for now**:
   - **USD Price**: $5.99/month (recurring)
   
4. **Copy the Price ID** (starts with `price_`)

## ⚙️ Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration (Basic Setup)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_USD=price_your_price_id_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🎯 That's It for Now!

You now have:
- ✅ Stripe account set up
- ✅ API keys configured  
- ✅ Basic product created
- ✅ Environment variables ready

## 🚀 Future Implementation Checklist

When you're ready to complete the integration:
- [ ] Add webhook endpoints
- [ ] Create INR pricing
- [ ] Update database schema  
- [ ] Implement payment UI
- [ ] Add subscription management
- [ ] Test payment flow

The basic foundation is ready for when you want to implement the full payment system!
   
4. **Copy the Price IDs**:
   - Each price will have an ID like `price_1234567890abcdef`
   - Save both USD and INR price IDs

## 🔗 Step 3: Set Up Webhooks

1. **Go to Dashboard → Developers → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/stripe/webhook`
3. **Select events to send**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Copy the webhook signing secret** (starts with `whsec_`)

## ⚙️ Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Price IDs
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_USD=price_your_usd_price_id
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_INR=price_your_inr_price_id

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🗄️ Step 5: Update Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Add Stripe columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

-- Update existing free users
UPDATE public.user_profiles 
SET query_limit = 3 
WHERE subscription_tier = 'free' AND query_limit != 3;
```

## 🧪 Step 6: Test Payment Flow

1. **Start your development server**: `npm run dev`
2. **Go to Dashboard** at http://localhost:3000/dashboard
3. **Click "Upgrade to Pro"** button
4. **Use Stripe test card**: 4242 4242 4242 4242
   - Any future expiry date
   - Any 3-digit CVC
   - Any billing details

## 🔄 Step 7: Test Webhooks (Local Development)

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe**: `stripe login`
3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. **Use the webhook signing secret** shown in the CLI output

## 🚀 Step 8: Production Deployment

1. **Update environment variables** with production values
2. **Update webhook endpoint** to your production URL
3. **Switch to live API keys** (remove `_test_` from keys)
4. **Create live prices** in Stripe dashboard

## 💡 Features Included

### ✅ Free Tier (Starter Plan)
- 3 AI questions per day
- 3 citations per response
- Access to FDA + PubMed
- No saved history

### ✅ Pro Tier (₹299/month or $5.99/month)
- Unlimited AI chats
- 10+ citations per response
- Full Research Mode access
- Save chat history
- Download PDF responses
- Source Finder Intelligence
- Priority speed

## 🛡️ Security Features

- ✅ Webhook signature verification
- ✅ User authentication required
- ✅ Subscription status validation
- ✅ Automatic plan downgrades on cancellation
- ✅ Failed payment handling

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard logs
2. Check your browser console for errors
3. Check server logs for webhook errors
4. Verify all environment variables are set correctly

## 🎉 You're Done!

Your Stripe payment integration is now ready! Users can upgrade to Pro and enjoy unlimited access to MedGPT Scholar's premium features.
