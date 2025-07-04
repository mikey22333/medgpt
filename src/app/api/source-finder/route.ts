import { NextRequest, NextResponse } from "next/server";
import { PubMedClient } from "@/lib/research/pubmed";
import { EuropePMCClient } from "@/lib/research/europepmc";
import { SemanticScholarClient } from "@/lib/research/semantic-scholar";
import { TogetherAIClient } from "@/lib/ai/together";
import type { ResearchQuery } from "@/lib/types/research";

const pubmedClient = new PubMedClient();
const europePMCClient = new EuropePMCClient();
const semanticClient = new SemanticScholarClient();

// Initialize Together AI client
const togetherAI = new TogetherAIClient(process.env.TOGETHER_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle chat-style requests
    if (body.sessionId && body.mode) {
      const { query, sessionId, mode } = body;
      
      if (!query || query.trim().length === 0) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        );
      }

      // For now, provide a simple source finder response
      const response = `I'm your source finder assistant! You asked: "${query}"

I can help you find and verify sources for medical claims and research. Here's how I can assist:

**Source Finding Services:**
📚 **Find Research Papers** - Locate peer-reviewed studies relevant to your topic
🔍 **Verify Claims** - Check if statements are supported by current evidence
📊 **Assess Source Quality** - Evaluate the reliability and impact of research
🏥 **Find Guidelines** - Locate clinical practice guidelines and consensus statements

**Search Strategy:**
1. I'll search across multiple medical databases (PubMed, Semantic Scholar, etc.)
2. Focus on peer-reviewed, high-impact journals
3. Prioritize recent publications and systematic reviews
4. Check for conflicting evidence or limitations

**To get started, you can:**
- Share a specific medical claim you want me to verify
- Ask me to find sources on a particular topic
- Request help evaluating the quality of existing sources

**Medical Disclaimer:** Source finding is for educational and research purposes. Always consult healthcare professionals for medical decisions.

What would you like me to help you find sources for?`;

      return NextResponse.json({
        response,
        citations: [],
        reasoningSteps: [
          {
            step: 1,
            description: "Received source finding request",
            content: `Processing query: "${query}"`
          },
          {
            step: 2,
            description: "Provided source finding guidance",
            content: "Generated educational response about source finding methodology"
          }
        ],
        sessionId,
        mode
      });
    }

    // Handle original source-finder requests
    const { textSnippet, conversationHistory = [] } = body;

    if (!textSnippet?.trim()) {
      return NextResponse.json(
        { error: "Text snippet is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Source finder request:", { textSnippet: textSnippet.substring(0, 100) + "..." });

    // Extract key terms and phrases from the text snippet for searching
    const searchTerms = extractSearchTerms(textSnippet);
    console.log("📝 Extracted search terms:", searchTerms);

    // Search multiple databases for potential sources
    const searchPromises = searchTerms.map(async (term) => {
      try {
        const [pubmedResults, europePMCResults, semanticResults] = await Promise.allSettled([
          pubmedClient.searchArticles({ query: term, maxResults: 10, source: 'pubmed' } as ResearchQuery),
          europePMCClient.searchArticles({ query: term, maxResults: 10, source: 'europepmc' } as ResearchQuery),
          // Make Semantic Scholar optional since it's having issues
          semanticClient.searchPapers({ query: term, maxResults: 8, source: 'semantic-scholar' } as ResearchQuery).catch(() => []),
        ]);

        return {
          term,
          pubmed: pubmedResults.status === 'fulfilled' ? pubmedResults.value : [],
          europePMC: europePMCResults.status === 'fulfilled' ? europePMCResults.value : [],
          semantic: semanticResults.status === 'fulfilled' ? semanticResults.value : [],
        };
      } catch (error) {
        console.error(`Error searching for term "${term}":`, error);
        return { term, pubmed: [], europePMC: [], semantic: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Combine and rank results
    const allResults = combineAndRankResults(searchResults, textSnippet);

    // Generate AI response with source analysis using Together AI
    let aiResponse;
    try {
      aiResponse = await togetherAI.generateSourceFinderResponse(
        textSnippet,
        allResults,
        conversationHistory
      );
    } catch (aiError) {
      console.warn("Together AI unavailable, using fallback analysis:", aiError);
      // Fallback analysis when AI is not available
      aiResponse = generateFallbackSourceAnalysis(textSnippet, allResults);
    }

    console.log("✅ Source finder response generated");

    return NextResponse.json({
      message: {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        citations: aiResponse.citations,
      },
      searchResults: allResults,
      searchTerms,
    });

  } catch (error) {
    console.error("❌ Source finder error:", error);
    return NextResponse.json(
      { 
        error: "Failed to find sources",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Extract meaningful search terms from text snippet
function extractSearchTerms(text: string): string[] {
  const terms: string[] = [];
  
  // Extract phrases in quotes
  const quotedPhrases = text.match(/"([^"]*)"/g);
  if (quotedPhrases) {
    terms.push(...quotedPhrases.map(phrase => phrase.replace(/"/g, '')));
  }
  
  // Extract key medical/scientific terms (enhanced patterns)
  const medicalTerms = text.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[a-z]+(?:itis|osis|emia|uria|pathy|trophy|plasia|genesis|lysis|therapy|treatment|syndrome|disease))\b/g);
  if (medicalTerms) {
    terms.push(...medicalTerms.slice(0, 5)); // Increased from 3 to 5
  }
  
  // Extract numerical data patterns (enhanced)
  const numericalPatterns = text.match(/\b\d+(?:\.\d+)?(?:\s*(?:%|fold|times|mg|μg|ml|IU|units?|years?|patients?|studies?|trials?))\b/g);
  if (numericalPatterns) {
    terms.push(...numericalPatterns.slice(0, 3)); // Increased from 2 to 3
  }
  
  // Extract significant phrases (3-6 words)
  const significantPhrases = text.match(/\b(?:[A-Za-z]+\s+){2,5}[A-Za-z]+\b/g);
  if (significantPhrases) {
    const filteredPhrases = significantPhrases
      .filter(phrase => phrase.length > 15 && phrase.length < 80)
      .slice(0, 3);
    terms.push(...filteredPhrases);
  }
  
  // Extract specific medical concepts
  const conceptPatterns = [
    /\b(?:meta-analysis|systematic review|randomized controlled trial|RCT|cohort study)\b/gi,
    /\b(?:efficacy|effectiveness|safety|adverse events|contraindications)\b/gi,
    /\b(?:pathophysiology|mechanism|etiology|diagnosis|treatment|prognosis)\b/gi
  ];
  
  conceptPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) terms.push(...matches.slice(0, 2));
  });
  
  // If no specific terms found, use the full snippet (but also break into chunks)
  if (terms.length === 0) {
    terms.push(text.substring(0, 100));
    // Also try breaking into smaller chunks
    const words = text.split(/\s+/);
    if (words.length > 10) {
      terms.push(words.slice(0, 8).join(' '));
      terms.push(words.slice(-8).join(' '));
    }
  }
  
  return [...new Set(terms)]; // Remove duplicates
}

// Combine and rank results from different sources
function combineAndRankResults(searchResults: any[], originalText: string) {
  const allPapers: any[] = [];
  
  searchResults.forEach(result => {
    // Add papers from each source with source attribution
    if (result.pubmed) {
      result.pubmed.forEach((paper: any) => {
        allPapers.push({ ...paper, source: 'PubMed', searchTerm: result.term });
      });
    }
    if (result.europePMC) {
      result.europePMC.forEach((paper: any) => {
        allPapers.push({ ...paper, source: 'Europe PMC', searchTerm: result.term });
      });
    }
    if (result.semantic) {
      result.semantic.forEach((paper: any) => {
        allPapers.push({ ...paper, source: 'Semantic Scholar', searchTerm: result.term });
      });
    }
  });
  
  // Enhanced ranking based on text similarity
  const rankedPapers = allPapers
    .map(paper => ({
      ...paper,
      relevanceScore: calculateRelevanceScore(paper, originalText)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20); // Increased from 10 to 20 results
  
  return rankedPapers;
}

// Calculate relevance score based on text similarity (enhanced)
function calculateRelevanceScore(paper: any, originalText: string): number {
  let score = 0;
  const textLower = originalText.toLowerCase();
  const title = (paper.title || '').toLowerCase();
  const abstract = (paper.abstract || '').toLowerCase();
  
  // Check for exact phrase matches (high weight)
  const phrases = originalText.match(/\b(?:\w+\s+){2,5}\w+\b/g) || [];
  phrases.forEach(phrase => {
    const phraseLower = phrase.toLowerCase();
    if (title.includes(phraseLower)) score += 5;
    if (abstract.includes(phraseLower)) score += 3;
  });
  
  // Check for individual word matches
  const words = textLower.split(/\s+/).filter(word => word.length > 3);
  words.forEach(word => {
    if (title.includes(word)) score += 2;
    if (abstract.includes(word)) score += 1;
  });
  
  // Check for numerical matches (exact numbers are strong indicators)
  const numbers = originalText.match(/\b\d+(?:\.\d+)?\b/g) || [];
  numbers.forEach(num => {
    if (title.includes(num)) score += 4;
    if (abstract.includes(num)) score += 2;
  });
  
  // Bonus for recent papers
  if (paper.publishedDate || paper.pubDate) {
    const year = new Date(paper.publishedDate || paper.pubDate).getFullYear();
    if (year >= 2020) score += 1;
    if (year >= 2022) score += 2;
    if (year >= 2024) score += 3;
  }
  
  // Bonus for high-impact indicators
  if (title.includes('meta-analysis') || title.includes('systematic review')) score += 2;
  if (title.includes('randomized') || title.includes('controlled trial')) score += 1;
  
  // Bonus for exact citation format matches
  if (originalText.includes('et al') && (title.includes('study') || title.includes('trial'))) score += 1;
  
  return score;
}

// Fallback source analysis when AI is unavailable
function generateFallbackSourceAnalysis(textSnippet: string, searchResults: any[]): { content: string; citations: any[] } {
  const topResults = searchResults.slice(0, 3);
  
  let content = `## 🔍 Source Analysis\n\n`;
  
  if (topResults.length > 0) {
    content += `**Most Likely Sources:**\n`;
    topResults.forEach((result, index) => {
      content += `${index + 1}. "${result.title}" (${result.source})\n`;
      content += `   - Relevance Score: ${result.relevanceScore || 'N/A'}\n`;
      content += `   - Journal: ${result.journal || result.venue || 'Unknown'}\n\n`;
    });
    
    content += `**Key Claims Identified:**\n`;
    content += `- The provided text snippet contains medical/scientific information\n`;
    content += `- Several potentially matching sources were found in medical databases\n\n`;
    
    content += `**Confidence Assessment:**\n`;
    content += `- Overall Confidence: ${topResults[0]?.relevanceScore > 3 ? 'Moderate' : 'Low'}\n`;
    content += `- Reasoning: Based on keyword matching and database search results\n\n`;
    
    content += `**Verification Steps:**\n`;
    content += `1. Access the full text of the top-ranked papers\n`;
    content += `2. Search for the exact text snippet within the papers\n`;
    content += `3. Verify the context and citation format\n`;
    content += `4. Check for any paraphrasing or summarization\n\n`;
    
    content += `**Additional Notes:**\n`;
    content += `This analysis was performed using database search only. For more accurate source identification, manual verification is recommended.\n`;
  } else {
    content += `**No Strong Matches Found**\n\n`;
    content += `The text snippet could not be matched to papers in the searched databases.\n\n`;
    content += `**Suggested Next Steps:**\n`;
    content += `1. Try searching with different keywords\n`;
    content += `2. Check additional databases (Google Scholar, specialty journals)\n`;
    content += `3. Look for the source in clinical guidelines or textbooks\n`;
    content += `4. Contact the original author or institution if known\n`;
  }
  
  // Convert search results to citations
  const citations = topResults.map((result, index) => ({
    id: `fallback-${index}`,
    title: result.title || "Unknown Title",
    authors: result.authors || ["Unknown Author"],
    journal: result.journal || result.venue || "Unknown Journal",
    year: result.year || (result.publishedDate ? new Date(result.publishedDate).getFullYear() : undefined),
    pmid: result.pmid || undefined,
    doi: result.doi || undefined,
    url: result.url || (result.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/` : undefined),
    abstract: result.abstract || "No abstract available",
    relevanceScore: result.relevanceScore || 50,
    confidenceScore: Math.max(40, (result.relevanceScore || 30) * 8), 
    evidenceLevel: result.relevanceScore > 3 ? "Moderate" : "Low",
    source: result.source || "Database Search"
  }));
  
  return { content, citations };
}
