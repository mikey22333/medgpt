# Security Monitoring Checklist - Exposed Keys

**Date**: July 27, 2025
**Status**: Using exposed API keys despite security risk

## Daily Monitoring Tasks

### OpenRouter (API Key: sk-or-v1-e3acb734...)
- [ ] Check usage dashboard for unexpected requests
- [ ] Monitor rate limit consumption
- [ ] Review request patterns and sources
- [ ] Check for unusual model usage

### Supabase (Service Key: eyJhbGciOiJIUzI1NiIs...)
- [ ] Review database access logs
- [ ] Monitor connection patterns
- [ ] Check for unauthorized data access
- [ ] Review authentication logs

### Signs of Compromise
- [ ] Unexpected API usage spikes
- [ ] Unknown IP addresses in logs
- [ ] Unusual database queries
- [ ] Rate limit exhaustion
- [ ] Unexpected charges/usage

### Emergency Response
If compromise detected:
1. Immediately revoke keys
2. Generate new keys
3. Update all deployments
4. Review access logs
5. Change any compromised data

## Weekly Security Review
- [ ] Compare usage patterns to expected traffic
- [ ] Review all access logs
- [ ] Check for any data anomalies
- [ ] Verify application performance metrics

**Remember**: This is a temporary risk assessment. Strongly recommend key rotation ASAP.
