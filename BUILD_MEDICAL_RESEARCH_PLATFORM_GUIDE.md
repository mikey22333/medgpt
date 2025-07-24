# Building a Medical Research Platform Like Consensus - Complete Guide

## Overview
This guide walks you through building a comprehensive medical research platform similar to Consensus.app that searches, filters, and ranks medical literature using AI and multiple APIs.

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Technology Stack](#technology-stack)
3. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
4. [Phase 2: Medical APIs Integration](#phase-2-medical-apis-integration)
5. [Phase 3: AI-Powered Filtering](#phase-3-ai-powered-filtering)
6. [Phase 4: Advanced Features](#phase-4-advanced-features)
7. [Phase 5: Production Deployment](#phase-5-production-deployment)
8. [Medical Compliance & Safety](#medical-compliance--safety)

## Project Architecture

### System Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   AI Services   │
│   Next.js       │◄──►│   Next.js API    │◄──►│   Together AI   │
│   TypeScript    │    │   Routes         │    │   OpenAI        │
│   Tailwind CSS  │    │   TypeScript     │    │   Local LLMs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Medical Data Sources                          │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   PubMed        │   CrossRef      │   FDA Database  │   WHO     │
│   (30M papers)  │   (130M works)  │   (Drugs/Dev)   │   (Global)│
├─────────────────┼─────────────────┼─────────────────┼───────────┤
│ Semantic Scholar│   Europe PMC    │ ClinicalTrials  │   DOAJ    │
│   (200M papers) │   (38M papers)  │   (400K trials) │ (OpenAccess)│
├─────────────────┼─────────────────┼─────────────────┼───────────┤
│   OpenAlex      │   bioRxiv       │   NIH RePORTER  │ Guidelines│
│   (250M works)  │   (Preprints)   │   (Funded Res.) │ (Clinical)│
└─────────────────┴─────────────────┴─────────────────┴───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Processing Pipeline                      │
│  Query Analysis → Medical Filtering → Relevance Scoring →       │
│  Duplicate Detection → Quality Assessment → Result Ranking      │
└─────────────────────────────────────────────────────────────────┘
```

### Medical Research Quality Hierarchy
```
Level 1A: Systematic Reviews & Meta-Analyses (Cochrane, PROSPERO)
Level 1B: High-Quality RCTs (Phase 3/4, n>1000, peer-reviewed)
Level 2:  Moderate-Quality RCTs, Clinical Trials (Phase 2)
Level 3A: Cohort Studies, Case-Control Studies (peer-reviewed)
Level 3B: Observational Studies, Cross-sectional
Level 4:  Case Reports, Expert Opinion, Preprints
Level 5:  Regulatory Documents, Guidelines (context-dependent)
```

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript, Zod validation
- **Database**: Supabase (PostgreSQL) or PlanetScale (MySQL)
- **AI/ML**: Together AI, OpenAI GPT-4, Local LLMs (Ollama)
- **Authentication**: NextAuth.js or Supabase Auth
- **Deployment**: Vercel, Railway, or AWS

### Medical APIs & Data Sources
- **PubMed/MEDLINE**: Primary biomedical literature (Free, 30M+ articles)
- **Semantic Scholar**: AI-enhanced academic search (200M+ papers)
- **CrossRef**: Scholarly metadata & DOI resolution (130M+ works)
- **Europe PMC**: European biomedical literature (38M+ articles)
- **FDA Databases**: Drug/device regulatory data (Free)
- **ClinicalTrials.gov**: Clinical trial registry (400K+ studies)
- **OpenAlex**: Open scholarly data (250M+ works)
- **DOAJ**: Directory of Open Access Journals
- **NIH RePORTER**: Funded research projects
- **WHO Global Health**: International health data

## Phase 1: Core Infrastructure

### 1.1 Project Setup
```bash
# Create Next.js project
npx create-next-app@latest medical-research-platform --typescript --tailwind --app

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install zod @hookform/resolvers react-hook-form
npm install lucide-react @vercel/analytics

# Install development dependencies
npm install -D @types/node eslint-config-next
```

### 1.2 Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
TOGETHER_API_KEY=your_together_ai_key
OPENAI_API_KEY=your_openai_key

# Medical APIs
PUBMED_API_KEY=optional_pubmed_key
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
CROSSREF_EMAIL=your_email@domain.com

# FDA APIs (Free - no key required)
# ClinicalTrials.gov (Free - no key required)
# Europe PMC (Free - no key required)
```

### 1.3 Database Schema
```sql
-- Supabase SQL Schema
-- User management
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    daily_queries_used INTEGER DEFAULT 0,
    daily_queries_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id)
);

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    mode TEXT DEFAULT 'research', -- 'research', 'clinical', 'patient'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    metadata JSONB, -- citations, sources, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Research papers cache
CREATE TABLE research_papers (
    id TEXT PRIMARY KEY, -- DOI or unique identifier
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT[],
    journal TEXT,
    publication_date DATE,
    doi TEXT,
    pmid TEXT,
    url TEXT,
    citation_count INTEGER DEFAULT 0,
    study_type TEXT,
    evidence_level TEXT,
    medical_relevance_score FLOAT,
    source TEXT, -- 'pubmed', 'crossref', etc.
    raw_data JSONB,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Search queries cache
CREATE TABLE search_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT NOT NULL,
    query_hash TEXT UNIQUE, -- MD5 hash of normalized query
    medical_domains TEXT[],
    results_count INTEGER,
    cached_results JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX idx_research_papers_doi ON research_papers(doi);
CREATE INDEX idx_research_papers_pmid ON research_papers(pmid);
CREATE INDEX idx_research_papers_source ON research_papers(source);
CREATE INDEX idx_research_papers_relevance ON research_papers(medical_relevance_score DESC);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_search_queries_hash ON search_queries(query_hash);
```

### 1.4 Core Type Definitions
```typescript
// src/lib/types/research.ts
export interface ResearchQuery {
  query: string;
  maxResults: number;
  source: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
    studyTypes?: string[];
    evidenceLevels?: string[];
    includePreprints?: boolean;
  };
}

export interface MedicalPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  url: string;
  citationCount: number;
  studyType: string;
  evidenceLevel: string;
  medicalRelevanceScore: number;
  source: string;
  
  // Advanced metadata
  meshTerms?: string[];
  clinicalTrialIds?: string[];
  fundingInfo?: string[];
  conflicts?: string[];
  retracted?: boolean;
  
  // Quality indicators
  journalImpactFactor?: number;
  peerReviewed: boolean;
  openAccess: boolean;
  fullTextAvailable: boolean;
}

export interface SearchResult {
  papers: MedicalPaper[];
  totalFound: number;
  searchTime: number;
  sources: Record<string, number>;
  medicalDomains: string[];
  qualityDistribution: Record<string, number>;
  debugInfo?: {
    originalQuery: string;
    enhancedQuery: string;
    filtersApplied: string[];
    totalScanned: number;
  };
}
```

## Phase 2: Medical APIs Integration

### 2.1 PubMed/MEDLINE Client
```typescript
// src/lib/research/clients/pubmed.ts
export class PubMedClient {
  private apiKey?: string;
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchArticles(query: ResearchQuery): Promise<MedicalPaper[]> {
    // Step 1: Search for PMIDs
    const searchUrl = `${this.baseUrl}/esearch.fcgi`;
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: this.buildMedicalQuery(query.query),
      retmax: query.maxResults.toString(),
      retmode: 'json',
      sort: 'relevance',
      field: 'title,abstract',
    });

    if (this.apiKey) {
      searchParams.set('api_key', this.apiKey);
    }

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult?.idlist?.length) {
      return [];
    }

    // Step 2: Fetch detailed paper information
    const fetchUrl = `${this.baseUrl}/efetch.fcgi`;
    const pmids = searchData.esearchresult.idlist;
    
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      rettype: 'abstract',
    });

    if (this.apiKey) {
      fetchParams.set('api_key', this.apiKey);
    }

    const fetchResponse = await fetch(`${fetchUrl}?${fetchParams}`);
    const xmlData = await fetchResponse.text();
    
    return this.parseXMLToPapers(xmlData);
  }

  private buildMedicalQuery(query: string): string {
    // Enhance query with MeSH terms and medical filters
    const medicalTerms = [
      'clinical[sb]', // Clinical subset
      'systematic[sb]', // Systematic reviews
      'therapy/narrow[mesh]', // Therapy MeSH
      'diagnosis[mesh]', // Diagnosis MeSH
      'etiology[mesh]', // Etiology MeSH
    ];

    // Add publication type filters
    const publicationTypes = [
      'randomized controlled trial[pt]',
      'meta analysis[pt]',
      'systematic review[pt]',
      'clinical trial[pt]',
    ];

    // Build enhanced query
    let enhancedQuery = query;
    
    // Add medical context
    if (!query.toLowerCase().includes('mesh') && !query.includes('[')) {
      enhancedQuery = `(${query}) AND (${medicalTerms.slice(0, 2).join(' OR ')})`;
    }

    return enhancedQuery;
  }

  private parseXMLToPapers(xml: string): MedicalPaper[] {
    // XML parsing logic to convert PubMed XML to MedicalPaper objects
    // Implementation depends on XML parser library
    // Return structured paper data
  }
}
```

### 2.2 Semantic Scholar Client (Enhanced)
```typescript
// src/lib/research/clients/semantic-scholar.ts
export class SemanticScholarClient {
  private apiKey?: string;
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchPapers(query: ResearchQuery): Promise<MedicalPaper[]> {
    const params = new URLSearchParams({
      query: this.enhanceMedicalQuery(query.query),
      limit: Math.min(query.maxResults * 2, 100).toString(), // Get more for filtering
      fields: [
        'paperId', 'title', 'abstract', 'authors', 'venue', 'year',
        'citationCount', 'doi', 'url', 'isOpenAccess', 'fieldsOfStudy',
        'publicationTypes', 's2FieldsOfStudy'
      ].join(','),
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    // Retry logic for rate limiting
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/paper/search?${params}`, {
          method: 'GET',
          headers,
        });

        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`Rate limited, waiting ${delay}ms before retry ${attempt}/3`);
          await this.delay(delay);
          continue;
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const papers = data.data || [];
        
        // Apply medical relevance filtering
        return this.filterMedicalRelevance(papers, query.query);
      } catch (error) {
        if (attempt === 3) throw error;
        await this.delay(1000 * attempt);
      }
    }

    return [];
  }

  private enhanceMedicalQuery(query: string): string {
    // Add medical context to improve relevance
    const medicalKeywords = [
      'medical', 'clinical', 'health', 'patient', 'treatment',
      'therapy', 'disease', 'diagnosis', 'healthcare'
    ];

    // Check if query already has medical context
    const hasContext = medicalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    if (!hasContext) {
      return `${query} medical clinical health`;
    }

    return query;
  }

  private filterMedicalRelevance(papers: any[], query: string): MedicalPaper[] {
    return papers
      .filter(paper => this.isMedicallyRelevant(paper, query))
      .map(paper => this.transformToPaper(paper));
  }

  private isMedicallyRelevant(paper: any, query: string): boolean {
    const title = paper.title || '';
    const abstract = paper.abstract || '';
    const venue = paper.venue || '';
    const fieldsOfStudy = paper.fieldsOfStudy || [];
    const s2Fields = paper.s2FieldsOfStudy || [];

    // Check for medical fields
    const medicalFields = [
      'Medicine', 'Biology', 'Medical', 'Clinical', 'Health',
      'Biomedical', 'Pharmaceutical', 'Therapy', 'Surgery'
    ];

    const hasMedicalField = [...fieldsOfStudy, ...s2Fields].some(field =>
      medicalFields.some(medField => 
        field.category?.toLowerCase().includes(medField.toLowerCase()) ||
        field.toLowerCase().includes(medField.toLowerCase())
      )
    );

    // Apply medical relevance scoring
    return this.calculateMedicalScore(title, abstract, venue) >= 0.6 || hasMedicalField;
  }
}
```

### 2.3 CrossRef Medical Search
```typescript
// src/lib/research/clients/crossref.ts
export class CrossRefClient {
  private baseUrl = 'https://api.crossref.org/works';
  private email: string;

  constructor(email: string) {
    this.email = email; // Required for polite pool
  }

  async searchMedicalPapers(query: ResearchQuery): Promise<MedicalPaper[]> {
    const params = new URLSearchParams({
      query: this.buildMedicalQuery(query.query),
      rows: Math.min(query.maxResults * 2, 1000).toString(),
      sort: 'is-referenced-by-count',
      order: 'desc',
      filter: [
        'type:journal-article',
        'has-abstract:true',
        'from-pub-date:2000-01-01', // Recent publications
      ].join(','),
    });

    const headers = {
      'User-Agent': `MedicalResearchBot/1.0 (${this.email})`,
    };

    const response = await fetch(`${this.baseUrl}?${params}`, { headers });
    
    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }

    const data = await response.json();
    const works = data.message.items || [];
    
    // Filter for medical relevance
    const medicalWorks = works.filter(work => this.isMedicalWork(work));
    
    return medicalWorks.map(work => this.transformToPaper(work));
  }

  private buildMedicalQuery(query: string): string {
    // Add medical journal filters and terms
    const medicalJournals = [
      'medicine', 'medical', 'clinical', 'health', 'therapy',
      'surgery', 'cardiology', 'oncology', 'neurology'
    ];

    return `${query} AND (${medicalJournals.slice(0, 3).join(' OR ')})`;
  }

  private isMedicalWork(work: any): boolean {
    const title = work.title?.[0] || '';
    const journal = work['container-title']?.[0] || '';
    const abstract = work.abstract || '';
    const subjects = work.subject || [];

    // Check for medical subjects
    const medicalSubjects = [
      'Medicine', 'Medical', 'Clinical', 'Health Sciences',
      'Biomedical', 'Pharmaceutical', 'Surgery', 'Therapy'
    ];

    const hasMedicalSubject = subjects.some(subject =>
      medicalSubjects.some(medSubject => 
        subject.toLowerCase().includes(medSubject.toLowerCase())
      )
    );

    // Apply medical relevance scoring
    return this.calculateMedicalScore(title, abstract, journal) >= 0.7 || hasMedicalSubject;
  }
}
```

## Phase 3: AI-Powered Filtering & Ranking

### 3.1 Medical Relevance Scoring
```typescript
// src/lib/ai/medical-relevance.ts
export class MedicalRelevanceScorer {
  private medicalTerms = {
    clinical: [
      'patient', 'clinical', 'treatment', 'therapy', 'diagnosis',
      'medical', 'healthcare', 'hospital', 'physician', 'doctor',
      'nurse', 'care', 'intervention', 'outcome', 'efficacy'
    ],
    
    research: [
      'randomized', 'controlled', 'trial', 'study', 'research',
      'meta-analysis', 'systematic review', 'cohort', 'case-control',
      'observational', 'prospective', 'retrospective', 'longitudinal'
    ],
    
    medical_domains: [
      'cardiology', 'oncology', 'neurology', 'psychiatry', 'surgery',
      'internal medicine', 'pediatrics', 'emergency medicine',
      'radiology', 'pathology', 'pharmacology', 'immunology'
    ],
    
    diseases: [
      'cancer', 'diabetes', 'hypertension', 'heart disease', 'stroke',
      'infection', 'inflammation', 'autoimmune', 'genetic disorder',
      'mental health', 'neurological', 'cardiovascular'
    ]
  };

  calculateRelevance(
    title: string,
    abstract: string,
    journal: string,
    query: string
  ): number {
    const text = `${title} ${abstract} ${journal}`.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    let maxScore = 0;

    // Clinical relevance (40% weight)
    const clinicalScore = this.scoreTerms(text, this.medicalTerms.clinical);
    score += clinicalScore * 0.4;
    maxScore += 0.4;

    // Research quality (30% weight)
    const researchScore = this.scoreTerms(text, this.medicalTerms.research);
    score += researchScore * 0.3;
    maxScore += 0.3;

    // Domain specificity (20% weight)
    const domainScore = this.scoreDomains(text, queryLower);
    score += domainScore * 0.2;
    maxScore += 0.2;

    // Query relevance (10% weight)
    const queryScore = this.scoreQueryRelevance(text, queryLower);
    score += queryScore * 0.1;
    maxScore += 0.1;

    // Penalties for non-medical content
    const penalties = this.calculatePenalties(text);
    score -= penalties;

    return Math.max(0, Math.min(1, score / maxScore));
  }

  private scoreTerms(text: string, terms: string[]): number {
    const matches = terms.filter(term => text.includes(term)).length;
    return Math.min(matches / Math.max(terms.length * 0.3, 1), 1);
  }

  private scoreDomains(text: string, query: string): number {
    // Score based on medical domain alignment
    const domainMatches = this.medicalTerms.medical_domains
      .filter(domain => text.includes(domain) || query.includes(domain)).length;
    
    const diseaseMatches = this.medicalTerms.diseases
      .filter(disease => text.includes(disease) || query.includes(disease)).length;

    return Math.min((domainMatches + diseaseMatches) / 5, 1);
  }

  private scoreQueryRelevance(text: string, query: string): number {
    const queryWords = query.split(' ').filter(w => w.length > 2);
    const matches = queryWords.filter(word => text.includes(word)).length;
    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  private calculatePenalties(text: string): number {
    const nonMedicalTerms = [
      'computer science', 'software engineering', 'machine learning',
      'business management', 'marketing', 'finance', 'economics',
      'pure mathematics', 'theoretical physics', 'chemistry'
    ];

    const penalties = nonMedicalTerms.filter(term => text.includes(term)).length;
    return penalties * 0.2; // 20% penalty per non-medical term
  }
}
```

### 3.2 Evidence Quality Assessment
```typescript
// src/lib/ai/evidence-quality.ts
export class EvidenceQualityAssessor {
  private studyTypeRankings = {
    'systematic review': 1.0,
    'meta-analysis': 1.0,
    'randomized controlled trial': 0.9,
    'clinical trial': 0.8,
    'cohort study': 0.7,
    'case-control': 0.6,
    'cross-sectional': 0.5,
    'case report': 0.4,
    'expert opinion': 0.3,
    'preprint': 0.2,
  };

  assessQuality(paper: MedicalPaper): {
    evidenceLevel: string;
    qualityScore: number;
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Study type assessment (40% weight)
    const studyType = this.detectStudyType(paper.title, paper.abstract);
    const studyScore = this.studyTypeRankings[studyType] || 0.3;
    score += studyScore * 0.4;
    factors.push(`Study Type: ${studyType}`);

    // Citation impact (25% weight)
    const citationScore = this.scoreCitations(paper.citationCount, paper.year);
    score += citationScore * 0.25;
    factors.push(`Citations: ${paper.citationCount} (${citationScore.toFixed(2)} score)`);

    // Journal quality (20% weight)
    const journalScore = this.scoreJournal(paper.journal);
    score += journalScore * 0.2;
    factors.push(`Journal: ${paper.journal} (${journalScore.toFixed(2)} score)`);

    // Recency (10% weight)
    const recencyScore = this.scoreRecency(paper.year);
    score += recencyScore * 0.1;
    factors.push(`Year: ${paper.year} (${recencyScore.toFixed(2)} score)`);

    // Peer review status (5% weight)
    const peerReviewScore = paper.peerReviewed ? 1.0 : 0.0;
    score += peerReviewScore * 0.05;
    factors.push(`Peer Reviewed: ${paper.peerReviewed}`);

    // Generate recommendations
    if (studyScore < 0.7) {
      recommendations.push('Consider higher-quality study designs (RCTs, systematic reviews)');
    }
    
    if (paper.year < new Date().getFullYear() - 5) {
      recommendations.push('Look for more recent studies to confirm current relevance');
    }

    if (paper.citationCount < 10 && paper.year < new Date().getFullYear() - 2) {
      recommendations.push('Low citation count may indicate limited impact or newer publication');
    }

    return {
      evidenceLevel: this.getEvidenceLevel(score),
      qualityScore: Math.min(1, Math.max(0, score)),
      factors,
      recommendations,
    };
  }

  private detectStudyType(title: string, abstract: string): string {
    const text = `${title} ${abstract}`.toLowerCase();
    
    // Priority order matters - more specific first
    if (text.includes('meta-analysis') || text.includes('meta analysis')) {
      return 'meta-analysis';
    }
    
    if (text.includes('systematic review')) {
      return 'systematic review';
    }
    
    if (text.includes('randomized controlled trial') || text.includes('rct')) {
      return 'randomized controlled trial';
    }
    
    if (text.includes('clinical trial')) {
      return 'clinical trial';
    }
    
    if (text.includes('cohort')) {
      return 'cohort study';
    }
    
    if (text.includes('case-control') || text.includes('case control')) {
      return 'case-control';
    }
    
    if (text.includes('cross-sectional')) {
      return 'cross-sectional';
    }
    
    if (text.includes('case report')) {
      return 'case report';
    }

    // Default based on journal patterns
    return 'observational study';
  }

  private scoreCitations(citationCount: number, year: number): number {
    const age = new Date().getFullYear() - year;
    const expectedCitations = Math.max(1, age * 5); // 5 citations per year baseline
    
    // Logarithmic scaling to prevent citation inflation dominance
    return Math.min(1, Math.log10(citationCount + 1) / Math.log10(expectedCitations + 10));
  }

  private scoreJournal(journal: string): number {
    const highImpactJournals = [
      'new england journal of medicine', 'lancet', 'jama', 'bmj',
      'nature medicine', 'cell', 'science', 'plos medicine',
      'circulation', 'journal of clinical investigation'
    ];
    
    const mediumImpactJournals = [
      'american journal', 'european journal', 'journal of',
      'clinical', 'medical', 'international journal'
    ];

    const journalLower = journal.toLowerCase();
    
    if (highImpactJournals.some(j => journalLower.includes(j))) {
      return 1.0;
    }
    
    if (mediumImpactJournals.some(j => journalLower.includes(j))) {
      return 0.7;
    }
    
    return 0.4; // Default for unknown journals
  }

  private scoreRecency(year: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    if (age <= 2) return 1.0;
    if (age <= 5) return 0.8;
    if (age <= 10) return 0.6;
    return Math.max(0.2, 1 - (age / 50)); // Gradual decline
  }

  private getEvidenceLevel(score: number): string {
    if (score >= 0.9) return 'Level 1A (Very High)';
    if (score >= 0.8) return 'Level 1B (High)';
    if (score >= 0.7) return 'Level 2 (Moderate-High)';
    if (score >= 0.6) return 'Level 3A (Moderate)';
    if (score >= 0.5) return 'Level 3B (Moderate-Low)';
    if (score >= 0.4) return 'Level 4 (Low)';
    return 'Level 5 (Very Low)';
  }
}
```

### 3.3 AI-Powered Query Enhancement
```typescript
// src/lib/ai/query-enhancement.ts
import { Together } from 'together-ai';

export class MedicalQueryEnhancer {
  private together: Together;

  constructor(apiKey: string) {
    this.together = new Together({ apiKey });
  }

  async enhanceQuery(
    originalQuery: string,
    context?: {
      previousQueries?: string[];
      userType?: 'researcher' | 'clinician' | 'student';
      specialty?: string;
    }
  ): Promise<{
    enhancedQuery: string;
    meshTerms: string[];
    synonyms: string[];
    relatedConcepts: string[];
    searchStrategy: string;
  }> {
    const prompt = this.buildEnhancementPrompt(originalQuery, context);
    
    const response = await this.together.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a medical research expert specializing in optimizing search queries for biomedical literature databases.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return this.parseEnhancementResponse(response.choices[0].message.content);
  }

  private buildEnhancementPrompt(
    query: string,
    context?: {
      previousQueries?: string[];
      userType?: string;
      specialty?: string;
    }
  ): string {
    return `
Enhance this medical research query for comprehensive literature search:

Original Query: "${query}"
User Type: ${context?.userType || 'researcher'}
Specialty: ${context?.specialty || 'general medicine'}

Please provide:
1. Enhanced query with appropriate medical terminology
2. Relevant MeSH terms (Medical Subject Headings)
3. Synonyms and alternative terms
4. Related concepts to explore
5. Search strategy (broad vs. focused)

Consider:
- Medical terminology precision
- Search scope and specificity
- Database-appropriate syntax
- Evidence-based medicine principles
- Current medical nomenclature

Format your response as JSON:
{
  "enhancedQuery": "...",
  "meshTerms": ["term1", "term2"],
  "synonyms": ["syn1", "syn2"],
  "relatedConcepts": ["concept1", "concept2"],
  "searchStrategy": "focused|broad|comprehensive"
}
    `;
  }

  private parseEnhancementResponse(response: string): any {
    try {
      return JSON.parse(response.trim());
    } catch {
      // Fallback parsing if JSON fails
      return {
        enhancedQuery: response,
        meshTerms: [],
        synonyms: [],
        relatedConcepts: [],
        searchStrategy: 'focused'
      };
    }
  }
}
```

## Phase 4: Advanced Features

### 4.1 Medical Domain Classification
```typescript
// src/lib/ai/domain-classifier.ts
export class MedicalDomainClassifier {
  private domains = {
    cardiology: {
      keywords: ['heart', 'cardiac', 'cardiovascular', 'coronary', 'myocardial', 'arrhythmia'],
      conditions: ['heart failure', 'myocardial infarction', 'atrial fibrillation', 'hypertension']
    },
    oncology: {
      keywords: ['cancer', 'tumor', 'oncology', 'chemotherapy', 'radiation', 'metastasis'],
      conditions: ['breast cancer', 'lung cancer', 'leukemia', 'lymphoma']
    },
    neurology: {
      keywords: ['brain', 'neural', 'neurological', 'cognitive', 'seizure', 'stroke'],
      conditions: ['alzheimer', 'parkinson', 'epilepsy', 'multiple sclerosis']
    },
    endocrinology: {
      keywords: ['diabetes', 'insulin', 'hormone', 'endocrine', 'metabolism', 'glucose'],
      conditions: ['type 1 diabetes', 'type 2 diabetes', 'thyroid disorders']
    },
    infectious_diseases: {
      keywords: ['infection', 'bacterial', 'viral', 'antibiotic', 'pathogen', 'immune'],
      conditions: ['covid-19', 'pneumonia', 'sepsis', 'tuberculosis']
    }
  };

  classifyQuery(query: string): {
    primaryDomain: string;
    confidence: number;
    secondaryDomains: Array<{ domain: string; confidence: number }>;
    suggestedFilters: string[];
  } {
    const queryLower = query.toLowerCase();
    const domainScores: Record<string, number> = {};

    // Score each domain
    Object.entries(this.domains).forEach(([domain, config]) => {
      let score = 0;
      
      // Check keywords
      config.keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          score += 1;
        }
      });
      
      // Check conditions (higher weight)
      config.conditions.forEach(condition => {
        if (queryLower.includes(condition)) {
          score += 2;
        }
      });
      
      domainScores[domain] = score;
    });

    // Find primary and secondary domains
    const sortedDomains = Object.entries(domainScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    const primaryDomain = sortedDomains[0]?.[0] || 'general_medicine';
    const primaryScore = sortedDomains[0]?.[1] || 0;
    
    const secondaryDomains = sortedDomains.slice(1, 3)
      .map(([domain, score]) => ({
        domain,
        confidence: score / Math.max(primaryScore, 1)
      }));

    // Generate suggested filters
    const suggestedFilters = this.generateFilters(primaryDomain, queryLower);

    return {
      primaryDomain,
      confidence: Math.min(1, primaryScore / 3),
      secondaryDomains,
      suggestedFilters
    };
  }

  private generateFilters(domain: string, query: string): string[] {
    const filters: string[] = [];

    // Domain-specific filters
    switch (domain) {
      case 'cardiology':
        filters.push('cardiovascular diseases[mesh]', 'heart diseases[mesh]');
        break;
      case 'oncology':
        filters.push('neoplasms[mesh]', 'antineoplastic agents[mesh]');
        break;
      case 'neurology':
        filters.push('nervous system diseases[mesh]', 'brain diseases[mesh]');
        break;
      case 'endocrinology':
        filters.push('endocrine system diseases[mesh]', 'diabetes mellitus[mesh]');
        break;
      case 'infectious_diseases':
        filters.push('communicable diseases[mesh]', 'anti-bacterial agents[mesh]');
        break;
    }

    // General medical filters
    if (query.includes('treatment') || query.includes('therapy')) {
      filters.push('therapy[mesh]', 'therapeutics[mesh]');
    }

    if (query.includes('diagnosis') || query.includes('diagnostic')) {
      filters.push('diagnosis[mesh]', 'diagnostic techniques[mesh]');
    }

    return filters;
  }
}
```

### 4.2 Citation Network Analysis
```typescript
// src/lib/ai/citation-network.ts
export class CitationNetworkAnalyzer {
  async analyzeCitations(papers: MedicalPaper[]): Promise<{
    keyAuthors: Array<{ name: string; paperCount: number; influence: number }>;
    topJournals: Array<{ journal: string; paperCount: number; avgCitations: number }>;
    researchTrends: Array<{ year: number; paperCount: number; avgCitations: number }>;
    conceptClusters: Array<{ concept: string; papers: string[]; strength: number }>;
  }> {
    // Analyze author networks
    const authorMap = new Map<string, { papers: string[]; totalCitations: number }>();
    
    papers.forEach(paper => {
      paper.authors.forEach(author => {
        if (!authorMap.has(author)) {
          authorMap.set(author, { papers: [], totalCitations: 0 });
        }
        
        const authorData = authorMap.get(author)!;
        authorData.papers.push(paper.id);
        authorData.totalCitations += paper.citationCount;
      });
    });

    const keyAuthors = Array.from(authorMap.entries())
      .map(([name, data]) => ({
        name,
        paperCount: data.papers.length,
        influence: data.totalCitations / data.papers.length
      }))
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 10);

    // Analyze journal impact
    const journalMap = new Map<string, { papers: number; totalCitations: number }>();
    
    papers.forEach(paper => {
      if (!journalMap.has(paper.journal)) {
        journalMap.set(paper.journal, { papers: 0, totalCitations: 0 });
      }
      
      const journalData = journalMap.get(paper.journal)!;
      journalData.papers += 1;
      journalData.totalCitations += paper.citationCount;
    });

    const topJournals = Array.from(journalMap.entries())
      .map(([journal, data]) => ({
        journal,
        paperCount: data.papers,
        avgCitations: data.totalCitations / data.papers
      }))
      .sort((a, b) => b.avgCitations - a.avgCitations)
      .slice(0, 10);

    // Analyze research trends by year
    const yearMap = new Map<number, { papers: number; totalCitations: number }>();
    
    papers.forEach(paper => {
      if (!yearMap.has(paper.year)) {
        yearMap.set(paper.year, { papers: 0, totalCitations: 0 });
      }
      
      const yearData = yearMap.get(paper.year)!;
      yearData.papers += 1;
      yearData.totalCitations += paper.citationCount;
    });

    const researchTrends = Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        paperCount: data.papers,
        avgCitations: data.totalCitations / data.papers
      }))
      .sort((a, b) => a.year - b.year);

    // Extract concept clusters using TF-IDF
    const conceptClusters = await this.extractConceptClusters(papers);

    return {
      keyAuthors,
      topJournals,
      researchTrends,
      conceptClusters
    };
  }

  private async extractConceptClusters(papers: MedicalPaper[]): Promise<Array<{
    concept: string;
    papers: string[];
    strength: number;
  }>> {
    // Extract key concepts from titles and abstracts
    const conceptMap = new Map<string, Set<string>>();
    
    papers.forEach(paper => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      const concepts = this.extractMedicalConcepts(text);
      
      concepts.forEach(concept => {
        if (!conceptMap.has(concept)) {
          conceptMap.set(concept, new Set());
        }
        conceptMap.get(concept)!.add(paper.id);
      });
    });

    // Calculate concept strength (frequency × papers)
    return Array.from(conceptMap.entries())
      .map(([concept, paperSet]) => ({
        concept,
        papers: Array.from(paperSet),
        strength: paperSet.size * this.calculateConceptImportance(concept)
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 20);
  }

  private extractMedicalConcepts(text: string): string[] {
    // Medical concept extraction patterns
    const conceptPatterns = [
      /\b[A-Z][a-z]+ (?:syndrome|disease|disorder|condition)\b/g,
      /\b(?:treatment|therapy) (?:of|for) [a-z ]+/g,
      /\b[a-z]+ (?:inhibitor|blocker|agonist|antagonist)\b/g,
      /\b(?:randomized|clinical) trial\b/g,
      /\b(?:meta-analysis|systematic review)\b/g,
    ];

    const concepts: string[] = [];
    
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(concepts)]; // Remove duplicates
  }

  private calculateConceptImportance(concept: string): number {
    // Weight concepts by medical importance
    const importantTerms = [
      'randomized controlled trial', 'meta-analysis', 'systematic review',
      'clinical trial', 'treatment', 'therapy', 'diagnosis', 'prognosis'
    ];

    return importantTerms.some(term => concept.includes(term)) ? 2 : 1;
  }
}
```

## Phase 5: Production Deployment

### 5.1 API Rate Limiting & Caching
```typescript
// src/lib/middleware/rate-limiting.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different tiers
const rateLimits = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 d'), // 10 per day
    analytics: true,
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 d'), // 100 per day
    analytics: true,
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 d'), // 1000 per day
    analytics: true,
  }),
};

export async function checkRateLimit(userId: string, tier: string = 'free') {
  const rateLimit = rateLimits[tier as keyof typeof rateLimits] || rateLimits.free;
  
  const { success, limit, reset, remaining } = await rateLimit.limit(userId);
  
  return {
    allowed: success,
    limit,
    remaining,
    resetTime: new Date(reset)
  };
}
```

### 5.2 Monitoring & Analytics
```typescript
// src/lib/monitoring/analytics.ts
import { Analytics } from '@vercel/analytics';

export class MedicalSearchAnalytics {
  track(event: string, properties: Record<string, any>) {
    // Track search patterns
    Analytics.track(event, properties);
    
    // Custom medical search metrics
    this.trackMedicalSearchMetrics(event, properties);
  }

  private trackMedicalSearchMetrics(event: string, properties: Record<string, any>) {
    switch (event) {
      case 'medical_search':
        this.trackSearchQuality(properties);
        break;
      case 'paper_clicked':
        this.trackPaperEngagement(properties);
        break;
      case 'search_filtered':
        this.trackFilterUsage(properties);
        break;
    }
  }

  private trackSearchQuality(properties: any) {
    const metrics = {
      query_length: properties.query?.length || 0,
      results_count: properties.resultsCount || 0,
      medical_domains: properties.medicalDomains || [],
      evidence_levels: properties.evidenceLevels || [],
      search_time: properties.searchTime || 0,
      sources_used: properties.sourcesUsed || [],
    };

    console.log('Search Quality Metrics:', metrics);
  }

  private trackPaperEngagement(properties: any) {
    const engagement = {
      paper_id: properties.paperId,
      evidence_level: properties.evidenceLevel,
      citation_count: properties.citationCount,
      source: properties.source,
      position_in_results: properties.position,
    };

    console.log('Paper Engagement:', engagement);
  }

  private trackFilterUsage(properties: any) {
    const filterUsage = {
      filter_type: properties.filterType,
      filter_value: properties.filterValue,
      results_before: properties.resultsBefore,
      results_after: properties.resultsAfter,
    };

    console.log('Filter Usage:', filterUsage);
  }
}
```

### 5.3 Error Handling & Reliability
```typescript
// src/lib/error-handling/medical-errors.ts
export class MedicalSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public source?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'MedicalSearchError';
  }
}

export class ErrorHandler {
  static handleAPIError(error: any, source: string): MedicalSearchError {
    // Rate limiting errors
    if (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
      return new MedicalSearchError(
        `${source} API rate limit exceeded. Please try again later.`,
        'RATE_LIMIT_EXCEEDED',
        source,
        true
      );
    }

    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return new MedicalSearchError(
        `${source} API authentication failed. Please check your API key.`,
        'AUTH_FAILED',
        source,
        false
      );
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.name === 'TypeError') {
      return new MedicalSearchError(
        `Network error connecting to ${source}. Please check your connection.`,
        'NETWORK_ERROR',
        source,
        true
      );
    }

    // Generic API errors
    return new MedicalSearchError(
      `${source} API error: ${error.message}`,
      'API_ERROR',
      source,
      true
    );
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }

    throw lastError!;
  }
}
```

## Medical Compliance & Safety

### Legal & Ethical Considerations
```typescript
// src/lib/compliance/medical-disclaimers.ts
export const MEDICAL_DISCLAIMERS = {
  general: `
This platform provides research information for educational and informational 
purposes only. It is not intended as medical advice, diagnosis, or treatment. 
Always consult with qualified healthcare professionals for medical decisions.
  `,
  
  research: `
Research papers and studies presented here are for academic reference. 
Results may not be generalizable to all populations. Consider study 
limitations, sample sizes, and methodological quality when interpreting results.
  `,
  
  ai_generated: `
AI-generated summaries and insights are based on available literature and 
should be verified with primary sources. These summaries may not capture 
all nuances of complex medical topics.
  `,
  
  emergency: `
This platform is not for medical emergencies. If you are experiencing a 
medical emergency, contact emergency services immediately.
  `
};

export class ComplianceChecker {
  checkContent(content: string): {
    requiresDisclaimer: boolean;
    disclaimerType: keyof typeof MEDICAL_DISCLAIMERS;
    sensitiveTopics: string[];
    recommendations: string[];
  } {
    const sensitivePatterns = [
      /\b(?:treatment|therapy|medication|drug|dose|dosage)\b/i,
      /\b(?:diagnosis|diagnostic|symptom|side effect)\b/i,
      /\b(?:emergency|urgent|critical|life-threatening)\b/i,
      /\b(?:pregnancy|pediatric|children|infant)\b/i,
    ];

    const sensitiveTopics = sensitivePatterns
      .filter(pattern => pattern.test(content))
      .map(pattern => pattern.source);

    const requiresDisclaimer = sensitiveTopics.length > 0;
    
    let disclaimerType: keyof typeof MEDICAL_DISCLAIMERS = 'general';
    if (content.includes('AI') || content.includes('summary')) {
      disclaimerType = 'ai_generated';
    } else if (content.includes('study') || content.includes('research')) {
      disclaimerType = 'research';
    }

    const recommendations = this.generateRecommendations(sensitiveTopics);

    return {
      requiresDisclaimer,
      disclaimerType,
      sensitiveTopics,
      recommendations
    };
  }

  private generateRecommendations(topics: string[]): string[] {
    const recommendations: string[] = [];

    if (topics.some(t => t.includes('treatment'))) {
      recommendations.push('Consult healthcare provider before starting any treatment');
    }

    if (topics.some(t => t.includes('emergency'))) {
      recommendations.push('Contact emergency services for urgent medical situations');
    }

    if (topics.some(t => t.includes('pregnancy'))) {
      recommendations.push('Discuss with obstetrician for pregnancy-related medical questions');
    }

    return recommendations;
  }
}
```

## Deployment Instructions

### Environment Setup
```bash
# 1. Clone and setup
git clone <your-repo>
cd medical-research-platform
npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in all required API keys and database URLs

# 3. Database setup
npx supabase db push
npx supabase db seed

# 4. Development
npm run dev
```

### Production Deployment (Vercel)
```bash
# 1. Build and test
npm run build
npm run start

# 2. Deploy
vercel --prod
```

### Performance Optimizations
- Implement Redis caching for search results
- Use CDN for static assets
- Database indexing for fast lookups
- API response compression
- Image optimization for paper thumbnails
- Lazy loading for large result sets

### Security Measures
- Input sanitization and validation
- Rate limiting per IP and user
- API key rotation and management
- SQL injection prevention
- XSS protection
- CSRF protection with tokens

This comprehensive guide provides everything needed to build a production-ready medical research platform like Consensus. The modular architecture allows for gradual implementation and scaling as needed.
