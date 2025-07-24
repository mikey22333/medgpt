import { NextRequest, NextResponse } from 'next/server';
import { Phase4EnhancedResearchService, Phase4SearchFilters } from '@/lib/services/Phase4EnhancedResearchService';

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {} } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid query string is required' },
        { status: 400 }
      );
    }

    const researchService = new Phase4EnhancedResearchService();
    
    // Enhanced filters with Phase 4 capabilities
    const phase4Filters: Phase4SearchFilters = {
      dateRange: filters.dateRange,
      studyTypes: filters.studyTypes,
      evidenceLevels: filters.evidenceLevels,
      maxResults: filters.maxResults || 50,
      requireOpenAccess: filters.requireOpenAccess !== false, // Default to true
      medicalDomain: filters.medicalDomain || 'ALL',
      includeScreeningLog: filters.includeScreeningLog !== false, // Default to true
      includeBiasAssessment: filters.includeBiasAssessment !== false, // Default to true
      optimizePatientLanguage: filters.optimizePatientLanguage !== false // Default to true
    };

    const searchResults = await researchService.comprehensiveSearch(query, phase4Filters);

    return NextResponse.json({
      success: true,
      data: searchResults,
      metadata: {
        version: 'Phase 4 Enhanced',
        timestamp: new Date().toISOString(),
        capabilities: [
          'Multi-database search (PLOS, BMC, TRIP)',
          'Transparent screening logs',
          'RoB2/AMSTAR-2 bias assessment',
          'Automated meta-analysis',
          'Patient language optimization',
          'Evidence gap analysis',
          'Quality recommendations'
        ]
      }
    });

  } catch (error) {
    console.error('Phase 4 Research API Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process research query',
        details: error instanceof Error ? error.message : 'Unknown error',
        capabilities: [
          'Multi-database search',
          'Screening transparency',
          'Bias assessment',
          'Meta-analysis',
          'Patient optimization'
        ]
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const queryId = searchParams.get('queryId');

  try {
    const researchService = new Phase4EnhancedResearchService();

    switch (action) {
      case 'screening-report':
        if (!queryId) {
          return NextResponse.json(
            { error: 'queryId required for screening report' },
            { status: 400 }
          );
        }
        
        const screeningReport = await researchService.getScreeningReport(queryId);
        return NextResponse.json({
          success: true,
          report: screeningReport,
          queryId
        });

      case 'performance-stats':
        const performanceStats = await researchService.getPerformanceStatistics();
        return NextResponse.json({
          success: true,
          statistics: performanceStats
        });

      case 'capabilities':
        return NextResponse.json({
          success: true,
          capabilities: {
            databases: ['PLOS', 'BMC', 'TRIP', 'PubMed', 'PMC', 'DOAJ', 'ClinicalTrials.gov'],
            features: [
              'Transparent screening with exclusion rationale',
              'RoB2 bias assessment for RCTs',
              'AMSTAR-2 quality assessment for systematic reviews',
              'Automated meta-analysis with forest plots',
              'Patient language optimization (6th grade reading level)',
              'Real-time evidence gap identification',
              'Clinical relevance scoring (0-10 PICO alignment)',
              'Predatory journal filtering',
              'Open access verification',
              'Domain-specific search optimization'
            ],
            qualityMetrics: [
              'Quality scores (0-100)',
              'Evidence levels (1-5)',
              'Relevance scores (0-100)',
              'Impact factor integration',
              'Citation count weighting',
              'Open access compliance'
            ],
            outputFormats: [
              'Researcher summary with statistical analysis',
              'Clinician summary with practical recommendations',
              'Patient summary with simplified language',
              'Complete screening audit trail',
              'Bias assessment reports',
              'Meta-analysis results with interpretation'
            ]
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: screening-report, performance-stats, capabilities' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Phase 4 Research API GET Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
