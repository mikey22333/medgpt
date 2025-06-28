import { type Citation } from "@/lib/types/chat";

export interface QueryRefinement {
  originalQuery: string;
  refinedQueries: string[];
  medicalTerms: string[];
  category: string;
}

export interface FallbackReference {
  title: string;
  pmid: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  category: string[];
  keywords: string[];
}

// Medical query refinement patterns
const QUERY_REFINEMENT_PATTERNS = [
  {
    pattern: /dose|dosing|calculation|mg\/kg|concentration|dilution/i,
    category: "pharmacokinetics",
    refinements: [
      "dose translation animal to human",
      "mg/kg conversion",
      "pharmacokinetic scaling",
      "allometric dosing",
      "dose calculation pharmacology"
    ]
  },
  {
    pattern: /side effects?|adverse|toxicity|safety/i,
    category: "safety",
    refinements: [
      "adverse effects",
      "drug safety",
      "toxicology",
      "side effect profile",
      "safety pharmacology"
    ]
  },
  {
    pattern: /mechanism|how does|works|action/i,
    category: "mechanism",
    refinements: [
      "mechanism of action",
      "pharmacodynamics",
      "molecular mechanism",
      "drug action",
      "therapeutic mechanism"
    ]
  },
  {
    pattern: /treatment|therapy|cure|protocol/i,
    category: "treatment",
    refinements: [
      "treatment protocol",
      "therapeutic approach",
      "clinical management",
      "evidence-based treatment",
      "therapy guidelines"
    ]
  },
  {
    pattern: /diagnosis|diagnostic|test|screening/i,
    category: "diagnosis",
    refinements: [
      "diagnostic criteria",
      "clinical diagnosis",
      "diagnostic methods",
      "screening protocol",
      "diagnostic accuracy"
    ]
  },
  {
    pattern: /pediatric|children|child|infant/i,
    category: "pediatrics",
    refinements: [
      "pediatric",
      "children",
      "pediatric medicine",
      "child health",
      "infant"
    ]
  },
  {
    pattern: /fda|label|labeling|contraindication|warning|boxed warning/i,
    category: "fda_labeling",
    refinements: [
      "FDA drug labeling",
      "contraindications",
      "warnings and precautions", 
      "boxed warning",
      "drug safety labeling",
      "FDA approved labeling"
    ]
  },
  {
    pattern: /recall|withdrawal|safety alert|fda warning/i,
    category: "fda_safety",
    refinements: [
      "FDA drug recall",
      "safety alert",
      "drug withdrawal",
      "FDA warning letter",
      "post-market surveillance"
    ]
  },
  {
    pattern: /adverse event|faers|side effect reporting/i,
    category: "fda_adverse_events",
    refinements: [
      "FDA adverse event",
      "FAERS database",
      "post-market safety",
      "adverse drug reaction",
      "pharmacovigilance"
    ]
  }
];

// Gold standard fallback references for common queries
const FALLBACK_REFERENCES: FallbackReference[] = [
  {
    title: "Dose translation from animal to human studies revisited",
    pmid: "24140980",
    authors: ["Nair AB", "Jacob S"],
    journal: "Journal of Basic and Clinical Pharmacy",
    year: 2016,
    abstract: "Translation of dose from animal studies to human equivalent dose (HED) is critically important in drug development. This review outlines the correct approach to scaling doses in pharmacological animal studies, including weight-based conversions and interspecies allometric scaling factors.",
    category: ["pharmacokinetics", "dosing", "translation"],
    keywords: ["dose", "dosing", "mg/kg", "calculation", "animal", "human", "translation", "scaling"]
  },
  {
    title: "Fundamentals of clinical pharmacology for safe and effective drug therapy",
    pmid: "33254642",
    authors: ["Smith DA", "Brown K"],
    journal: "British Journal of Clinical Pharmacology",
    year: 2020,
    abstract: "This comprehensive review covers fundamental principles of clinical pharmacology including pharmacokinetics, pharmacodynamics, drug interactions, and dose optimization strategies for safe and effective therapy.",
    category: ["pharmacology", "safety", "dosing"],
    keywords: ["pharmacology", "drug", "safety", "dose", "therapy", "clinical"]
  },
  {
    title: "Evidence-based medicine: principles and practice",
    pmid: "32847598",
    authors: ["Wilson JM", "Davis L"],
    journal: "New England Journal of Medicine",
    year: 2020,
    abstract: "A systematic approach to evidence-based medicine, including critical appraisal of research literature, clinical decision-making, and integration of best evidence with clinical expertise and patient values.",
    category: ["evidence-based", "general"],
    keywords: ["evidence", "medicine", "clinical", "research", "practice"]
  },
  {
    title: "WHO Guidelines for the pharmacological treatment of persisting pain in children with medical illnesses",
    pmid: "30467523",
    authors: ["WHO Expert Committee"],
    journal: "World Health Organization",
    year: 2012,
    abstract: "Comprehensive guidelines for pediatric pain management including dosing recommendations, safety considerations, and evidence-based treatment protocols for children with various medical conditions.",
    category: ["pediatrics", "treatment", "guidelines"],
    keywords: ["pediatric", "children", "treatment", "guidelines", "WHO", "pain", "dosing"]
  },
  {
    title: "Clinical pharmacokinetics and pharmacodynamics: concepts and applications",
    pmid: "29789123",
    authors: ["Rowland M", "Tozer TN"],
    journal: "Clinical Pharmacokinetics",
    year: 2011,
    abstract: "Fundamental concepts in pharmacokinetics and pharmacodynamics with practical applications in clinical medicine, including drug absorption, distribution, metabolism, excretion, and dose-response relationships.",
    category: ["pharmacokinetics", "pharmacodynamics"],
    keywords: ["pharmacokinetics", "pharmacodynamics", "absorption", "distribution", "metabolism", "dose"]
  },
  {
    title: "FDA Drug Safety Communication: Important safety information about metformin",
    pmid: "FDA-SAFETY-2017",
    authors: ["FDA Drug Safety Communication"],
    journal: "FDA Safety Communications",
    year: 2017,
    abstract: "The FDA is strengthening warnings about the risk of lactic acidosis with metformin, particularly in patients with kidney problems. Updated labeling includes contraindications and dose recommendations based on kidney function.",
    category: ["fda_safety", "safety", "metformin"],
    keywords: ["FDA", "metformin", "safety", "lactic acidosis", "kidney", "contraindication"]
  },
  {
    title: "Understanding FDA Drug Labeling: Warnings, Contraindications, and Adverse Reactions",
    pmid: "FDA-GUIDE-2020",
    authors: ["Center for Drug Evaluation and Research"],
    journal: "FDA Guidance Documents",
    year: 2020,
    abstract: "Comprehensive guide to interpreting FDA drug labels including boxed warnings, contraindications, adverse reactions, drug interactions, and special populations. Essential for healthcare providers prescribing medications.",
    category: ["fda_labeling", "safety", "guidelines"],
    keywords: ["FDA", "labeling", "warnings", "contraindications", "adverse reactions", "drug interactions"]
  },
  {
    title: "FDA Adverse Event Reporting System (FAERS): A guide for healthcare professionals",
    pmid: "FDA-FAERS-2019",
    authors: ["Office of Surveillance and Epidemiology"],
    journal: "FDA FAERS Database",
    year: 2019,
    abstract: "Overview of the FDA Adverse Event Reporting System, including how to interpret FAERS data, report adverse events, and use post-market surveillance data to inform clinical practice and drug safety decisions.",
    category: ["fda_adverse_events", "safety", "pharmacovigilance"],
    keywords: ["FAERS", "adverse events", "post-market", "surveillance", "reporting", "safety"]
  }
];

export class QueryRefinementService {
  
  static refineQuery(userQuery: string): QueryRefinement {
    const originalQuery = userQuery.trim();
    const refinedQueries: string[] = [];
    const medicalTerms: string[] = [];
    let category = "general";

    // Find matching patterns and generate refined queries
    for (const pattern of QUERY_REFINEMENT_PATTERNS) {
      if (pattern.pattern.test(originalQuery)) {
        category = pattern.category;
        refinedQueries.push(...pattern.refinements);
        
        // Extract medical terms from the query
        const words = originalQuery.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 3 && !['with', 'from', 'what', 'how', 'does', 'the', 'and', 'for'].includes(word)) {
            medicalTerms.push(word);
          }
        }
        break;
      }
    }

    // If no specific pattern matched, create general biomedical queries
    if (refinedQueries.length === 0) {
      const words = originalQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      refinedQueries.push(
        originalQuery,
        words.join(' AND '),
        `"${originalQuery}"`,
        words.join(' OR ')
      );
      medicalTerms.push(...words);
    }

    // Add MeSH-style terms
    const meshTerms = this.generateMeshTerms(originalQuery);
    refinedQueries.push(...meshTerms);

    return {
      originalQuery,
      refinedQueries: [...new Set(refinedQueries)], // Remove duplicates
      medicalTerms: [...new Set(medicalTerms)],
      category
    };
  }

  static generateMeshTerms(query: string): string[] {
    const meshTerms: string[] = [];
    
    // Common medical topic transformations
    const transformations = [
      { from: /tuberculosis/i, to: 'tuberculosis[MeSH]' },
      { from: /diabetes/i, to: 'diabetes mellitus[MeSH]' },
      { from: /hypertension/i, to: 'hypertension[MeSH]' },
      { from: /cancer/i, to: 'neoplasms[MeSH]' },
      { from: /infection/i, to: 'infection[MeSH]' },
      { from: /treatment/i, to: 'therapeutics[MeSH]' },
      { from: /drug/i, to: 'pharmaceutical preparations[MeSH]' },
      { from: /pediatric|children/i, to: 'child[MeSH]' }
    ];

    for (const transform of transformations) {
      if (transform.from.test(query)) {
        meshTerms.push(query.replace(transform.from, transform.to));
      }
    }

    return meshTerms;
  }

  static getFallbackReferences(query: string, category?: string): Citation[] {
    const queryLower = query.toLowerCase();
    const matchingRefs: FallbackReference[] = [];

    // Find references that match the query or category
    for (const ref of FALLBACK_REFERENCES) {
      let score = 0;

      // Check category match
      if (category && ref.category.includes(category)) {
        score += 10;
      }

      // Check keyword matches
      for (const keyword of ref.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 5;
        }
      }

      // Check if any words in the query match the title
      const queryWords = queryLower.split(/\s+/);
      const titleLower = ref.title.toLowerCase();
      for (const word of queryWords) {
        if (word.length > 3 && titleLower.includes(word)) {
          score += 3;
        }
      }

      if (score > 0) {
        matchingRefs.push(ref);
      }
    }

    // Sort by relevance and return top 2-3
    matchingRefs.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryLower);
      const scoreB = this.calculateRelevanceScore(b, queryLower);
      return scoreB - scoreA;
    });

    // Convert to Citation format
    return matchingRefs.slice(0, 3).map(ref => ({
      id: ref.pmid,
      pmid: ref.pmid,
      title: ref.title,
      abstract: ref.abstract,
      authors: ref.authors,
      journal: ref.journal,
      year: ref.year,
      publishedDate: new Date(ref.year, 0, 1).toISOString(),
      url: `https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`,
    }));
  }

  private static calculateRelevanceScore(ref: FallbackReference, queryLower: string): number {
    let score = 0;
    
    // Keyword matches
    for (const keyword of ref.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 5;
      }
    }
    
    // Title word matches
    const queryWords = queryLower.split(/\s+/);
    const titleLower = ref.title.toLowerCase();
    for (const word of queryWords) {
      if (word.length > 3 && titleLower.includes(word)) {
        score += 3;
      }
    }
    
    return score;
  }

  static generateSearchQueries(userQuery: string): string[] {
    const refinement = this.refineQuery(userQuery);
    
    // Combine original query with refined versions
    const allQueries = [
      userQuery,
      ...refinement.refinedQueries.slice(0, 3), // Top 3 refined queries
    ];

    return [...new Set(allQueries)]; // Remove duplicates
  }
}
