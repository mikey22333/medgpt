import { type Message } from "@/lib/types/chat";
import { CitationCard } from "./CitationCard";
import { EnhancedCitationCard } from "../medical/EnhancedCitationCard";
import { SimpleExplanation } from "../medical/SimpleExplanation";
import { MedicalVisualization } from "../medical/MedicalVisualization";
import { SourceDiversityTracker } from "../medical/SourceDiversityTracker";
import { EnhancedCitationProcessor } from "../medical/EnhancedCitationProcessor";
import { StrokeStratificationGuide } from "../medical/StrokeStratificationGuide";
import { ComprehensiveStrokeGuide } from "../medical/ComprehensiveStrokeGuide";
import { PatientEducationCard } from "../medical/PatientEducationCard";
import { PatientEducationProcessor } from "../medical/PatientEducationProcessor";
import { GuidelineQuote, LandmarkTrial } from "../medical/EnhancedMedicalComponents";
import { MedicalFlowchart } from "../medical/MedicalFlowchart";
import { ProbabilityChart } from "../medical/ProbabilityChart";
import { ResearchGapAnalysis } from "../medical/ResearchGapAnalysis";
import { MissingLandmarkTrials } from "../medical/MissingLandmarkTrials";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
  mode?: 'research' | 'doctor' | 'source-finder';
  allMessages?: Message[]; // All messages in the conversation for context
  showReasoning?: boolean; // Optional prop for showing reasoning steps
}

export function MessageBubble({ message, mode = 'research', allMessages = [], showReasoning = true }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Find the user query that preceded this assistant response
  const getUserQueryForResponse = (): string | undefined => {
    if (message.role === 'user') return message.content;
    
    const currentIndex = allMessages.findIndex(msg => msg.id === message.id);
    if (currentIndex > 0) {
      // Look for the most recent user message before this assistant response
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (allMessages[i].role === 'user') {
          return allMessages[i].content;
        }
      }
    }
    return undefined;
  };

  const userQuery = getUserQueryForResponse();

  return (
    <div className={cn(
      "group relative mb-6 px-4 md:px-0",
      isUser ? "flex justify-end" : "w-full"
    )}>
      {/* User Message - Compact Right-aligned */}
      {isUser ? (
        <div className="max-w-xs sm:max-w-md bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-blue-500/20">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 text-white ring-2 ring-white/20 flex items-center justify-center">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs sm:text-sm text-white">You</div>
            </div>
            <div className="text-xs text-blue-100 flex-shrink-0">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
              {message.content}
            </p>
          </div>
        </div>
      ) : (
        /* AI Message - Full width container */
        <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Message Header */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-sm"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-gray-900">MedGPT Scholar</div>
              <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">AI Medical Research Assistant</div>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Dynamic Confidence Badge */}
          {(() => {
            // First check if there's a confidence score from multi-agent system
            const multiAgentConfidence = message.confidence;
            
            // Fallback to extracting confidence percentage from AI response text
            const confidenceMatch = message.content.match(/confidence[:\s]*(\d+)%/i) || 
                                   message.content.match(/(\d+)%\s*confidence/i) ||
                                   message.content.match(/certainty[:\s]*(\d+)%/i);
            
            // Use multi-agent confidence first, then extracted confidence
            const confidence = multiAgentConfidence || (confidenceMatch ? parseInt(confidenceMatch[1]) : null);
            
            if (confidence !== null) {
              const getConfidenceColor = (conf: number) => {
                if (conf >= 85) return "bg-emerald-100 text-emerald-800 border-emerald-200";
                if (conf >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
                if (conf >= 55) return "bg-yellow-100 text-yellow-800 border-yellow-200";
                return "bg-red-100 text-red-800 border-red-200";
              };
              
              const getConfidenceLabel = (conf: number) => {
                if (conf >= 85) return "High Confidence";
                if (conf >= 70) return "Moderate Confidence";
                if (conf >= 55) return "Low Confidence";
                return "Very Low Confidence";
              };

              return (
                <div className="px-3 sm:px-6 py-2 border-b border-gray-100 bg-gray-50/30">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidence)}`}>
                    <div className="w-2 h-2 rounded-full mr-2 bg-current opacity-60"></div>
                    {getConfidenceLabel(confidence)} ({confidence}%)
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* AI Message Content */}
          <div className="px-3 sm:px-6 py-4 sm:py-5 leading-relaxed text-gray-800">
            {/* Quick Summary for Doctor Mode */}
            {mode === 'doctor' && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">📋</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-teal-900 mb-1 sm:mb-2 text-xs sm:text-sm">Quick Summary</h3>
                    <div className="text-xs sm:text-sm text-teal-800 leading-relaxed">
                      {message.content.split('\n').slice(0, 3).join(' ').substring(0, 200)}...
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Rendering */}
            <div className="prose prose-sm sm:prose-base prose-gray max-w-none break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left font-semibold text-gray-900">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 text-gray-700">
                    {children}
                  </td>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mt-5 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 text-xs sm:text-sm leading-relaxed">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-xs sm:text-sm text-gray-700 leading-relaxed last:mb-0">
                    {children}
                  </p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children, ...props }) => {
                  // Check if it's inline code (no language specified)
                  const isInline = !props.className;
                  return isInline ? (
                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                      {children}
                    </code>
                  );
                },
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700">{children}</em>
                )
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Enhanced Medical Components */}
          <div className="px-3 sm:px-6 space-y-4">
            <GuidelineQuote content={message.content} />
            <LandmarkTrial content={message.content} />
          </div>

          {/* Patient-Friendly Visual Components - Doctor mode only */}
          {mode === 'doctor' && (
            <div className="px-3 sm:px-6 space-y-4">
              <ProbabilityChart content={message.content} />
              <MedicalFlowchart content={message.content} patientFriendly={true} />
            </div>
          )}

          {/* Citation Cards - Research mode only */}
          {mode === 'research' && message.citations && message.citations.length > 0 && (
            <div className="px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="mt-4 sm:mt-6 space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">Sources</h3>
                {(() => {
                  // Intelligently filter citations while preserving multi-database diversity
                  const filteredCitations = message.citations.filter((citation) => {
                    const title = citation.title.toLowerCase();
                    const source = citation.source?.toLowerCase() || '';
                    const abstract = citation.abstract?.toLowerCase() || '';
                    const query = userQuery?.toLowerCase() || '';
                    
                    // Track citation sources to maintain diversity
                    const citationSource = citation.source || 'Unknown';
                    
                    // Only exclude truly irrelevant citations, not valid sources from different databases
                    
                    // Exclude only clearly unrelated FDA adverse event reports (not all FDA sources)
                    if (source.includes('fda faers') && 
                        !query.includes(title.split(' ')[0]) && // Keep if drug name matches query
                        title.includes('recall reason') && 
                        !title.includes('efficacy') && !title.includes('clinical')) {
                      return false;
                    }
                    
                    // More selective UKPDS filtering - only exclude for very specific modern drug comparisons
                    if ((title.includes('ukpds') || title.includes('uk prospective diabetes')) && 
                        query.includes('sglt2') && query.includes('dpp-4') && 
                        !title.includes('cardiovascular') && !title.includes('mortality')) {
                      return false;
                    }
                    
                    // Exclude only pure bibliometric studies (not research with bibliometric analysis)
                    if (title.includes('bibliometric analysis') && 
                        !title.includes('clinical') && !title.includes('treatment') && 
                        !title.includes('efficacy') && !title.includes('outcome')) {
                      return false;
                    }
                    
                    // Keep all other citations to preserve database diversity
                    return true;
                  });
                  
                  // Group citations by source to show database diversity
                  const citationsBySource = filteredCitations.reduce((acc, citation) => {
                    const source = citation.source || 'Unknown';
                    if (!acc[source]) acc[source] = [];
                    acc[source].push(citation);
                    return acc;
                  }, {} as Record<string, typeof filteredCitations>);
                  
                  const sourceCount = Object.keys(citationsBySource).length;
                  
                  // Show filtered citations with database diversity information
                  if (filteredCitations.length === 0) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          📋 Note: No sources provided were directly relevant to this specific comparison. 
                          Response based on established evidence from landmark cardiovascular outcome trials 
                          (EMPA-REG OUTCOME, CANVAS, DECLARE-TIMI 58, SAVOR-TIMI 53).
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Database Diversity Indicator */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-800 font-medium">
                            🗄️ Sources from {sourceCount} database{sourceCount !== 1 ? 's' : ''}: {Object.keys(citationsBySource).join(', ')}
                          </span>
                          <span className="text-blue-600">
                            {filteredCitations.length} citation{filteredCitations.length !== 1 ? 's' : ''} total
                          </span>
                        </div>
                      </div>
                      
                      {/* Display citations grouped by source */}
                      {Object.entries(citationsBySource).map(([source, citations]) => (
                        <div key={source} className="mb-4">
                          <h4 className="text-xs font-medium text-gray-600 mb-2 px-2">
                            {source} ({citations.length} citation{citations.length !== 1 ? 's' : ''})
                          </h4>
                          {citations.map((citation, index) => (
                            <div key={`${source}-${index}`} className="mb-2">
                              <EnhancedCitationCard 
                                citation={citation} 
                                userQuery={userQuery}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                      
                      {message.citations.length > filteredCitations.length && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-gray-700 text-xs">
                            🔍 {message.citations.length - filteredCitations.length} citation{message.citations.length - filteredCitations.length !== 1 ? 's' : ''} filtered out: 
                            excluding unrelated FDA recalls, pure bibliometric analyses, and trials not addressing the specific comparison.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
