import { NextRequest, NextResponse } from "next/server";
import { EuropePMCClient } from "@/lib/research/europepmc";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'pediatric tuberculosis treatment';
    const maxResults = parseInt(searchParams.get('maxResults') || '3');

    console.log(`Testing Europe PMC API with query: "${query}"`);

    // Test Europe PMC search
    const europePMC = new EuropePMCClient(process.env.EUROPE_PMC_EMAIL);
    const articles = await europePMC.searchArticles({
      query,
      maxResults,
      source: "europepmc"
    });

    return NextResponse.json({
      query,
      maxResults,
      results: {
        articlesFound: articles.length,
        articles: articles.map(article => ({
          id: article.id,
          pmid: article.pmid,
          pmcid: article.pmcid,
          title: article.title,
          authors: article.authors,
          journal: article.journal,
          publishedDate: article.publishedDate,
          abstractLength: article.abstract?.length || 0,
          url: article.url,
          isOpenAccess: article.isOpenAccess,
          citationCount: article.citationCount
        }))
      }
    });

  } catch (error) {
    console.error("Europe PMC test error:", error);
    return NextResponse.json({
      error: "Europe PMC test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
