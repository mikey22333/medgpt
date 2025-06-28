import { type Message, type Citation } from "@/lib/types/chat";
import jsPDF from "jspdf";

export interface ExportData {
  conversation?: Message[];
  citations?: Citation[];
  query?: string;
  response?: string;
  timestamp?: Date;
}

export class ExportUtils {
  static async exportToPDF(data: ExportData, title: string = "MedGPT Scholar Export"): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Add title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, currentY);
      currentY += 15;

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const timestamp = data.timestamp || new Date();
      pdf.text(`Generated: ${timestamp.toLocaleString()}`, margin, currentY);
      currentY += 10;

      // Add disclaimer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const disclaimer = "MEDICAL DISCLAIMER: This information is for educational purposes only. Always consult healthcare professionals for medical advice.";
      const disclaimerLines = pdf.splitTextToSize(disclaimer, maxWidth);
      pdf.text(disclaimerLines, margin, currentY);
      currentY += disclaimerLines.length * 4 + 10;

      pdf.setTextColor(0, 0, 0);

      // Add conversation if available
      if (data.conversation && data.conversation.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Conversation", margin, currentY);
        currentY += 10;

        for (const message of data.conversation) {
          // Check if we need a new page
          if (currentY > pdf.internal.pageSize.height - 40) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          const role = message.role === "user" ? "User:" : "Assistant:";
          pdf.text(role, margin, currentY);
          currentY += 6;

          pdf.setFont("helvetica", "normal");
          const messageLines = pdf.splitTextToSize(message.content, maxWidth);
          pdf.text(messageLines, margin, currentY);
          currentY += messageLines.length * 4 + 8;
        }
      }

      // Add single query/response if available
      if (data.query && data.response) {
        if (currentY > pdf.internal.pageSize.height - 60) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Query:", margin, currentY);
        currentY += 8;

        pdf.setFont("helvetica", "normal");
        const queryLines = pdf.splitTextToSize(data.query, maxWidth);
        pdf.text(queryLines, margin, currentY);
        currentY += queryLines.length * 4 + 10;

        pdf.setFont("helvetica", "bold");
        pdf.text("Response:", margin, currentY);
        currentY += 8;

        pdf.setFont("helvetica", "normal");
        const responseLines = pdf.splitTextToSize(data.response, maxWidth);
        pdf.text(responseLines, margin, currentY);
        currentY += responseLines.length * 4 + 10;
      }

      // Add citations if available
      if (data.citations && data.citations.length > 0) {
        if (currentY > pdf.internal.pageSize.height - 60) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Citations", margin, currentY);
        currentY += 10;

        for (let i = 0; i < data.citations.length; i++) {
          const citation = data.citations[i];
          
          // Check if we need a new page
          if (currentY > pdf.internal.pageSize.height - 80) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(`[${i + 1}] ${citation.title}`, margin, currentY);
          currentY += 6;

          pdf.setFont("helvetica", "normal");
          if (citation.authors) {
            pdf.text(`Authors: ${citation.authors}`, margin, currentY);
            currentY += 5;
          }

          if (citation.journal) {
            pdf.text(`Journal: ${citation.journal}`, margin, currentY);
            currentY += 5;
          }

          if (citation.year) {
            pdf.text(`Year: ${citation.year}`, margin, currentY);
            currentY += 5;
          }

          if (citation.doi) {
            pdf.text(`DOI: ${citation.doi}`, margin, currentY);
            currentY += 5;
          }

          if (citation.url) {
            pdf.text(`URL: ${citation.url}`, margin, currentY);
            currentY += 5;
          }

          if (citation.studyType) {
            pdf.text(`Study Type: ${citation.studyType}`, margin, currentY);
            currentY += 5;
          }

          if (citation.evidenceLevel) {
            pdf.text(`Evidence Level: ${citation.evidenceLevel}`, margin, currentY);
            currentY += 5;
          }

          if (citation.confidenceScore) {
            pdf.text(`Confidence Score: ${citation.confidenceScore}%`, margin, currentY);
            currentY += 5;
          }

          if (citation.meshTerms && citation.meshTerms.length > 0) {
            pdf.text(`MeSH Terms: ${citation.meshTerms.join(", ")}`, margin, currentY);
            currentY += 5;
          }

          currentY += 8; // Space between citations
        }
      }

      // Save the PDF
      const filename = `medgpt-scholar-${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      throw new Error("Failed to export PDF");
    }
  }

  static exportToText(data: ExportData): string {
    let text = "MedGPT Scholar Export\n";
    text += "=".repeat(50) + "\n\n";
    
    const timestamp = data.timestamp || new Date();
    text += `Generated: ${timestamp.toLocaleString()}\n\n`;

    text += "MEDICAL DISCLAIMER: This information is for educational purposes only. ";
    text += "Always consult healthcare professionals for medical advice.\n\n";

    // Add conversation
    if (data.conversation && data.conversation.length > 0) {
      text += "CONVERSATION\n";
      text += "-".repeat(20) + "\n\n";

      for (const message of data.conversation) {
        text += `${message.role.toUpperCase()}: ${message.content}\n\n`;
      }
    }

    // Add single query/response
    if (data.query && data.response) {
      text += "QUERY: " + data.query + "\n\n";
      text += "RESPONSE: " + data.response + "\n\n";
    }

    // Add citations
    if (data.citations && data.citations.length > 0) {
      text += "CITATIONS\n";
      text += "-".repeat(20) + "\n\n";

      data.citations.forEach((citation, index) => {
        text += `[${index + 1}] ${citation.title}\n`;
        if (citation.authors) text += `Authors: ${citation.authors}\n`;
        if (citation.journal) text += `Journal: ${citation.journal}\n`;
        if (citation.year) text += `Year: ${citation.year}\n`;
        if (citation.doi) text += `DOI: ${citation.doi}\n`;
        if (citation.url) text += `URL: ${citation.url}\n`;
        if (citation.studyType) text += `Study Type: ${citation.studyType}\n`;
        if (citation.evidenceLevel) text += `Evidence Level: ${citation.evidenceLevel}\n`;
        if (citation.confidenceScore) text += `Confidence Score: ${citation.confidenceScore}%\n`;
        if (citation.meshTerms && citation.meshTerms.length > 0) {
          text += `MeSH Terms: ${citation.meshTerms.join(", ")}\n`;
        }
        text += "\n";
      });
    }

    return text;
  }

  static downloadTextFile(content: string, filename: string = `medgpt-scholar-${Date.now()}.txt`): void {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(content: string): Promise<void> {
    return navigator.clipboard.writeText(content);
  }
}
