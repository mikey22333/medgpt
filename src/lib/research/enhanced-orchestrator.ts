// Enhanced research orchestrator with intelligent fallback strategies
import { PubMedClient } from "./pubmed";
import { SemanticScholarClient } from "./semantic-scholar";
import { EuropePMCClient } from "./europepmc";
import { crossRefAPI } from "./crossref";
import { CellPressClient } from "./cell-press";
import { ExpertQueryGenerator } from "./expert-query-generator";
import { type ResearchQuery, type ResearchPaper } from "@/lib/types/research";

export interface SearchStrategy {
  name: string;
  priority: number;
  sources: string[];
  queryModifications: string[];
  relevanceThreshold: number;
}

export class EnhancedResearchOrchestrator {
  private pubmedClient: PubMedClient;
  private semanticClient: SemanticScholarClient;
  private europePMCClient: EuropePMCClient;
  private cellPressClient: CellPressClient;

  constructor() {
    this.pubmedClient = new PubMedClient();
    this.semanticClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
    this.europePMCClient = new EuropePMCClient();
    this.cellPressClient = new CellPressClient();
  }

  async executeIntelligentSearch(query: string, maxResults: number = 10): Promise<{
    papers: ResearchPaper[];
    strategy: string;
    relevanceScore: number;
    fallbackLevel: number;
    expertAnalysis: any;
  }> {
    // First, analyze query with expert system
    const expertStrategy = ExpertQueryGenerator.generateSearchStrategy(query);
    console.log(`🧠 Expert analysis: ${expertStrategy.complexity.level}/5 complexity, ${expertStrategy.searchApproach} approach`);
    console.log(`📚 Recommended databases: ${expertStrategy.databases.join(', ')}`);
    
    const strategies = this.buildSearchStrategies(query, expertStrategy);
    
    for (let level = 0; level < strategies.length; level++) {
      const strategy = strategies[level];
      console.log(`🎯 Executing search strategy: ${strategy.name} (Level ${level + 1})`);
      
      try {
        const results = await this.executeStrategy(strategy, query, maxResults, expertStrategy);
        
        // Calculate overall relevance
        const relevanceScore = this.calculateOverallRelevance(results.papers, query);
        
        // If we have good results, return them
        if (results.papers.length >= Math.min(5, maxResults) && relevanceScore >= strategy.relevanceThreshold) {
          return {
            papers: results.papers.slice(0, maxResults),
            strategy: strategy.name,
            relevanceScore,
            fallbackLevel: level,
            expertAnalysis: expertStrategy
          };
        }
        
        console.log(`⚠️ Strategy ${strategy.name} yielded ${results.papers.length} papers with ${relevanceScore}% relevance (threshold: ${strategy.relevanceThreshold}%)`);
        
      } catch (error) {
        console.error(`❌ Strategy ${strategy.name} failed:`, error);
        continue;
      }
    }
    
    // Emergency fallback - return whatever we can find
    console.log("🚨 Using emergency fallback strategy");
    const emergencyResults = await this.emergencyFallback(query, maxResults, expertStrategy);
    
    return {
      papers: emergencyResults,
      strategy: "Emergency Fallback",
      relevanceScore: 30,
      fallbackLevel: strategies.length,
      expertAnalysis: expertStrategy
    };
  }

  private buildSearchStrategies(query: string, expertStrategy: any): SearchStrategy[] {
    const complexity = expertStrategy.complexity;
    const isSpecificCondition = this.isSpecificMedicalCondition(query);
    const isInterventionQuery = this.isInterventionQuery(query);
    
    // Use expert-generated queries instead of basic keyword matching
    const expertQueries = expertStrategy.queries;
    
    return [
      // Strategy 1: Expert MeSH-based search (highest precision)
      {
        name: "Expert Medical Terminology",
        priority: 1,
        sources: ["PubMed", "Europe PMC", "Cell Press"],
        queryModifications: expertQueries.mesh.slice(0, 2), // Use top 2 MeSH queries
        relevanceThreshold: complexity.level >= 4 ? 70 : 85
      },
      
      // Strategy 2: Expert primary queries (balanced precision/recall)
      {
        name: "Expert Primary Search",
        priority: 2,
        sources: ["PubMed", "Semantic Scholar", "CrossRef", "Cell Press"],
        queryModifications: expertQueries.primary.slice(0, 2), // Use top 2 primary queries
        relevanceThreshold: complexity.level >= 4 ? 60 : 75
      },
      
      // Strategy 3: Expert semantic expansion (broader recall)
      {
        name: "Expert Semantic Expansion",
        priority: 3,
        sources: ["Semantic Scholar", "PubMed", "Europe PMC", "CrossRef", "Cell Press"],
        queryModifications: expertQueries.semantic.slice(0, 2), // Use top 2 semantic queries
        relevanceThreshold: complexity.level >= 4 ? 50 : 65
      },
      
      // Strategy 4: Expert specialized search (last resort)
      {
        name: "Expert Specialized Fallback",
        priority: 4,
        sources: ["Semantic Scholar", "CrossRef", "Europe PMC", "Cell Press"],
        queryModifications: expertQueries.specialized.length > 0 ? 
          expertQueries.specialized : [this.extractKeyTerms(query)],
        relevanceThreshold: complexity.level >= 4 ? 40 : 50
      }
    ];
  }

  private async executeStrategy(
    strategy: SearchStrategy, 
    originalQuery: string, 
    maxResults: number,
    expertStrategy: any
  ): Promise<{
    papers: ResearchPaper[];
  }> {
    const allPapers: ResearchPaper[] = [];
    
    console.log(`🔍 Using ${strategy.queryModifications.length} expert-generated queries:`);
    strategy.queryModifications.forEach((query, index) => {
      console.log(`   ${index + 1}. ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
    });
    
    for (const modification of strategy.queryModifications) {
      for (const source of strategy.sources) {
        try {
          const results = await this.searchBySource(source, modification, Math.ceil(maxResults / strategy.sources.length));
          allPapers.push(...results);
          console.log(`✅ ${source}: Found ${results.length} papers for query: ${modification.substring(0, 50)}...`);
        } catch (error) {
          console.error(`Error searching ${source}:`, error);
          continue;
        }
      }
    }
    
    // Remove duplicates and rank by relevance
    const deduplicatedPapers = this.removeDuplicates(allPapers);
    const rankedPapers = this.rankByRelevance(deduplicatedPapers, originalQuery);
    
    console.log(`📊 Strategy results: ${allPapers.length} total → ${deduplicatedPapers.length} unique → ${rankedPapers.length} ranked`);
    
    return {
      papers: rankedPapers
    };
  }

  private async searchBySource(source: string, query: string, maxResults: number): Promise<ResearchPaper[]> {
    switch (source) {
      case "PubMed":
        const pubmedResults = await this.pubmedClient.searchArticles({
          query,
          maxResults,
          source: 'pubmed'
        });
        return pubmedResults.map(p => ({
          ...p,
          year: p.publishedDate ? new Date(p.publishedDate).getFullYear().toString() : new Date().getFullYear().toString(),
          source: "PubMed" as const
        }));
        
      case "Semantic Scholar":
        const semanticResults = await this.semanticClient.searchPapers({
          query,
          maxResults,
          source: 'semantic-scholar'
        });
        return semanticResults.map(p => ({
          pmid: undefined,
          title: p.title,
          abstract: p.abstract,
          authors: p.authors.map(a => a.name),
          journal: p.venue,
          year: p.year.toString(),
          url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
          source: "Semantic Scholar" as const,
          doi: p.doi,
          citationCount: p.citationCount,
          relevanceScore: 0.8
        }));
        
      case "Europe PMC":
        const europePMCResults = await this.europePMCClient.searchArticles({
          query,
          maxResults,
          source: 'europepmc'
        });
        return europePMCResults.map(p => ({
          ...p,
          year: p.publishedDate ? new Date(p.publishedDate).getFullYear().toString() : new Date().getFullYear().toString(),
          source: "Europe PMC" as const
        }));
        
      case "CrossRef":
        const crossRefResults = await crossRefAPI.searchWorks({ query, rows: maxResults });
        return crossRefResults.map(p => ({
          pmid: undefined,
          title: Array.isArray(p.title) ? p.title[0] : p.title || "",
          abstract: p.abstract || "",
          authors: p.author?.map(a => `${a.given || ""} ${a.family || ""}`.trim()).filter(name => name) || [],
          journal: Array.isArray(p['container-title']) ? p['container-title'][0] : p['container-title'] || "",
          year: p.published?.['date-parts']?.[0]?.[0]?.toString() || new Date().getFullYear().toString(),
          url: p.URL || `https://doi.org/${p.DOI}`,
          source: "CrossRef" as const,
          doi: p.DOI,
          citationCount: 0,
          relevanceScore: 0.7
        }));
        
      case "Cell Press":
        const cellPressResults = await this.cellPressClient.searchPapers({
          query,
          maxResults,
          source: 'cell-press'
        });
        return cellPressResults.map(p => ({
          pmid: p.pmid,
          title: p.title,
          abstract: p.abstract,
          authors: p.authors,
          journal: p.journal,
          year: p.year.toString(),
          url: p.url,
          source: "Cell Press" as const,
          doi: p.doi,
          citationCount: 0,
          relevanceScore: 0.9 // High relevance for Cell Press papers
        }));
        
      default:
        return [];
    }
  }

  private async emergencyFallback(query: string, maxResults: number, expertStrategy: any): Promise<ResearchPaper[]> {
    // Try to get anything relevant from any source using expert queries
    console.log("🚨 Emergency fallback: Using simplified expert queries");
    
    const results: ResearchPaper[] = [];
    
    try {
      // Try the simplest expert query first
      const simpleExpertQuery = expertStrategy.queries.primary[0] || 
                               expertStrategy.queries.semantic[0] || 
                               this.extractKeyTerms(query);
      
      console.log(`🔍 Emergency query: ${simpleExpertQuery}`);
      
      const semanticResults = await this.semanticClient.searchPapers({
        query: simpleExpertQuery,
        maxResults: maxResults * 2,
        source: 'semantic-scholar'
      });
      
      results.push(...semanticResults.map(p => ({
        pmid: undefined,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors.map(a => a.name),
        journal: p.venue,
        year: p.year.toString(),
        url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
        source: "Semantic Scholar" as const,
        doi: p.doi,
        citationCount: p.citationCount,
        relevanceScore: 0.5
      })));
      
      console.log(`🚨 Emergency fallback found ${results.length} papers`);
      
    } catch (error) {
      console.error("Emergency fallback failed:", error);
    }
    
    return results.slice(0, maxResults);
  }

  // Helper methods for query modification
  private identifyMedicalDomains(query: string): string[] {
    const domains = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('tuberculosis') || lowerQuery.includes('mycobacter')) {
      domains.push('infectious-disease', 'pulmonary');
    }
    if (lowerQuery.includes('bcg') || lowerQuery.includes('vaccine')) {
      domains.push('immunology', 'vaccination');
    }
    if (lowerQuery.includes('cardiovascular') || lowerQuery.includes('heart')) {
      domains.push('cardiology');
    }
    // Add more domain detection logic
    
    return domains;
  }

  private isSpecificMedicalCondition(query: string): boolean {
    const conditionKeywords = ['disease', 'syndrome', 'disorder', 'condition', 'infection'];
    return conditionKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private isInterventionQuery(query: string): boolean {
    const interventionKeywords = ['treatment', 'therapy', 'drug', 'medication', 'intervention'];
    return interventionKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private addMeSHTerms(query: string, domains: string[]): string {
    // Add relevant MeSH terms based on domains
    const meshTerms = [];
    
    for (const domain of domains) {
      switch (domain) {
        case 'infectious-disease':
          meshTerms.push('Communicable Diseases[MeSH]');
          break;
        case 'immunology':
          meshTerms.push('Immunity[MeSH]', 'Vaccines[MeSH]');
          break;
        case 'cardiology':
          meshTerms.push('Cardiovascular Diseases[MeSH]');
          break;
      }
    }
    
    return meshTerms.length > 0 ? `${query} AND (${meshTerms.join(' OR ')})` : query;
  }

  private addStudyTypeFilters(query: string, studyTypes: string[]): string {
    const filters = studyTypes.map(type => `"${type}"[Publication Type]`);
    return `${query} AND (${filters.join(' OR ')})`;
  }

  private expandWithSynonyms(query: string, domains: string[]): string {
    // Basic synonym expansion - could be enhanced with medical thesaurus
    let expandedQuery = query;
    
    // Common medical synonyms
    if (query.includes('tuberculosis')) {
      expandedQuery += ' OR TB OR "tuberculous infection"';
    }
    if (query.includes('BCG')) {
      expandedQuery += ' OR "Bacillus Calmette-Guérin" OR "BCG vaccine"';
    }
    
    return expandedQuery;
  }

  private addQualityFilters(query: string): string {
    return `${query} AND (journal[sb] OR clinical[sb] OR systematic[sb])`;
  }

  private createSemanticVariants(query: string): string {
    // Create semantic variants of the query
    const variants = [query];
    
    // Add question variations
    if (!query.includes('?')) {
      variants.push(`How does ${query}?`);
      variants.push(`What is the effect of ${query}?`);
    }
    
    return variants.join(' OR ');
  }

  private addTimeFilters(query: string, years: number): string {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years;
    return `${query} AND ${startYear}:${currentYear}[pdat]`;
  }

  private simplifyQuery(query: string): string {
    // Extract key terms and remove complex modifiers
    return this.extractKeyTerms(query);
  }

  private extractKeyTerms(query: string): string {
    // Simple keyword extraction - could be enhanced with NLP
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why'];
    const keywords = words.filter(word => 
      word.length > 3 && 
      !stopWords.includes(word) &&
      /^[a-z]+$/i.test(word)
    );
    
    return keywords.slice(0, 5).join(' ');
  }

  private removeDuplicates(papers: ResearchPaper[]): ResearchPaper[] {
    const seen = new Set();
    return papers.filter(paper => {
      const key = `${paper.title.toLowerCase()}-${paper.journal.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private rankByRelevance(papers: ResearchPaper[], query: string): ResearchPaper[] {
    return papers.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(paper: ResearchPaper, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const title = paper.title.toLowerCase();
    const abstract = (paper.abstract || '').toLowerCase();
    
    let score = 0;
    
    // Title relevance (higher weight)
    for (const term of queryTerms) {
      if (title.includes(term)) {
        score += 3;
      }
    }
    
    // Abstract relevance
    for (const term of queryTerms) {
      if (abstract.includes(term)) {
        score += 1;
      }
    }
    
    // Source quality bonus
    if (paper.source === 'PubMed') score += 2;
    if (paper.source === 'Semantic Scholar') score += 1;
    
    // Citation count bonus
    if (paper.citationCount && paper.citationCount > 50) score += 2;
    if (paper.citationCount && paper.citationCount > 100) score += 1;
    
    return score;
  }

  private calculateOverallRelevance(papers: ResearchPaper[], query: string): number {
    if (papers.length === 0) return 0;
    
    const totalScore = papers.reduce((sum, paper) => 
      sum + this.calculateRelevanceScore(paper, query), 0
    );
    
    const averageScore = totalScore / papers.length;
    const maxPossibleScore = 10; // Approximate max score per paper
    
    return Math.min(100, Math.round((averageScore / maxPossibleScore) * 100));
  }
}
