"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lightbulb,
  Activity
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  confidence: number;
  status: 'analyzing' | 'complete' | 'updating';
  insight: string;
}

interface BiasAlert {
  type: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  impact: string;
}

interface InteractiveElement {
  type: 'question' | 'clarification' | 'alternative_view' | 'bias_alert' | 'confidence_drill_down';
  content: string;
  options?: string[];
  followUpQueries?: string[];
}

interface ReasoningUpdate {
  id: string;
  timestamp: Date;
  type: 'evidence_update' | 'confidence_change' | 'bias_detection' | 'agent_insight' | 'synthesis_update';
  content: string;
  impact: 'low' | 'moderate' | 'high';
  relatedAgents: string[];
}

interface InteractiveIntelligenceProps {
  agents: Agent[];
  biasAlerts: BiasAlert[];
  interactiveElements: InteractiveElement[];
  updates: ReasoningUpdate[];
  overallConfidence: number;
  onUserInteraction: (type: string, content: string) => void;
  isVisible: boolean;
}

export function InteractiveIntelligence({
  agents,
  biasAlerts,
  interactiveElements,
  updates,
  overallConfidence,
  onUserInteraction,
  isVisible
}: InteractiveIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'biases' | 'interactions' | 'live'>('agents');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showLiveUpdates, setShowLiveUpdates] = useState(true);

  if (!isVisible) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600 bg-green-50 border-green-200";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getImpactColor = (impact: 'low' | 'moderate' | 'high') => {
    switch (impact) {
      case 'high': return "text-red-600 bg-red-50";
      case 'moderate': return "text-yellow-600 bg-yellow-50";
      case 'low': return "text-blue-600 bg-blue-50";
    }
  };

  const getSeverityColor = (severity: 'low' | 'moderate' | 'high') => {
    switch (severity) {
      case 'high': return "text-red-600 bg-red-100";
      case 'moderate': return "text-yellow-600 bg-yellow-100";
      case 'low': return "text-green-600 bg-green-100";
    }
  };

  const getStatusIcon = (status: 'analyzing' | 'complete' | 'updating') => {
    switch (status) {
      case 'analyzing': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'updating': return <TrendingUp className="h-4 w-4 text-orange-500 animate-bounce" />;
    }
  };

  const recentUpdates = updates.slice(-5).reverse();

  return (
    <Card className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-purple-600" />
        <span className="text-lg font-semibold text-purple-800">
          🤖 Interactive Multi-Agent Intelligence
        </span>
        <Badge className={`ml-auto ${getConfidenceColor(overallConfidence)}`}>
          {overallConfidence}% Overall Confidence
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg border">
        <Button
          variant={activeTab === 'agents' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('agents')}
          className="flex items-center gap-1 text-xs"
        >
          <Users className="h-3 w-3" />
          Agents ({agents.length})
        </Button>
        <Button
          variant={activeTab === 'biases' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('biases')}
          className="flex items-center gap-1 text-xs"
        >
          <AlertTriangle className="h-3 w-3" />
          Biases ({biasAlerts.length})
        </Button>
        <Button
          variant={activeTab === 'interactions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('interactions')}
          className="flex items-center gap-1 text-xs"
        >
          <MessageSquare className="h-3 w-3" />
          Interactions ({interactiveElements.length})
        </Button>
        <Button
          variant={activeTab === 'live' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('live')}
          className="flex items-center gap-1 text-xs"
        >
          <Activity className="h-3 w-3" />
          Live ({recentUpdates.length})
        </Button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-2">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className={`bg-white rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedAgent === agent.id ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <span className="font-medium text-gray-800">{agent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.role}
                    </Badge>
                  </div>
                  <Badge className={`text-xs ${getConfidenceColor(agent.confidence)}`}>
                    {agent.confidence}%
                  </Badge>
                </div>
                
                {selectedAgent === agent.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <strong>Agent Insight:</strong>
                    <p className="mt-1 text-gray-700">{agent.insight}</p>
                    <div className="mt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserInteraction('agent_query', `Tell me more about ${agent.name}'s analysis`);
                        }}
                      >
                        Ask for Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserInteraction('agent_challenge', `I disagree with ${agent.name}'s assessment`);
                        }}
                      >
                        Challenge View
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Biases Tab */}
        {activeTab === 'biases' && (
          <div className="space-y-2">
            {biasAlerts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No significant biases detected</p>
              </div>
            ) : (
              biasAlerts.map((bias, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-gray-800">{bias.type} Bias</span>
                    <Badge className={`text-xs ${getSeverityColor(bias.severity)}`}>
                      {bias.severity} severity
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{bias.description}</p>
                  <p className="text-xs text-gray-600 mb-3">
                    <strong>Impact:</strong> {bias.impact}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUserInteraction('bias_mitigation', `How can I mitigate ${bias.type} bias?`)}
                    >
                      Show Mitigation
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUserInteraction('bias_ignore', `This ${bias.type} bias seems acceptable`)}
                    >
                      Accept Risk
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-2">
            {interactiveElements.map((element, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  {element.type === 'question' && <HelpCircle className="h-4 w-4 text-blue-500" />}
                  {element.type === 'clarification' && <MessageSquare className="h-4 w-4 text-green-500" />}
                  {element.type === 'alternative_view' && <Eye className="h-4 w-4 text-purple-500" />}
                  {element.type === 'bias_alert' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {element.type === 'confidence_drill_down' && <TrendingUp className="h-4 w-4 text-red-500" />}
                  
                  <span className="font-medium text-gray-800 capitalize">
                    {element.type.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{element.content}</p>
                
                {element.options && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {element.options.map((option, optIndex) => (
                      <Button 
                        key={optIndex}
                        size="sm" 
                        variant="outline"
                        onClick={() => onUserInteraction('option_select', option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                
                {element.followUpQueries && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-2">Quick follow-ups:</p>
                    <div className="flex flex-wrap gap-1">
                      {element.followUpQueries.map((query, queryIndex) => (
                        <Button 
                          key={queryIndex}
                          size="sm" 
                          variant="ghost"
                          className="text-xs h-6"
                          onClick={() => onUserInteraction('follow_up', query)}
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Live Updates Tab */}
        {activeTab === 'live' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Real-time Reasoning Updates</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowLiveUpdates(!showLiveUpdates)}
                className="text-xs"
              >
                {showLiveUpdates ? 'Pause' : 'Resume'} Updates
              </Button>
            </div>
            
            {recentUpdates.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p>No recent updates</p>
              </div>
            ) : (
              recentUpdates.map((update) => (
                <div 
                  key={update.id} 
                  className={`bg-white rounded-lg border-l-4 p-3 ${
                    update.impact === 'high' ? 'border-l-red-400' :
                    update.impact === 'moderate' ? 'border-l-yellow-400' : 'border-l-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {update.type.replace('_', ' ')}
                    </Badge>
                    <Badge className={`text-xs ${getImpactColor(update.impact)}`}>
                      {update.impact} impact
                    </Badge>
                    <span className="text-xs text-gray-500 ml-auto">
                      {update.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700">{update.content}</p>
                  
                  {update.relatedAgents.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-gray-600">Agents:</span>
                      {update.relatedAgents.map((agentId, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {agentId.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onUserInteraction('explain_reasoning', 'Explain your reasoning process')}
          >
            Explain Reasoning
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onUserInteraction('alternative_view', 'Show me alternative perspectives')}
          >
            Alternative Views
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onUserInteraction('challenge_assumptions', 'Challenge your assumptions')}
          >
            Challenge AI
          </Button>
        </div>
      </div>
    </Card>
  );
}
