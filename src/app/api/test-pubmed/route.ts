import { NextRequest, NextResponse } from 'next/server';
import { PubMedClient } from '@/lib/research/pubmed';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || "metformin diabetes";
    
    console.log(`🔬 Testing PubMed direct search for: "${query}"`);
    
    const pubmedClient = new PubMedClient();
    const results = await pubmedClient.searchArticles({
      query,
      maxResults: 5,
      sort: 'relevance'
    });
    
    console.log(`✅ PubMed returned ${results.length} results`);
    
    return NextResponse.json({
      success: true,
      source: 'PubMed Direct',
      query,
      totalResults: results.length,
      papers: results.map(paper => ({
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        pmid: paper.pmid,
        abstract: paper.abstract ? paper.abstract.substring(0, 200) + '...' : 'No abstract'
      }))
    });
    
  } catch (error) {
    console.error('❌ PubMed test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
