import { NextRequest, NextResponse } from "next/server";

interface ClinicalTrialsRequest {
  query: string;
  filters?: {
    status?: string;
    phase?: string;
    studyType?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, filters }: ClinicalTrialsRequest = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // In a real implementation, this would query ClinicalTrials.gov API
    // For now, we'll return sample data filtered by query
    const trials = await searchClinicalTrials(query, filters);

    return NextResponse.json({
      trials,
      query,
      count: trials.length
    });

  } catch (error) {
    console.error("Error searching clinical trials:", error);
    return NextResponse.json(
      { error: "Failed to search clinical trials" },
      { status: 500 }
    );
  }
}

async function searchClinicalTrials(query: string, filters?: any) {
  // Sample data - in production this would query ClinicalTrials.gov API
  const allTrials = [
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
    },
    {
      id: "NCT05987654",
      title: "Immunotherapy Combination for Advanced Lung Cancer",
      status: "Recruiting",
      phase: "Phase 2",
      condition: "Non-Small Cell Lung Cancer",
      intervention: "Combo-Immuno-X + Standard Chemotherapy",
      sponsor: "OncologyTech Corp",
      location: "25 US Centers",
      enrollmentCount: 450,
      startDate: "2024-03-01",
      completionDate: "2027-02-28",
      studyType: "Interventional",
      url: "https://clinicaltrials.gov/ct2/show/NCT05987654",
      summary: "Phase 2 study evaluating combination immunotherapy with standard chemotherapy in patients with advanced non-small cell lung cancer."
    },
    {
      id: "NCT05234567",
      title: "Gene Therapy for Inherited Cardiomyopathy",
      status: "Recruiting",
      phase: "Phase 1",
      condition: "Hypertrophic Cardiomyopathy",
      intervention: "Gene Therapy Vector vs Placebo",
      sponsor: "GenHeart Therapeutics",
      location: "5 Specialized Centers",
      enrollmentCount: 60,
      startDate: "2024-04-15",
      completionDate: "2026-10-31",
      studyType: "Interventional",
      url: "https://clinicaltrials.gov/ct2/show/NCT05234567",
      summary: "First-in-human gene therapy study for patients with hypertrophic cardiomyopathy caused by MYBPC3 mutations."
    },
    {
      id: "NCT05345678",
      title: "AI-Powered Early Detection of Sepsis in ICU",
      status: "Active, not recruiting",
      phase: "N/A",
      condition: "Sepsis",
      intervention: "AI Algorithm + Standard Care vs Standard Care",
      sponsor: "MedAI Solutions",
      location: "12 ICUs Nationwide",
      enrollmentCount: 2000,
      startDate: "2023-08-01",
      completionDate: "2024-12-31",
      studyType: "Interventional",
      url: "https://clinicaltrials.gov/ct2/show/NCT05345678",
      summary: "Evaluating an AI-powered early warning system for sepsis detection in intensive care units."
    }
  ];

  // Filter trials based on query
  const queryLower = query.toLowerCase();
  let filteredTrials = allTrials.filter(trial => 
    trial.title.toLowerCase().includes(queryLower) ||
    trial.condition.toLowerCase().includes(queryLower) ||
    trial.intervention.toLowerCase().includes(queryLower) ||
    trial.summary.toLowerCase().includes(queryLower)
  );

  // Apply filters if provided
  if (filters) {
    if (filters.status && filters.status !== 'all') {
      filteredTrials = filteredTrials.filter(trial => 
        trial.status.toLowerCase().includes(filters.status.toLowerCase())
      );
    }
    
    if (filters.phase && filters.phase !== 'all') {
      const phaseMap: { [key: string]: string } = {
        'phase1': 'Phase 1',
        'phase2': 'Phase 2',
        'phase3': 'Phase 3',
        'phase4': 'Phase 4'
      };
      const targetPhase = phaseMap[filters.phase];
      if (targetPhase) {
        filteredTrials = filteredTrials.filter(trial => trial.phase === targetPhase);
      }
    }
    
    if (filters.studyType && filters.studyType !== 'all') {
      filteredTrials = filteredTrials.filter(trial => 
        trial.studyType.toLowerCase() === filters.studyType.toLowerCase()
      );
    }
  }

  return filteredTrials;
}
