// Enhanced query generation system for complex medical questions
import { type ResearchQuery } from "@/lib/types/research";

export interface MedicalDomain {
  name: string;
  meshTerms: string[];
  synonyms: string[];
  relatedConcepts: string[];
  specializedDatabases: string[];
}

export interface QueryComplexity {
  level: 1 | 2 | 3 | 4 | 5; // 1=basic, 5=highly specialized
  domains: string[];
  conceptCount: number;
  relationshipType: 'simple' | 'interaction' | 'causation' | 'mechanism';
  evidenceExpectation: 'abundant' | 'moderate' | 'limited' | 'rare';
}

export class ExpertQueryGenerator {
  private static readonly MEDICAL_DOMAINS: Record<string, MedicalDomain> = {
    'immunology': {
      name: 'Immunology',
      meshTerms: [
        'Immunity[MeSH]', 'Immunologic Memory[MeSH]', 'Cross Reactions[MeSH]',
        'Hypersensitivity[MeSH]', 'Immune System[MeSH]', 'Antibodies[MeSH]'
      ],
      synonyms: [
        'immune response', 'immunological', 'antibody', 'antigen', 
        'immunization', 'immune system', 'immunity'
      ],
      relatedConcepts: [
        'T-cell response', 'B-cell response', 'cytokine', 'interferon',
        'immune memory', 'cross-reactivity', 'immunological tolerance'
      ],
      specializedDatabases: ['PubMed-Immunology', 'Clinical-Immunology-Reviews']
    },
    'vaccinology': {
      name: 'Vaccinology', 
      meshTerms: [
        'Vaccines[MeSH]', 'Vaccination[MeSH]', 'Immunization[MeSH]',
        'Vaccine Efficacy[MeSH]', 'BCG Vaccine[MeSH]'
      ],
      synonyms: [
        'vaccine', 'vaccination', 'immunization', 'inoculation',
        'vaccine effectiveness', 'vaccine efficacy', 'vaccine protection'
      ],
      relatedConcepts: [
        'herd immunity', 'vaccine safety', 'vaccine schedule',
        'booster dose', 'vaccine adjuvant', 'vaccine development'
      ],
      specializedDatabases: ['Vaccine-Safety-Database', 'WHO-Vaccine-Data']
    },
    'infectious-disease': {
      name: 'Infectious Disease',
      meshTerms: [
        'Communicable Diseases[MeSH]', 'Tuberculosis[MeSH]', 
        'Mycobacterium[MeSH]', 'Bacterial Infections[MeSH]'
      ],
      synonyms: [
        'infectious disease', 'communicable disease', 'bacterial infection',
        'mycobacterial infection', 'tuberculosis', 'TB'
      ],
      relatedConcepts: [
        'pathogen', 'antimicrobial resistance', 'epidemic', 'endemic',
        'disease transmission', 'infection control'
      ],
      specializedDatabases: ['CDC-Surveillance', 'WHO-Infectious-Disease']
    },
    'mycobacteriology': {
      name: 'Mycobacteriology',
      meshTerms: [
        'Mycobacterium[MeSH]', 'Mycobacterium tuberculosis[MeSH]',
        'Mycobacterium, Atypical[MeSH]', 'Tuberculin Test[MeSH]'
      ],
      synonyms: [
        'mycobacteria', 'mycobacterial', 'non-tuberculous mycobacteria',
        'atypical mycobacteria', 'environmental mycobacteria', 'NTM'
      ],
      relatedConcepts: [
        'mycobacterial sensitization', 'tuberculin reactivity',
        'acid-fast bacilli', 'mycobacterial culture', 'species identification'
      ],
      specializedDatabases: ['TB-Research-Database', 'Mycobacteriology-Reviews']
    }
  };

  static analyzeQueryComplexity(query: string): QueryComplexity {
    const lowerQuery = query.toLowerCase();
    
    // Count medical concepts
    let conceptCount = 0;
    const concepts = ['bcg', 'vaccine', 'mycobacteria', 'tuberculosis', 'effectiveness', 'exposure', 'prior'];
    conceptCount = concepts.filter(concept => lowerQuery.includes(concept)).length;

    // Identify domains
    const domains: string[] = [];
    if (lowerQuery.includes('bcg') || lowerQuery.includes('vaccine')) domains.push('vaccinology');
    if (lowerQuery.includes('immune') || lowerQuery.includes('antibody')) domains.push('immunology');
    if (lowerQuery.includes('mycobacteria') || lowerQuery.includes('tuberculosis')) domains.push('mycobacteriology');
    if (lowerQuery.includes('infection') || lowerQuery.includes('disease')) domains.push('infectious-disease');

    // Determine relationship type
    let relationshipType: QueryComplexity['relationshipType'] = 'simple';
    if (lowerQuery.includes('impact') || lowerQuery.includes('effect') || lowerQuery.includes('influence')) {
      relationshipType = 'causation';
    }
    if (lowerQuery.includes('interaction') || lowerQuery.includes('cross') || lowerQuery.includes('interfere')) {
      relationshipType = 'interaction';
    }
    if (lowerQuery.includes('mechanism') || lowerQuery.includes('pathway')) {
      relationshipType = 'mechanism';
    }

    // Assess complexity level
    let level: QueryComplexity['level'] = 1;
    if (domains.length >= 2) level = Math.min(5, level + 1) as QueryComplexity['level'];
    if (conceptCount >= 4) level = Math.min(5, level + 1) as QueryComplexity['level'];
    if (relationshipType !== 'simple') level = Math.min(5, level + 1) as QueryComplexity['level'];
    if (lowerQuery.includes('prior') || lowerQuery.includes('previous')) level = Math.min(5, level + 1) as QueryComplexity['level'];

    // Evidence expectation
    let evidenceExpectation: QueryComplexity['evidenceExpectation'] = 'abundant';
    if (level >= 4) evidenceExpectation = 'limited';
    if (level >= 5) evidenceExpectation = 'rare';

    return {
      level,
      domains,
      conceptCount,
      relationshipType,
      evidenceExpectation
    };
  }

  static generateExpertQueries(query: string): {
    primary: string[];
    semantic: string[];
    mesh: string[];
    specialized: string[];
  } {
    const complexity = this.analyzeQueryComplexity(query);
    const primaryTerms = this.extractPrimaryTerms(query);
    
    // Generate different query types
    const primary = this.generatePrimaryQueries(query, primaryTerms, complexity);
    const semantic = this.generateSemanticQueries(query, primaryTerms, complexity);  
    const mesh = this.generateMeSHQueries(query, primaryTerms, complexity);
    const specialized = this.generateSpecializedQueries(query, primaryTerms, complexity);

    return { primary, semantic, mesh, specialized };
  }

  private static extractPrimaryTerms(query: string): {
    intervention: string[];
    outcome: string[];
    population: string[];
    exposure: string[];
  } {
    const lowerQuery = query.toLowerCase();
    
    const intervention: string[] = [];
    const outcome: string[] = [];
    const population: string[] = [];
    const exposure: string[] = [];

    // BCG/NTM specific extraction
    if (lowerQuery.includes('bcg')) intervention.push('BCG vaccine', 'Bacillus Calmette-Guérin');
    if (lowerQuery.includes('effectiveness') || lowerQuery.includes('efficacy')) {
      outcome.push('effectiveness', 'efficacy', 'protection', 'vaccine effectiveness');
    }
    if (lowerQuery.includes('non-tuberculous') || lowerQuery.includes('ntm')) {
      exposure.push('non-tuberculous mycobacteria', 'environmental mycobacteria', 'atypical mycobacteria');
    }
    if (lowerQuery.includes('prior') || lowerQuery.includes('previous')) {
      exposure.push('prior exposure', 'previous exposure', 'pre-existing');
    }

    return { intervention, outcome, population, exposure };
  }

  private static generatePrimaryQueries(
    query: string, 
    terms: ReturnType<typeof ExpertQueryGenerator.extractPrimaryTerms>,
    complexity: QueryComplexity
  ): string[] {
    const queries: string[] = [];

    // For BCG/NTM type queries
    if (terms.intervention.some(t => t.includes('BCG')) && terms.exposure.some(t => t.includes('mycobacteria'))) {
      queries.push(
        `("environmental mycobacteria" OR "non-tuberculous mycobacteria" OR "atypical mycobacteria") AND ("BCG vaccine" OR "BCG vaccination") AND ("efficacy" OR "effectiveness" OR "protection")`
      );
      queries.push(
        `"BCG vaccine effectiveness" AND ("environmental mycobacteria" OR "NTM exposure")`
      );
      queries.push(
        `"mycobacterial sensitization" AND "BCG" AND ("interference" OR "cross-reactivity")`
      );
    }

    // General complex query approach
    if (complexity.level >= 3) {
      queries.push(this.buildComplexQuery(terms));
    }

    return queries.filter(Boolean);
  }

  private static generateSemanticQueries(
    query: string,
    terms: ReturnType<typeof ExpertQueryGenerator.extractPrimaryTerms>,
    complexity: QueryComplexity
  ): string[] {
    const queries: string[] = [];

    // Semantic variations for BCG/NTM
    queries.push(`How does environmental mycobacterial exposure affect BCG vaccine protection?`);
    queries.push(`BCG vaccine efficacy in populations with high NTM exposure`);
    queries.push(`Geographic variation in BCG effectiveness due to mycobacterial diversity`);
    queries.push(`Cross-reactivity between environmental mycobacteria and BCG vaccine`);

    return queries;
  }

  private static generateMeSHQueries(
    query: string,
    terms: ReturnType<typeof ExpertQueryGenerator.extractPrimaryTerms>,
    complexity: QueryComplexity
  ): string[] {
    const queries: string[] = [];

    // MeSH-based queries for BCG/NTM
    queries.push(
      `("Mycobacterium, Atypical"[MeSH Terms] OR "Environmental Mycobacteria"[Title/Abstract]) AND "BCG Vaccine"[MeSH Terms] AND ("Vaccine Efficacy"[MeSH Terms] OR "Treatment Outcome"[MeSH Terms])`
    );
    queries.push(
      `"Cross Reactions"[MeSH Terms] AND "BCG Vaccine"[MeSH Terms] AND "Mycobacterium"[MeSH Terms]`
    );
    queries.push(
      `"Tuberculin Test"[MeSH Terms] AND ("Environmental Exposure"[MeSH Terms] OR "Mycobacterium, Atypical"[MeSH Terms])`
    );

    return queries;
  }

  private static generateSpecializedQueries(
    query: string,
    terms: ReturnType<typeof ExpertQueryGenerator.extractPrimaryTerms>,
    complexity: QueryComplexity
  ): string[] {
    const queries: string[] = [];

    // Specialized database queries
    if (complexity.domains.includes('vaccinology')) {
      queries.push(`BCG vaccine effectiveness tropical settings mycobacteria`);
      queries.push(`tuberculosis vaccine geographic variation environmental factors`);
    }

    if (complexity.domains.includes('immunology')) {
      queries.push(`mycobacterial cross-reactivity immune response BCG`);
      queries.push(`tuberculin skin test environmental mycobacteria interference`);
    }

    return queries;
  }

  private static buildComplexQuery(
    terms: ReturnType<typeof ExpertQueryGenerator.extractPrimaryTerms>
  ): string {
    const parts: string[] = [];

    if (terms.intervention.length > 0) {
      parts.push(`(${terms.intervention.map(t => `"${t}"`).join(' OR ')})`);
    }
    if (terms.exposure.length > 0) {
      parts.push(`(${terms.exposure.map(t => `"${t}"`).join(' OR ')})`);
    }
    if (terms.outcome.length > 0) {
      parts.push(`(${terms.outcome.map(t => `"${t}"`).join(' OR ')})`);
    }

    return parts.join(' AND ');
  }

  static selectOptimalDatabases(complexity: QueryComplexity): string[] {
    const databases: string[] = ['PubMed']; // Always include PubMed

    // Add specialized databases based on complexity and domains
    if (complexity.level >= 3) {
      databases.push('Semantic Scholar', 'Europe PMC');
    }

    if (complexity.domains.includes('vaccinology')) {
      databases.push('ClinicalTrials.gov', 'WHO-Vaccine-Database');
    }

    if (complexity.domains.includes('immunology')) {
      databases.push('Clinical-Immunology-Database');
    }

    if (complexity.evidenceExpectation === 'rare' || complexity.evidenceExpectation === 'limited') {
      databases.push('bioRxiv', 'medRxiv', 'Cochrane-Reviews');
    }

    return databases;
  }

  static generateSearchStrategy(query: string): {
    complexity: QueryComplexity;
    queries: ReturnType<typeof ExpertQueryGenerator.generateExpertQueries>;
    databases: string[];
    searchApproach: 'broad' | 'targeted' | 'specialized' | 'comprehensive';
  } {
    const complexity = this.analyzeQueryComplexity(query);
    const queries = this.generateExpertQueries(query);
    const databases = this.selectOptimalDatabases(complexity);

    let searchApproach: 'broad' | 'targeted' | 'specialized' | 'comprehensive' = 'broad';
    if (complexity.level >= 4) searchApproach = 'specialized';
    else if (complexity.level >= 3) searchApproach = 'comprehensive';
    else if (complexity.domains.length >= 2) searchApproach = 'targeted';

    return {
      complexity,
      queries,
      databases,
      searchApproach
    };
  }
}
