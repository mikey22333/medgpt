import { NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { generateResearchPDF, generateSourcePDF } from '@/lib/utils/pdf-export';
import { type ResearchPaper } from '@/lib/types/research';

// Helper to parse the request body
async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { 
      mode, // 'research' or 'source'
      title,
      content,
      papers,
      metaAnalysis,
      gradeAssessment,
      clinicalImplications,
      query,
      exportOptions = {}
    } = body;

    if (!['research', 'source'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid export mode. Must be "research" or "source"' },
        { status: 400 }
      );
    }

    let pdfBlob: Blob;
    
    if (mode === 'research') {
      // Generate research mode PDF
      pdfBlob = await generateResearchPDF({
        mode: 'research',
        title: title || 'Research Summary',
        content,
        papers: papers as ResearchPaper[],
        metaAnalysis,
        gradeAssessment,
        clinicalImplications,
        query,
        ...exportOptions
      });
    } else {
      // Generate source mode PDF
      pdfBlob = await generateSourcePDF({
        mode: 'source',
        title: title || 'Source Export',
        papers: papers as ResearchPaper[],
        query,
        ...exportOptions
      });
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create response with PDF
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'export'}.pdf"`,
        'Content-Length': buffer.length.toString()
      }
    });

    return response;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
