import { type Message } from "@/lib/types/chat";
import { Card } from "@/components/ui/card";
import { CitationCard } from "./CitationCard";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { cn } from "@/lib/utils";
import { User, Bot, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
  mode?: 'research' | 'doctor' | 'source-finder';
  onMeshTermClick?: (term: string) => void;
  onGenerateFlashcards?: (topic: string) => void;
  onExploreResearch?: (query: string) => void;
  showReasoning?: boolean;
}

export function MessageBubble({ message, mode = 'research', onMeshTermClick, onGenerateFlashcards, onExploreResearch, showReasoning = true }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      
      <div className={cn("flex flex-col space-y-2", isUser ? "items-end" : "items-start")}>
        {/* Show reasoning steps for assistant messages before the main response */}
        {!isUser && showReasoning && message.reasoningSteps && message.reasoningSteps.length > 0 && (
          <ReasoningDisplay 
            steps={message.reasoningSteps} 
            mode={mode} 
            isVisible={true}
          />
        )}

        <Card className={cn(
          "px-4 py-3 max-w-[85%]",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 leading-relaxed text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-secondary px-1 py-0.5 rounded text-sm font-mono text-foreground">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </Card>
        
        {/* Show citations in research mode and source-finder mode */}
        {(mode === 'research' || mode === 'source-finder') && message.citations && message.citations.length > 0 && (
          <div className="space-y-2 w-full max-w-[80%]">
            {message.citations.map((citation) => (
              <CitationCard 
                key={citation.id} 
                citation={citation} 
                onMeshTermClick={onMeshTermClick}
              />
            ))}
          </div>
        )}
        
        
        <div className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
