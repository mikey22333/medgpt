"use client";

import React from 'react';
import { MessageBubble } from "@/components/chat/MessageBubble";
import { type Message } from "@/lib/types/chat";

// Mock message with comprehensive citation data
const mockMessage: Message = {
  id: "test-message-1",
  role: "assistant",
  content: `# Diabetes Treatment Analysis

Based on my analysis of the research, **metformin shows high effectiveness** for type 2 diabetes management. The evidence demonstrates **strong confidence** in its efficacy, with **moderate evidence** supporting its cardiovascular benefits.

## Key Findings:
- **Effective** glycemic control in 85% of patients
- **Moderate** weight loss effects observed
- **Some improvement** in cardiovascular outcomes
- **Adverse effects** reported in 15% of patients (mainly GI symptoms)

The research shows **high confidence** in metformin's primary effects, with **moderate confidence** regarding long-term benefits. Some studies show **uncertain** results for specific subgroups.

## Treatment Recommendations:
- First-line therapy for type 2 diabetes
- Consider combination therapy for better outcomes
- Monitor for adverse effects during initiation`,
  timestamp: new Date(),
  citations: [
    {
      id: "1",
      title: "Efficacy and safety of metformin in type 2 diabetes: systematic review and meta-analysis",
      authors: ["Smith J", "Johnson M", "Brown K"],
      journal: "New England Journal of Medicine",
      year: "2023",
      pmid: "12345678",
      doi: "10.1056/NEJMoa123456",
      url: "https://pubmed.ncbi.nlm.nih.gov/12345678/",
      abstract: "This systematic review and meta-analysis evaluated the efficacy and safety of metformin...",
      studyType: "Meta-Analysis",
      confidenceScore: 95,
      evidenceLevel: "High",
      source: "PubMed",
      meshTerms: ["Metformin", "Diabetes Mellitus", "Type 2"],
      relevanceScore: 0.95,
      relevanceCategory: "Highly Relevant"
    },
    {
      id: "2",
      title: "American Diabetes Association Guidelines for Metformin Use",
      authors: ["ADA Committee"],
      journal: "Diabetes Care",
      year: "2023", 
      doi: "10.2337/dc23-0001",
      url: "https://care.diabetesjournals.org/content/46/Supplement_1/S1",
      abstract: "Clinical practice guidelines for the use of metformin in diabetes management...",
      studyType: "Guideline",
      confidenceScore: 90,
      evidenceLevel: "High",
      source: "PubMed",
      isGuideline: true,
      guidelineOrg: "Other",
      relevanceScore: 0.88,
      relevanceCategory: "Highly Relevant"
    },
    {
      id: "3",
      title: "Long-term effects of metformin on cardiovascular outcomes: randomized controlled trial",
      authors: ["Wilson P", "Davis L", "Miller R"],
      journal: "Circulation",
      year: "2022",
      pmid: "23456789",
      doi: "10.1161/CIRCULATIONAHA.122.059999",
      url: "https://pubmed.ncbi.nlm.nih.gov/23456789/",
      abstract: "A randomized controlled trial examining cardiovascular outcomes with metformin...",
      studyType: "RCT",
      confidenceScore: 88,
      evidenceLevel: "High",
      source: "PubMed",
      meshTerms: ["Metformin", "Cardiovascular Disease"],
      relevanceScore: 0.82,
      relevanceCategory: "Highly Relevant"
    },
    {
      id: "4",
      title: "Metformin therapy in diabetes: real-world evidence from electronic health records",
      authors: ["Thompson A", "Clark B"],
      journal: "Journal of Clinical Medicine",
      year: "2022",
      doi: "10.3390/jcm11154567",
      url: "https://www.mdpi.com/2077-0383/11/15/4567",
      abstract: "Analysis of real-world metformin use patterns and outcomes...",
      studyType: "Observational",
      confidenceScore: 75,
      evidenceLevel: "Moderate",
      source: "Semantic Scholar",
      relevanceScore: 0.78,
      relevanceCategory: "Moderately Relevant"
    },
    {
      id: "5",
      title: "European consensus on metformin use in type 2 diabetes",
      authors: ["European Diabetes Society"],
      journal: "Diabetologia", 
      year: "2023",
      doi: "10.1007/s00125-023-05678-9",
      url: "https://link.springer.com/article/10.1007/s00125-023-05678-9",
      abstract: "European consensus statement on metformin therapy...",
      studyType: "Guideline",
      confidenceScore: 85,
      evidenceLevel: "High",
      source: "Europe PMC",
      isGuideline: true,
      guidelineOrg: "Other",
      relevanceScore: 0.85,
      relevanceCategory: "Highly Relevant"
    },
    {
      id: "6", 
      title: "Comparative effectiveness of metformin vs other antidiabetic drugs: network meta-analysis",
      authors: ["Anderson K", "White S", "Garcia M"],
      journal: "Diabetes Research and Clinical Practice",
      year: "2023",
      doi: "10.1016/j.diabres.2023.110123",
      url: "https://www.sciencedirect.com/science/article/pii/S0168822723001234",
      abstract: "Network meta-analysis comparing effectiveness of different antidiabetic medications...",
      studyType: "Meta-Analysis",
      confidenceScore: 92,
      evidenceLevel: "High", 
      source: "CrossRef",
      relevanceScore: 0.89,
      relevanceCategory: "Highly Relevant"
    },
    {
      id: "7",
      title: "FDA drug safety communication: metformin labeling changes",
      authors: ["FDA"],
      journal: "FDA Safety Communication",
      year: "2023",
      url: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-metformin",
      abstract: "FDA safety update on metformin prescribing information...",
      studyType: "FDA Label",
      confidenceScore: 88,
      evidenceLevel: "High",
      source: "FDA Drug Labels",
      relevanceScore: 0.72,
      relevanceCategory: "Moderately Relevant"
    },
    {
      id: "8",
      title: "Patient experiences with metformin therapy: qualitative analysis",
      authors: ["Lee J", "Kim H"],
      journal: "Patient Preference and Adherence", 
      year: "2022",
      doi: "10.2147/PPA.S345678",
      url: "https://www.dovepress.com/patient-experiences-with-metformin-therapy-qualitative-analysis-peer-reviewed-fulltext-article-PPA",
      abstract: "Qualitative study of patient experiences and preferences with metformin...",
      studyType: "Observational",
      confidenceScore: 65,
      evidenceLevel: "Moderate",
      source: "OpenAlex",
      relevanceScore: 0.68,
      relevanceCategory: "Moderately Relevant"
    }
  ]
};

export default function MessageBubbleWithPieCharts() {
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Message Bubble with Pie Chart Visualizations</h1>
        
        <MessageBubble 
          message={mockMessage}
          mode="research"
          allMessages={[mockMessage]}
          showReasoning={true}
        />
        
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Features Demonstrated:</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li><strong>Citation Sources</strong> - Shows distribution across PubMed, Europe PMC, Semantic Scholar, CrossRef, FDA, and OpenAlex</li>
            <li><strong>Study Types</strong> - Visualizes mix of Meta-Analysis, Guidelines, RCTs, and Observational studies</li>
            <li><strong>Evidence Quality</strong> - Displays High/Moderate evidence levels</li>
            <li><strong>Treatment Outcomes</strong> - Extracts effectiveness mentions from content text</li>
            <li><strong>Confidence Levels</strong> - Shows confidence expressions from the AI response</li>
            <li><strong>Summary Statistics</strong> - For smaller datasets, shows key metrics instead of charts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
