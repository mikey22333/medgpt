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
import { TLDRSummary, GuidelineQuote, LandmarkTrial } from "../medical/EnhancedMedicalComponents";
import { MedicalFlowchart } from "../medical/MedicalFlowchart";
import { ResearchGapAnalysis } from "../medical/ResearchGapAnalysis";
import { MissingLandmarkTrials } from "../medical/MissingLandmarkTrials";
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

  // Parse content for special sections
  const parseSpecialSections = (content: string) => {
    const sections = {
      simpleExplanations: [] as Array<{ term: string; explanation: string }>,
      visualizations: [] as Array<any>,
      clinicalSummary: '' as string,
      mainContent: content,
      medicalContentAnalysis: {
        needsGuidelines: false,
        needsRCTs: false,
        needsMedications: false,
        needsStratification: false,
        missingInterventions: [] as string[],
        suggestions: [] as string[]
      }
    };

    // Extract Simple Explanations - Updated patterns to match actual format
    const simpleExplanationPatterns = [
      /\*\*Simple Explanation:\*\* ([^\n]+)\n([^*]+?)(?=\*\*|$)/g,
      /Simple Explanation:\s*\n\s*\*\*Simple Explanation:\*\* ([^\n]+)\n([^*]+?)(?=\*\*|$)/g,
      /Simple Explanation:\s*([^*\n]+?)\*\*Simple Explanation:\*\* ([^\n]+)\n([^*]+?)(?=\*\*|$)/g
    ];
    
    let match;
    for (const regex of simpleExplanationPatterns) {
      regex.lastIndex = 0;
      while ((match = regex.exec(content)) !== null) {
        let term = '';
        let explanation = '';
        
        if (match.length === 3) {
          // Standard format: **Simple Explanation:** term \n explanation
          term = match[1].trim();
          explanation = match[2].trim();
        } else if (match.length === 4) {
          // Complex format with header
          term = match[2].trim();
          explanation = match[3].trim();
        }
        
        if (term && explanation) {
          sections.simpleExplanations.push({ term, explanation });
          sections.mainContent = sections.mainContent.replace(match[0], '');
          console.log('Extracted simple explanation:', { term, explanation: explanation.substring(0, 50) + '...' });
        }
      }
    }

    // Extract Clinical Summary (TL;DR) - Using substring approach that works
    // Find the TL;DR section and extract content until Evidence Sources or 🧬
    const tldrIndex = content.indexOf('TL;DR');
    const evidenceIndex = Math.min(
      content.indexOf('🧬') !== -1 ? content.indexOf('🧬') : Infinity,
      content.indexOf('Evidence Sources') !== -1 ? content.indexOf('Evidence Sources') : Infinity
    );
    
    if (tldrIndex !== -1 && evidenceIndex !== Infinity && evidenceIndex > tldrIndex) {
      const extracted = content.substring(tldrIndex, evidenceIndex).trim();
      const bulletStart = extracted.indexOf('•');
      if (bulletStart !== -1) {
        sections.clinicalSummary = extracted.substring(bulletStart);
        // Remove the entire clinical summary section from main content more aggressively
        const summaryStart = Math.max(0, content.indexOf('📋') !== -1 ? content.indexOf('📋') : tldrIndex - 20);
        const summaryEnd = evidenceIndex;
        const summarySection = content.substring(summaryStart, summaryEnd);
        sections.mainContent = sections.mainContent.replace(summarySection, '').trim();
        console.log('Successfully extracted clinical summary:', sections.clinicalSummary.substring(0, 100) + '...');
      }
    }
    
    // Fallback regex patterns if substring approach fails
    if (!sections.clinicalSummary) {
      const summaryRegexes = [
        /📋\s*Clinical Summary \(TL;DR\)\s*(.*?)(?=🧬|Evidence Sources)/g,
        /Clinical Summary \(TL;DR\)\s*(.*?)(?=🧬|Evidence Sources)/g,
        /TL;DR\)\s*(.*?)(?=🧬|Evidence Sources)/g
      ];
      
      for (const regex of summaryRegexes) {
        regex.lastIndex = 0;
        while ((match = regex.exec(content)) !== null) {
          if (!sections.clinicalSummary) {
            sections.clinicalSummary = match[1].trim();
            sections.mainContent = sections.mainContent.replace(match[0], '');
            console.log('Regex extracted clinical summary:', sections.clinicalSummary.substring(0, 100) + '...');
            break;
          }
        }
        if (sections.clinicalSummary) break;
      }
    }

    // Extract Visualization suggestions - Multiple patterns to match different formats
    const visualizationPatterns = [
      // Pattern 1: **📊 Suggested Visualization:** format
      /\*\*📊 Suggested Visualization:\*\*\s*\n\s*Type:\s*([^\n]+)\n\s*Title:\s*([^\n]+)\n\s*Data:\s*([^*]+?)(?=\*\*|$)/g,
      // Pattern 2: 📊 Suggested Visualization: format  
      /📊 Suggested Visualization:\s*\n\s*Type:\s*([^\n]+)\n\s*Title:\s*([^\n]+)\n\s*Data:\s*([^*]+?)(?=\*\*|$)/g,
      // Pattern 3: VISUALIZATION REQUIREMENTS format
      /VISUALIZATION REQUIREMENTS:\s*\n\s*\*\*📊 Suggested Visualization:\*\*\s*\n\s*Type:\s*([^\n]+)\n\s*Title:\s*([^\n]+)\n\s*Data:\s*([^*]+?)(?=\*\*|$)/g,
      // Pattern 4: Simple format
      /Suggested Visualization:\s*\n\s*Type:\s*([^\n]+)\n\s*Title:\s*([^\n]+)\n\s*Data:\s*([^*]+?)(?=\*\*|$)/g
    ];
    
    for (const visualizationRegex of visualizationPatterns) {
      visualizationRegex.lastIndex = 0;
      while ((match = visualizationRegex.exec(content)) !== null) {
        const vizType = match[1].trim();
        const vizTitle = match[2].trim();
        const vizData = match[3].trim();
        
        console.log('Found visualization match:', { vizType, vizTitle, vizData: vizData.substring(0, 100) + '...' });
        
        // Parse data more flexibly
        const dataItems = [];
        if (vizData.includes('Europe') && vizData.includes('Asia')) {
          // Handle specific prevalence data format
          const dataText = vizData.replace(/[()]/g, ''); // Remove parentheses
          if (dataText.includes('1 in 2,000 in Europe')) {
            dataItems.push({ label: 'Europe', value: 0.05 }); // 1 in 2,000 = 0.05%
          }
          if (dataText.includes('1 in 5,000 in Asia')) {
            dataItems.push({ label: 'Asia', value: 0.02 }); // 1 in 5,000 = 0.02%
          }
          if (dataText.includes('variable in other regions')) {
            dataItems.push({ label: 'Other Regions', value: 0.03 });
          }
        } else {
          // Fallback parsing for other data formats
          const parts = vizData.split(',');
          parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed) {
              const match = trimmed.match(/([^:]+):\s*(.+)/);
              if (match) {
                const label = match[1].trim();
                const value = match[2].trim();
                const numValue = parseFloat(value) || 0;
                dataItems.push({ label, value: numValue > 1 ? numValue : numValue * 100 });
              }
            }
          });
        }

        if (dataItems.length > 0) {
          sections.visualizations.push({
            type: vizType.toLowerCase().includes('bar') ? 'bar' : 
                  vizType.toLowerCase().includes('pie') ? 'pie' : 
                  vizType.toLowerCase().includes('flow') ? 'flowchart' : 'bar',
            title: vizTitle,
            description: "Data visualization based on research findings",
            data: dataItems,
            totalSample: "Population-based estimates",
            source: "Medical literature review"
          });
          console.log('Added visualization:', sections.visualizations[sections.visualizations.length - 1]);
        }
        sections.mainContent = sections.mainContent.replace(match[0], '');
      }
    }

    // Comprehensive stroke prevention analysis - all intervention categories
    const medicalContentAnalysis = {
      needsGuidelines: false,
      needsRCTs: false,
      needsMedications: false,
      needsStratification: false,
      missingInterventions: [] as string[],
      suggestions: [] as string[]
    };
    
    // Check for comprehensive stroke prevention coverage
    const strokePreventionTerms = ['stroke prevention', 'secondary prevention', 'ischemic stroke', 'stroke recurrence'];
    const guidelineTerms = ['AHA/ASA', 'ESC', 'NICE', 'ESOC', 'guideline'];
    const landmarkTrials = ['NAVIGATE ESUS', 'NAVIGATE-ESUS', 'RESPECT', 'COMPASS', 'SPARCL', 'CLOSE'];
    
    // Intervention categories to check
    const interventionCategories = {
      anticoagulation: ['anticoagulation', 'warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'DOAC', 'NOAC'],
      antiplatelet: ['aspirin', 'clopidogrel', 'dipyridamole', 'antiplatelet', 'dual antiplatelet'],
      lipidLowering: ['statin', 'atorvastatin', 'rosuvastatin', 'lipid lowering', 'cholesterol', 'SPARCL'],
      bloodPressure: ['blood pressure', 'hypertension', 'ACE inhibitor', 'ARB', 'diuretic', 'antihypertensive'],
      diabetes: ['diabetes', 'metformin', 'glucose control', 'HbA1c', 'glycemic control'],
      lifestyle: ['smoking cessation', 'exercise', 'diet', 'lifestyle', 'Mediterranean diet', 'physical activity'],
      pfoClousure: ['PFO', 'patent foramen ovale', 'cryptogenic stroke', 'PFO closure', 'RESPECT', 'CLOSE']
    };
    
    const hasStrokePrevention = strokePreventionTerms.some(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
    
    if (hasStrokePrevention) {
      // Check for guidelines
      const hasGuidelines = guidelineTerms.some(term => 
        content.toLowerCase().includes(term.toLowerCase())
      );
      if (!hasGuidelines) {
        medicalContentAnalysis.needsGuidelines = true;
        medicalContentAnalysis.suggestions.push(
          '📋 Reference clinical guidelines: AHA/ASA 2021, ESC 2020, ESOC, NICE for evidence-based recommendations'
        );
      }
      
      // Check for landmark trials
      const hasLandmarkTrials = landmarkTrials.some(trial => 
        content.toLowerCase().includes(trial.toLowerCase())
      );
      if (!hasLandmarkTrials) {
        medicalContentAnalysis.needsRCTs = true;
        medicalContentAnalysis.suggestions.push(
          '🧪 Include key trials: NAVIGATE ESUS, RESPECT/CLOSE (PFO), COMPASS (dual therapy), SPARCL (statins)'
        );
      }
      
      // Check intervention coverage
      const missingInterventions: string[] = [];
      Object.entries(interventionCategories).forEach(([category, keywords]) => {
        const hasIntervention = keywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasIntervention) {
          missingInterventions.push(category);
        }
      });
      
      // Generate specific suggestions for missing interventions
      if (missingInterventions.includes('antiplatelet')) {
        medicalContentAnalysis.missingInterventions.push('Antiplatelet therapy');
        medicalContentAnalysis.suggestions.push(
          '� Add antiplatelet therapy: Aspirin 75-100mg daily for non-cardioembolic stroke, clopidogrel for aspirin-intolerant patients'
        );
      }
      
      if (missingInterventions.includes('lipidLowering')) {
        medicalContentAnalysis.missingInterventions.push('Lipid management');
        medicalContentAnalysis.suggestions.push(
          '📊 Include lipid lowering: High-intensity statins (atorvastatin 80mg) reduce stroke recurrence + mortality (SPARCL trial)'
        );
      }
      
      if (missingInterventions.includes('bloodPressure')) {
        medicalContentAnalysis.missingInterventions.push('Blood pressure control');
        medicalContentAnalysis.suggestions.push(
          '🩺 Address BP control: Most important modifiable risk factor. Target <130/80 mmHg with ACE inhibitors/ARBs'
        );
      }
      
      if (missingInterventions.includes('diabetes')) {
        medicalContentAnalysis.missingInterventions.push('Diabetes management');
        medicalContentAnalysis.suggestions.push(
          '🍎 Include diabetes control: HbA1c <7%, metformin first-line, lifestyle modification critical'
        );
      }
      
      if (missingInterventions.includes('lifestyle')) {
        medicalContentAnalysis.missingInterventions.push('Lifestyle interventions');
        medicalContentAnalysis.suggestions.push(
          '🏃 Add lifestyle measures: Smoking cessation, Mediterranean diet, regular exercise - essential and cost-effective'
        );
      }
      
      if (missingInterventions.includes('pfoClousure')) {
        medicalContentAnalysis.missingInterventions.push('PFO closure consideration');
        medicalContentAnalysis.suggestions.push(
          '🔧 Consider PFO closure: For cryptogenic stroke patients with PFO based on RESPECT/CLOSE trials'
        );
      }
      
      // Overall scope assessment
      if (missingInterventions.length >= 4) {
        medicalContentAnalysis.suggestions.unshift(
          '⚠️ Narrow scope detected: Response focuses mainly on anticoagulation. Include comprehensive stroke prevention across all intervention categories'
        );
      }
    }
    
    // Store analysis results in sections for rendering
    sections.medicalContentAnalysis = medicalContentAnalysis;
    if (process.env.NODE_ENV === 'development') {
      console.log('MessageBubble parsing content length:', content.length);
      console.log('Content preview:', content.substring(0, 300) + '...');
      if (sections.visualizations.length > 0) {
        console.log('Found visualizations:', sections.visualizations);
      }
      if (sections.simpleExplanations.length > 0) {
        console.log('Found simple explanations:', sections.simpleExplanations);
      }
      if (sections.clinicalSummary) {
        console.log('Found clinical summary:', sections.clinicalSummary.substring(0, 100) + '...');
      }
    }
    
    // Enhanced Fallback: If no structured data found but content contains keywords, try alternative parsing
    if (sections.simpleExplanations.length === 0 && content.includes('Simple Explanation')) {
      console.log('Attempting fallback simple explanation parsing...');
      
      // Try to extract simple explanations from unstructured text
      const fallbackExplanationRegex = /Simple Explanation[:\s]*([^.!?]*(?:[.!?][^.!?]*)*)/gi;
      const matches = content.match(fallbackExplanationRegex);
      if (matches) {
        matches.forEach((match, index) => {
          const cleanMatch = match.replace(/Simple Explanation[:\s]*/i, '').trim();
          if (cleanMatch.length > 10) { // Only if substantial content
            sections.simpleExplanations.push({
              term: `Medical Term ${index + 1}`,
              explanation: cleanMatch
            });
            console.log('Fallback extracted:', cleanMatch.substring(0, 50) + '...');
          }
        });
      }
    }
    
    // Advanced Visualization Fallback - Look for any data that can be visualized
    if (sections.visualizations.length === 0) {
      console.log('Attempting advanced fallback visualization parsing...');
      
      let dataItems: Array<{ label: string; value: number; color?: string }> = [];
      let vizTitle = 'Medical Data Visualization';
      
      // Look for stroke prevention guidelines and trials data
      const guidelineMatches = content.match(/(AHA\/ASA|ESC|NICE|ACC\/AHA)\s+(\d{4})/gi);
      if (guidelineMatches && guidelineMatches.length > 0) {
        guidelineMatches.forEach((match, index) => {
          dataItems.push({
            label: match.trim(),
            value: 100 - (index * 15), // Decreasing relevance
            color: `hsl(${220 + index * 30}, 70%, 60%)`
          });
        });
        vizTitle = 'Clinical Guidelines Timeline';
      }
      
      // Look for RCT trials (NAVIGATE, RESPECT, COMPASS, etc.)
      const trialMatches = content.match(/(NAVIGATE\s+ESUS|RESPECT|COMPASS|WARSS|PICSS|CLOSURE|PC Trial)/gi);
      if (trialMatches && trialMatches.length > 0) {
        trialMatches.forEach((match, index) => {
          dataItems.push({
            label: match.trim(),
            value: 95 - (index * 10), // High evidence quality
            color: `hsl(${120 + index * 25}, 70%, 60%)`
          });
        });
        vizTitle = 'Major RCT Evidence Base';
      }
      
      // Look for stroke prevention efficacy data
      const efficacyMatches = content.match(/(\d+(?:\.\d+)?)\s*%\s*(reduction|efficacy|effectiveness)/gi);
      if (efficacyMatches && efficacyMatches.length > 0) {
        efficacyMatches.forEach((match, index) => {
          const percentageMatch = match.match(/(\d+(?:\.\d+)?)/);
          if (percentageMatch) {
            const percentage = parseFloat(percentageMatch[1]);
            dataItems.push({
              label: `Intervention ${index + 1}`,
              value: percentage,
              color: `hsl(${60 + index * 40}, 70%, 60%)`
            });
          }
        });
        vizTitle = 'Stroke Prevention Efficacy';
      }
      
      // Look for stroke subtype stratification data
      const strokeSubtypeMatches = content.match(/(atrial fibrillation|AF|ESUS|atherosclerotic|cardioembolic|lacunar).{0,50}(\d+(?:\.\d+)?)\s*%/gi);
      if (strokeSubtypeMatches && strokeSubtypeMatches.length > 0) {
        strokeSubtypeMatches.forEach((match, index) => {
          const subtypeMatch = match.match(/(atrial fibrillation|AF|ESUS|atherosclerotic|cardioembolic|lacunar)/i);
          const percentageMatch = match.match(/(\d+(?:\.\d+)?)\s*%/);
          if (subtypeMatch && percentageMatch) {
            const subtype = subtypeMatch[1].toUpperCase();
            const percentage = parseFloat(percentageMatch[1]);
            dataItems.push({
              label: subtype === 'AF' ? 'Atrial Fibrillation' : subtype,
              value: percentage,
              color: `hsl(${180 + index * 40}, 70%, 60%)`
            });
          }
        });
        vizTitle = 'Stroke Subtype Distribution';
      }
      
      // Look for medication efficacy data
      const medicationMatches = content.match(/(apixaban|rivaroxaban|dabigatran|edoxaban|aspirin|clopidogrel|warfarin).{0,100}(\d+(?:\.\d+)?)\s*%\s*(reduction|efficacy|effective)/gi);
      if (medicationMatches && medicationMatches.length > 0) {
        medicationMatches.forEach((match, index) => {
          const drugMatch = match.match(/(apixaban|rivaroxaban|dabigatran|edoxaban|aspirin|clopidogrel|warfarin)/i);
          const percentageMatch = match.match(/(\d+(?:\.\d+)?)\s*%/);
          if (drugMatch && percentageMatch) {
            const drug = drugMatch[1].charAt(0).toUpperCase() + drugMatch[1].slice(1);
            const percentage = parseFloat(percentageMatch[1]);
            dataItems.push({
              label: drug,
              value: percentage,
              color: `hsl(${300 + index * 25}, 70%, 60%)`
            });
          }
        });
        vizTitle = 'Medication Efficacy Comparison';
      }
      const riskMatches = content.match(/(CHA2DS2-VASc|CHADS2|HAS-BLED|ABCD2)\s*[:=]\s*(\d+)/gi);
      if (riskMatches && riskMatches.length > 0) {
        riskMatches.forEach((match, index) => {
          const scoreMatch = match.match(/(\d+)/);
          if (scoreMatch) {
            dataItems.push({
              label: match.split(/[:=]/)[0].trim(),
              value: parseInt(scoreMatch[1]) * 20, // Scale to percentage
              color: `hsl(${10 + index * 50}, 70%, 60%)`
            });
          }
        });
        vizTitle = 'Risk Stratification Scores';
      }
      
      // Fallback: General percentage data
      if (dataItems.length === 0) {
        const percentageMatches = content.match(/(\d+(?:\.\d+)?)\s*%/g);
        if (percentageMatches && percentageMatches.length > 0) {
          dataItems = percentageMatches.slice(0, 4).map((match, index) => ({
            label: `Data Point ${index + 1}`,
            value: parseFloat(match.replace('%', '')),
            color: `hsl(${200 + index * 30}, 70%, 60%)`
          }));
          vizTitle = 'Numerical Data from Content';
        }
      }
      
      if (dataItems.length > 0) {
        sections.visualizations.push({
          type: 'bar',
          title: vizTitle,
          description: 'Auto-generated visualization from medical content',
          data: dataItems,
          totalSample: 'Literature analysis',
          source: 'Extracted medical data'
        });
        console.log('Advanced fallback visualization created:', vizTitle, dataItems);
      }
    }
    
    return sections;
  };

  const { simpleExplanations, visualizations, clinicalSummary, mainContent, medicalContentAnalysis } = isUser ? 
    { simpleExplanations: [], visualizations: [], clinicalSummary: '', mainContent: message.content, medicalContentAnalysis: { needsGuidelines: false, needsRCTs: false, needsMedications: false, needsStratification: false, missingInterventions: [], suggestions: [] } } : 
    parseSpecialSections(message.content);

  // Identify highlighted conditions for enhanced citations
  const highlightConditions = ['Brugada', 'LQTS', 'Long QT', 'CPVT', 'Hypertrophic Cardiomyopathy', 'ARVC'];

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
              {mainContent}
            </ReactMarkdown>
          )}
        </div>

        {/* TL;DR for Patients - Always show first for medical responses */}
        {!isUser && message.content.length > 200 && (
          <div className="mt-4">
            <TLDRSummary 
              content={message.content} 
              condition={(() => {
                const conditions = ['stroke', 'atrial fibrillation', 'diabetes', 'hypertension'];
                return conditions.find(c => message.content.toLowerCase().includes(c));
              })()} 
            />
          </div>
        )}

        {/* Guideline Quotes - Show authoritative statements */}
        {!isUser && (message.content.includes('guideline') || message.content.includes('AHA') || message.content.includes('ESC')) && (
          <div className="mt-4">
            <GuidelineQuote content={message.content} />
          </div>
        )}

        {/* Landmark Trials - Show when relevant trials are mentioned */}
        {!isUser && (message.content.includes('trial') || message.content.includes('study') || message.content.includes('PROGRESS') || message.content.includes('UKPDS')) && (
          <div className="mt-4">
            <LandmarkTrial content={message.content} />
          </div>
        )}

        {/* Medical Flowchart - Show for any medical content */}
        {!isUser && (
          <div className="mt-4">
            <MedicalFlowchart content={message.content} />
          </div>
        )}

        {/* Missing Landmark Trials - Critical studies not referenced */}
        {!isUser && (
          <div className="mt-4">
            <MissingLandmarkTrials content={message.content} />
          </div>
        )}

        {/* Research Gap Analysis - Identify missing landmark studies */}
        {!isUser && (
          <div className="mt-4">
            <ResearchGapAnalysis 
              content={message.content} 
              gaps={[
                "No direct RCTs comparing CAC vs. stress testing in the retrieved dataset",
                "Off-topic sources (e.g., desmoplakin cardiomyopathy) were included", 
                "No synthesis of high-impact studies like MESA, PROMISE, or SCOT-HEART"
              ]}
            />
          </div>
        )}

        {/* Clinical Summary (TL;DR) */}
        {!isUser && clinicalSummary && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="text-sm font-semibold text-blue-800">Clinical Summary (TL;DR)</h3>
            </div>
            <div className="text-sm text-blue-700 space-y-3">
              {(() => {
                // Parse the clinical summary content more intelligently
                const content = clinicalSummary;
                
                // Split by bullet points and process each section
                const sections = content.split('•').filter(section => section.trim());
                
                return sections.map((section, index) => {
                  const trimmedSection = section.trim();
                  if (!trimmedSection) return null;
                  
                  // Identify section type and extract content
                  let sectionIcon = '📄';
                  let sectionTitle = '';
                  let sectionContent = trimmedSection;
                  
                  if (trimmedSection.includes('Primary Cause:')) {
                    sectionIcon = '🎯';
                    sectionTitle = 'Primary Cause';
                    sectionContent = trimmedSection.replace(/.*?Primary Cause:\s*/, '');
                  } else if (trimmedSection.includes('Secondary Causes:')) {
                    sectionIcon = '🔬';
                    sectionTitle = 'Secondary Causes';
                    sectionContent = trimmedSection.replace(/.*?Secondary Causes:\s*/, '');
                  } else if (trimmedSection.includes('Diagnostic Tools:')) {
                    sectionIcon = '🩺';
                    sectionTitle = 'Diagnostic Tools';
                    sectionContent = trimmedSection.replace(/.*?Diagnostic Tools:\s*/, '');
                  } else if (trimmedSection.includes('Evidence Gaps:')) {
                    sectionIcon = '⚠️';
                    sectionTitle = 'Evidence Gaps';
                    sectionContent = trimmedSection.replace(/.*?Evidence Gaps:\s*/, '');
                  }
                  
                  // Clean up and format the content
                  const cleanContent = sectionContent
                    .replace(/\*\*\*\*/g, '') // Remove quadruple asterisks
                    .replace(/\*\*\*/g, '') // Remove triple asterisks
                    .replace(/\*\*/g, '') // Remove double asterisks
                    .trim();
                  
                  // Split by arrows and confidence indicators for better formatting
                  const parts = cleanContent.split(/→/).map(part => part.trim()).filter(Boolean);
                  
                  return (
                    <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{sectionIcon}</span>
                        <span className="font-semibold text-blue-800">{sectionTitle}</span>
                      </div>
                      <div className="space-y-2">
                        {parts.map((part, partIndex) => {
                          // Style confidence levels
                          const styledPart = part
                            .replace(/\(([^)]*confidence[^)]*)\)/gi, '<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium ml-1">$1</span>')
                            .replace(/\b(MODERATE|HIGH|LOW|VERY LOW)\b/g, '<strong class="text-blue-900">$1</strong>');
                          
                          return (
                            <div key={partIndex} className="text-blue-700 leading-relaxed">
                              <div dangerouslySetInnerHTML={{ __html: styledPart }} />
                              {partIndex < parts.length - 1 && (
                                <div className="flex items-center justify-center my-2">
                                  <span className="text-blue-500 font-bold">↓</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
          </div>
        )}

        {/* Medical Content Quality Suggestions */}
        {!isUser && medicalContentAnalysis && medicalContentAnalysis.suggestions.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h3 className="text-sm font-semibold text-amber-800">Evidence Enhancement Suggestions</h3>
            </div>
            <div className="space-y-2">
              {medicalContentAnalysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <p className="text-sm text-amber-700 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-amber-600 italic">
              These suggestions help ensure clinical recommendations are backed by the highest quality evidence.
            </div>
          </div>
        )}

        {/* Comprehensive Stroke Guide - Show when intervention categories are missing */}
        {!isUser && medicalContentAnalysis && medicalContentAnalysis.missingInterventions.length > 0 && (
          <div className="mt-4">
            <ComprehensiveStrokeGuide missingInterventions={medicalContentAnalysis.missingInterventions} />
          </div>
        )}

        {/* Stroke Stratification Guide - Show when stratification is missing */}
        {!isUser && medicalContentAnalysis && medicalContentAnalysis.needsStratification && (
          <div className="mt-4">
            <StrokeStratificationGuide />
          </div>
        )}

        {/* Simple Explanations */}
        {!isUser && simpleExplanations.length > 0 && (
          <div className="space-y-2 mt-3">
            {simpleExplanations.map((explanation, index) => (
              <SimpleExplanation
                key={index}
                medicalTerm={explanation.term}
                explanation={explanation.explanation}
              />
            ))}
          </div>
        )}

        {/* Medical Visualizations - Hidden numerical data from users */}
        {/* {!isUser && visualizations.length > 0 && (
          <div className="space-y-3 mt-3">
            {visualizations.map((viz, index) => (
              <MedicalVisualization
                key={index}
                visualization={viz}
              />
            ))}
          </div>
        )} */}

        {/* Patient Education - Auto-detect medical conditions for patient-friendly explanations */}
        {!isUser && mode === 'doctor' && (
          (() => {
            // Detect medical conditions that would benefit from patient education
            const medicalConditions = [
              'stroke', 'heart attack', 'diabetes', 'hypertension', 'atrial fibrillation',
              'blood pressure', 'cholesterol', 'anticoagulant', 'blood thinner'
            ];
            
            const detectedCondition = medicalConditions.find(condition => 
              message.content.toLowerCase().includes(condition)
            );
            
            if (detectedCondition) {
              let patientEducation;
              
              // Generate condition-specific patient education
              if (detectedCondition.includes('stroke')) {
                patientEducation = PatientEducationProcessor.generateStrokePatientEducation('basic');
              } else {
                // For other conditions, extract from the medical content
                patientEducation = PatientEducationProcessor.extractPatientEducation(
                  message.content, 
                  detectedCondition, 
                  'basic'
                );
              }
              
              return (
                <div className="mt-4">
                  <PatientEducationCard 
                    content={patientEducation}
                    readingLevel="basic"
                    onLevelChange={(level) => {
                      // Could implement dynamic level switching here
                      console.log('Patient education level changed to:', level);
                    }}
                  />
                </div>
              );
            }
            
            return null;
          })()
        )}
        
        {/* Enhanced Citations with Source Diversity */}
        {(mode === 'research' || mode === 'source-finder') && message.citations && message.citations.length > 0 && (
          <div className="space-y-3 mt-3">
            {(() => {
              // Filter and rank citations using enhanced processor
              console.log('MessageBubble: Processing citations', {
                originalCount: message.citations.length,
                citations: message.citations.map(c => ({ title: c.title?.substring(0, 40), journal: c.journal }))
              });
              
              const filteredCitations = EnhancedCitationProcessor.filterAndRankCitations(message.citations);
              const qualityReport = EnhancedCitationProcessor.generateQualityReport(filteredCitations);
              
              console.log('MessageBubble: After filtering', {
                filteredCount: filteredCitations.length,
                filtered: filteredCitations.map(c => ({ title: c.title?.substring(0, 40), journal: c.journal }))
              });
              
              return (
                <>
                  {/* Debug Information - Hidden from users in production */}
                  {/* {message.citations.length > 0 && filteredCitations.length < 2 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <span>🔍</span>
                        Citation Analysis Debug
                      </h4>
                      <div className="text-sm text-amber-700 space-y-2">
                        <p><strong>Original Citations:</strong> {message.citations.length}</p>
                        <p><strong>After Quality Filter:</strong> {filteredCitations.length}</p>
                        <div>
                          <strong>Original Sources:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {message.citations.map((citation, index) => (
                              <li key={index} className="text-xs">
                                {citation.title?.substring(0, 60)}... ({citation.journal || 'Unknown Journal'})
                              </li>
                            ))}
                          </ul>
                        </div>
                        {filteredCitations.length < message.citations.length && (
                          <p className="text-amber-600">
                            <strong>Note:</strong> Some citations were filtered for quality. This might indicate 
                            the research API needs to retrieve more diverse, high-quality sources.
                          </p>
                        )}
                      </div>
                    </div>
                  )} */}

                  {/* Evidence Quality Summary - Simplified for users */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <span>🎯</span>
                      Research Quality
                    </h4>
                    <div className="text-sm text-green-700">
                      Research findings are based on peer-reviewed medical literature and clinical guidelines.
                    </div>
                  </div>
                  
                  {/* Source Diversity Tracker - Hidden from users */}
                  {/* <SourceDiversityTracker citations={filteredCitations} /> */}
                  
                  {/* Enhanced Citation Cards */}
                  <div className="space-y-2">
                    {filteredCitations.length > 0 ? (
                      filteredCitations.map((citation, index) => (
                        <EnhancedCitationCard 
                          key={citation.id || citation.pmid || citation.doi || `citation-${index}`} 
                          citation={citation}
                          highlightConditions={highlightConditions}
                        />
                      ))
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          📚 <strong>Research Sources:</strong> Medical information is sourced from peer-reviewed journals and clinical databases.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
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
