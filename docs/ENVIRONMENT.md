# Environment Variables

This document outlines the required and optional environment variables for the MedGPT Scholar application.

## Required Variables

### Database
- `DATABASE_URL`: The connection string for your PostgreSQL database
- `DIRECT_URL`: Direct connection URL for database migrations (Prisma)

### Authentication
- `NEXTAUTH_SECRET`: Secret used to encrypt the NextAuth.js JWT
- `NEXTAUTH_URL`: The canonical URL of your site (e.g., `http://localhost:3000`)
- `AUTH_SECRET`: Secret used for authentication (can be same as NEXTAUTH_SECRET)

### AI Services
- `TOGETHER_API_KEY`: API key for Together AI (primary LLM provider)
- `OPENROUTER_API_KEY`: API key for OpenRouter (fallback LLM provider, optional but recommended)

### Search & Research
- `SERPER_API_KEY`: API key for Serper.dev (search engine)
- `EUROPEPMC_EMAIL`: Email for Europe PMC API (for research papers)
- `OPENALEX_API_KEY`: API key for OpenAlex (research papers and citations)
- `CROSSREF_EMAIL`: Email for CrossRef API (for DOI resolution)

### Optional Variables

#### Analytics
- `GOOGLE_ANALYTICS_ID`: Google Analytics tracking ID (optional)
- `POSTHOG_KEY`: PostHog API key (optional)
- `POSTHOG_HOST`: PostHog host (optional)

#### Email
- `RESEND_API_KEY`: API key for Resend (for email notifications)
- `EMAIL_FROM`: Sender email address for notifications

#### Feature Flags
- `ENABLE_EXPERIMENTAL_FEATURES`: Set to 'true' to enable experimental features
- `ENABLE_PREMIUM_FEATURES`: Set to 'true' to enable premium features

## Local Development

1. Copy the `.env.local.example` to `.env.local`
2. Fill in the required variables
3. For local database, you can use Docker with the provided `docker-compose.yml`

## Production

Make sure all required variables are set in your production environment. The application will fail to start if any required variables are missing.

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate API keys regularly
- Use the principle of least privilege for database and API access
