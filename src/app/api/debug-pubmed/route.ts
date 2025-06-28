import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'pediatric tuberculosis';
    
    console.log(`Testing PubMed directly with query: "${query}"`);
    
    // Test PubMed search step by step
    const searchParams2 = new URLSearchParams({
      db: "pubmed",
      term: query,
      retmax: "3",
      retmode: "json",
      sort: "relevance",
    });
    
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams2}`;
    console.log("PubMed search URL:", searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    console.log("PubMed search response status:", searchResponse.status, searchResponse.statusText);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log("PubMed search error body:", errorText);
      return NextResponse.json({
        error: "PubMed search failed",
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        errorBody: errorText,
        searchUrl
      });
    }
    
    const searchData = await searchResponse.json();
    console.log("PubMed search data:", JSON.stringify(searchData, null, 2));
    
    const pmids = searchData.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      return NextResponse.json({
        message: "No PMIDs found",
        searchData
      });
    }
    
    // Test fetching details
    const fetchParams = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "xml",
    });
    
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams}`;
    console.log("PubMed fetch URL:", fetchUrl);
    
    const fetchResponse = await fetch(fetchUrl);
    console.log("PubMed fetch response status:", fetchResponse.status, fetchResponse.statusText);
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      return NextResponse.json({
        error: "PubMed fetch failed",
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        errorBody: errorText,
        fetchUrl,
        pmids
      });
    }
    
    const xmlText = await fetchResponse.text();
    
    return NextResponse.json({
      success: true,
      query,
      pmidsFound: pmids.length,
      pmids,
      xmlLength: xmlText.length,
      xmlPreview: xmlText.substring(0, 500) + "...",
      searchUrl,
      fetchUrl
    });
    
  } catch (error) {
    console.error("Debug PubMed error:", error);
    return NextResponse.json({
      error: "Debug test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
