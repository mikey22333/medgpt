import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, BookOpen, Users } from "lucide-react";

interface TLDRSummaryProps {
  content: string;
  condition?: string;
}

export function TLDRSummary({ content, condition }: TLDRSummaryProps) {
  // Extract or generate patient-friendly TL;DR
  const generatePatientTLDR = (content: string, condition?: string) => {
    // Check if there's already a TL;DR section
    const tldrMatch = content.match(/TL;DR[:\s]*([^•]*?)(?:•|$)/i);
    if (tldrMatch) {
      return tldrMatch[1].trim();
    }

    // Generate condition-specific TL;DR based on content analysis
    if (condition?.toLowerCase().includes('stroke')) {
      if (content.includes('atrial fibrillation') || content.includes('AFib')) {
        return "If you have irregular heartbeat (atrial fibrillation), blood thinners can significantly reduce your stroke risk. Work with your doctor to find the right medication and dose for you.";
      }
      if (content.includes('blood pressure') || content.includes('hypertension')) {
        return "Keeping your blood pressure under control is one of the most important things you can do to prevent stroke. Even small improvements can make a big difference.";
      }
      if (content.includes('diabetes')) {
        return "Managing diabetes well (keeping blood sugar levels steady) helps protect your blood vessels and reduces stroke risk. Regular monitoring and medication compliance are key.";
      }
      return "Stroke prevention involves controlling risk factors like blood pressure, cholesterol, and diabetes, plus taking prescribed medications. Small daily changes can significantly reduce your risk.";
    }
    
    // Generic medical TL;DR
    return "This medical information is based on current research and guidelines. Always discuss treatment options with your healthcare provider to determine what's best for your specific situation.";
  };

  const tldrText = generatePatientTLDR(content, condition);

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-blue-900">TL;DR for Patients</h3>
              <Badge variant="secondary" className="text-xs">Plain English</Badge>
            </div>
            <p className="text-blue-800 leading-relaxed">{tldrText}</p>
            <p className="text-xs text-blue-600 mt-2 italic">
              💡 This summary is written in simple terms. See full explanation below for details.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface GuidelineQuoteProps {
  content: string;
}

export function GuidelineQuote({ content }: GuidelineQuoteProps) {
  // Extract or identify relevant guideline quotes
  const getGuidelineQuotes = (content: string) => {
    const quotes = [];
    
    // AHA/ASA guideline patterns for stroke prevention
    if (content.includes('atrial fibrillation') || content.includes('AFib')) {
      quotes.push({
        organization: 'AHA/ASA',
        quote: '"Oral anticoagulation with warfarin or a NOAC is recommended for patients with atrial fibrillation and a CHA₂DS₂-VASc score ≥2 in men or ≥3 in women."',
        reference: '2019 AHA/ASA Stroke Prevention Guidelines',
        pmid: 'PMID: 30700139'
      });
    }
    
    if (content.includes('blood pressure') || content.includes('hypertension')) {
      quotes.push({
        organization: 'AHA/ASA',
        quote: '"Antihypertensive treatment is recommended for secondary stroke prevention to reduce the risk of recurrent stroke and other vascular events."',
        reference: '2021 AHA/ASA Secondary Prevention Guidelines',
        pmid: 'PMID: 34024117'
      });
    }
    
    if (content.includes('diabetes') && content.includes('stroke')) {
      quotes.push({
        organization: 'AHA/ASA',
        quote: '"Diabetes management with a target HbA1c of <7% is reasonable for reducing microvascular complications and possibly macrovascular events."',
        reference: '2021 AHA/ASA Secondary Prevention Guidelines',
        pmid: 'PMID: 34024117'
      });
    }

    // ESC guideline patterns
    if (content.includes('anticoagulation') || content.includes('NOAC')) {
      quotes.push({
        organization: 'ESC',
        quote: '"NOACs are preferred over vitamin K antagonists for stroke prevention in atrial fibrillation when both are suitable."',
        reference: '2020 ESC Guidelines for Atrial Fibrillation',
        pmid: 'PMID: 32860505'
      });
    }
    
    return quotes;
  };

  const quotes = getGuidelineQuotes(content);
  
  if (quotes.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {quotes.map((quote, index) => (
        <Card key={index} className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Quote className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {quote.organization}
                  </Badge>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <blockquote className="text-green-800 italic mb-2 leading-relaxed">
                  {quote.quote}
                </blockquote>
                <div className="text-xs text-green-600 space-y-1">
                  <p className="font-medium">{quote.reference}</p>
                  <p className="font-mono">{quote.pmid}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface LandmarkTrialProps {
  content: string;
}

export function LandmarkTrial({ content }: LandmarkTrialProps) {
  // Extract or identify relevant landmark trials
  const getLandmarkTrials = (content: string) => {
    const trials = [];
    
    // PROGRESS trial for blood pressure
    if (content.includes('blood pressure') || content.includes('hypertension') || content.includes('perindopril')) {
      trials.push({
        name: 'PROGRESS',
        description: 'Perindopril Protection Against Recurrent Stroke Study',
        finding: 'ACE inhibitor reduced stroke risk by 28% in patients with previous stroke or TIA',
        participants: '6,105 patients',
        pmid: 'PMID: 11451936',
        year: '2001'
      });
    }
    
    // UKPDS for diabetes
    if (content.includes('diabetes') || content.includes('HbA1c') || content.includes('glucose')) {
      trials.push({
        name: 'UKPDS',
        description: 'UK Prospective Diabetes Study',
        finding: 'Intensive glucose control reduced microvascular complications by 25%',
        participants: '5,102 patients with Type 2 diabetes',
        pmid: 'PMID: 9742977',
        year: '1998'
      });
    }
    
    // COMPASS trial for dual therapy
    if (content.includes('rivaroxaban') || content.includes('aspirin') || content.includes('dual therapy')) {
      trials.push({
        name: 'COMPASS',
        description: 'Cardiovascular Outcomes for People Using Anticoagulation Strategies',
        finding: 'Low-dose rivaroxaban plus aspirin reduced stroke risk by 42%',
        participants: '27,395 patients with stable cardiovascular disease',
        pmid: 'PMID: 28844192',
        year: '2017'
      });
    }
    
    return trials;
  };

  const trials = getLandmarkTrials(content);
  
  if (trials.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        Key Clinical Trials
      </h4>
      {trials.map((trial, index) => (
        <Card key={index} className="border-l-4 border-l-purple-500 bg-purple-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-purple-900">{trial.name} ({trial.year})</h5>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                  {trial.participants}
                </Badge>
              </div>
              <p className="text-sm text-purple-700 italic">{trial.description}</p>
              <p className="text-purple-800 font-medium">{trial.finding}</p>
              <p className="text-xs text-purple-600 font-mono">{trial.pmid}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
