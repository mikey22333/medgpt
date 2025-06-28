import { NextRequest, NextResponse } from "next/server";
import { RAGPipeline } from "@/lib/research/rag";
import { createMedicalPrompt } from "@/lib/ai/prompts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'pediatric tuberculosis treatment';
    const maxResults = parseInt(searchParams.get('maxResults') || '3');

    console.log(`Testing research APIs with query: "${query}"`);

    // Test the RAG pipeline
    const rag = new RAGPipeline();
    const ragResult = await rag.retrieveContext(query, maxResults);

    // Test the prompt generation
    const testPrompt = createMedicalPrompt({
      userQuery: query,
      researchPapers: ragResult.citations,
      conversationHistory: []
    });

    return NextResponse.json({
      query,
      maxResults,
      results: {
        totalPapersFound: ragResult.totalPapersFound,
        citationsReturned: ragResult.citations.length,
        sources: ragResult.sources,
        citations: ragResult.citations.map(c => ({
          title: c.title,
          authors: c.authors,
          journal: c.journal,
          year: c.year,
          pmid: c.pmid,
          id: c.id,
          abstractLength: c.abstract?.length || 0,
          url: c.url
        })),
        promptPreview: testPrompt.substring(0, 1000) + "...",
        fullPromptLength: testPrompt.length
      }
    });

  } catch (error) {
    console.error("Research API test error:", error);
    return NextResponse.json({
      error: "Research API test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
