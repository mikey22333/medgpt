import { NextRequest, NextResponse } from 'next/server';
import { SemanticScholarClient } from '@/lib/research/semantic-scholar';
import { EuropePMCClient } from '@/lib/research/europepmc';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || "diabetes treatment";
    
    console.log(`🔬 Testing Alternative Research Sources for: "${query}"`);
    
    const results: any = {
      query,
      sources: {},
      summary: {
        workingSources: 0,
        totalPapers: 0,
        errors: []
      }
    };
    
    // Test Europe PMC
    try {
      console.log('🌍 Testing Europe PMC...');
      const europePMCClient = new EuropePMCClient();
      const europePMCResults = await europePMCClient.searchArticles({
        query: query,
        maxResults: 3,
        source: 'europepmc'
      });
      
      results.sources.europePMC = {
        status: 'working',
        papers: europePMCResults.length,
        sample: europePMCResults.slice(0, 2).map(p => ({
          title: p.title,
          authors: p.authors,
          year: p.publishedDate ? new Date(p.publishedDate).getFullYear() : 'Unknown'
        }))
      };
      
      if (europePMCResults.length > 0) {
        results.summary.workingSources++;
        results.summary.totalPapers += europePMCResults.length;
      }
      
      console.log(`✅ Europe PMC: Found ${europePMCResults.length} papers`);
    } catch (error) {
      console.log('❌ Europe PMC failed:', error);
      results.sources.europePMC = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.errors.push('Europe PMC: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    // Test Semantic Scholar (but handle 403 errors gracefully)
    try {
      console.log('🎓 Testing Semantic Scholar...');
      const semanticClient = new SemanticScholarClient();
      const semanticResults = await semanticClient.searchPapers({
        query: query,
        maxResults: 3,
        source: 'semantic-scholar'
      });
      
      results.sources.semanticScholar = {
        status: 'working',
        papers: semanticResults.length,
        sample: semanticResults.slice(0, 2).map(p => ({
          title: p.title,
          authors: p.authors?.map(a => a.name).join(', '),
          year: p.year
        }))
      };
      
      if (semanticResults.length > 0) {
        results.summary.workingSources++;
        results.summary.totalPapers += semanticResults.length;
      }
      
      console.log(`✅ Semantic Scholar: Found ${semanticResults.length} papers`);
    } catch (error) {
      console.log('❌ Semantic Scholar failed:', error);
      results.sources.semanticScholar = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.errors.push('Semantic Scholar: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    // Summary assessment
    if (results.summary.workingSources > 0) {
      results.summary.assessment = `✅ ${results.summary.workingSources} research source(s) working, found ${results.summary.totalPapers} papers total`;
    } else {
      results.summary.assessment = '❌ No research sources are currently working';
    }
    
    console.log('📊 Test Summary:', results.summary.assessment);
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Alternative sources test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
