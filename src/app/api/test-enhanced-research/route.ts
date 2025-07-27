import { NextRequest, NextResponse } from 'next/server';
import { ExpertQueryGenerator } from '@/lib/research/expert-query-generator';
import { MedicalRelevanceDetector } from '@/lib/research/medical-relevance-detector';
import { EnhancedResearchOrchestrator } from '@/lib/research/enhanced-orchestrator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || "BCG therapy effectiveness for non-tuberculous mycobacterial lung disease";
    const maxResults = parseInt(searchParams.get('maxResults') || '5');
    
    console.log('🔬 Testing Enhanced Research System');
    console.log(`📝 Query: "${query}"`);
    
    // Initialize orchestrator
    const orchestrator = new EnhancedResearchOrchestrator();
    
    // Step 1: Expert Query Generation (static method)
    console.log('🧠 Generating expert queries...');
    const expertQueries = ExpertQueryGenerator.generateExpertQueries(query);
    
    // Step 2: Intelligent Research
    console.log('🔍 Executing intelligent search...');
    const searchResult = await orchestrator.executeIntelligentSearch(query, maxResults);
    const searchResults = searchResult.papers || [];
    
    // Step 3: Medical Relevance Analysis (static method)
    console.log('⚕️ Analyzing medical relevance...');
    const relevanceAnalysis = MedicalRelevanceDetector.filterRelevantPapers(searchResults, query);
    
    // Step 4: Confidence Assessment
    const irrelevanceRatio = relevanceAnalysis.irrelevant.length / searchResults.length;
    let confidenceLevel;
    if (irrelevanceRatio > 0.5) {
      confidenceLevel = 'Low (15-30%)';
    } else if (irrelevanceRatio > 0.3) {
      confidenceLevel = 'Medium (45-65%)';
    } else {
      confidenceLevel = 'High (75-90%)';
    }
    
    const testResults = {
      query,
      totalResults: searchResults.length,
      searchStrategy: searchResult.strategy,
      expertQueries: {
        primary: expertQueries.primary,
        semantic: expertQueries.semantic,
        mesh: expertQueries.mesh,
        specialized: expertQueries.specialized
      },
      relevanceAnalysis: {
        totalPapers: searchResults.length,
        relevantPapers: relevanceAnalysis.relevant.length,
        irrelevantPapers: relevanceAnalysis.irrelevant.length,
        analysisReport: relevanceAnalysis.report,
        irrelevantPapersDetails: relevanceAnalysis.irrelevant.map((p: any) => ({
          title: p.title,
          reasons: p.irrelevanceReasons
        }))
      },
      confidenceAssessment: {
        irrelevanceRatio: irrelevanceRatio,
        confidenceLevel: confidenceLevel,
        recommendation: irrelevanceRatio > 0.5 ? 'Query refinement needed' : 'Sources adequate for response'
      },
      topRelevantPapers: relevanceAnalysis.relevant.slice(0, 3).map((p: any) => ({
        title: p.title,
        journal: p.journal,
        year: p.year,
        source: p.source,
        relevanceScore: p.relevanceScore,
        doi: p.doi
      })),
      systemStatus: 'Enhanced research system operational'
    };
    
    console.log('✅ Test completed successfully');
    
    return NextResponse.json({
      success: true,
      data: testResults
    });
    
  } catch (error) {
    console.error('❌ Enhanced research test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
