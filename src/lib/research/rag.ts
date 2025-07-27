import { PubMedClient } from "./pubmed";
import { SemanticScholarClient } from "./semantic-scholar";
import { EuropePMCClient } from "./europepmc";
import { FDAClient } from "./fda";
import { QueryRefinementService } from "./query-refinement";
import { type Citation } from "@/lib/types/chat";
import { type ResearchQuery, type PubMedArticle, type SemanticScholarPaper, type EuropePMCArticle, type ResearchPaper } from "@/lib/types/research";

export interface RAGResult {
  citations: Citation[];
  contextSummary: string;
  totalPapersFound: number;
  sources: string[];
}

export class RAGPipeline {
  private pubmedClient: PubMedClient;
  private semanticScholarClient: SemanticScholarClient;
  private europePMCClient: EuropePMCClient;
  private fdaClient: FDAClient;

  constructor() {
    this.pubmedClient = new PubMedClient(process.env.PUBMED_API_KEY);
    this.semanticScholarClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
    this.europePMCClient = new EuropePMCClient(process.env.EUROPE_PMC_EMAIL);
    this.fdaClient = new FDAClient();
  }

  async retrieveContext(query: string, maxResults: number = 5): Promise<RAGResult> {
    try {
      console.log(`RAG: Retrieving context for query: "${query}"`);
      
      // Step 1: Refine the query using medical terminology
      const refinement = QueryRefinementService.refineQuery(query);
      console.log(`RAG: Refined queries: ${refinement.refinedQueries.slice(0, 3).join(', ')}`);
      
      // Step 2: Try multiple refined queries
      const allCitations: Citation[] = [];
      const sources: string[] = [];
      
      // Search with refined queries
      for (const refinedQuery of refinement.refinedQueries.slice(0, 2)) {
        const researchQuery: ResearchQuery = {
          query: refinedQuery,
          maxResults: Math.ceil(maxResults / 4), // Divide between 4 sources now
          source: "all"
        };

        // Search all four sources with refined query
        const [pubmedResults, europePMCResults, fdaResults] = await Promise.allSettled([
          this.searchPubMed(researchQuery),
          this.searchEuropePMC(researchQuery),
          this.searchFDA(researchQuery),
        ]);

        // Process PubMed results
        if (pubmedResults.status === "fulfilled" && pubmedResults.value.length > 0) {
          const pubmedCitations = pubmedResults.value.map(paper => this.convertPubMedToCitation(paper));
          allCitations.push(...pubmedCitations);
          if (!sources.includes("PubMed")) sources.push("PubMed");
          console.log(`RAG: Found ${pubmedCitations.length} papers from PubMed with query: "${refinedQuery}"`);
        }

        // Process Europe PMC results
        if (europePMCResults.status === "fulfilled" && europePMCResults.value.length > 0) {
          const europePMCCitations = europePMCResults.value.map(paper => this.convertEuropePMCToCitation(paper));
          allCitations.push(...europePMCCitations);
          if (!sources.includes("Europe PMC")) sources.push("Europe PMC");
          console.log(`RAG: Found ${europePMCCitations.length} papers from Europe PMC with query: "${refinedQuery}"`);
        }

        // Process FDA results
        if (fdaResults.status === "fulfilled" && fdaResults.value.length > 0) {
          const fdaCitations = fdaResults.value.map(paper => this.convertFDAToCitation(paper));
          allCitations.push(...fdaCitations);
          if (!sources.includes("FDA")) sources.push("FDA");
          console.log(`RAG: Found ${fdaCitations.length} FDA resources with query: "${refinedQuery}"`);
        }
        
        // Break if we have enough results
        if (allCitations.length >= maxResults) break;
      }

      // Step 3: Add fallback references if we have few results
      if (allCitations.length < 2) {
        console.log(`RAG: Low results (${allCitations.length}), adding fallback references`);
        const fallbackRefs = QueryRefinementService.getFallbackReferences(query, refinement.category);
        allCitations.push(...fallbackRefs);
        sources.push("Curated References");
        console.log(`RAG: Added ${fallbackRefs.length} fallback references`);
      }

      // Process Semantic Scholar results (temporarily disabled)
      /*
      if (semanticScholarResults.status === "fulfilled" && semanticScholarResults.value.length > 0) {
        const semanticCitations = semanticScholarResults.value.map(paper => this.convertSemanticScholarToCitation(paper));
        allCitations.push(...semanticCitations);
        sources.push("Semantic Scholar");
        console.log(`RAG: Found ${semanticCitations.length} papers from Semantic Scholar`);
      } else {
        console.log("RAG: Semantic Scholar search failed or returned no results");
      }
      */

      // Remove duplicates and limit results to 3-4 papers for better token management
      const uniqueCitations = this.removeDuplicateCitations(allCitations);
      const limitedCitations = uniqueCitations.slice(0, Math.min(4, maxResults));

      // Truncate abstracts to keep prompt size manageable (< 4,000 tokens)
      const truncatedCitations = limitedCitations.map(citation => ({
        ...citation,
        abstract: citation.abstract && citation.abstract.length > 400 
          ? citation.abstract.substring(0, 400) + "..."
          : citation.abstract
      }));

      // Generate context summary
      const contextSummary = this.generateContextSummary(truncatedCitations);

      console.log(`RAG: Retrieved ${truncatedCitations.length} unique citations with truncated abstracts`);

      return {
        citations: truncatedCitations,
        contextSummary,
        totalPapersFound: allCitations.length,
        sources
      };

    } catch (error) {
      console.error("RAG pipeline error:", error);
      return {
        citations: [],
        contextSummary: "No research context available due to search errors.",
        totalPapersFound: 0,
        sources: []
      };
    }
  }

  private async searchPubMed(query: ResearchQuery) {
    try {
      return await this.pubmedClient.searchArticles({
        ...query,
        maxResults: Math.ceil(query.maxResults / 2) // Split between sources
      });
    } catch (error) {
      console.error("PubMed search error in RAG:", error);
      return [];
    }
  }

  private async searchSemanticScholar(query: ResearchQuery) {
    try {
      return await this.semanticScholarClient.searchPapers({
        ...query,
        maxResults: Math.ceil(query.maxResults / 2) // Split between sources
      });
    } catch (error) {
      console.error("Semantic Scholar search error in RAG:", error);
      return [];
    }
  }

  private async searchEuropePMC(query: ResearchQuery): Promise<EuropePMCArticle[]> {
    try {
      return await this.europePMCClient.searchArticles({
        ...query,
        maxResults: Math.ceil(query.maxResults)
      });
    } catch (error) {
      console.error("Europe PMC search error in RAG:", error);
      return [];
    }
  }

  private async searchFDA(query: ResearchQuery): Promise<ResearchPaper[]> {
    try {
      return await this.fdaClient.searchAll(query.query);
    } catch (error) {
      console.error("FDA search error in RAG:", error);
      return [];
    }
  }

  // Enhanced citation conversion with confidence scoring and study type detection
  private convertPubMedToCitation(paper: PubMedArticle): Citation {
    const studyType = this.detectStudyType(paper.title, paper.abstract);
    const confidenceScore = this.calculateConfidenceScore(paper, studyType);
    const meshTerms = this.extractMeshTerms(paper.abstract);
    const year = paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : new Date().getFullYear();
    const evidenceLevel = this.determineEvidenceLevel(studyType, paper.journal, year);
    const guidelineOrg = this.detectGuidelineOrganization(paper.title, paper.journal, paper.authors);

    return {
      id: paper.pmid || paper.id,
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors : [paper.authors].filter(Boolean),
      journal: paper.journal || "Unknown Journal",
      year: paper.publishedDate ? new Date(paper.publishedDate).getFullYear().toString() : new Date().getFullYear().toString(),
      pmid: paper.pmid,
      doi: paper.doi,
      url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
      abstract: paper.abstract || "Abstract not available",
      studyType,
      confidenceScore,
      evidenceLevel,
      source: 'PubMed',
      meshTerms,
      isGuideline: studyType === 'Guideline',
      guidelineOrg
    };
  }

  private convertSemanticScholarToCitation(paper: SemanticScholarPaper): Citation {
    const studyType = this.detectStudyType(paper.title, paper.abstract);
    const confidenceScore = this.calculateConfidenceScore(paper, studyType);
    const meshTerms = this.extractMeshTerms(paper.abstract);
    const evidenceLevel = this.determineEvidenceLevel(studyType, paper.venue, paper.year);

    return {
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors ? paper.authors.map((author) => author.name) : [],
      journal: paper.venue || "Unknown Venue",
      year: paper.year ? paper.year.toString() : new Date().getFullYear().toString(),
      doi: paper.doi,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      abstract: paper.abstract || "Abstract not available",
      studyType,
      confidenceScore,
      evidenceLevel,
      source: 'Semantic Scholar',
      meshTerms
    };
  }

  private convertEuropePMCToCitation(paper: EuropePMCArticle): Citation {
    const studyType = this.detectStudyType(paper.title, paper.abstract);
    const confidenceScore = this.calculateConfidenceScore(paper, studyType);
    const meshTerms = this.extractMeshTerms(paper.abstract);
    const year = paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : new Date().getFullYear();
    const evidenceLevel = this.determineEvidenceLevel(studyType, paper.journal, year);

    return {
      id: paper.pmid || paper.pmcid || paper.id,
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors : [],
      journal: paper.journal || "Unknown Journal",
      year: year.toString(),
      pmid: paper.pmid,
      pmcid: paper.pmcid,
      doi: paper.doi,
      url: paper.url,
      abstract: paper.abstract || "Abstract not available",
      studyType,
      confidenceScore,
      evidenceLevel,
      source: 'Europe PMC',
      meshTerms
    };
  }

  private convertFDAToCitation(paper: ResearchPaper): Citation {
    const studyType = this.detectFDAStudyType(paper.source);
    const confidenceScore = this.calculateFDAConfidenceScore(paper);
    const evidenceLevel = 'High'; // FDA sources are authoritative

    return {
      id: paper.pmid || paper.id || `fda-${Date.now()}`,
      title: paper.title,
      authors: paper.authors,
      journal: paper.journal,
      year: (parseInt(paper.year) || new Date().getFullYear()).toString(),
      pmid: paper.pmid,
      doi: paper.doi,
      url: paper.url,
      abstract: paper.abstract || "No abstract available",
      studyType,
      confidenceScore,
      evidenceLevel,
      source: paper.source as Citation['source'] || 'Fallback',
      guidelineOrg: 'FDA',
      isGuideline: studyType === 'FDA Label'
    };
  }

  // Study type detection based on title and abstract
  private detectStudyType(title: string, abstract?: string): Citation['studyType'] {
    const content = `${title} ${abstract || ''}`.toLowerCase();
    
    if (content.includes('randomized controlled trial') || content.includes('rct') || content.includes('randomized trial')) {
      return 'RCT';
    }
    if (content.includes('meta-analysis') || content.includes('systematic review and meta-analysis')) {
      return 'Meta-Analysis';
    }
    if (content.includes('systematic review')) {
      return 'Systematic Review';
    }
    if (content.includes('guideline') || content.includes('recommendation') || content.includes('consensus')) {
      return 'Guideline';
    }
    if (content.includes('case study') || content.includes('case report')) {
      return 'Case Study';
    }
    if (content.includes('cohort') || content.includes('observational') || content.includes('cross-sectional')) {
      return 'Observational';
    }
    
    return 'Review';
  }

  private detectFDAStudyType(source?: string): Citation['studyType'] {
    if (source?.includes('Drug Labels')) return 'FDA Label';
    if (source?.includes('FAERS')) return 'FAERS Report';
    if (source?.includes('Recalls')) return 'FDA Recall';
    return 'FDA Label';
  }

  // Confidence score calculation (0-100)
  private calculateConfidenceScore(paper: any, studyType?: string): number {
    let score = 50; // Base score
    
    // Study type scoring
    const studyTypeScores: { [key: string]: number } = {
      'Meta-Analysis': 25,
      'RCT': 20,
      'Systematic Review': 18,
      'Guideline': 22,
      'Observational': 10,
      'Case Study': 5,
      'Review': 8
    };
    
    if (studyType && studyTypeScores[studyType]) {
      score += studyTypeScores[studyType];
    }
    
    // Recency scoring (more recent = higher score)
    const currentYear = new Date().getFullYear();
    const paperYear = typeof paper.year === 'string' ? parseInt(paper.year) : paper.year;
    
    if (!isNaN(paperYear)) {
      const yearsOld = currentYear - paperYear;
      
      if (yearsOld <= 2) score += 15;
      else if (yearsOld <= 5) score += 10;
      else if (yearsOld <= 10) score += 5;
      else score -= 5;
    }
    
    // Journal quality (simplified - could be enhanced with impact factors)
    const highImpactJournals = [
      'new england journal of medicine', 'nature', 'science', 'lancet', 'jama',
      'british medical journal', 'annals of internal medicine'
    ];
    
    if (paper.journal && highImpactJournals.some(journal => 
      paper.journal.toLowerCase().includes(journal)
    )) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateFDAConfidenceScore(paper: ResearchPaper): number {
    // FDA sources get high confidence by default
    let score = 85;
    
    const currentYear = new Date().getFullYear();
    const paperYear = parseInt(paper.year);
    
    if (!isNaN(paperYear)) {
      const yearsOld = currentYear - paperYear;
      
      // Recent FDA data is more relevant
      if (yearsOld <= 1) score += 10;
      else if (yearsOld <= 3) score += 5;
      else if (yearsOld > 10) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Evidence level determination
  private determineEvidenceLevel(studyType?: string, journal?: string, year?: number): Citation['evidenceLevel'] {
    if (studyType === 'Meta-Analysis' || studyType === 'Systematic Review') return 'High';
    if (studyType === 'RCT' || studyType === 'Guideline') return 'High';
    if (studyType === 'Observational' || studyType === 'Review') return 'Moderate';
    return 'Low';
  }

  // Extract MeSH-like terms from abstract
  private extractMeshTerms(abstract?: string): string[] {
    if (!abstract) return [];
    
    const medicalTerms = [
      'cardiovascular disease', 'diabetes mellitus', 'hypertension', 'cancer', 'pneumonia',
      'antimicrobial', 'antibiotic', 'vaccination', 'immunization', 'pathophysiology',
      'pharmacokinetics', 'adverse effects', 'contraindications', 'mechanism of action',
      'clinical trial', 'therapeutic efficacy', 'drug safety', 'pediatric', 'geriatric'
    ];
    
    const found = medicalTerms.filter(term => 
      abstract.toLowerCase().includes(term.toLowerCase())
    );
    
    return found.slice(0, 5); // Limit to 5 terms
  }

  // Detect guideline organizations
  private detectGuidelineOrganization(title: string, journal?: string, authors?: string[]): Citation['guidelineOrg'] {
    const content = `${title} ${journal || ''} ${authors?.join(' ') || ''}`.toLowerCase();
    
    if (content.includes('who') || content.includes('world health organization')) return 'WHO';
    if (content.includes('nice') || content.includes('national institute')) return 'NICE';
    if (content.includes('fda') || content.includes('food and drug')) return 'FDA';
    if (content.includes('aap') || content.includes('american academy of pediatrics')) return 'AAP';
    if (content.includes('aha') || content.includes('american heart association')) return 'AHA';
    if (content.includes('cdc') || content.includes('centers for disease control')) return 'CDC';
    
    return undefined;
  }

  private removeDuplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Set<string>();
    const unique: Citation[] = [];

    for (const citation of citations) {
      // Create a key based on title and first author
      const firstAuthor = citation.authors[0] || "";
      const key = `${citation.title.toLowerCase()}_${firstAuthor.toLowerCase()}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      }
    }

    return unique;
  }

  private generateContextSummary(citations: Citation[]): string {
    if (citations.length === 0) {
      return "No relevant research papers found for this query.";
    }

    const recentPapers = citations.filter(c => {
      const citationYear = parseInt(c.year);
      return !isNaN(citationYear) && citationYear >= new Date().getFullYear() - 5;
    });
    const totalPapers = citations.length;
    const avgYear = Math.round(citations.reduce((sum, c) => {
      const year = parseInt(c.year);
      return sum + (isNaN(year) ? new Date().getFullYear() : year);
    }, 0) / citations.length);

    let summary = `Found ${totalPapers} relevant research paper${totalPapers > 1 ? 's' : ''}`;
    
    if (recentPapers.length > 0) {
      summary += `, including ${recentPapers.length} from the last 5 years`;
    }
    
    summary += `. Average publication year: ${avgYear}.`;

    const journals = [...new Set(citations.map(c => c.journal))];
    if (journals.length <= 3) {
      summary += ` Sources include: ${journals.join(", ")}.`;
    } else {
      summary += ` Sources include ${journals.length} different journals.`;
    }

    return summary;
  }

  // Utility method to extract key terms from abstracts
  extractKeyTerms(citations: Citation[]): string[] {
    const allText = citations
      .map(c => `${c.title} ${c.abstract}`)
      .join(" ")
      .toLowerCase();

    // Simple keyword extraction (in production, use proper NLP)
    const medicalTerms = [
      "treatment", "therapy", "diagnosis", "pathophysiology", "mechanism",
      "clinical trial", "randomized", "efficacy", "safety", "outcomes",
      "patient", "disease", "syndrome", "disorder", "condition"
    ];

    return medicalTerms.filter(term => allText.includes(term));
  }
}
