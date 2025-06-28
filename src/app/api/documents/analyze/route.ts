import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { extractPDFText } from '@/lib/pdf-extractor';
import { TogetherAIClient } from '@/lib/ai/together';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const userPrompt = formData.get('userPrompt') as string;
    const conversationHistory = formData.get('conversationHistory') as string;
    const mode = formData.get('mode') as 'research' | 'doctor' || 'research';

    if (!file) {
      return NextResponse.json(
        { error: "No document provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, Word, Excel, or text files." },
        { status: 400 }
      );
    }

    // Create temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFileName = `${randomUUID()}-${file.name}`;
    const tempFilePath = join(process.cwd(), 'temp', tempFileName);

    // Ensure temp directory exists
    try {
      await writeFile(tempFilePath, buffer);
    } catch (error) {
      // If temp directory doesn't exist, create it and try again
      const { mkdir } = await import('fs/promises');
      await mkdir(join(process.cwd(), 'temp'), { recursive: true });
      await writeFile(tempFilePath, buffer);
    }

    let extractedText = '';

    try {
      // Extract text based on file type
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        extractedText = await readFile(tempFilePath, 'utf-8');
      } else if (file.type === 'application/pdf') {
        extractedText = await extractPDFText(tempFilePath);
      } else if (file.type.includes('word')) {
        extractedText = await extractTextFromWord(tempFilePath);
      } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
        extractedText = await extractTextFromExcel(tempFilePath);
      }

      // Analyze the document with AI
      const analysis = await analyzeDocumentWithAI(
        extractedText, 
        file.name, 
        file.type, 
        userPrompt || "Please analyze this document and provide key insights.",
        conversationHistory,
        mode
      );

      return NextResponse.json({
        message: {
          id: Date.now().toString(),
          content: analysis,
          timestamp: new Date().toISOString(),
          citations: [] // Could be enhanced to extract citations from document
        },
        analysis,
        filename: file.name,
        fileType: file.type,
        extractedLength: extractedText.length
      });

    } finally {
      // Clean up temporary file
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Failed to delete temp file:', error);
      }
    }

  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}

async function extractTextFromWord(filePath: string): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "No text content found in Word document";
  } catch (error) {
    console.error("Word extraction error:", error);
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function extractTextFromExcel(filePath: string): Promise<string> {
  try {
    // For basic Excel support, we'll read it as text for now
    // In production, you'd use libraries like xlsx or exceljs
    const fs = await import('fs');
    const data = fs.readFileSync(filePath);
    
    // Try to extract readable text from Excel file
    // This is a basic approach - for full Excel support, use xlsx library
    const text = data.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const cleanText = text.split('\n')
      .filter((line: string) => line.trim().length > 0)
      .join('\n')
      .substring(0, 5000); // Limit to first 5000 chars
    
    return cleanText || "No readable text content found in Excel file";
  } catch (error) {
    console.error("Excel extraction error:", error);
    throw new Error(`Failed to extract text from Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function analyzeDocumentWithAI(
  text: string, 
  filename: string, 
  fileType: string, 
  userPrompt: string,
  conversationHistory?: string,
  mode: 'research' | 'doctor' = 'research'
): Promise<string> {
  // Truncate text if too long to avoid API limits
  const maxLength = 8000;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  // Parse conversation history if provided
  let contextPrompt = "";
  if (conversationHistory) {
    try {
      const history = JSON.parse(conversationHistory);
      if (history.length > 0) {
        contextPrompt = "\n\n**Previous Conversation Context:**\n" + 
          history.slice(-3).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') + "\n\n";
      }
    } catch (error) {
      console.error("Failed to parse conversation history:", error);
    }
  }

  let prompt = "";
  
  if (mode === 'doctor') {
    prompt = `You are MedGPT, a compassionate and knowledgeable virtual doctor.

You respond like a board-certified physician with clinical clarity, using simple language for patients and precise language for professionals.

**Patient's Request:** ${userPrompt}

**Document:** ${filename}
**Type:** ${fileType}

**Content:**
${truncatedText}

${contextPrompt}

Structure your response like this:

1. 🧾 Clinical Overview
2. ⚠️ Key Findings / Important Points
3. 🩺 What This Means for You
4. 🏥 When to Discuss with Your Doctor
5. 🧠 Medical Explanation (for those who want details)

Use empathetic, clear, and supportive language.`;
  } else {
    prompt = `As a medical research assistant, please help with the following request regarding this document:

**User Request:** ${userPrompt}

**Document:** ${filename}
**Type:** ${fileType}

**Content:**
${truncatedText}

${contextPrompt}

Please respond to the user's specific request while providing medically accurate information. If the request involves analysis, include relevant clinical insights and evidence-based information.

Please format your response in clear, professional language.`;
  }

  try {
    // Use Together AI for document analysis
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      console.error("Together AI API key not configured");
      return generateFallbackAnalysis(filename, truncatedText);
    }

    const togetherClient = new TogetherAIClient(apiKey);
    const model = process.env.TOGETHER_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";

    const messages = [
      {
        role: "system" as const,
        content: mode === 'doctor' 
          ? "You are MedGPT, a compassionate virtual doctor providing clear, empathetic guidance. Use simple language and avoid citations or references."
          : "You are a medical AI assistant providing evidence-based analysis of medical documents."
      },
      {
        role: "user" as const,
        content: prompt
      }
    ];

    const response = await togetherClient.generateResponse(messages, model, {
      temperature: 0.3,
      max_tokens: 2000
    });

    return response || generateFallbackAnalysis(filename, truncatedText);

  } catch (error) {
    console.error("Together AI analysis failed:", error);
    return generateFallbackAnalysis(filename, truncatedText);
  }
}

function generateFallbackAnalysis(filename: string, text: string): string {
  const wordCount = text.split(/\s+/).length;
  const hasNumericalData = /\d+\.?\d*\s*(mg|ml|mmol|units|%|g\/dl|mg\/dl)/i.test(text);
  const medicalTerms = text.match(/\b(patient|diagnosis|treatment|medication|symptoms|blood|pressure|heart|liver|kidney|cancer|diabetes|hypertension)\b/gi) || [];

  return `# Document Analysis: ${filename}

## Document Summary
- **File:** ${filename}
- **Content Length:** ${wordCount} words
- **Medical Terms Detected:** ${medicalTerms.length} medical terms found
- **Numerical Data:** ${hasNumericalData ? 'Contains numerical medical data' : 'Limited numerical data detected'}

## Key Observations
${medicalTerms.length > 0 ? `- Medical terminology present: ${[...new Set(medicalTerms.slice(0, 10))].join(', ')}` : '- Limited medical terminology detected'}
${hasNumericalData ? '- Document appears to contain quantitative medical data (lab values, measurements, etc.)' : '- Document appears to be primarily text-based'}

## Analysis Limitations
- This is a basic text analysis as the full AI analysis service is currently unavailable
- For comprehensive medical document analysis, please ensure the AI service is properly configured
- Professional medical review is recommended for clinical decision-making

## Recommendations
- Have a qualified healthcare provider review the original document
- Consider uploading the document again when the AI analysis service is available
- For critical medical decisions, always consult with healthcare professionals`;
  }
