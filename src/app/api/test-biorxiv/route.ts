import { NextRequest, NextResponse } from 'next/server';
import { BioRxivClient } from '@/lib/research/biorxiv';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing BioRxiv API functionality...');
  
  try {
    const bioRxivClient = new BioRxivClient();
    
    // Test 1: Try to fetch recent bioRxiv papers
    console.log('📋 Test 1: Fetching recent bioRxiv papers...');
    const bioRxivPapers = await bioRxivClient.searchPreprints('diabetes', 5);
    console.log(`📄 BioRxiv papers found: ${bioRxivPapers.length}`);
    
    // Test 2: Try to fetch recent medRxiv papers  
    console.log('📋 Test 2: Fetching recent medRxiv papers...');
    const medRxivPapers = await bioRxivClient.searchMedicalPreprints('covid', 5);
    console.log(`📄 MedRxiv papers found: ${medRxivPapers.length}`);
    
    // Test 3: Try to get latest preprints
    console.log('📋 Test 3: Fetching latest preprints...');
    const latestPapers = await bioRxivClient.getLatestPreprints('medicine', 3);
    console.log(`📄 Latest papers found: ${latestPapers.length}`);
    
    // Test 4: Test direct API endpoint
    console.log('📋 Test 4: Testing direct API endpoint...');
    const directResponse = await fetch('https://api.biorxiv.org/details/biorxiv/2024-07-01/2024-07-26/0/json');
    const directData = await directResponse.json();
    console.log(`📄 Direct API status: ${directResponse.status}, papers: ${directData.collection?.length || 0}`);
    
    return NextResponse.json({
      success: true,
      tests: {
        bioRxivSearch: {
          status: 'completed',
          papers: bioRxivPapers.length,
          sample: bioRxivPapers.slice(0, 2).map(p => ({
            title: p.title?.substring(0, 50) + '...',
            authors: p.authors.slice(0, 2),
            date: p.publishedDate,
            server: p.server
          }))
        },
        medRxivSearch: {
          status: 'completed', 
          papers: medRxivPapers.length,
          sample: medRxivPapers.slice(0, 2).map(p => ({
            title: p.title?.substring(0, 50) + '...',
            authors: p.authors.slice(0, 2),
            date: p.publishedDate,
            server: p.server
          }))
        },
        latestPreprints: {
          status: 'completed',
          papers: latestPapers.length,
          sample: latestPapers.slice(0, 1).map(p => ({
            title: p.title?.substring(0, 50) + '...',
            category: p.category,
            date: p.publishedDate
          }))
        },
        directAPI: {
          status: directResponse.status,
          papers: directData.collection?.length || 0,
          messages: directData.messages
        }
      },
      totalPapersFound: bioRxivPapers.length + medRxivPapers.length + latestPapers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ BioRxiv test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
