import { TogetherAIClient } from "./together";
import { OpenRouterClient } from "./openrouter";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface IAIClient {
  generateResponse(
    messages: AIMessage[],
    model?: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string>;

  generateStreamingResponse(
    messages: AIMessage[],
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string>;

  checkHealth(): Promise<boolean>;
}

export class AIService implements IAIClient {
  private primaryClient: IAIClient;
  private fallbackClient: IAIClient | null;
  private useFallback: boolean = false;

  constructor(primaryClient: IAIClient, fallbackClient: IAIClient | null = null) {
    this.primaryClient = primaryClient;
    this.fallbackClient = fallbackClient;
  }

  private async withFallback<T>(
    fn: (client: IAIClient) => Promise<T>,
    operation: string
  ): Promise<T> {
    try {
      if (!this.useFallback) {
        try {
          return await fn(this.primaryClient);
        } catch (error) {
          console.error(`Primary AI client failed during ${operation}:`, error);
          if (this.fallbackClient) {
            console.log("Falling back to secondary AI client...");
            this.useFallback = true;
            return await fn(this.fallbackClient);
          }
          throw error;
        }
      } else {
        return await fn(this.fallbackClient!);
      }
    } catch (error) {
      console.error(`All AI clients failed during ${operation}:`, error);
      throw new Error(`Failed to complete ${operation} with all available AI providers`);
    }
  }

  async generateResponse(
    messages: AIMessage[],
    model?: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    return this.withFallback(
      (client) => client.generateResponse(messages, model, options),
      "generateResponse"
    );
  }

  async generateStreamingResponse(
    messages: AIMessage[],
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    return this.withFallback(
      (client) => client.generateStreamingResponse(messages, model, onChunk),
      "generateStreamingResponse"
    );
  }

  async checkHealth(): Promise<boolean> {
    if (this.useFallback && this.fallbackClient) {
      return this.fallbackClient.checkHealth();
    }
    return this.primaryClient.checkHealth();
  }

  // Factory method to create a configured AIService instance
  static createAIService(): AIService {
    const togetherAIKey = process.env.TOGETHER_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!togetherAIKey) {
      throw new Error("TOGETHER_API_KEY is required");
    }

    const togetherClient = new TogetherAIClient(togetherAIKey);
    let openRouterClient: OpenRouterClient | null = null;

    if (openRouterKey) {
      openRouterClient = new OpenRouterClient(openRouterKey);
    } else {
      console.warn(
        "OPENROUTER_API_KEY not found. Fallback to OpenRouter will not be available."
      );
    }

    return new AIService(togetherClient, openRouterClient);
  }
}

// Export a singleton instance
export const aiService = AIService.createAIService();
