# CliniSynth - Render Deployment Guide

## 🚀 **Why Render for CliniSynth Medical Platform**

- ✅ **Global Deployment**: Multi-region support for better performance
- ✅ **Always-On**: No cold starts (critical for medical applications)
- ✅ **Generous Free Tier**: 750 hours/month (vs Vercel's limitations)
- ✅ **Built-in PostgreSQL**: Database included in free tier
- ✅ **Better for Medical Apps**: Consistent performance and uptime

---

## 📋 **Pre-Deployment Checklist**

### ✅ **Repository Ready:**
- [x] TypeScript errors resolved
- [x] Environment variables configured
- [x] Health endpoint available at `/api/health`
- [x] .gitignore properly configured
- [x] AI fallback mechanism implemented

---

## 🔧 **Render Deployment Steps**

### **1. Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### **2. Create New Web Service**
1. Click "New +" → "Web Service"
2. Connect to repository: `mikey22333/medgpt`
3. Configure deployment settings:

**Basic Settings:**
```
Name: clinisynth
Environment: Node
Region: Oregon (US West) or Frankfurt (Europe)
Branch: master
Root Directory: ./
```

**Build & Deploy:**
```
Build Command: npm ci && npm run build
Start Command: npm start
```

### **3. Environment Variables**
Add these in Render Dashboard → Environment:

#### **🤖 AI Services:**
```
TOGETHER_API_KEY=tgp_v1_e9APmFQ1U8HZnpARJYrAgJxSVcl7N8pGAk0bILC1nyc
TOGETHER_AI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=tngtech/deepseek-r1t-chimera:free
```

#### **🗄️ Database (Supabase):**
```
NEXT_PUBLIC_SUPABASE_URL=https://mjrvmvhoqqfhmnkpxjvo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcnZtdmhvcXFmaG1ua3B4anZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDA0NTksImV4cCI6MjA2NjU3NjQ1OX0.v-cK-DugGJciSp_ZXnSQ-_2hM_ZY9RSEP6JO1dwY1Hc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcnZtdmhvcXFmaG1ua3B4anZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwMDQ1OSwiZXhwIjoyMDY2NTc2NDU5fQ.1L1T_EWK7TmSp9_s-cvmf1SGzOCvJeHgCVrCFBOoDG8
```

#### **🔍 Research APIs:**
```
PUBMED_API_KEY=5c6057b5e143f84e5260bba08024eb992d08
GOOGLE_GEMINI_API_KEY=AIzaSyB6KxI4mQ-6p-iIXJPWBbhQA78sIKPRPXM
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here
EUROPE_PMC_EMAIL=your_email@example.com
```

#### **🔐 Authentication:**
```
GOOGLE_CLIENT_ID=1069909116411-tqee1795vsbadkunsduomtvhevnlmubf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

#### **🌐 Application URLs:**
```
NEXT_PUBLIC_APP_URL=https://clinisynth.onrender.com
NEXT_PUBLIC_API_URL=https://clinisynth.onrender.com
NEXT_PUBLIC_SITE_URL=https://clinisynth.onrender.com
```

#### **🔧 System Variables:**
```
NODE_ENV=production
PORT=10000
```

### **4. Advanced Settings**
```
Health Check Path: /api/health
Auto-Deploy: Yes (on GitHub pushes)
```

---

## 🌍 **Multi-Region Configuration**

Render automatically handles:
- ✅ **CDN Distribution**: Global edge caching
- ✅ **Load Balancing**: Automatic traffic distribution  
- ✅ **Health Monitoring**: Built-in health checks
- ✅ **SSL/TLS**: Automatic HTTPS certificates

---

## 📊 **Performance Optimization**

### **Build Optimization:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p ${PORT:-10000}",
    "postbuild": "next-sitemap"
  }
}
```

### **Caching Strategy:**
- **Static Assets**: Cached at CDN edge
- **API Routes**: Smart caching based on content
- **Database**: Connection pooling via Supabase

---

## 🔍 **Health Monitoring**

Your app includes comprehensive health checks:

### **Endpoint**: `https://clinisynth.onrender.com/api/health`
**Monitors:**
- ✅ AI service availability (Together AI)
- ✅ Database connectivity (Supabase)
- ✅ Memory usage
- ✅ Response times
- ✅ Error rates

### **Render Dashboard:**
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, response times
- **Alerts**: Automatic notifications for issues

---

## 🚨 **Post-Deployment Tasks**

### **1. Update Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to Authorized redirect URIs:
   ```
   https://clinisynth.onrender.com/auth/callback/google
   https://clinisynth.onrender.com/api/auth/callback/google
   ```

### **2. Update Supabase Auth:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Render URL:
   ```
   Site URL: https://clinisynth.onrender.com
   Redirect URLs: https://clinisynth.onrender.com/**
   ```

### **3. Test Core Features:**
- [ ] Homepage loads correctly
- [ ] AI chat functionality works
- [ ] Medical research queries return results
- [ ] Google OAuth login works
- [ ] PDF export functions properly
- [ ] Health endpoint returns 200 OK

---

## 📈 **Scaling & Monitoring**

### **Free Tier Limits:**
- **Compute**: 750 hours/month
- **Bandwidth**: 100GB/month
- **Build Minutes**: 500/month
- **Concurrent Connections**: 10

### **Upgrade Benefits:**
- **Performance**: Faster CPUs, more memory
- **Reliability**: 99.9% SLA uptime
- **Scaling**: Auto-scaling based on traffic
- **Support**: Priority technical support

---

## 🔒 **Security Features**

### **Built-in Security:**
- ✅ **HTTPS/SSL**: Automatic certificates
- ✅ **DDoS Protection**: Built-in mitigation
- ✅ **Security Headers**: Automatic security headers
- ✅ **Environment Isolation**: Secure variable storage

---

## 🚀 **Deployment Command Summary**

Once configured in Render dashboard, deployment is automatic:

1. **Push to GitHub** → Automatic build triggered
2. **Build Process** → `npm ci && npm run build`
3. **Health Check** → Verify `/api/health` endpoint
4. **Live Deployment** → Available at `clinisynth.onrender.com`

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**
- **Build Fails**: Check Node.js version compatibility
- **Environment Variables**: Ensure all required vars are set
- **Health Check Fails**: Verify API keys are valid
- **OAuth Issues**: Check redirect URLs are correct

### **Getting Help:**
- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Project Issues**: https://github.com/mikey22333/medgpt/issues

---

**Your CliniSynth medical research platform is ready for global deployment with Render! 🌍✨**
