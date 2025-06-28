"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Calendar, Users, FileText, ExternalLink, Filter } from "lucide-react";

interface ClinicalTrial {
  id: string;
  title: string;
  status: string;
  phase: string;
  condition: string;
  intervention: string;
  sponsor: string;
  location: string;
  enrollmentCount: number;
  startDate: string;
  completionDate?: string;
  studyType: string;
  url: string;
  summary: string;
}

interface ResearchExplorerProps {
  onClose: () => void;
  initialQuery?: string;
}

export function ResearchExplorer({ onClose, initialQuery }: ResearchExplorerProps) {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    phase: "all",
    studyType: "all"
  });

  useEffect(() => {
    if (initialQuery) {
      searchTrials(initialQuery);
    } else {
      loadSampleTrials();
    }
  }, [initialQuery]);

  const searchTrials = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/research/clinical-trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters })
      });

      if (response.ok) {
        const data = await response.json();
        setTrials(data.trials);
      }
    } catch (error) {
      console.error('Failed to search trials:', error);
      loadSampleTrials();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleTrials = () => {
    const sampleTrials: ClinicalTrial[] = [
      {
        id: "NCT05123456",
        title: "Phase 3 Study of Novel ACE Inhibitor in Heart Failure Patients",
        status: "Recruiting",
        phase: "Phase 3",
        condition: "Heart Failure",
        intervention: "ACE-X Inhibitor vs Placebo",
        sponsor: "CardioTech Pharmaceuticals",
        location: "Multi-center (US, EU)",
        enrollmentCount: 2400,
        startDate: "2024-01-15",
        completionDate: "2026-12-31",
        studyType: "Interventional",
        url: "https://clinicaltrials.gov/ct2/show/NCT05123456",
        summary: "A randomized, double-blind, placebo-controlled study evaluating the efficacy and safety of ACE-X inhibitor in patients with heart failure with reduced ejection fraction."
      },
      {
        id: "NCT05789012",
        title: "Digital Therapeutic for Diabetes Self-Management",
        status: "Active, not recruiting",
        phase: "N/A",
        condition: "Type 2 Diabetes",
        intervention: "Mobile App + Standard Care vs Standard Care",
        sponsor: "DigitalHealth Inc",
        location: "Virtual/Remote",
        enrollmentCount: 800,
        startDate: "2023-06-01",
        completionDate: "2024-08-31",
        studyType: "Interventional",
        url: "https://clinicaltrials.gov/ct2/show/NCT05789012",
        summary: "Evaluating the effectiveness of a AI-powered mobile application for improving glycemic control in patients with type 2 diabetes."
      },
      {
        id: "NCT05456789",
        title: "Biomarker Study in Early Alzheimer's Disease",
        status: "Completed",
        phase: "N/A",
        condition: "Alzheimer's Disease",
        intervention: "Observational",
        sponsor: "NeuroResearch Institute",
        location: "10 US Centers",
        enrollmentCount: 1200,
        startDate: "2021-03-01",
        completionDate: "2023-12-15",
        studyType: "Observational",
        url: "https://clinicaltrials.gov/ct2/show/NCT05456789",
        summary: "Longitudinal study identifying blood and CSF biomarkers for early detection of Alzheimer's disease in cognitively normal individuals."
      }
    ];
    setTrials(sampleTrials);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTrials(searchQuery);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recruiting': return 'bg-green-100 text-green-800';
      case 'Active, not recruiting': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800';
      case 'Terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Phase 1': return 'bg-orange-100 text-orange-800';
      case 'Phase 2': return 'bg-yellow-100 text-yellow-800';
      case 'Phase 3': return 'bg-blue-100 text-blue-800';
      case 'Phase 4': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <h2 className="text-xl font-bold">Research Study Explorer</h2>
            </div>
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinical trials (e.g., 'heart failure', 'diabetes', 'cancer')"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Filters */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={filters.status} 
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="all">All Status</option>
                <option value="recruiting">Recruiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={filters.phase} 
                onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="all">All Phases</option>
                <option value="phase1">Phase 1</option>
                <option value="phase2">Phase 2</option>
                <option value="phase3">Phase 3</option>
                <option value="phase4">Phase 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Searching clinical trials...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trials.map((trial) => (
                  <Card key={trial.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{trial.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trial.status)}`}>
                            {trial.status}
                          </span>
                          {trial.phase !== "N/A" && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(trial.phase)}`}>
                              {trial.phase}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {trial.studyType}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={trial.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Condition:</span>
                          <span>{trial.condition}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Intervention:</span>
                          <span>{trial.intervention}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Location:</span>
                          <span>{trial.location}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Enrollment:</span>
                          <span>{trial.enrollmentCount.toLocaleString()} participants</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Start Date:</span>
                          <span>{new Date(trial.startDate).toLocaleDateString()}</span>
                        </div>
                        {trial.completionDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Completion:</span>
                            <span>{new Date(trial.completionDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{trial.summary}</p>
                    
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Sponsor:</span> {trial.sponsor} | 
                      <span className="font-medium"> ID:</span> {trial.id}
                    </div>
                  </Card>
                ))}

                {trials.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No clinical trials found. Try a different search term.</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
