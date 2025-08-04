import { NextRequest, NextResponse } from 'next/server';
import { SemanticScholarClient } from '@/lib/research/semantic-scholar';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🧪 Testing Semantic Scholar with query: "${query}"`);
    
    const client = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
    
    const startTime = Date.now();
    
    const papers = await client.searchPapers({
      query,
      maxResults: 5,
      source: 'semantic-scholar'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Semantic Scholar test completed in ${duration}ms`);
    console.log(`📄 Found ${papers.length} papers`);
    
    return NextResponse.json({
      success: true,
      query,
      resultsCount: papers.length,
      duration: `${duration}ms`,
      papers: papers.map(paper => ({
        title: paper.title,
        authors: paper.authors.map(a => a.name).join(', '),
        year: paper.year,
        venue: paper.venue,
        citationCount: paper.citationCount,
        hasAbstract: !!paper.abstract && paper.abstract !== 'No abstract available'
      })),
      status: papers.length > 0 ? 'working' : 'no_results'
    });

  } catch (error: any) {
    console.error('❌ Semantic Scholar test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with {"query": "your search terms"} to test Semantic Scholar'
  });
}
