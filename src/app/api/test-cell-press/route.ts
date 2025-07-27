import { NextRequest, NextResponse } from 'next/server';
import { CellPressClient } from '@/lib/research/cell-press';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || "diabetes treatment";
    const maxResults = parseInt(searchParams.get('maxResults') || '5');
    
    console.log(`🔬 Testing Cell Press search for: "${query}"`);
    
    const cellPressClient = new CellPressClient();
    
    // Test the main search method
    const searchResults = await cellPressClient.searchPapers({
      query: query,
      maxResults: maxResults,
      source: 'cell-press'
    });
    
    // Also test medical journal specific search
    const medicalResults = await cellPressClient.searchMedicalJournals(query, 3);
    
    console.log(`✅ Cell Press: Found ${searchResults.length} papers from main search`);
    console.log(`✅ Cell Press: Found ${medicalResults.length} papers from medical journals`);
    
    const results = {
      query,
      totalResults: searchResults.length,
      mainSearch: {
        papers: searchResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
          url: paper.url,
          abstract: paper.abstract ? paper.abstract.substring(0, 200) + '...' : 'No abstract',
          source: paper.source
        }))
      },
      medicalJournalSearch: {
        papers: medicalResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
          url: paper.url,
          abstract: paper.abstract ? paper.abstract.substring(0, 200) + '...' : 'No abstract',
          source: paper.source
        }))
      },
      analysis: {
        mainSearchWorking: searchResults.length > 0,
        medicalSearchWorking: medicalResults.length > 0,
        combinedResults: searchResults.length + medicalResults.length,
        uniqueTitles: new Set([...searchResults.map(p => p.title), ...medicalResults.map(p => p.title)]).size
      }
    };
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Cell Press test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
