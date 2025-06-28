// Separate module for PDF text extraction to avoid module loading issues
import fs from 'fs';

let pdfParse: any = null;

export async function extractPDFText(filePath: string): Promise<string> {
  try {
    // Load pdf-parse only when needed
    if (!pdfParse) {
      pdfParse = (await import('pdf-parse')).default;
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return data.text?.trim() || "No text content found in PDF";
  } catch (error) {
    console.error("PDF extraction error:", error);
    
    // Try fallback text extraction from PDF binary
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const binaryText = dataBuffer.toString('binary');
      
      // Look for text streams in PDF
      const textRegex = /stream\s+([\s\S]*?)\s+endstream/g;
      const matches = binaryText.match(textRegex);
      
      if (matches && matches.length > 0) {
        let extractedText = matches
          .map(match => match.replace(/stream\s+|\s+endstream/g, ''))
          .join(' ')
          .replace(/[^\x20-\x7E\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (extractedText.length > 50) {
          return extractedText;
        }
      }
      
      // If no readable text found, return helpful message
      const fileSizeKB = Math.round(dataBuffer.length / 1024);
      return `This appears to be a PDF document (${fileSizeKB}KB). PDF text extraction is currently limited. 

For better analysis, please try:
1. Converting the PDF to a text (.txt) file
2. Copying and pasting the content into a text document
3. Using a Word document (.docx) format instead

I can still provide general medical information based on your questions about the document topic.`;
      
    } catch (fallbackError) {
      console.error("Fallback extraction also failed:", fallbackError);
      throw new Error(`Unable to process PDF file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
