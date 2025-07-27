"use client";

import React from 'react';
import { MessagePieChart, extractCitationSourceData, extractStudyTypeData, extractEvidenceLevelData } from "@/components/chat/MessagePieChart";

// Mock citation data for testing
const mockCitations = [
  {
    id: "1",
    title: "Effect of metformin on diabetes",
    source: "PubMed",
    studyType: "RCT",
    evidenceLevel: "High"
  },
  {
    id: "2", 
    title: "Diabetes management guidelines",
    source: "PubMed",
    studyType: "Guideline",
    evidenceLevel: "High"
  },
  {
    id: "3",
    title: "Meta-analysis of diabetes treatments",
    source: "Semantic Scholar",
    studyType: "Meta-Analysis", 
    evidenceLevel: "High"
  },
  {
    id: "4",
    title: "Observational study of diabetic patients",
    source: "Europe PMC",
    studyType: "Observational",
    evidenceLevel: "Moderate"
  },
  {
    id: "5",
    title: "CrossRef diabetes research",
    source: "CrossRef",
    studyType: "Review",
    evidenceLevel: "Moderate"
  },
  {
    id: "6",
    title: "FDA diabetes drug information",
    source: "FDA",
    studyType: "Guideline",
    evidenceLevel: "High"
  }
];

export default function PieChartTest() {
  const sourceData = extractCitationSourceData(mockCitations);
  const studyData = extractStudyTypeData(mockCitations);
  const evidenceData = extractEvidenceLevelData(mockCitations);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Pie Chart Visualization Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagePieChart
          title="Citation Sources"
          subtitle={`${mockCitations.length} total citations`}
          data={sourceData}
          size="medium"
          showLegend={true}
        />
        
        <MessagePieChart
          title="Study Types"
          subtitle="Evidence hierarchy"
          data={studyData}
          size="medium"
          showLegend={true}
        />
        
        <MessagePieChart
          title="Evidence Quality"
          subtitle="Strength of evidence"
          data={evidenceData}
          size="medium"
          showLegend={true}
          className="lg:col-span-2"
        />
      </div>
      
      <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Mock Data Used:</h2>
        <pre className="text-sm text-gray-600 overflow-x-auto">
          {JSON.stringify(mockCitations, null, 2)}
        </pre>
      </div>
    </div>
  );
}
