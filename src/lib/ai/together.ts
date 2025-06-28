interface TogetherAIRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface TogetherAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class TogetherAIClient {
  private apiKey: string;
  private baseUrl: string = "https://api.together.xyz/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Together AI API key is required");
    }
    this.apiKey = apiKey;
  }

  async generateResponse(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
    model: string = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    try {
      const requestData: TogetherAIRequest = {
        model,
        messages,
        max_tokens: options?.max_tokens || 2000,
        temperature: options?.temperature || 0.7,
        top_p: 0.9,
        stream: false,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: TogetherAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response generated from Together AI");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating response with Together AI:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  async generateStreamingResponse(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
    model: string = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const requestData: TogetherAIRequest = {
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        stream: true,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`);
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
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") {
              return fullResponse;
            }

            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
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
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Together AI health check failed:", error);
      return false;
    }
  }

  async listModels(): Promise<Array<{ id: string; object: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }

  // Helper method to convert simple prompt to messages format
  promptToMessages(prompt: string): Array<{ role: "system" | "user"; content: string }> {
    return [
      {
        role: "user",
        content: prompt
      }
    ];
  }

  async generateSourceFinderResponse(
    textSnippet: string,
    searchResults: any[],
    conversationHistory: any[] = []
  ): Promise<{ content: string; citations: any[] }> {
    try {
      const { createSourceFinderPrompt } = await import("./prompts");
      
      const prompt = createSourceFinderPrompt({
        textSnippet,
        searchResults,
        conversationHistory
      });

      const messages = [
        {
          role: "user" as const,
          content: prompt
        }
      ];

      const response = await this.generateResponse(
        messages,
        "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        {
          temperature: 0.3, // Lower temperature for more precise analysis
          max_tokens: 2000
        }
      );

      // Convert search results to comprehensive citation format
      const citations = searchResults.slice(0, 10).map((result, index) => ({
        id: `source-${index}`,
        title: result.title || "Unknown Title",
        authors: result.authors || ["Unknown Author"],
        journal: result.journal || result.venue || "Unknown Journal",
        year: result.year || (result.publishedDate ? new Date(result.publishedDate).getFullYear() : undefined),
        pmid: result.pmid || undefined,
        doi: result.doi || undefined,
        url: result.url || (result.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/` : undefined),
        abstract: result.abstract || "No abstract available",
        relevanceScore: result.relevanceScore || 50,
        confidenceScore: Math.min(95, Math.max(30, (result.relevanceScore || 30) * 8)), // Better scaling
        evidenceLevel: result.relevanceScore > 5 ? "High" : result.relevanceScore > 2 ? "Moderate" : "Low",
        source: result.source || "Unknown Source",
        searchTerm: result.searchTerm || "Unknown"
      }));

      return {
        content: response,
        citations: citations
      };

    } catch (error) {
      console.error("Error generating source finder response:", error);
      throw new Error("Failed to generate source analysis");
    }
  }
}
