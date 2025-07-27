import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || "metformin";
    
    console.log(`🔍 Testing PubMed API Response for: "${query}"`);
    
    // Test direct PubMed API call
    const pubmedParams = new URLSearchParams({
      db: 'pubmed',  // Try standard pubmed database
      term: query,
      retmax: '5',
      retmode: 'json',
      sort: 'relevance',
      api_key: process.env.PUBMED_API_KEY || ''
    });
    
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${pubmedParams}`;
    console.log('🌐 PubMed URL:', pubmedUrl);
    
    const pubmedResponse = await fetch(pubmedUrl);
    console.log('📊 PubMed Response Status:', pubmedResponse.status, pubmedResponse.statusText);
    console.log('📋 PubMed Response Headers:', Object.fromEntries(pubmedResponse.headers.entries()));
    
    const pubmedText = await pubmedResponse.text();
    console.log('📄 PubMed Response (first 500 chars):', pubmedText.substring(0, 500));
    
    // Also test PMC database
    const pmcParams = new URLSearchParams({
      db: 'pmc',  // PMC database
      term: query,
      retmax: '5',
      retmode: 'json',
      sort: 'relevance',
      api_key: process.env.PUBMED_API_KEY || ''
    });
    
    const pmcUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${pmcParams}`;
    console.log('🌐 PMC URL:', pmcUrl);
    
    const pmcResponse = await fetch(pmcUrl);
    console.log('📊 PMC Response Status:', pmcResponse.status, pmcResponse.statusText);
    
    const pmcText = await pmcResponse.text();
    console.log('📄 PMC Response (first 500 chars):', pmcText.substring(0, 500));
    
    // Try parsing JSON
    let pubmedData = null;
    let pmcData = null;
    
    try {
      pubmedData = JSON.parse(pubmedText);
      console.log('✅ PubMed JSON parsed successfully');
    } catch (error) {
      console.log('❌ PubMed JSON parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    try {
      pmcData = JSON.parse(pmcText);
      console.log('✅ PMC JSON parsed successfully');
    } catch (error) {
      console.log('❌ PMC JSON parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json({
      success: true,
      query,
      tests: {
        pubmed: {
          url: pubmedUrl,
          status: pubmedResponse.status,
          headers: Object.fromEntries(pubmedResponse.headers.entries()),
          responsePreview: pubmedText.substring(0, 500),
          jsonParsed: pubmedData ? true : false,
          data: pubmedData,
          error: pubmedData ? null : 'Failed to parse JSON'
        },
        pmc: {
          url: pmcUrl,
          status: pmcResponse.status,
          responsePreview: pmcText.substring(0, 500),
          jsonParsed: pmcData ? true : false,
          data: pmcData,
          error: pmcData ? null : 'Failed to parse JSON'
        }
      },
      environment: {
        hasApiKey: !!process.env.PUBMED_API_KEY,
        apiKeyPreview: process.env.PUBMED_API_KEY ? process.env.PUBMED_API_KEY.substring(0, 8) + '...' : 'Not set'
      }
    });
    
  } catch (error) {
    console.error('❌ PubMed debug test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
