# CliniSynth - Project Limitations & Constraints

## 🚨 **Medical Disclaimer**

**CRITICAL**: CliniSynth is a research assistance tool and should **NEVER** be used for:
- Direct medical diagnosis
- Treatment recommendations
- Emergency medical situations
- Replacing professional medical advice
- Clinical decision-making without human oversight

**Always consult qualified healthcare professionals for medical decisions.**

---

## 🔄 **API Rate Limits**

### **Primary AI Service (Together AI)**
- **Free Tier**: 20 requests per minute
- **Rate Reset**: Per minute rolling window
- **Token Limit**: ~4,000 tokens per request
- **Daily Limit**: ~2,000 requests per day
- **Fallback**: Automatic failover to OpenRouter

### **Fallback AI Service (OpenRouter)**
- **Free Tier**: 10 requests per minute
- **Rate Reset**: Per minute rolling window  
- **Token Limit**: ~8,000 tokens per request
- **Daily Limit**: ~200 requests per day
- **Model**: DeepSeek R1T Chimera (Free)

### **Research APIs**

#### **PubMed/NCBI Entrez API**
- **Rate Limit**: 10 requests per second (with API key)
- **Rate Limit**: 3 requests per second (without API key)
- **Daily Limit**: No official limit, but fair use expected
- **Search Results**: Max 20 results per query
- **Retry Logic**: 3 attempts with exponential backoff

#### **Europe PMC API**
- **Rate Limit**: No official limit, but ~1000 requests/hour recommended
- **Search Results**: Max 25 results per query
- **Response Time**: ~2-5 seconds average
- **Availability**: 99.5% uptime (estimated)

#### **Semantic Scholar API**
- **Rate Limit**: 100 requests per 5 minutes
- **Daily Limit**: ~1000 requests per day
- **Search Results**: Max 100 results per query
- **Response Time**: ~1-3 seconds average

#### **FDA API**
- **Rate Limit**: 240 requests per minute, 1000 per hour
- **Search Results**: Max 100 results per query
- **Data Freshness**: Updated weekly
- **Coverage**: US FDA data only

### **Supabase Database**
- **Connection Pool**: 15 concurrent connections (free tier)
- **Storage**: 500MB total storage
- **Bandwidth**: 5GB per month
- **Realtime**: 2 concurrent connections
- **Row Level Security**: Enabled

---

## 📊 **Performance Limitations**

### **Response Times**
- **AI Response**: 2-8 seconds (depends on query complexity)
- **Research Retrieval**: 3-10 seconds (multiple API calls)
- **Citation Processing**: 1-3 seconds per citation
- **PDF Generation**: 5-15 seconds (depends on content length)

### **Concurrent Users**
- **Estimated Capacity**: ~50-100 concurrent users
- **Database Connections**: Limited by Supabase free tier
- **Memory Usage**: ~512MB per instance (Vercel limit)

### **Search Limitations**
- **Query Length**: Max 500 characters
- **Results per Query**: Max 100 total citations
- **Search Depth**: Surface-level semantic matching
- **Language Support**: English only

---

## 🔍 **Content & Quality Limitations**

### **Research Coverage**
- **Primary Focus**: English-language medical literature
- **Date Range**: Primarily last 20 years (varies by source)
- **Geographic Bias**: Western/US-centric research emphasis
- **Specialty Coverage**: General medical topics (limited specialty depth)

### **Citation Quality**
- **Relevance Scoring**: Algorithmic (not peer-reviewed)
- **Quality Filtering**: Automated (may miss nuances)
- **Duplicate Detection**: Basic deduplication only
- **Impact Factor**: Not considered in ranking

### **AI Response Limitations**
- **Hallucination Risk**: AI may generate inaccurate information
- **Context Window**: Limited memory of conversation history
- **Bias**: Reflects training data biases
- **Uncertainty**: May not express appropriate uncertainty levels

---

## 🛡️ **Security & Privacy Limitations**

### **Data Handling**
- **Chat History**: Stored in Supabase (encrypted at rest)
- **User Sessions**: 30-day retention period
- **API Logs**: Minimal logging for debugging
- **No PHI**: System does not handle protected health information

### **Authentication**
- **Session Management**: Basic JWT tokens
- **Password Security**: Standard bcrypt hashing
- **No 2FA**: Two-factor authentication not implemented
- **Rate Limiting**: Basic IP-based limiting only

---

## 🔧 **Technical Limitations**

### **Browser Compatibility**
- **Modern Browsers Only**: Chrome 90+, Firefox 88+, Safari 14+
- **JavaScript Required**: No fallback for disabled JS
- **Mobile Responsive**: Optimized for desktop experience
- **Offline Mode**: Not supported

### **File Handling**
- **PDF Export**: Basic formatting only
- **Image Support**: No image analysis capabilities
- **File Upload**: Not supported
- **Attachment Processing**: Text-only content

### **Platform Dependencies**
- **Render Hosting**: Subject to Render service limits
- **Third-party APIs**: Dependent on external service availability
- **Global CDN**: Built-in edge distribution
- **Backup**: Automated backup procedures included

---

## 📈 **Scalability Constraints**

### **Free Tier Limits**
- **Render**: 750 hours/month compute, 100GB bandwidth
- **Supabase**: 500MB database, 5GB bandwidth
- **Together AI**: ~2,000 requests per day
- **OpenRouter**: ~200 requests per day

### **Cost Scaling**
- **High Usage**: Requires paid tier upgrades
- **API Costs**: Linear scaling with user growth
- **Infrastructure**: Auto-scaling available on paid tiers
- **Monitoring**: Comprehensive error tracking and metrics

---

## 🚫 **Known Issues & Workarounds**

### **Current Bugs**
- **Citation Duplicates**: Occasional duplicate citations from different sources
- **Response Timeout**: Long queries may timeout (>30 seconds)
- **Mobile Layout**: Some layout issues on small screens
- **Export Formatting**: PDF headers may have formatting issues

### **Temporary Workarounds**
- **Rate Limit Errors**: Implement automatic retry with exponential backoff
- **Slow Responses**: Loading indicators and progress updates
- **Failed Searches**: Fallback to simplified queries
- **API Failures**: Graceful degradation to available sources

---

## 🔮 **Future Improvements Needed**

### **High Priority**
- [ ] Implement proper user authentication system
- [ ] Add comprehensive error handling and user feedback
- [ ] Improve mobile responsiveness
- [ ] Add query history and bookmarking
- [ ] Implement better citation quality scoring

### **Medium Priority**
- [ ] Add multi-language support
- [ ] Implement advanced search filters
- [ ] Add collaboration features
- [ ] Improve PDF export formatting
- [ ] Add usage analytics dashboard

### **Low Priority**
- [ ] Add image analysis capabilities
- [ ] Implement offline mode
- [ ] Add browser extension
- [ ] Create mobile app
- [ ] Add voice interaction

---

## 📞 **Support & Contact**

For technical issues or questions about limitations:
- **GitHub Issues**: [mikey22333/medgpt](https://github.com/mikey22333/medgpt/issues)
- **Documentation**: See project README and implementation guides
- **Emergency**: This is not an emergency medical service

---

## 📋 **Version Information**

- **Last Updated**: July 27, 2025
- **Project Version**: v1.0.0-beta
- **Platform**: Next.js 15.3.4, TypeScript 5.6.3
- **License**: Open Source (see LICENSE file)

---

**Remember: CliniSynth is a research tool to assist healthcare professionals and researchers. It is not a replacement for clinical expertise, peer review, or professional medical judgment.**
