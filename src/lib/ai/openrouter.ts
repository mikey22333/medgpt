interface OpenRouterRequest {
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

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
  }

  async generateResponse(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
    model: string = "meta-llama/llama-3-70b-instruct",
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    try {
      const requestData: OpenRouterRequest = {
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
          "HTTP-Referer": "https://medgpt-scholar.vercel.app",
          "X-Title": "MedGPT Scholar",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response generated from OpenRouter");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating response with OpenRouter:", error);
      throw new Error("Failed to generate AI response with OpenRouter");
    }
  }

  async generateStreamingResponse(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
    model: string = "meta-llama/llama-3-70b-instruct",
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const requestData: OpenRouterRequest = {
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
          "HTTP-Referer": "https://medgpt-scholar.vercel.app",
          "X-Title": "MedGPT Scholar",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
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
      console.error("Error with OpenRouter streaming response:", error);
      throw new Error("Failed to generate streaming AI response with OpenRouter");
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
      console.error("OpenRouter health check failed:", error);
      return false;
    }
  }
}
