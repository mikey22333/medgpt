import { NextRequest, NextResponse } from 'next/server';
import { crossRefAPI, medicalResearchHelpers, CrossRefWork } from '@/lib/research/crossref';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'general';
    const limit = parseInt(searchParams.get('limit') || '20');
    const doi = searchParams.get('doi');

    if (!query && !doi) {
      return NextResponse.json(
        { error: 'Query or DOI parameter is required' },
        { status: 400 }
      );
    }

    let results: CrossRefWork[] = [];

    if (doi) {
      // Get specific work by DOI
      const work = await crossRefAPI.getWorkByDOI(doi);
      if (work) {
        results = [work];
      }
    } else if (query) {
      // Search based on type
      switch (type) {
        case 'drug':
          results = await medicalResearchHelpers.searchDrugResearch(query, limit);
          break;
        case 'disease':
          results = await medicalResearchHelpers.searchDiseaseResearch(query, limit);
          break;
        case 'clinical-trials':
          results = await medicalResearchHelpers.searchClinicalTrials(query, limit);
          break;
        case 'systematic-reviews':
          results = await medicalResearchHelpers.searchSystematicReviews(query, limit);
          break;
        case 'recent':
          results = await medicalResearchHelpers.searchRecentResearch(query, 2, limit);
          break;
        default:
          results = await crossRefAPI.searchMedicalResearch(query, { limit });
      }
    }

    // Transform results to match our Citation interface
    const citations = results.map(work => ({
      id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
      title: work.title?.[0] || 'Untitled',
      authors: work.author?.map((a) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown Author'],
      journal: work['container-title']?.[0] || 'Unknown Journal',
      year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
      doi: work.DOI,
      url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
      abstract: work.abstract || undefined,
      studyType: work.type === 'journal-article' ? 'Journal Article' : 
                 work.type === 'proceedings-article' ? 'Conference Paper' :
                 work.type === 'book-chapter' ? 'Book Chapter' :
                 work.type === 'book' ? 'Book' : 'Other',
      source: 'CrossRef',
      confidenceScore: work['is-referenced-by-count'] ? Math.min(95, 60 + (work['is-referenced-by-count'] / 100) * 35) : 70,
      evidenceLevel: work['is-referenced-by-count'] && work['is-referenced-by-count'] > 50 ? 'High' :
                    work['is-referenced-by-count'] && work['is-referenced-by-count'] > 10 ? 'Moderate' : 'Low',
      citationCount: work['is-referenced-by-count'] || 0,
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      publisher: work.publisher,
      isOpenAccess: work.license ? work.license.length > 0 : false,
      subjects: work.subject || []
    }));

    return NextResponse.json({
      success: true,
      source: 'CrossRef',
      totalResults: citations.length,
      query: query || doi,
      citations: citations
    });

  } catch (error) {
    console.error('CrossRef API error:', error);
    return NextResponse.json(
      { error: 'Failed to search CrossRef database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dois, format = 'apa' } = body;

    if (!dois || !Array.isArray(dois)) {
      return NextResponse.json(
        { error: 'DOIs array is required' },
        { status: 400 }
      );
    }

    // Get works for multiple DOIs and format citations
    const citations = await Promise.all(
      dois.map(async (doi: string) => {
        const work = await crossRefAPI.getWorkByDOI(doi);
        if (!work) return null;

        return {
          doi,
          citation: crossRefAPI.formatCitation(work, format),
          work: {
            title: work.title?.[0],
            authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()),
            journal: work['container-title']?.[0],
            year: work.published?.['date-parts']?.[0]?.[0],
            citationCount: work['is-referenced-by-count'] || 0
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      citations: citations.filter(c => c !== null),
      format
    });

  } catch (error) {
    console.error('CrossRef citation formatting error:', error);
    return NextResponse.json(
      { error: 'Failed to format citations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
