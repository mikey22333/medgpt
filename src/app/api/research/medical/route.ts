import { NextRequest, NextResponse } from 'next/server';
import { crossRefAPI, medicalResearchHelpers } from '@/lib/research/crossref';
import { PubMedClient } from '@/lib/research/pubmed';

/**
 * Specialized Medical Research API endpoint
 * Combines PubMed and CrossRef for comprehensive medical research
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'general', limit = 10, sources = ['pubmed', 'crossref'] } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const maxResults = Math.min(limit, 20); // Prevent abuse
    let allResults: any[] = [];

    // PubMed search for medical literature
    if (sources.includes('pubmed')) {
      try {
        const pubmedClient = new PubMedClient(process.env.PUBMED_API_KEY);
        const pubmedResults = await pubmedClient.searchArticles({
          query,
          maxResults: Math.ceil(maxResults / sources.length),
          source: 'pubmed'
        });

        const formattedPubMed = pubmedResults.map(paper => ({
          id: paper.pmid,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: new Date(paper.publishedDate).getFullYear(),
          pmid: paper.pmid,
          doi: paper.doi,
          url: paper.url,
          abstract: paper.abstract,
          source: 'PubMed',
          confidenceScore: 90, // PubMed is highly reliable for medical research
          evidenceLevel: 'High',
          studyType: 'Journal Article',
        }));

        allResults.push(...formattedPubMed);
      } catch (error) {
        console.error('PubMed search error:', error);
      }
    }

    // CrossRef search with medical specialization
    if (sources.includes('crossref')) {
      try {
        let crossRefResults = [];

        switch (type) {
          case 'drug':
            crossRefResults = await medicalResearchHelpers.searchDrugResearch(query, Math.ceil(maxResults / sources.length));
            break;
          case 'disease':
            crossRefResults = await medicalResearchHelpers.searchDiseaseResearch(query, Math.ceil(maxResults / sources.length));
            break;
          case 'clinical-trials':
            crossRefResults = await medicalResearchHelpers.searchClinicalTrials(query, Math.ceil(maxResults / sources.length));
            break;
          case 'systematic-reviews':
            crossRefResults = await medicalResearchHelpers.searchSystematicReviews(query, Math.ceil(maxResults / sources.length));
            break;
          case 'recent':
            crossRefResults = await medicalResearchHelpers.searchRecentResearch(query, 2, Math.ceil(maxResults / sources.length));
            break;
          default:
            crossRefResults = await crossRefAPI.searchMedicalResearch(query, { 
              limit: Math.ceil(maxResults / sources.length) 
            });
        }

        const formattedCrossRef = crossRefResults.map(work => ({
          id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
          title: work.title?.[0] || 'Untitled',
          authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown Author'],
          journal: work['container-title']?.[0] || 'Unknown Journal',
          year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          doi: work.DOI,
          url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
          abstract: work.abstract,
          source: 'CrossRef',
          confidenceScore: work['is-referenced-by-count'] ? 
            Math.min(95, 60 + (work['is-referenced-by-count'] / 100) * 35) : 70,
          evidenceLevel: work['is-referenced-by-count'] && work['is-referenced-by-count'] > 50 ? 'High' :
                        work['is-referenced-by-count'] && work['is-referenced-by-count'] > 10 ? 'Moderate' : 'Low',
          studyType: work.type === 'journal-article' ? 'Journal Article' :
                    work.type === 'proceedings-article' ? 'Conference Paper' :
                    work.type === 'book-chapter' ? 'Book Chapter' : 'Other',
          citationCount: work['is-referenced-by-count'] || 0,
          volume: work.volume,
          issue: work.issue,
          pages: work.page,
          publisher: work.publisher,
          isOpenAccess: work.license ? work.license.length > 0 : false,
        }));

        allResults.push(...formattedCrossRef);
      } catch (error) {
        console.error('CrossRef search error:', error);
      }
    }

    // Sort by confidence score and recency
    const sortedResults = allResults
      .sort((a, b) => {
        const confidenceDiff = (b.confidenceScore || 70) - (a.confidenceScore || 70);
        if (confidenceDiff !== 0) return confidenceDiff;
        return b.year - a.year;
      })
      .slice(0, maxResults);

    // Generate search insights
    const insights = {
      totalResults: allResults.length,
      highConfidenceCount: allResults.filter(r => (r.confidenceScore || 0) >= 80).length,
      recentCount: allResults.filter(r => r.year >= new Date().getFullYear() - 2).length,
      openAccessCount: allResults.filter(r => r.isOpenAccess).length,
      averageCitationCount: allResults.reduce((sum, r) => sum + (r.citationCount || 0), 0) / allResults.length,
      sourceBreakdown: {
        pubmed: allResults.filter(r => r.source === 'PubMed').length,
        crossref: allResults.filter(r => r.source === 'CrossRef').length,
      }
    };

    return NextResponse.json({
      success: true,
      results: sortedResults,
      insights,
      query,
      searchType: type,
      sources: sources,
    });

  } catch (error) {
    console.error('Medical research API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform medical research search', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Medical Research API endpoint',
    methods: ['POST'],
    description: 'Specialized medical research combining PubMed and CrossRef',
    searchTypes: {
      general: 'General medical research',
      drug: 'Drug-specific research',
      disease: 'Disease-specific research',
      'clinical-trials': 'Clinical trials and RCTs',
      'systematic-reviews': 'Systematic reviews and meta-analyses',
      recent: 'Recent research (last 2 years)'
    },
    sources: ['pubmed', 'crossref'],
    example: {
      query: 'diabetes treatment metformin',
      type: 'drug',
      limit: 10,
      sources: ['pubmed', 'crossref']
    }
  });
}
