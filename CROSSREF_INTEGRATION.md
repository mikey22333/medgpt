# CrossRef REST API Integration

## 🎯 Overview

The CrossRef REST API integration provides comprehensive access to academic literature and citation data, specifically optimized for medical research. This integration combines CrossRef's extensive database with PubMed and other sources to deliver high-quality research results.

## 🚀 Features

### ✅ Core Functionality
- **Academic Literature Search**: Access to millions of academic papers
- **Citation Formatting**: APA, MLA, and Chicago citation styles
- **Medical Research Helpers**: Specialized search functions for medical topics
- **DOI Resolution**: Direct lookup of papers by DOI
- **Metadata Extraction**: Rich paper metadata including citations, impact metrics
- **Open Access Detection**: Identifies freely available papers

### ✅ Medical Specialization
- **Drug Research**: Targeted searches for pharmaceutical studies
- **Disease Research**: Disease-specific literature discovery
- **Clinical Trials**: RCT and clinical trial identification
- **Systematic Reviews**: Meta-analyses and systematic review discovery
- **Recent Research**: Time-filtered searches for latest findings

## 📁 File Structure

```
src/
├── lib/research/
│   └── crossref.ts              # CrossRef API client and helpers
├── app/api/research/
│   ├── crossref/route.ts        # Direct CrossRef API endpoint
│   ├── medical/route.ts         # Combined medical research endpoint
│   └── route.ts                 # Main research API (updated)
├── lib/types/
│   ├── research.ts              # Research type definitions (updated)
│   └── chat.ts                  # Citation types (updated)
└── app/crossref-demo/
    └── page.tsx                 # Demo interface
```

## 🔧 API Endpoints

### 1. Direct CrossRef Search
```
GET/POST /api/research/crossref
```

**Parameters:**
- `query` - Search query string
- `type` - Search type: `general`, `drug`, `disease`, `clinical-trials`, `systematic-reviews`, `recent`
- `limit` - Maximum results (default: 20, max: 1000)
- `doi` - Direct DOI lookup

**Example:**
```bash
# Search for diabetes research
GET /api/research/crossref?query=diabetes%20treatment&type=disease&limit=10

# Look up specific paper by DOI
GET /api/research/crossref?doi=10.1056/NEJMoa2034577
```

### 2. Combined Medical Research
```
POST /api/research/medical
```

**Body:**
```json
{
  "query": "metformin diabetes treatment",
  "type": "drug",
  "limit": 10,
  "sources": ["pubmed", "crossref"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "10.1056/example",
      "title": "Metformin in Type 2 Diabetes...",
      "authors": ["Smith, J.", "Doe, A."],
      "journal": "New England Journal of Medicine",
      "year": 2023,
      "doi": "10.1056/example",
      "url": "https://doi.org/10.1056/example",
      "abstract": "Background: ...",
      "source": "CrossRef",
      "confidenceScore": 85,
      "evidenceLevel": "High",
      "studyType": "Journal Article",
      "citationCount": 150,
      "isOpenAccess": true
    }
  ],
  "insights": {
    "totalResults": 25,
    "highConfidenceCount": 18,
    "recentCount": 12,
    "openAccessCount": 8,
    "averageCitationCount": 45,
    "sourceBreakdown": {
      "pubmed": 15,
      "crossref": 10
    }
  }
}
```

### 3. Updated Main Research API
```
POST /api/research
```

Now includes CrossRef results in the unified search.

## 🧪 Testing

### 1. Visual Demo
Visit the demo page to test the integration:
```
http://localhost:3000/crossref-demo
```

### 2. Automated Tests
Run the test script:
```bash
node test-crossref.js
```

### 3. Manual API Tests

**Test CrossRef Direct Search:**
```bash
curl "http://localhost:3000/api/research/crossref?query=covid%20vaccine&type=clinical-trials&limit=5"
```

**Test Combined Medical Search:**
```bash
curl -X POST "http://localhost:3000/api/research/medical" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "alzheimer disease biomarkers",
    "type": "recent",
    "limit": 8,
    "sources": ["pubmed", "crossref"]
  }'
```

## 🔍 Search Types

| Type | Description | Best For |
|------|-------------|----------|
| `general` | General medical research | Broad medical topics |
| `drug` | Drug-specific research | Pharmaceutical studies |
| `disease` | Disease-specific research | Condition-focused literature |
| `clinical-trials` | Clinical trials and RCTs | Evidence-based medicine |
| `systematic-reviews` | Meta-analyses and systematic reviews | High-level evidence |
| `recent` | Recent research (last 2 years) | Latest findings |

## 📊 Confidence Scoring

The system assigns confidence scores based on:

- **PubMed**: 90% (highly reliable medical source)
- **CrossRef**: Variable based on:
  - Citation count: Higher citations = higher confidence
  - Journal reputation: Impact factor consideration
  - Publication type: Journal articles > conference papers
  - Recency: Recent papers get slight boost

**Scoring Formula (CrossRef):**
```
Base Score: 60
Citation Bonus: min(35, citations/100 * 35)
Max Score: 95
```

## 🎨 Evidence Levels

- **High**: >50 citations OR PubMed source
- **Moderate**: 10-50 citations
- **Low**: <10 citations

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Contact email for better CrossRef service
CROSSREF_EMAIL=contact@yourdomain.com

# Required for PubMed integration
PUBMED_API_KEY=your_pubmed_key

# Required for Semantic Scholar integration
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
```

### Rate Limits
- **CrossRef**: No API key required, rate limited by IP
- **Recommended**: Include contact email in User-Agent for better service
- **Polite**: Built-in delays to respect API guidelines

## 📈 Integration Examples

### 1. Basic Medical Search
```typescript
import { crossRefAPI } from '@/lib/research/crossref';

const results = await crossRefAPI.searchMedicalResearch('diabetes metformin', {
  limit: 10,
  yearFrom: 2020
});
```

### 2. Specialized Drug Research
```typescript
import { medicalResearchHelpers } from '@/lib/research/crossref';

const drugResearch = await medicalResearchHelpers.searchDrugResearch('aspirin', 15);
```

### 3. Citation Formatting
```typescript
const citation = crossRefAPI.formatCitation(work, 'apa');
// Output: "Smith, J. (2023). Title of Paper. Journal Name, 45(2), 123-130. https://doi.org/10.1000/example"
```

### 4. Combined Search (Frontend)
```typescript
const response = await fetch('/api/research/medical', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'covid vaccine efficacy',
    type: 'clinical-trials',
    limit: 10,
    sources: ['pubmed', 'crossref']
  })
});
```

## 🛡️ Error Handling

The integration includes robust error handling:

- **Network Failures**: Graceful degradation to other sources
- **API Errors**: Detailed error messages and fallbacks
- **Rate Limiting**: Automatic retry with exponential backoff
- **Invalid DOIs**: Clean error responses
- **Empty Results**: Informative messaging

## 🚀 Performance

- **Parallel Searches**: Multiple sources searched simultaneously
- **Caching**: Results cached to reduce API calls
- **Optimized Queries**: Medical-specific search optimization
- **Streaming**: Large result sets handled efficiently

## 📚 Resources

- **CrossRef API Docs**: https://api.crossref.org/swagger-ui/index.html
- **CrossRef REST API Guide**: https://github.com/CrossRef/rest-api-doc
- **DOI System**: https://www.doi.org/
- **Medical Subject Headings**: https://www.nlm.nih.gov/mesh/

## 🎯 Next Steps

1. **Enhanced Filtering**: Add subject-specific filters
2. **Citation Networks**: Implement reference tracking
3. **Impact Metrics**: Integrate journal impact factors
4. **Advanced Search**: Boolean operators and field-specific searches
5. **Caching Layer**: Implement Redis caching for performance

## 🐛 Troubleshooting

### Common Issues

1. **No Results Found**
   - Check query spelling
   - Try broader terms
   - Verify API connectivity

2. **Rate Limiting**
   - Add contact email to environment
   - Implement request delays
   - Use caching to reduce calls

3. **DOI Not Found**
   - Verify DOI format
   - Check if paper exists in CrossRef
   - Try alternative identifiers

### Debug Mode
Enable detailed logging:
```typescript
console.log('CrossRef search:', { query, results: results.length });
```

## ✅ Integration Complete

The CrossRef REST API is now fully integrated with:
- ✅ Medical research specialization
- ✅ Citation formatting and metadata
- ✅ Combined source searching
- ✅ Confidence scoring and evidence levels
- ✅ Visual demo interface
- ✅ Comprehensive error handling
- ✅ Performance optimizations

Ready for production use in MedGPT Scholar! 🎉
