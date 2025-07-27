import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing complete research system with BioRxiv integration...');
  
  try {
    const testQuery = 'diabetes treatment';
    
    // Call the main research API
    const response = await fetch('http://localhost:3002/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        maxResults: 15
      })
    });
    
    const data = await response.json();
    
    // Check if BioRxiv papers are included
    const bioRxivPapers = data.citations?.filter((citation: any) => 
      citation.source?.toLowerCase().includes('biorxiv') || 
      citation.source?.toLowerCase().includes('medrxiv') ||
      citation.id?.includes('biorxiv')
    ) || [];
    
    return NextResponse.json({
      success: true,
      query: testQuery,
      totalCitations: data.citations?.length || 0,
      bioRxivPapers: bioRxivPapers.length,
      bioRxivSample: bioRxivPapers.slice(0, 2).map((paper: any) => ({
        title: paper.title?.substring(0, 60) + '...',
        authors: paper.authors?.slice(0, 2),
        source: paper.source,
        isPeerReviewed: paper.isPeerReviewed
      })),
      summary: data.summary,
      confidence: data.confidence,
      evidenceQuality: data.evidenceQuality,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Research system test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
