import { type Message } from "@/lib/types/chat";
import { CitationCard } from "./CitationCard";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
  mode?: 'research' | 'doctor' | 'source-finder';
}

export function MessageBubble({ message, mode = 'research' }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {message.role === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 mb-1">
          {message.role === 'user' ? 'You' : 'MedGPT Scholar'}
        </div>
        <div className="text-gray-800 leading-relaxed break-words chat-content">
          {message.role === 'user' ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-medium mb-2">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                table: ({ children }) => <table className="w-full border-collapse border border-gray-300 mb-3">{children}</table>,
                th: ({ children }) => <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold text-left">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
                a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        {/* Citations for research mode */}
        {(mode === 'research' || mode === 'source-finder') && message.citations && message.citations.length > 0 && (
          <div className="space-y-2 mt-3">
            {message.citations.map((citation, index) => (
              <CitationCard 
                key={citation.id || citation.pmid || citation.doi || `citation-${index}`} 
                citation={citation}
              />
            ))}
          </div>
        )}
        
        {/* Confidence indicator */}
        {message.confidence && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>Confidence: {message.confidence}%</span>
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  message.confidence > 80 ? 'bg-green-500' : 
                  message.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${message.confidence}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
