import { NextResponse } from 'next/server';
import { MetaAnalysisService } from '@/lib/research/meta-analysis';
import { type MetaAnalysisSummary } from '@/lib/research/meta-summary';
import { type EuropePMCMetaAnalysis } from '@/lib/research/europepmc';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const minStudies = searchParams.get('minStudies') ? parseInt(searchParams.get('minStudies')!) : undefined;
  const minYear = searchParams.get('minYear') ? parseInt(searchParams.get('minYear')!) : undefined;
  const maxYear = searchParams.get('maxYear') ? parseInt(searchParams.get('maxYear')!) : undefined;
  const hasFullText = searchParams.get('hasFullText') === 'true';
  const includeNonEnglish = searchParams.get('includeNonEnglish') === 'true';
  const sortBy = searchParams.get('sortBy') as 'relevance' | 'date' | 'cited' | null;
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
  const includeSummary = searchParams.get('includeSummary') === 'true';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const service = new MetaAnalysisService();
    const { results, fallbackSuggestions } = await service.searchMetaAnalyses(query, {
      minStudies,
      minYear,
      maxYear,
      hasFullText,
      includeNonEnglish,
      sortBy: sortBy || 'relevance',
      sortOrder: sortOrder || 'desc',
      suggestFallbacks: true
    });

    // Generate summaries if requested and we have results
    let processedResults: EuropePMCMetaAnalysis[] = [];
    if (results.length > 0 && includeSummary) {
      // Process results in parallel to generate summaries
      processedResults = await Promise.all(
        results.map(async (result) => {
          try {
            const detailed = await service.getMetaAnalysis(result.id, {
              includeFullText: false,
              assessQuality: true,
              includeSummary: true
            });
            return detailed || result;
          } catch (error) {
            console.error(`Error generating summary for ${result.id}:`, error);
            return result; // Return original result if summary generation fails
          }
        })
      );
    } else {
      processedResults = results;
    }

    // Prepare response with fallback suggestions if no results
    const response: {
      results: EuropePMCMetaAnalysis[];
      summaryIncluded: boolean;
      fallbackSuggestions?: Array<{
        query: string;
        description: string;
        url: string;
      }>;
    } = { 
      results: processedResults,
      summaryIncluded: includeSummary 
    };

    // Add fallback suggestions if no results were found
    if (results.length === 0 && fallbackSuggestions && fallbackSuggestions.length > 0) {
      response.fallbackSuggestions = fallbackSuggestions;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching meta-analyses:', error);
    return NextResponse.json(
      { error: 'Failed to search meta-analyses' },
      { status: 500 }
    );
  }
}
