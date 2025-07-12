"use client";

import { type Citation } from "@/lib/types/chat";

interface CitationQualityFilter {
  citation: Citation;
  priority: number;
  relevance: number;
  evidenceLevel: string;
}

export class EnhancedCitationProcessor {
  // Define high-priority source types and keywords
  private static readonly HIGH_PRIORITY_SOURCES = [
    'AHA/ASA', 'ESC', 'NICE', 'ACC/AHA', 'ACCP',
    'Stroke', 'Circulation', 'NEJM', 'Lancet', 'JAMA',
    'Cochrane', 'BMJ', 'Nature', 'Science', 'Circulation Research'
  ];

  private static readonly LANDMARK_TRIALS = [
    // Stroke Prevention Trials
    'NAVIGATE ESUS', 'NAVIGATE-ESUS', 'RESPECT', 'COMPASS', 
    'WARSS', 'PICSS', 'CLOSURE I', 'PC Trial', 'CLOSURE',
    'REDUCE', 'CLOSE', 'DEFENSE-PFO', 'Gore HELEX',
    'CRYSTAL AF', 'EMBRACE', 'AF-CHF', 'ARISTOTLE', 'RE-LY',
    
    // Cardiovascular Imaging Trials
    'MESA', 'Multi-Ethnic Study of Atherosclerosis',
    'PROMISE', 'Prospective Multicenter Imaging Study',
    'SCOT-HEART', 'Scottish Computed Tomography of the Heart',
    'CONFIRM', 'Coronary CT Angiography Evaluation',
    'ACCURACY', 'Assessment by Coronary Computed Tomographic Angiography',
    'CT-STAT', 'Coronary Computed Tomographic Angiography for Systematic Triage',
    'DISCHARGE', 'Danish Study of Non-Invasive Diagnostic Testing',
    'ISCHEMIA', 'International Study of Comparative Health Effectiveness',
    'COURAGE', 'Clinical Outcomes Utilizing Revascularization',
    'CAPP', 'Coronary Artery Calcium and Atherosclerosis',
    
    // CAC and Risk Stratification Studies
    'CAC Consortium', 'Calcium Scoring Consortium',
    'EISNER', 'Early Identification of Subclinical Atherosclerosis',
    'St. Francis Heart Study', 'PREDICT', 'FACTOR-64',
    'ROMICAT', 'Rule Out Myocardial Infarction/Ischemia Using Computer Assisted Tomography'
  ];

  private static readonly RCT_KEYWORDS = [
    'randomized', 'controlled', 'trial', 'RCT', 'double-blind',
    'placebo-controlled', 'multicenter', 'phase III', 'meta-analysis',
    'systematic review', 'pooled analysis'
  ];

  private static readonly GUIDELINE_KEYWORDS = [
    'guideline', 'recommendation', 'consensus', 'statement',
    'practice parameter', 'clinical practice', 'evidence-based',
    'AHA/ASA 2021', 'AHA/ASA 2019', 'ESC 2020', 'ESC 2016', 'NICE guideline', 'ACC/AHA',
    'ESOC guideline', 'European Stroke Organisation', 'American Heart Association',
    'American Stroke Association', 'European Society of Cardiology'
  ];

  private static readonly HIGH_QUALITY_EVIDENCE = [
    'systematic review', 'meta-analysis', 'pooled analysis', 'network meta-analysis',
    'cochrane review', 'randomized controlled trial', 'RCT', 'phase III trial',
    'multicentre trial', 'double-blind', 'placebo-controlled', 'intention-to-treat'
  ];

  private static readonly LOW_QUALITY_INDICATORS = [
    'FDA adverse event', 'drug ineffective', 'case report',
    'letter to editor', 'opinion', 'commentary', 'editorial',
    'conference abstract', 'poster presentation', 'meeting abstract'
  ];

  private static readonly COMPREHENSIVE_STROKE_PREVENTION_KEYWORDS = [
    // Anticoagulation
    'stroke prevention', 'anticoagulation', 'CHA2DS2-VASc', 'CHADS2', 
    'atrial fibrillation', 'warfarin', 'DOAC', 'NOAC', 'apixaban', 'rivaroxaban',
    'dabigatran', 'edoxaban', 'ischemic stroke', 'embolic stroke', 'ESUS',
    
    // Antiplatelet therapy
    'aspirin', 'clopidogrel', 'dipyridamole', 'antiplatelet', 'dual antiplatelet',
    'non-cardioembolic stroke', 'atherothrombotic', 'small vessel disease',
    
    // Lipid management
    'statin', 'atorvastatin', 'rosuvastatin', 'simvastatin', 'lipid lowering',
    'cholesterol', 'LDL', 'SPARCL', 'lipid management', 'HMG-CoA reductase',
    
    // Blood pressure control
    'blood pressure', 'hypertension', 'ACE inhibitor', 'ARB', 'diuretic',
    'amlodipine', 'lisinopril', 'losartan', 'BP control', 'antihypertensive',
    
    // Diabetes management
    'diabetes', 'metformin', 'HbA1c', 'glucose control', 'insulin',
    'diabetes mellitus', 'glycemic control', 'diabetic stroke',
    
    // Lifestyle interventions
    'smoking cessation', 'diet', 'exercise', 'lifestyle', 'Mediterranean diet',
    'physical activity', 'weight loss', 'alcohol', 'lifestyle modification',
    
    // PFO closure
    'patent foramen ovale', 'PFO', 'cryptogenic stroke', 'PFO closure',
    'percutaneous closure', 'RESPECT', 'CLOSE', 'REDUCE'
  ];

  private static readonly CARDIOVASCULAR_IMAGING_KEYWORDS = [
    // Coronary Artery Calcium (CAC)
    'coronary artery calcium', 'CAC', 'calcium score', 'calcium scoring',
    'Agatston score', 'coronary calcium', 'calcification', 'atherosclerotic plaque',
    'subclinical atherosclerosis', 'coronary atherosclerosis', 'MESA study',
    'calcium percentile', 'calcium progression', 'zero calcium score',
    
    // Stress Testing
    'stress test', 'exercise stress test', 'treadmill test', 'stress echocardiography',
    'stress echo', 'dobutamine stress', 'adenosine stress', 'dipyridamole stress',
    'nuclear stress test', 'myocardial perfusion imaging', 'SPECT', 'PET stress',
    'exercise ECG', 'Bruce protocol', 'Duke treadmill score', 'functional testing',
    
    // CT Angiography
    'coronary CT angiography', 'CCTA', 'CT coronary angiography', 'coronary CTA',
    'cardiac CT', 'computed tomography angiography', 'non-invasive angiography',
    'SCOT-HEART', 'PROMISE trial', 'DISCHARGE trial', 'CONFIRM registry',
    
    // Risk Stratification
    'cardiovascular risk assessment', 'risk stratification', 'intermediate risk',
    'pretest probability', 'Framingham risk', 'ASCVD risk calculator', 
    'pooled cohort equations', 'risk reclassification', 'CAD-RADS',
    'coronary artery disease reporting', 'stenosis severity', 'plaque burden',
    
    // Comparative Effectiveness
    'diagnostic accuracy', 'sensitivity', 'specificity', 'positive predictive value',
    'negative predictive value', 'area under curve', 'ROC analysis',
    'cost-effectiveness', 'downstream testing', 'radiation exposure',
    'test performance', 'clinical utility', 'prognostic value'
  ];

  static filterAndRankCitations(citations: Citation[]): Citation[] {
    console.log('Enhanced citation filtering started with', citations.length, 'citations');
    console.log('Input citations:', citations.map(c => ({ 
      title: c.title?.substring(0, 50), 
      journal: c.journal,
      pmid: c.pmid,
      doi: c.doi 
    })));

    if (!citations || citations.length === 0) {
      console.log('No citations to process');
      return [];
    }

    // Use more lenient filtering - only remove obviously problematic sources
    const filtered = citations.filter(citation => {
      const title = citation.title?.toLowerCase() || '';
      const journal = citation.journal?.toLowerCase() || '';
      const combined = `${title} ${journal}`.toLowerCase();

      // Only filter out the most problematic sources
      const veryLowQualityIndicators = [
        'fda adverse event',
        'drug ineffective', 
        'letter to editor',
        'conference abstract only'
      ];

      const isVeryLowQuality = veryLowQualityIndicators.some(indicator => 
        combined.includes(indicator.toLowerCase())
      );

      if (isVeryLowQuality) {
        console.log('Filtered out very low quality source:', citation.title?.substring(0, 50));
        return false;
      }

      return true;
    });

    console.log('After lenient filtering:', {
      remaining: filtered.length,
      filtered: citations.length - filtered.length
    });

    // Calculate quality scores for remaining citations
    const scored = filtered.map(citation => {
      const score = this.calculateCitationScore(citation);
      console.log('Citation score:', {
        title: citation.title?.substring(0, 40),
        score: score
      });
      return { citation, score };
    });

    // Sort by score (highest first) and return more citations
    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 12) // Increased limit to show more citations
      .map(item => item.citation);

    console.log('Enhanced citation filtering complete:', {
      original: citations.length,
      filtered: filtered.length,
      final: sorted.length,
      topScores: scored.slice(0, 5).map(s => ({ 
        title: s.citation.title?.substring(0, 30), 
        score: s.score 
      }))
    });

    return sorted;
  }

  private static calculateCitationScore(citation: Citation): number {
    let score = 0;
    const title = citation.title?.toLowerCase() || '';
    const journal = citation.journal?.toLowerCase() || '';
    const abstract = citation.abstract?.toLowerCase() || '';
    const combined = `${title} ${journal} ${abstract}`.toLowerCase();

    // Landmark trials get maximum priority (game-changing)
    if (this.LANDMARK_TRIALS.some(trial => 
      combined.includes(trial.toLowerCase())
    )) {
      score += 100; // Highest possible score for landmark trials
    }

    // Clinical guidelines get very high priority
    if (this.GUIDELINE_KEYWORDS.some(keyword => 
      combined.includes(keyword.toLowerCase())
    )) {
      score += 80;
    }

    // High-priority sources get major boost
    if (this.HIGH_PRIORITY_SOURCES.some(source => 
      journal.includes(source.toLowerCase()) || title.includes(source.toLowerCase())
    )) {
      score += 60;
    }

    // High-quality evidence types get premium scoring
    if (this.HIGH_QUALITY_EVIDENCE.some(evidence => 
      combined.includes(evidence.toLowerCase())
    )) {
      score += 70; // Premium for systematic reviews, meta-analyses
    }

    // RCT studies get high priority
    if (this.RCT_KEYWORDS.some(keyword => 
      combined.includes(keyword.toLowerCase())
    )) {
      score += 50;
    }

    // Comprehensive stroke prevention relevance
    if (this.COMPREHENSIVE_STROKE_PREVENTION_KEYWORDS.some(keyword => 
      combined.includes(keyword.toLowerCase())
    )) {
      score += 40;
    }

    // Cardiovascular imaging relevance (CAC, stress testing, CCTA)
    if (this.CARDIOVASCULAR_IMAGING_KEYWORDS.some(keyword => 
      combined.includes(keyword.toLowerCase())
    )) {
      score += 45; // High priority for imaging studies
    }

    // Boost for specific landmark imaging trials
    const imagingTrials = ['mesa', 'promise', 'scot-heart', 'confirm', 'discharge', 'ischemia'];
    if (imagingTrials.some(trial => combined.includes(trial))) {
      score += 85; // Very high priority for major imaging trials
    }

    // Specific drug mentions (clinical relevance)
    const drugMentions = [
      'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban',
      'aspirin', 'clopidogrel', 'dipyridamole', 'statins'
    ];
    if (drugMentions.some(drug => combined.includes(drug))) {
      score += 30;
    }

    // Recent publications get boost (2020+ guidelines era)
    if (citation.year && citation.year >= 2020) {
      score += 20;
    } else if (citation.year && citation.year >= 2015) {
      score += 10;
    }

    // Impact factor estimation based on journal name
    if (journal.includes('nejm') || journal.includes('lancet') || journal.includes('jama')) {
      score += 40;
    } else if (journal.includes('circulation') || journal.includes('stroke')) {
      score += 35;
    } else if (journal.includes('bmj') || journal.includes('cochrane')) {
      score += 30;
    } else if (journal.includes('jacc') || journal.includes('heart') || journal.includes('radiology')) {
      score += 35; // High priority for cardiology and radiology journals
    }

    // Boost for comparative effectiveness studies
    const comparativeKeywords = [
      'versus', 'vs', 'compared to', 'comparison', 'comparative effectiveness',
      'head-to-head', 'diagnostic accuracy', 'cost-effectiveness'
    ];
    if (comparativeKeywords.some(keyword => combined.includes(keyword))) {
      score += 25;
    }

    // Penalty for very specific off-topic content
    const offTopicPenalties = [
      'desmoplakin', 'cardiomyopathy genetics', 'molecular biology',
      'animal model', 'in vitro', 'cell culture', 'mouse model'
    ];
    if (offTopicPenalties.some(topic => combined.includes(topic))) {
      score -= 30;
    }

    // Penalize low-quality sources heavily
    if (this.LOW_QUALITY_INDICATORS.some(indicator => 
      combined.includes(indicator.toLowerCase())
    )) {
      score -= 50; // Heavy penalty for poor quality
    }

    return Math.max(0, score); // Ensure non-negative scores
  }

  static generateQualityReport(citations: Citation[]): string {
    const guidelines = citations.filter(c => 
      this.GUIDELINE_KEYWORDS.some(keyword => 
        (c.title?.toLowerCase() || '').includes(keyword.toLowerCase()) ||
        (c.journal?.toLowerCase() || '').includes(keyword.toLowerCase())
      )
    );

    const landmarkTrials = citations.filter(c => 
      this.LANDMARK_TRIALS.some(trial => 
        (c.title?.toLowerCase() || '').includes(trial.toLowerCase())
      )
    );

    const rcts = citations.filter(c => 
      this.RCT_KEYWORDS.some(keyword => 
        (c.title?.toLowerCase() || '').includes(keyword.toLowerCase())
      )
    );

    const highImpact = citations.filter(c => 
      this.HIGH_PRIORITY_SOURCES.some(source => 
        (c.journal?.toLowerCase() || '').includes(source.toLowerCase())
      )
    );

    const drugCoverage = this.assessDrugCoverage(citations);
    const missingTrials = this.identifyMissingTrials(citations);

    return `
📊 **Evidence Quality Summary:**
- **Clinical Guidelines:** ${guidelines.length} ${guidelines.length >= 2 ? '✅' : '⚠️'}
- **Landmark Trials:** ${landmarkTrials.length} ${landmarkTrials.length >= 1 ? '✅' : '❌'}
- **Randomized Controlled Trials:** ${rcts.length}
- **High-Impact Journals:** ${highImpact.length}
- **Total Sources:** ${citations.length}

**Drug Coverage:** ${drugCoverage}
**Evidence Strength:** ${this.calculateEvidenceStrength(citations)}
${missingTrials.length > 0 ? `\n🔍 **Missing Key Trials:** ${missingTrials.join(', ')}` : ''}
    `.trim();
  }

  private static assessDrugCoverage(citations: Citation[]): string {
    const drugCategories = {
      'DOACs': ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'],
      'Antiplatelets': ['aspirin', 'clopidogrel', 'dipyridamole'],
      'Statins': ['statin', 'atorvastatin', 'rosuvastatin']
    };

    const coverage = Object.entries(drugCategories).filter(([category, drugs]) =>
      drugs.some(drug => citations.some(c => 
        (c.title?.toLowerCase() || '').includes(drug) ||
        (c.abstract?.toLowerCase() || '').includes(drug)
      ))
    ).map(([category]) => category);

    return coverage.length > 0 ? `${coverage.join(', ')} ✅` : 'Limited drug specificity ⚠️';
  }

  private static identifyMissingTrials(citations: Citation[]): string[] {
    const keyTrials = ['NAVIGATE ESUS', 'RESPECT', 'COMPASS'];
    return keyTrials.filter(trial => 
      !citations.some(c => 
        (c.title?.toLowerCase() || '').includes(trial.toLowerCase())
      )
    );
  }

  private static calculateEvidenceStrength(citations: Citation[]): string {
    const totalScore = citations.reduce((sum, citation) => 
      sum + this.calculateCitationScore(citation), 0
    );
    const avgScore = totalScore / citations.length;

    if (avgScore >= 40) return "🟢 **Strong** - Guidelines + RCTs";
    if (avgScore >= 25) return "🟡 **Moderate** - Mixed evidence quality";
    return "🔴 **Limited** - Requires higher quality sources";
  }
}
