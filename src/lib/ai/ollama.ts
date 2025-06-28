interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async generateResponse(
    prompt: string,
    model: string = "llama3.1",
    options?: {
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    try {
      const requestData: OllamaRequest = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          top_p: 0.9,
          max_tokens: options?.max_tokens || 2000,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error generating response with Ollama:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  async generateStreamingResponse(
    prompt: string,
    model: string = "llama3.1",
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const requestData: OllamaRequest = {
        model,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line);
            fullResponse += data.response;
            
            if (onChunk) {
              onChunk(data.response);
            }

            if (data.done) {
              return fullResponse;
            }
          } catch {
            // Skip invalid JSON lines
            continue;
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Error with streaming response:", error);
      throw new Error("Failed to generate streaming AI response");
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Ollama health check failed:", error);
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }

  async pullModel(model: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: model }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Note: This is a simplified version
      // In production, you'd want to handle the streaming response for pull progress
    } catch (error) {
      console.error("Error pulling model:", error);
      throw new Error("Failed to pull model");
    }
  }

  async generateSourceFinderResponse(
    textSnippet: string,
    searchResults: any[],
    conversationHistory: any[] = [],
    model: string = "llama3.1"
  ): Promise<{ content: string; citations: any[] }> {
    try {
      const prompt = this.buildSourceFinderPrompt(textSnippet, searchResults, conversationHistory);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more precise source finding
            top_p: 0.8,
            num_ctx: 4096,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse the response to extract content and citations
      const content = data.response || "I couldn't find matching sources for this text snippet.";
      const citations = this.extractCitationsFromResults(searchResults);

      return { content, citations };
    } catch (error) {
      console.error("Error generating source finder response:", error);
      throw new Error("Failed to generate source analysis");
    }
  }

  private buildSourceFinderPrompt(
    textSnippet: string,
    searchResults: any[],
    conversationHistory: any[] = []
  ): string {
    const context = conversationHistory.length > 0 
      ? `Previous conversation context:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
      : '';

    const sourcesSection = searchResults.length > 0 
      ? `Found potential sources:\n${searchResults.map((result, index) => 
          `${index + 1}. Title: "${result.title || 'Unknown'}"\n   Authors: ${result.authors?.join?.(', ') || result.authorString || 'Unknown'}\n   Journal: ${result.journal || result.venue || 'Unknown'}\n   Year: ${result.publishedDate?.split('-')[0] || result.year || 'Unknown'}\n   Source: ${result.source}\n   Abstract: ${(result.abstract || '').substring(0, 200)}...\n`
        ).join('\n')}`
      : 'No potential sources found in the databases.';

    return `${context}You are a medical source verification expert. A user has provided a text snippet from what appears to be a medical/scientific article, and I've searched multiple research databases for potential sources.

Text snippet to analyze:
"${textSnippet}"

${sourcesSection}

Please provide a comprehensive source analysis that includes:

1. **Most Likely Sources**: Identify which of the found papers (if any) could be the original source of this text
2. **Confidence Assessment**: Rate your confidence (High/Medium/Low) in each potential match
3. **Key Claims Analysis**: Extract and list the main medical/scientific claims from the text
4. **Verification Strategy**: Suggest specific steps to verify this information
5. **Source Quality Assessment**: Evaluate the reliability of potential sources
6. **Alternative Sources**: Recommend additional search strategies if no good matches were found

Format your response clearly with headers and provide specific, actionable guidance for verifying the information.`;
  }

  private extractCitationsFromResults(searchResults: any[]): any[] {
    return searchResults.slice(0, 5).map((result, index) => ({
      id: `source-${index + 1}`,
      title: result.title,
      authors: result.authors?.slice(0, 3) || [],
      journal: result.journal || result.venue || 'Unknown Journal',
      publishedDate: result.publishedDate || result.year?.toString() || 'Unknown Date',
      doi: result.doi,
      url: result.url,
      source: result.source,
      relevanceScore: result.relevanceScore || 0,
      abstract: result.abstract ? result.abstract.substring(0, 300) + '...' : '',
      confidenceScore: Math.min(95, Math.max(60, (result.relevanceScore || 0) * 10 + 60)),
      evidenceLevel: result.relevanceScore > 8 ? 'High' : result.relevanceScore > 5 ? 'Moderate' : 'Low'
    }));
  }
}
