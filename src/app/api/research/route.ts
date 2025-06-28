import { NextRequest, NextResponse } from "next/server";
import { PubMedClient } from "@/lib/research/pubmed";
import { SemanticScholarClient } from "@/lib/research/semantic-scholar";
import { crossRefAPI, medicalResearchHelpers } from "@/lib/research/crossref";
import { type ResearchQuery, type PubMedArticle, type SemanticScholarPaper, type CrossRefPaper } from "@/lib/types/research";

export async function POST(request: NextRequest) {
  try {
    const body: ResearchQuery = await request.json();
    
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const maxResults = Math.min(body.maxResults || 5, 10); // Limit to prevent abuse
    const source = body.source || "all";

    let pubmedPapers: PubMedArticle[] = [];
    let semanticScholarPapers: SemanticScholarPaper[] = [];
    let crossRefPapers: CrossRefPaper[] = [];

    // Search PubMed
    if (source === "pubmed" || source === "all") {
      try {
        const pubmedClient = new PubMedClient(process.env.PUBMED_API_KEY);
        pubmedPapers = await pubmedClient.searchArticles({
          query: body.query,
          maxResults: Math.ceil(maxResults / (source === "all" ? 3 : 1)),
          source: "pubmed",
        });
      } catch (error) {
        console.error("PubMed search error:", error);
        // Continue with other sources if PubMed fails
      }
    }

    // Search Semantic Scholar
    if (source === "semantic-scholar" || source === "all") {
      try {
        const semanticScholarClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
        semanticScholarPapers = await semanticScholarClient.searchPapers({
          query: body.query,
          maxResults: Math.ceil(maxResults / (source === "all" ? 3 : 1)),
          source: "semantic-scholar",
        });
      } catch (error) {
        console.error("Semantic Scholar search error:", error);
        // Continue with other sources if Semantic Scholar fails
      }
    }

    // Search CrossRef
    if (source === "crossref" || source === "all") {
      try {
        const crossRefResults = await crossRefAPI.searchMedicalResearch(body.query, {
          limit: Math.ceil(maxResults / (source === "all" ? 3 : 1))
        });
        
        crossRefPapers = crossRefResults.map(work => ({
          id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
          doi: work.DOI,
          title: work.title?.[0] || 'Untitled',
          abstract: work.abstract,
          authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown Author'],
          journal: work['container-title']?.[0] || 'Unknown Journal',
          year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
          citationCount: work['is-referenced-by-count'] || 0,
          isOpenAccess: work.license ? work.license.length > 0 : false,
          type: work.type,
          publisher: work.publisher,
          volume: work.volume,
          issue: work.issue,
          pages: work.page
        }));
      } catch (error) {
        console.error("CrossRef search error:", error);
        // Continue with other sources if CrossRef fails
      }
    }

    // Combine and format results
    const combinedResults = [
      ...pubmedPapers.map(paper => ({
        id: paper.pmid,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: new Date(paper.publishedDate).getFullYear(),
        pmid: paper.pmid,
        doi: paper.doi,
        url: paper.url,
        abstract: paper.abstract,
        source: "PubMed",
        confidenceScore: 85, // PubMed has high medical relevance
        evidenceLevel: 'High' as const,
        studyType: 'Journal Article' as const,
      })),
      ...semanticScholarPapers.map(paper => ({
        id: paper.paperId,
        title: paper.title,
        authors: paper.authors.map(author => author.name),
        journal: paper.venue,
        year: paper.year,
        doi: paper.doi,
        url: paper.url,
        abstract: paper.abstract,
        source: "Semantic Scholar",
        confidenceScore: 75, // Good for general academic research
        evidenceLevel: 'Moderate' as const,
        studyType: 'Journal Article' as const,
      })),
      ...crossRefPapers.map(paper => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        doi: paper.doi,
        url: paper.url,
        abstract: paper.abstract,
        source: "CrossRef",
        confidenceScore: paper.citationCount && paper.citationCount > 50 ? 90 : 
                       paper.citationCount && paper.citationCount > 10 ? 80 : 70,
        evidenceLevel: paper.citationCount && paper.citationCount > 50 ? 'High' as const :
                      paper.citationCount && paper.citationCount > 10 ? 'Moderate' as const : 'Low' as const,
        studyType: paper.type === 'journal-article' ? 'Journal Article' as const :
                  paper.type === 'proceedings-article' ? 'Observational' as const :
                  'Review' as const,
        citationCount: paper.citationCount,
        isOpenAccess: paper.isOpenAccess,
        volume: paper.volume,
        issue: paper.issue,
        pages: paper.pages,
        publisher: paper.publisher,
      })),
    ];

    // Sort by relevance/confidence score and year, then limit results
    const sortedResults = combinedResults
      .sort((a, b) => {
        // Sort by confidence score first, then by year
        const confidenceDiff = (b.confidenceScore || 70) - (a.confidenceScore || 70);
        if (confidenceDiff !== 0) return confidenceDiff;
        return b.year - a.year;
      })
      .slice(0, maxResults);

    return NextResponse.json({
      papers: sortedResults,
      totalFound: combinedResults.length,
      query: body.query,
      sources: {
        pubmed: pubmedPapers.length,
        semanticScholar: semanticScholarPapers.length,
        crossref: crossRefPapers.length,
      },
    });

  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Research API endpoint",
    methods: ["POST"],
    endpoints: {
      search: "/api/research",
    },
  });
}
