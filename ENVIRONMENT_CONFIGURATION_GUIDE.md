# 🔧 Environment Configuration for Implementation Improvements

## Required Environment Variables

Add these to your `.env.local` file for the implementation improvements:

```bash
# Biomedical Embedding Services
HUGGINGFACE_API_KEY=hf_your_key_here
# Get free key at: https://huggingface.co/settings/tokens
# Rate limits: 1000 requests/hour (free tier)

# Optional: OpenAI for fallback embeddings
OPENAI_API_KEY=sk-your_key_here
# Only needed if you want OpenAI as fallback for general queries

# Optional: Local embedding service
LOCAL_EMBEDDING_URL=http://localhost:8000
# If you're running a local embedding server

# Debugging and Quality Monitoring
VERBOSE_LOGGING=false
RELAXED_FILTERING=false
LOG_INTERMEDIATE_RESULTS=false
ENABLE_AB_TESTING=false

# Quality Thresholds (can be adjusted)
MEDICAL_RELEVANCE_THRESHOLD=0.5
SEMANTIC_SIMILARITY_THRESHOLD=0.7
EVIDENCE_QUALITY_THRESHOLD=0.6

# Filter Transparency
TRACK_FILTER_PERFORMANCE=true
LOG_EXCLUSION_REASONS=true
ALERT_HIGH_REDUCTION_RATE=0.8

# Existing API keys (already configured)
PUBMED_API_KEY=your_existing_key
SEMANTIC_SCHOLAR_API_KEY=your_existing_key
SUPABASE_URL=your_existing_url
SUPABASE_ANON_KEY=your_existing_key
```

## API Key Setup Instructions

### 1. Hugging Face API Key (Recommended)
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with "Read" permissions
3. Add to `.env.local` as `HUGGINGFACE_API_KEY=hf_...`

**Benefits**: 
- Free biomedical embeddings (BioBERT, SciBERT, SPECTER2)
- 1000 requests/hour free tier
- No cost for basic usage

### 2. OpenAI API Key (Optional)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local` as `OPENAI_API_KEY=sk-...`

**Benefits**:
- High-quality general embeddings
- Reliable fallback option

**Costs**:
- ~$0.0001 per 1K tokens
- About $0.10 per 1000 queries

### 3. Local Embedding Server (Advanced)
If you want to run embeddings locally:

```bash
# Install dependencies
pip install transformers torch sentence-transformers

# Run simple embedding server
python -c "
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

app = Flask(__name__)
model = SentenceTransformer('dmis-lab/biobert-v1.1')

@app.route('/embed', methods=['POST'])
def embed():
    data = request.json
    text = data['text']
    embedding = model.encode(text).tolist()
    return jsonify({'embedding': embedding})

app.run(host='0.0.0.0', port=8000)
"
```

## Configuration Validation

Add this to your API route to validate configuration:

```typescript
// In src/app/api/research/route.ts
async function validateConfiguration() {
  const config = {
    huggingface: !!process.env.HUGGINGFACE_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    localEmbedding: !!process.env.LOCAL_EMBEDDING_URL,
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    trackFilters: process.env.TRACK_FILTER_PERFORMANCE === 'true'
  };
  
  console.log('🔧 Configuration Status:');
  console.log(`   🤗 Hugging Face: ${config.huggingface ? '✅' : '❌'} (Primary biomedical embeddings)`);
  console.log(`   🤖 OpenAI: ${config.openai ? '✅' : '❌'} (Fallback embeddings)`);
  console.log(`   🏠 Local: ${config.localEmbedding ? '✅' : '❌'} (Local embedding server)`);
  console.log(`   📝 Verbose Logging: ${config.verboseLogging ? 'ON' : 'OFF'}`);
  console.log(`   📊 Filter Tracking: ${config.trackFilters ? 'ON' : 'OFF'}`);
  
  if (!config.huggingface && !config.openai && !config.localEmbedding) {
    console.warn('⚠️  No embedding service configured - will use keyword fallback only');
  }
  
  return config;
}

// Call in POST function
export async function POST(request: Request) {
  const config = await validateConfiguration();
  // ... rest of your code
}
```

## Gradual Rollout Strategy

### Phase 1: Hugging Face Only
```bash
# Minimal setup for testing
HUGGINGFACE_API_KEY=your_key
TRACK_FILTER_PERFORMANCE=true
VERBOSE_LOGGING=true
```

### Phase 2: Add Quality Monitoring
```bash
# Add after Phase 1 is working
LOG_INTERMEDIATE_RESULTS=true
MEDICAL_RELEVANCE_THRESHOLD=0.4  # Slightly relaxed
ALERT_HIGH_REDUCTION_RATE=0.75   # Alert sooner
```

### Phase 3: Full Configuration
```bash
# Production-ready setup
HUGGINGFACE_API_KEY=your_key
OPENAI_API_KEY=your_key  # For important queries
TRACK_FILTER_PERFORMANCE=true
ENABLE_AB_TESTING=true
VERBOSE_LOGGING=false  # Reduce noise in production
```

## Troubleshooting

### Common Issues

1. **Hugging Face 429 Rate Limit**
```typescript
// Add exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(apiCall: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s delays
        continue;
      }
      throw error;
    }
  }
}
```

2. **Model Loading Errors**
```typescript
// Test model availability
async function testBiomedicalModels() {
  const embeddingService = new BiomedicalEmbeddingService();
  const availability = await embeddingService.testModelAvailability();
  
  console.log('🧪 Model Availability Test:');
  Object.entries(availability).forEach(([model, available]) => {
    console.log(`   ${available ? '✅' : '❌'} ${model}`);
  });
  
  return availability;
}
```

3. **Memory Issues with Local Models**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## Cost Estimation

### Free Tier Usage (Hugging Face only):
- **1000 requests/hour** = sufficient for ~100 research queries/hour
- **Cost**: $0
- **Limitations**: Rate limiting during peak usage

### Paid Usage (Hugging Face + OpenAI):
- **HF Pro**: $9/month for 10,000 requests/month  
- **OpenAI**: ~$10/month for 10,000 queries
- **Total**: ~$19/month for production usage
- **Benefits**: No rate limits, higher reliability

## Next Steps

1. **Start with free Hugging Face setup**
2. **Monitor usage and quality metrics**
3. **Upgrade to paid tiers if needed**
4. **Consider local deployment for high volume**

This configuration will enable all the implementation improvements while maintaining cost control and reliability.
