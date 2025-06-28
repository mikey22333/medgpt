import { NextRequest, NextResponse } from "next/server";
import { RAGPipeline } from "@/lib/research/rag";
import { createMedicalPrompt } from "@/lib/ai/prompts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'pediatric tuberculosis treatment';

    console.log(`Testing full prompt generation with query: "${query}"`);

    // Get research citations
    const rag = new RAGPipeline();
    const ragResult = await rag.retrieveContext(query, 3);

    // Generate the full prompt that will be sent to the AI
    const fullPrompt = createMedicalPrompt({
      userQuery: query,
      researchPapers: ragResult.citations,
      conversationHistory: []
    });

    return NextResponse.json({
      query,
      research: {
        totalPapersFound: ragResult.totalPapersFound,
        citationsUsed: ragResult.citations.length,
        sources: ragResult.sources,
        citations: ragResult.citations.map(c => ({
          title: c.title,
          authors: c.authors,
          journal: c.journal,
          year: c.year,
          pmid: c.pmid,
          abstract: c.abstract?.substring(0, 200) + "..."
        }))
      },
      prompt: {
        length: fullPrompt.length,
        preview: fullPrompt.substring(0, 1500) + "\n\n... [TRUNCATED] ...",
        containsPMIDs: (fullPrompt.match(/PMID: \d+/g) || []).length,
        containsTitles: ragResult.citations.length
      }
    });

  } catch (error) {
    console.error("Prompt test error:", error);
    return NextResponse.json({
      error: "Prompt test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
