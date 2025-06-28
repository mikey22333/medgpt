import { NextRequest, NextResponse } from 'next/server';
import { fdaClient } from '@/lib/research/fda';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'aspirin';
    const maxResults = parseInt(searchParams.get('maxResults') || '5');

    console.log(`[API] Testing FDA search with query: "${query}"`);

    const results = await fdaClient.searchAll(query);

    return NextResponse.json({
      query,
      maxResults,
      results: {
        totalFDAResourcesFound: results.length,
        citationsReturned: results.length,
        sources: Array.from(new Set(results.map(r => r.source))),
        citations: results.map(result => ({
          title: result.title,
          abstract: result.abstract.substring(0, 200) + (result.abstract.length > 200 ? '...' : ''),
          authors: result.authors,
          journal: result.journal,
          year: result.year,
          source: result.source,
          url: result.url,
          pmid: result.pmid
        }))
      }
    });

  } catch (error) {
    console.error('[API] FDA test error:', error);
    return NextResponse.json(
      { 
        error: 'FDA search failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        query: request.url 
      },
      { status: 500 }
    );
  }
}
