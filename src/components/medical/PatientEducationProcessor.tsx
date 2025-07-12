/**
 * PatientEducationProcessor
 * Converts complex medical content into patient-friendly explanations
 */

interface MedicalTerm {
  term: string;
  simple: string;
  context?: string;
}

interface SimplificationRule {
  pattern: RegExp;
  replacement: string;
  readingLevel: 'basic' | 'intermediate' | 'advanced';
}

interface PatientEducationContent {
  condition: string;
  simpleExplanation: string;
  keyPoints: string[];
  lifestyleChanges: string[];
  warningSigns: string[];
  whenToSeeDoctorUrgently: string[];
  whenToSeeDoctorRoutine: string[];
  medicationSimplified?: {
    name: string;
    purpose: string;
    commonSideEffects: string[];
    importantNotes: string[];
  }[];
}

export class PatientEducationProcessor {
  // Common medical terms and their patient-friendly alternatives
  private static readonly MEDICAL_TERMS: MedicalTerm[] = [
    // Cardiovascular
    { term: 'myocardial infarction', simple: 'heart attack' },
    { term: 'cerebrovascular accident', simple: 'stroke' },
    { term: 'hypertension', simple: 'high blood pressure' },
    { term: 'hypotension', simple: 'low blood pressure' },
    { term: 'tachycardia', simple: 'fast heart rate' },
    { term: 'bradycardia', simple: 'slow heart rate' },
    { term: 'arrhythmia', simple: 'irregular heartbeat' },
    { term: 'atrial fibrillation', simple: 'irregular heart rhythm' },
    { term: 'anticoagulant', simple: 'blood thinner' },
    { term: 'antiplatelet', simple: 'blood thinner (different type)' },
    { term: 'thrombus', simple: 'blood clot' },
    { term: 'embolus', simple: 'traveling blood clot' },
    { term: 'ischemia', simple: 'reduced blood flow' },
    
    // Neurological
    { term: 'cerebral', simple: 'brain' },
    { term: 'neurological', simple: 'nerve-related' },
    { term: 'cognitive', simple: 'thinking and memory' },
    { term: 'transient ischemic attack', simple: 'mini-stroke' },
    { term: 'hemorrhagic', simple: 'bleeding' },
    { term: 'ischemic', simple: 'blocked blood vessel' },
    
    // General Medical
    { term: 'acute', simple: 'sudden' },
    { term: 'chronic', simple: 'long-term' },
    { term: 'benign', simple: 'not harmful' },
    { term: 'malignant', simple: 'cancerous' },
    { term: 'prognosis', simple: 'outlook' },
    { term: 'diagnosis', simple: 'what condition you have' },
    { term: 'etiology', simple: 'cause' },
    { term: 'pathophysiology', simple: 'how the disease works' },
    { term: 'therapeutic', simple: 'treatment' },
    { term: 'prophylactic', simple: 'preventive' },
    { term: 'contraindication', simple: 'reason not to use' },
    { term: 'adverse event', simple: 'side effect' },
    { term: 'efficacy', simple: 'how well it works' },
    
    // Medications
    { term: 'ACE inhibitor', simple: 'blood pressure medication (ACE inhibitor)' },
    { term: 'beta-blocker', simple: 'heart rate medication (beta-blocker)' },
    { term: 'calcium channel blocker', simple: 'blood pressure medication (calcium blocker)' },
    { term: 'statin', simple: 'cholesterol medication' },
    { term: 'diuretic', simple: 'water pill' },
    { term: 'NSAID', simple: 'anti-inflammatory pain medication' },
    { term: 'analgesic', simple: 'pain reliever' },
    
    // Laboratory
    { term: 'biomarker', simple: 'blood test marker' },
    { term: 'serum', simple: 'blood' },
    { term: 'platelet', simple: 'blood clotting cell' },
    { term: 'hemoglobin', simple: 'oxygen-carrying protein in blood' },
    { term: 'creatinine', simple: 'kidney function marker' },
    { term: 'troponin', simple: 'heart damage marker' },
  ];

  private static readonly SIMPLIFICATION_RULES: SimplificationRule[] = [
    // Reading level: Basic (6th grade)
    { 
      pattern: /administered/gi, 
      replacement: 'given', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /utilize/gi, 
      replacement: 'use', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /demonstrate/gi, 
      replacement: 'show', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /initiate/gi, 
      replacement: 'start', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /terminate/gi, 
      replacement: 'stop', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /subsequently/gi, 
      replacement: 'then', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /approximately/gi, 
      replacement: 'about', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /individuals/gi, 
      replacement: 'people', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /significant/gi, 
      replacement: 'important', 
      readingLevel: 'basic' 
    },
    { 
      pattern: /monitor/gi, 
      replacement: 'watch', 
      readingLevel: 'basic' 
    },
  ];

  /**
   * Simplifies medical text for patient understanding
   */
  public static simplifyMedicalText(
    text: string, 
    readingLevel: 'basic' | 'intermediate' | 'advanced' = 'basic'
  ): string {
    let simplified = text;

    // Replace medical terms with simpler alternatives
    this.MEDICAL_TERMS.forEach(({ term, simple }) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Apply simplification rules based on reading level
    const applicableRules = this.SIMPLIFICATION_RULES.filter(
      rule => this.getReadingLevelPriority(rule.readingLevel) <= this.getReadingLevelPriority(readingLevel)
    );

    applicableRules.forEach(({ pattern, replacement }) => {
      simplified = simplified.replace(pattern, replacement);
    });

    // Simplify sentence structure for basic level
    if (readingLevel === 'basic') {
      simplified = this.simplifyStructure(simplified);
    }

    return simplified;
  }

  /**
   * Extracts patient education content from medical response
   */
  public static extractPatientEducation(
    medicalContent: string,
    condition: string,
    readingLevel: 'basic' | 'intermediate' | 'advanced' = 'basic'
  ): PatientEducationContent {
    const simplified = this.simplifyMedicalText(medicalContent, readingLevel);
    
    return {
      condition: this.simplifyConditionName(condition),
      simpleExplanation: this.generateSimpleExplanation(simplified, condition, readingLevel),
      keyPoints: this.extractKeyPoints(simplified, readingLevel),
      lifestyleChanges: this.extractLifestyleChanges(simplified),
      warningSigns: this.extractWarningSigns(simplified, condition),
      whenToSeeDoctorUrgently: this.extractUrgentSigns(condition),
      whenToSeeDoctorRoutine: this.extractRoutineSigns(condition),
      medicationSimplified: this.extractMedicationInfo(simplified)
    };
  }

  /**
   * Generates condition-specific patient education
   */
  public static generateStrokePatientEducation(readingLevel: 'basic' | 'intermediate' | 'advanced' = 'basic'): PatientEducationContent {
    const content = {
      basic: {
        explanation: "A stroke happens when blood flow to part of your brain stops. This can damage brain cells. There are two main types: one caused by a blocked blood vessel (most common) and one caused by bleeding in the brain.",
        keyPoints: [
          "Strokes are medical emergencies - get help right away",
          "Many strokes can be prevented with healthy lifestyle choices",
          "Taking medications as prescribed is very important",
          "Recovery is possible with proper treatment and rehabilitation"
        ]
      },
      intermediate: {
        explanation: "A stroke occurs when blood supply to brain tissue is interrupted, either by a blocked artery (ischemic stroke) or bleeding vessel (hemorrhagic stroke). This causes brain cells to be damaged or die, leading to various symptoms depending on the affected area.",
        keyPoints: [
          "Time is critical - immediate medical treatment improves outcomes",
          "Risk factors include high blood pressure, diabetes, smoking, and heart disease",
          "Prevention involves medication compliance and lifestyle modifications",
          "Rehabilitation therapy helps maximize recovery potential"
        ]
      },
      advanced: {
        explanation: "Stroke results from cerebrovascular compromise causing focal neurological deficits. Ischemic strokes (87%) result from arterial occlusion, while hemorrhagic strokes (13%) involve vessel rupture. The extent of damage depends on location, duration of ischemia, and collateral circulation.",
        keyPoints: [
          "Acute intervention within therapeutic windows optimizes outcomes",
          "Primary prevention targets modifiable risk factors systematically",
          "Secondary prevention requires comprehensive medical management",
          "Neuroplasticity enables functional recovery through targeted rehabilitation"
        ]
      }
    };

    const levelContent = content[readingLevel];

    return {
      condition: "Stroke",
      simpleExplanation: levelContent.explanation,
      keyPoints: levelContent.keyPoints,
      lifestyleChanges: [
        "Quit smoking if you smoke",
        "Exercise regularly (ask your doctor what's safe for you)",
        "Eat a healthy diet with lots of fruits and vegetables",
        "Take your blood pressure medications every day",
        "Control your blood sugar if you have diabetes",
        "Limit alcohol to 1-2 drinks per day or less"
      ],
      warningSigns: [
        "Face drooping on one side",
        "Arm weakness (can't lift both arms equally)",
        "Speech problems (slurred or confused words)",
        "Sudden severe headache",
        "Sudden trouble seeing",
        "Sudden trouble walking or balance problems"
      ],
      whenToSeeDoctorUrgently: [
        "Any signs of stroke (call 911 immediately)",
        "Sudden severe headache that's different from usual",
        "Sudden trouble speaking or understanding",
        "Sudden numbness or weakness in face, arm, or leg",
        "Sudden trouble seeing in one or both eyes",
        "Sudden trouble walking, dizziness, or loss of balance"
      ],
      whenToSeeDoctorRoutine: [
        "Blood pressure readings are consistently high",
        "You're having trouble taking medications as prescribed",
        "You want to discuss stroke risk factors",
        "You need help with lifestyle changes",
        "You have questions about your treatment plan"
      ],
      medicationSimplified: [
        {
          name: "Blood Thinners (like warfarin, apixaban)",
          purpose: "These medications help prevent blood clots that could cause another stroke",
          commonSideEffects: ["Easy bruising", "bleeding that takes longer to stop"],
          importantNotes: [
            "Take exactly as prescribed - never skip doses",
            "Tell all doctors and dentists you take blood thinners",
            "Watch for unusual bleeding and call your doctor",
            "Don't start new medications without asking your doctor"
          ]
        },
        {
          name: "Blood Pressure Medications",
          purpose: "These help keep your blood pressure at a safe level to prevent future strokes",
          commonSideEffects: ["Dizziness when standing up", "fatigue", "dry cough (with some types)"],
          importantNotes: [
            "Take every day, even if you feel fine",
            "Don't stop suddenly without talking to your doctor",
            "Check your blood pressure regularly at home",
            "Stand up slowly to avoid dizziness"
          ]
        }
      ]
    };
  }

  // Helper methods
  private static getReadingLevelPriority(level: 'basic' | 'intermediate' | 'advanced'): number {
    return { basic: 1, intermediate: 2, advanced: 3 }[level];
  }

  private static simplifyConditionName(condition: string): string {
    const conditionMap: Record<string, string> = {
      'cerebrovascular accident': 'Stroke',
      'myocardial infarction': 'Heart Attack',
      'hypertension': 'High Blood Pressure',
      'diabetes mellitus': 'Diabetes',
      'atrial fibrillation': 'Irregular Heart Rhythm'
    };

    return conditionMap[condition.toLowerCase()] || condition;
  }

  private static generateSimpleExplanation(
    content: string, 
    condition: string, 
    readingLevel: 'basic' | 'intermediate' | 'advanced'
  ): string {
    // This would ideally use AI to generate explanations, but for now return condition-specific content
    if (condition.toLowerCase().includes('stroke')) {
      return this.generateStrokePatientEducation(readingLevel).simpleExplanation;
    }
    
    // Fallback: extract first meaningful sentence and simplify
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      return this.simplifyMedicalText(sentences[0].trim() + '.', readingLevel);
    }
    
    return "This is a medical condition that your doctor can help you understand and treat.";
  }

  private static extractKeyPoints(content: string, readingLevel: 'basic' | 'intermediate' | 'advanced'): string[] {
    // Extract bullet points or numbered lists
    const points: string[] = [];
    
    // Look for bullet points or numbered items
    const bulletRegex = /(?:^|\n)\s*[•\-\*]\s*(.+?)(?=\n|$)/g;
    const numberRegex = /(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)/g;
    
    let match;
    while ((match = bulletRegex.exec(content)) !== null) {
      const point = this.simplifyMedicalText(match[1].trim(), readingLevel);
      if (point.length > 10) points.push(point);
    }
    
    while ((match = numberRegex.exec(content)) !== null) {
      const point = this.simplifyMedicalText(match[1].trim(), readingLevel);
      if (point.length > 10) points.push(point);
    }
    
    // If no structured points found, extract key sentences
    if (points.length === 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
      const keyTerms = ['important', 'should', 'recommend', 'treatment', 'prevent'];
      
      sentences.forEach(sentence => {
        if (keyTerms.some(term => sentence.toLowerCase().includes(term)) && points.length < 4) {
          points.push(this.simplifyMedicalText(sentence.trim(), readingLevel));
        }
      });
    }
    
    return points.slice(0, 5); // Limit to 5 key points
  }

  private static extractLifestyleChanges(content: string): string[] {
    const lifestyleKeywords = [
      'exercise', 'diet', 'smoking', 'alcohol', 'weight', 'sleep', 
      'stress', 'physical activity', 'nutrition', 'lifestyle'
    ];
    
    const changes: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (lifestyleKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const simplified = this.simplifyMedicalText(sentence.trim(), 'basic');
        if (simplified.length > 15 && simplified.length < 150) {
          changes.push(simplified);
        }
      }
    });
    
    return changes.slice(0, 6);
  }

  private static extractWarningSigns(content: string, condition: string): string[] {
    if (condition.toLowerCase().includes('stroke')) {
      return [
        "Face drooping on one side",
        "Arm weakness (can't lift both arms equally)",
        "Speech problems (slurred or confused words)",
        "Sudden severe headache",
        "Sudden trouble seeing",
        "Sudden trouble walking or balance problems"
      ];
    }
    
    // Generic warning signs extraction
    const warningKeywords = ['symptom', 'sign', 'warning', 'emergency', 'urgent'];
    const signs: string[] = [];
    
    const sentences = content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (warningKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const simplified = this.simplifyMedicalText(sentence.trim(), 'basic');
        if (simplified.length > 10 && simplified.length < 100) {
          signs.push(simplified);
        }
      }
    });
    
    return signs.slice(0, 6);
  }

  private static extractUrgentSigns(condition: string): string[] {
    const urgentSigns: Record<string, string[]> = {
      stroke: [
        "Any signs of stroke (call 911 immediately)",
        "Sudden severe headache that's different from usual",
        "Sudden trouble speaking or understanding",
        "Sudden numbness or weakness in face, arm, or leg",
        "Sudden trouble seeing in one or both eyes"
      ],
      'heart attack': [
        "Chest pain or pressure",
        "Shortness of breath",
        "Pain in arm, neck, or jaw",
        "Unusual sweating",
        "Nausea with chest discomfort"
      ]
    };
    
    const conditionKey = Object.keys(urgentSigns).find(key => 
      condition.toLowerCase().includes(key)
    );
    
    return conditionKey ? urgentSigns[conditionKey] : [
      "Severe symptoms that worry you",
      "Sudden changes in your condition",
      "Signs that seem like an emergency"
    ];
  }

  private static extractRoutineSigns(condition: string): string[] {
    return [
      "Your symptoms are getting worse slowly",
      "You have questions about your medications",
      "You want to discuss treatment options",
      "You need help managing your condition",
      "It's time for your regular check-up"
    ];
  }

  private static extractMedicationInfo(content: string): { name: string; purpose: string; commonSideEffects: string[]; importantNotes: string[]; }[] {
    // This would ideally parse medication information from the content
    // For now, return empty array - this would be enhanced with actual parsing
    return [];
  }

  private static simplifyStructure(text: string): string {
    // Break long sentences into shorter ones
    return text
      .replace(/,\s*which\s*/g, '. This ')
      .replace(/,\s*and\s*therefore\s*/g, '. So ')
      .replace(/;\s*however,\s*/g, '. But ')
      .replace(/,\s*although\s*/g, '. But ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default PatientEducationProcessor;
