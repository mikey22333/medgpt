import { NextRequest, NextResponse } from "next/server";
import { PubMedClient } from "@/lib/research/pubmed";
import AdvancedPubMedClient from "@/lib/research/advanced-pubmed";
import SemanticResearchRanker from "@/lib/research/semantic-ranker";
import MedicalQueryProcessor from "@/lib/research/query-processor";
import { SemanticScholarClient } from "@/lib/research/semantic-scholar";
import { crossRefAPI, medicalResearchHelpers } from "@/lib/research/crossref";
import { EuropePMCClient } from "@/lib/research/europepmc";
import { FDAClient } from "@/lib/research/fda";
import { OpenAlexClient } from "@/lib/research/openalex";
import DOAJClient from "@/lib/research/clients/DOAJClient";
import { BioRxivClient } from "@/lib/research/biorxiv";
import { ClinicalTrialsClient } from "@/lib/research/clinicaltrials";
import { GuidelineCentralClient } from "@/lib/research/guideline-central";
import { NIHReporterClient } from "@/lib/research/nih-reporter";
import { type ResearchQuery, type PubMedArticle, type SemanticScholarPaper, type CrossRefPaper } from "@/lib/types/research";

// Enhanced medical relevance filtering
function isMedicallyRelevant(title: string, abstract: string = "", journal: string = "", keywords: string[] = []): boolean {
  const medicalTerms = [
    // Clinical terms
    'patient', 'treatment', 'therapy', 'clinical', 'medical', 'disease', 'diagnosis', 'symptom',
    'health', 'healthcare', 'medicine', 'pharmaceutical', 'drug', 'medication', 'intervention',
    'outcome', 'efficacy', 'safety', 'adverse', 'side effect', 'randomized', 'controlled trial',
    'meta-analysis', 'systematic review', 'cohort', 'case-control', 'epidemiologic', 'prevalence',
    'incidence', 'mortality', 'morbidity', 'prognosis', 'biomarker', 'screening', 'prevention',
    
    // Medical specialties
    'cardiology', 'oncology', 'neurology', 'psychiatry', 'pediatrics', 'surgery', 'radiology',
    'pathology', 'pharmacology', 'immunology', 'infectious disease', 'dermatology', 'orthopedic',
    'gastroenterology', 'endocrinology', 'pulmonology', 'nephrology', 'hematology', 'rheumatology',
    
    // Anatomical terms
    'heart', 'brain', 'lung', 'liver', 'kidney', 'blood', 'cell', 'tissue', 'organ', 'bone',
    'muscle', 'nerve', 'artery', 'vein', 'immune system', 'respiratory', 'cardiovascular',
    
    // Pathological terms
    'cancer', 'tumor', 'diabetes', 'hypertension', 'infection', 'inflammation', 'stroke',
    'heart attack', 'pneumonia', 'asthma', 'copd', 'alzheimer', 'parkinson', 'epilepsy',
    
    // Research terms
    'clinical trial', 'cohort study', 'case report', 'systematic review', 'meta-analysis',
    'randomized controlled trial', 'rct', 'double-blind', 'placebo', 'crossover', 'longitudinal'
  ];

  const combinedText = `${title} ${abstract} ${journal} ${keywords.join(' ')}`.toLowerCase();
  
  // Check for medical terms
  const medicalTermCount = medicalTerms.filter(term => combinedText.includes(term.toLowerCase())).length;
  
  // Medical journals (partial list)
  const medicalJournals = [
    'new england journal of medicine', 'lancet', 'jama', 'bmj', 'nature medicine',
    'cell', 'science', 'plos medicine', 'cochrane', 'american journal', 'european journal',
    'journal of clinical', 'annals of internal medicine', 'circulation', 'cancer research',
    'journal of the american medical association', 'british medical journal'
  ];
  
  const isMedicalJournal = medicalJournals.some(j => journal.toLowerCase().includes(j));
  
  // Exclude clearly non-medical terms
  const nonMedicalTerms = [
    'business', 'management', 'marketing', 'finance', 'economics', 'accounting', 'strategy',
    'leadership', 'organization', 'corporate', 'education', 'psychology', 'sociology',
    'philosophy', 'politics', 'engineering', 'computer science', 'mathematics', 'physics',
    'chemistry', 'environmental', 'agriculture', 'law', 'legal', 'art', 'literature',
    'motivation', 'self-determination', 'competitive advantage', 'firm resources'
  ];
  
  const hasNonMedicalTerms = nonMedicalTerms.some(term => combinedText.includes(term.toLowerCase()));
  
  // Scoring system
  let score = 0;
  
  // Positive indicators
  if (medicalTermCount >= 2) score += 3;
  else if (medicalTermCount === 1) score += 1;
  
  if (isMedicalJournal) score += 2;
  
  // Negative indicators
  if (hasNonMedicalTerms) score -= 2;
  
  return score >= 2;
}

// Enhanced CrossRef medical filtering
async function searchMedicalCrossRef(query: string, options: { limit?: number } = {}): Promise<any[]> {
  try {
    // First, try medical-specific search terms
    const medicalQuery = `${query} AND (medicine OR medical OR health OR clinical OR patient OR treatment OR therapy OR disease OR diagnosis)`;
    
    const results = await crossRefAPI.searchWorks({
      query: medicalQuery,
      rows: Math.min(options.limit || 10, 50), // Get more to filter
      sort: 'is-referenced-by-count',
      order: 'desc',
      filter: 'type:journal-article'
    });

    // Filter results for medical relevance
    const medicalResults = results.filter(work => {
      const title = work.title?.[0] || '';
      const journal = work['container-title']?.[0] || '';
      const abstract = work.abstract || '';
      
      return isMedicallyRelevant(title, abstract, journal);
    });

    // If we don't have enough medical results, try a broader search
    if (medicalResults.length < 3) {
      const broaderResults = await crossRefAPI.searchWorks({
        query: query,
        rows: 30,
        sort: 'relevance',
        order: 'desc',
        filter: 'type:journal-article'
      });

      const additionalMedical = broaderResults.filter(work => {
        const title = work.title?.[0] || '';
        const journal = work['container-title']?.[0] || '';
        const abstract = work.abstract || '';
        
        return isMedicallyRelevant(title, abstract, journal) && 
               !medicalResults.some(existing => existing.DOI === work.DOI);
      });

      medicalResults.push(...additionalMedical);
    }

    return medicalResults.slice(0, options.limit || 10);
  } catch (error) {
    console.error("Enhanced CrossRef medical search error:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle chat-style requests with actual research
    if (body.sessionId && body.mode) {
      const { query, sessionId, mode } = body;
      
      if (!query || query.trim().length === 0) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        );
      }

      console.log("🔍 Enhanced research mode chat request:", query);
      
      // Initialize medical query processing
      const queryAnalysis = MedicalQueryProcessor.processQuery(query);
      console.log("🧠 Query analysis:", queryAnalysis);

      const semanticRanker = new SemanticResearchRanker();
      const maxResults = 12;
      
      // Initialize result arrays
      let pubmedPapers: PubMedArticle[] = [];
      let crossRefPapers: CrossRefPaper[] = [];
      let semanticScholarPapers: SemanticScholarPaper[] = [];
      let europePMCPapers: any[] = [];

      // Enhanced PubMed Search (Primary)
      try {
        const advancedPubMedClient = new AdvancedPubMedClient(process.env.PUBMED_API_KEY);
        pubmedPapers = await advancedPubMedClient.searchAdvanced(queryAnalysis.enhancedQuery, {
          maxResults: 8,
          studyTypes: queryAnalysis.studyTypes,
          includeMetaAnalyses: queryAnalysis.filters.includeMetaAnalyses,
          includeRCTs: queryAnalysis.filters.includeRCTs,
          recentYears: queryAnalysis.filters.recentYearsOnly || undefined
        });
        console.log("✅ Enhanced PubMed papers found:", pubmedPapers.length);
      } catch (error) {
        console.error("❌ Enhanced PubMed search error:", error);
        
        // Fallback to basic PubMed
        try {
          const basicPubMedClient = new PubMedClient(process.env.PUBMED_API_KEY);
          pubmedPapers = await basicPubMedClient.searchArticles({
            query: query,
            maxResults: 6,
            source: "pubmed",
          });
          console.log("✅ Fallback PubMed papers found:", pubmedPapers.length);
        } catch (fallbackError) {
          console.error("❌ Fallback PubMed also failed:", fallbackError);
        }
      }

      // Enhanced CrossRef Search with Medical Filtering
      try {
        console.log("🔍 Searching CrossRef with medical filtering...");
        const crossRefResults = await searchMedicalCrossRef(query, { limit: 5 });
        
        crossRefPapers = crossRefResults.map(work => ({
          id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
          title: work.title?.[0] || 'Untitled',
          authors: work.author?.map((a: any) => `${a.family || ''}, ${a.given || ''}`).join(', ') || 'Unknown',
          journal: work['container-title']?.[0] || 'Unknown Journal',
          year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          abstract: work.abstract || 'Abstract not available',
          doi: work.DOI,
          url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : ''),
          citationCount: work['is-referenced-by-count'] || 0,
          type: work.type || 'journal-article',
          source: 'crossref',
          pmid: null,
          volume: work.volume,
          issue: work.issue,
          pages: work.page,
          publisher: work.publisher
        }));
        
        console.log("✅ Enhanced CrossRef medical papers found:", crossRefPapers.length);
      } catch (error) {
        console.error("❌ Enhanced CrossRef search error:", error);
      }

      // Semantic Scholar Search (if needed)
      if (pubmedPapers.length + crossRefPapers.length < 5) {
        try {
          const semanticScholarClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
          semanticScholarPapers = await semanticScholarClient.searchPapers({
            query: query,
            maxResults: 4,
            source: "semantic-scholar",
          });
          console.log("✅ Semantic Scholar papers found:", semanticScholarPapers.length);
        } catch (error) {
          console.error("❌ Semantic Scholar search error:", error);
        }
      }

      // Europe PMC Search (if still needed)
      if (pubmedPapers.length + crossRefPapers.length + semanticScholarPapers.length < 6) {
        try {
          const europePMCClient = new EuropePMCClient();
          europePMCPapers = await europePMCClient.searchArticles({
            query: query,
            maxResults: 3,
            source: "europepmc",
          });
          console.log("✅ Europe PMC papers found:", europePMCPapers.length);
        } catch (error) {
          console.error("❌ Europe PMC search error:", error);
        }
      }

      // Combine and rank results
      const allPapers = await Promise.all([
        // PubMed papers
        ...pubmedPapers.map(async paper => ({
          ...paper,
          relevanceScore: await semanticRanker.calculateSemanticRelevance(query, paper.title, paper.abstract || ''),
          medicalRelevanceScore: isMedicallyRelevant(paper.title, paper.abstract || '', paper.journal) ? 1.0 : 0.3,
          source: "PubMed",
          evidenceQuality: "Medium" // PubMed papers are generally peer-reviewed
        })),
        
        // CrossRef papers (already filtered for medical relevance)
        ...crossRefPapers.map(async paper => ({
          ...paper,
          relevanceScore: await semanticRanker.calculateSemanticRelevance(query, paper.title, paper.abstract || ''),
          medicalRelevanceScore: 1.0, // Already filtered
          source: "CrossRef",
          evidenceQuality: (paper as any).citationCount && (paper as any).citationCount > 50 ? "High" : 
                          (paper as any).citationCount && (paper as any).citationCount > 10 ? "Medium" : "Low"
        })),
        
        // Semantic Scholar papers
        ...semanticScholarPapers.map(async paper => ({
          ...paper,
          relevanceScore: await semanticRanker.calculateSemanticRelevance(query, paper.title, paper.abstract || ''),
          medicalRelevanceScore: isMedicallyRelevant(paper.title, paper.abstract || '', (paper as any).venue || '') ? 1.0 : 0.3,
          source: "Semantic Scholar",
          evidenceQuality: (paper as any).citationCount && (paper as any).citationCount > 50 ? "High" : 
                          (paper as any).citationCount && (paper as any).citationCount > 10 ? "Medium" : "Low"
        })),
        
        // Europe PMC papers
        ...europePMCPapers.map(async paper => ({
          ...paper,
          relevanceScore: await semanticRanker.calculateSemanticRelevance(query, paper.title, paper.abstract || ''),
          medicalRelevanceScore: isMedicallyRelevant(paper.title, paper.abstract || '', (paper as any).journal || '') ? 1.0 : 0.3,
          source: "Europe PMC",
          evidenceQuality: (paper as any).citationCount && (paper as any).citationCount > 50 ? "High" : 
                          (paper as any).citationCount && (paper as any).citationCount > 10 ? "Medium" : "Low"
        }))
      ]);

      // Filter out non-medical papers and sort by combined score
      const medicalPapers = allPapers.filter(paper => paper.medicalRelevanceScore >= 0.7);
      
      const rankedPapers = medicalPapers.sort((a, b) => {
        const scoreA = (a.relevanceScore || 0) * 0.6 + (a.medicalRelevanceScore || 0) * 0.4;
        const scoreB = (b.relevanceScore || 0) * 0.6 + (b.medicalRelevanceScore || 0) * 0.4;
        return scoreB - scoreA;
      }).slice(0, maxResults);

      console.log(`🎯 Final results: ${rankedPapers.length} medically relevant papers`);

      // Generate Consensus.app-style response with individual study cards
      let response = '';
      
      if (rankedPapers.length > 0) {
        // Brief AI summary (1-3 sentences max)
        const summaryInsight = generateBriefSummary(rankedPapers, query);
        response += `${summaryInsight}\n\n`;
        
        // Individual study cards (like Consensus.app)
        rankedPapers.forEach((paper, index) => {
          const keyFinding = extractKeyFinding(paper, query);
          const studyType = inferStudyType(paper.title, paper.abstract || '');
          const confidenceLevel = calculateConfidenceLevel(paper);
          
          response += `## 📄 ${paper.title}\n\n`;
          
          // One-line key finding
          response += `✅ **Key Finding:** ${keyFinding}\n\n`;
          
          // Study metadata card
          response += `🧬 **Study Type:** ${studyType}  \n`;
          response += `🏥 **Journal:** ${paper.journal} (${paper.year})  \n`;
          response += `👥 **Authors:** ${paper.authors?.slice(0, 3).join(', ') || 'Unknown'}${(paper.authors?.length || 0) > 3 ? ' et al.' : ''}  \n`;
          response += `📌 **Confidence:** ${confidenceLevel}  \n`;
          
          // Direct links
          if (paper.url) {
            response += `🔗 [Read Full Paper](${paper.url})`;
          }
          if (paper.doi) {
            response += ` | [DOI](https://doi.org/${paper.doi})`;
          }
          if (paper.pmid) {
            response += ` | [PubMed](https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/)`;
          }
          response += `\n\n`;
          
          response += `---\n\n`;
        });

        response += "**Medical Disclaimer:** This research synthesis is for educational purposes only. Clinical decisions must involve qualified healthcare providers considering individual patient factors.";
      } else {
        response = `No relevant studies found for "${query}". Try using different medical terms or broadening your search.`;
      }

      return NextResponse.json({
        response,
        citations: rankedPapers.slice(0, 10).map(paper => ({
          title: paper.title,
          authors: paper.authors || ['Unknown'],
          journal: paper.journal,
          year: paper.year,
          url: paper.url,
          doi: paper.doi,
          pmid: paper.pmid,
          source: paper.source
        })),
        reasoningSteps: [
          {
            step: 1,
            title: "Database Search",
            process: `Searched medical databases (PubMed, CrossRef, Semantic Scholar, Europe PMC) for: "${query}"`
          },
          {
            step: 2,
            title: "Medical Filtering",
            process: `Applied medical relevance filtering to ${allPapers.length} papers, selected ${medicalPapers.length} medically relevant`
          },
          {
            step: 3,
            title: "Study Cards",
            process: `Generated ${rankedPapers.length} individual study cards with key findings and metadata`
          }
        ],
        sessionId,
        mode
      });
    }

    // Handle other request types...
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });

  } catch (error) {
    console.error("Enhanced research API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper functions (would be imported from separate modules in a real implementation)
function identifyMedicalDomains(query: string): string[] {
  const domains = [];
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('drug') || lowerQuery.includes('medication') || lowerQuery.includes('pharmaceutical')) {
    domains.push('pharmaceuticals');
  }
  if (lowerQuery.includes('device') || lowerQuery.includes('diagnostic')) {
    domains.push('medical_devices');
  }
  if (lowerQuery.includes('surgery') || lowerQuery.includes('procedure')) {
    domains.push('surgery');
  }
  if (lowerQuery.includes('prevention') || lowerQuery.includes('screening')) {
    domains.push('preventive_medicine');
  }
  
  return domains.length > 0 ? domains : ['general_medicine'];
}

async function generateSemanticQueryVariants(query: string): Promise<string[]> {
  // Simple implementation - in practice, this might use an LLM or semantic similarity
  const variants = [];
  const lowerQuery = query.toLowerCase();
  
  // Add medical synonyms
  if (lowerQuery.includes('hypertension')) {
    variants.push(query.replace(/hypertension/gi, 'high blood pressure'));
  }
  if (lowerQuery.includes('lifestyle')) {
    variants.push(query.replace(/lifestyle/gi, 'behavior modification'));
  }
  if (lowerQuery.includes('diet')) {
    variants.push(query.replace(/diet/gi, 'nutrition'));
  }
  if (lowerQuery.includes('exercise')) {
    variants.push(query.replace(/exercise/gi, 'physical activity'));
  }
  
  return variants;
}

function extractResearchConcepts(query: string): string[] {
  const concepts = [];
  const lowerQuery = query.toLowerCase();
  
  const conceptMap = {
    'lifestyle changes': ['lifestyle modification', 'behavior change'],
    'diet': ['nutrition', 'dietary intervention'],
    'exercise': ['physical activity', 'fitness'],
    'hypertension': ['blood pressure', 'cardiovascular'],
    'management': ['treatment', 'therapy']
  };
  
  for (const [key, synonyms] of Object.entries(conceptMap)) {
    if (lowerQuery.includes(key)) {
      concepts.push(key, ...synonyms);
    }
  }
  
  return [...new Set(concepts)];
}

function generateMeSHTerms(query: string, domains: string[]): string[] {
  const meshTerms = [];
  const lowerQuery = query.toLowerCase();
  
  // Basic MeSH term mapping
  if (lowerQuery.includes('hypertension')) {
    meshTerms.push('Hypertension', 'Blood Pressure');
  }
  if (lowerQuery.includes('lifestyle') || lowerQuery.includes('diet') || lowerQuery.includes('exercise')) {
    meshTerms.push('Life Style', 'Diet Therapy', 'Exercise Therapy');
  }
  if (lowerQuery.includes('management') || lowerQuery.includes('treatment')) {
    meshTerms.push('Disease Management', 'Therapeutics');
  }
  
  return meshTerms;
}

// Consensus.app-style helper functions
function generateBriefSummary(papers: any[], query: string): string {
  const totalPapers = papers.length;
  const hasHighQuality = papers.some(p => p.evidenceQuality === 'High');
  
  if (totalPapers === 0) {
    return "No relevant studies found for this query.";
  }
  
  // Generate evidence-based summary
  const mainFindings = papers.slice(0, 3).map(p => extractKeyFinding(p, query)).filter(Boolean);
  
  if (hasHighQuality) {
    return `Based on ${totalPapers} studies including high-quality evidence, research shows ${mainFindings[0] || 'mixed results regarding your query'}.`;
  } else {
    return `Analysis of ${totalPapers} studies suggests ${mainFindings[0] || 'preliminary evidence regarding your query'}. More high-quality research may be needed.`;
  }
}

function extractKeyFinding(paper: any, query: string): string {
  const title = paper.title.toLowerCase();
  const abstract = (paper.abstract || '').toLowerCase();
  
  // Extract key findings based on study type and content
  if (title.includes('meta-analysis')) {
    if (abstract.includes('significant') && abstract.includes('reduction')) {
      return "Meta-analysis shows significant treatment benefits";
    }
    if (abstract.includes('no significant difference')) {
      return "Meta-analysis found no significant differences between treatments";
    }
    return "Meta-analysis provides pooled evidence on treatment effects";
  }
  
  if (title.includes('randomized') || title.includes('rct') || title.includes('clinical trial')) {
    if (abstract.includes('superior') || abstract.includes('more effective')) {
      return "RCT demonstrates superior treatment efficacy";
    }
    if (abstract.includes('non-inferior')) {
      return "RCT shows non-inferiority of treatment";
    }
    if (abstract.includes('reduced') && abstract.includes('risk')) {
      return "RCT shows reduced risk with intervention";
    }
    return "RCT evaluates treatment safety and efficacy";
  }
  
  if (title.includes('systematic review')) {
    return "Systematic review synthesizes current evidence";
  }
  
  // Default based on title/abstract content
  if (abstract.includes('effective') || title.includes('effective')) {
    return "Study suggests treatment effectiveness";
  }
  if (abstract.includes('safe') || title.includes('safety')) {
    return "Study evaluates treatment safety profile";
  }
  
  return "Study provides evidence on treatment outcomes";
}

function inferStudyType(title: string, abstract: string): string {
  const text = `${title} ${abstract}`.toLowerCase();
  
  if (text.includes('meta-analysis')) return 'Meta-analysis';
  if (text.includes('systematic review')) return 'Systematic Review';
  if (text.includes('randomized controlled trial') || text.includes('rct')) return 'Randomized Controlled Trial';
  if (text.includes('clinical trial')) return 'Clinical Trial';
  if (text.includes('cohort study')) return 'Cohort Study';
  if (text.includes('case-control')) return 'Case-Control Study';
  if (text.includes('case report')) return 'Case Report';
  if (text.includes('cross-sectional')) return 'Cross-sectional Study';
  if (text.includes('review')) return 'Review Article';
  
  return 'Research Article';
}

function calculateConfidenceLevel(paper: any): string {
  const studyType = inferStudyType(paper.title, paper.abstract || '');
  const relevanceScore = paper.relevanceScore || 0;
  const evidenceQuality = paper.evidenceQuality || 'Low';
  
  // High confidence
  if (studyType.includes('Meta-analysis') || evidenceQuality === 'High') {
    return "🟢 High";
  }
  
  // Medium-high confidence
  if (studyType.includes('RCT') || studyType.includes('Systematic Review') || evidenceQuality === 'Medium') {
    return "🟡 Medium-High";
  }
  
  // Medium confidence
  if (relevanceScore > 0.7 || studyType.includes('Cohort')) {
    return "🟠 Medium";
  }
  
  // Lower confidence
  return "🔴 Lower";
}
