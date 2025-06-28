export const STRIPE_CONFIG = {
  // Pro Plan Price IDs (you'll need to create these in Stripe Dashboard)
  PRICE_IDS: {
    PRO_MONTHLY_USD: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_USD || 'price_test_usd', // $5.99/month
    PRO_MONTHLY_INR: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_INR || 'price_test_inr', // ₹299/month
  },
  
  // Subscription features
  PLANS: {
    FREE: {
      name: '🧪 Starter Plan',
      price: 'Free',
      queries_per_day: 2,
      citations_per_response: 3,
      features: [
        'Google/email login',
        'Doctor & Research modes',
        'Access to FDA + PubMed',
        'No saved history'
      ]
    },
    PRO: {
      name: '💎 Pro Plan',
      price_usd: '$5.99/month',
      price_inr: '₹299/month',
      queries_per_day: 'unlimited',
      citations_per_response: '10+',
      features: [
        'Unlimited AI chats',
        '10+ citations per response', 
        'Full Research Mode access',
        'Save chat history',
        'Download PDF responses',
        'Source Finder Intelligence',
        'Priority speed'
      ]
    }
  }
};

// Utility to get the correct price ID based on user location
export function getStripePriceId(currency: 'USD' | 'INR' = 'USD') {
  return currency === 'INR' 
    ? STRIPE_CONFIG.PRICE_IDS.PRO_MONTHLY_INR 
    : STRIPE_CONFIG.PRICE_IDS.PRO_MONTHLY_USD;
}

// Utility to detect user currency (simplified)
export function detectUserCurrency(): 'USD' | 'INR' {
  if (typeof window !== 'undefined') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndia = timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta');
    return isIndia ? 'INR' : 'USD';
  }
  return 'USD';
}
