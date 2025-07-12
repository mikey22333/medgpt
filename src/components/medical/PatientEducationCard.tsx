/**
 * PatientEducationCard Component
 * Provides simplified, patient-friendly explanations of medical content
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lightbulb,
  Shield,
  Calendar,
  User
} from 'lucide-react';

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

interface PatientEducationCardProps {
  content: PatientEducationContent;
  readingLevel?: 'basic' | 'intermediate' | 'advanced';
  onLevelChange?: (level: 'basic' | 'intermediate' | 'advanced') => void;
}

export const PatientEducationCard: React.FC<PatientEducationCardProps> = ({ 
  content, 
  readingLevel = 'basic',
  onLevelChange 
}) => {
  const getReadingLevelBadge = () => {
    const levels = {
      basic: { label: '6th Grade Level', color: 'bg-green-100 text-green-800' },
      intermediate: { label: '9th Grade Level', color: 'bg-blue-100 text-blue-800' },
      advanced: { label: '12th Grade Level', color: 'bg-purple-100 text-purple-800' }
    };
    return levels[readingLevel];
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-blue-900">
              Patient Education: {content.condition}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReadingLevelBadge().color}`}>
              {getReadingLevelBadge().label}
            </div>
            {onLevelChange && (
              <div className="flex gap-1">
                {(['basic', 'intermediate', 'advanced'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={readingLevel === level ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs px-2 py-1"
                    onClick={() => onLevelChange(level)}
                  >
                    {level === 'basic' ? 'Simple' : level === 'intermediate' ? 'Medium' : 'Detailed'}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Simple Explanation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">What This Means</h4>
              <p className="text-blue-800 leading-relaxed">{content.simpleExplanation}</p>
            </div>
          </div>
        </div>

        {/* Key Points */}
        {content.keyPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Key Things to Remember</h4>
            </div>
            <ul className="space-y-2">
              {content.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lifestyle Changes */}
        {content.lifestyleChanges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-gray-900">Healthy Lifestyle Changes</h4>
            </div>
            <div className="grid gap-2">
              {content.lifestyleChanges.map((change, index) => (
                <div key={index} className="bg-red-50 rounded-lg p-3 border-l-3 border-l-red-300">
                  <span className="text-red-800">{change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications Simplified */}
        {content.medicationSimplified && content.medicationSimplified.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">About Your Medications</h4>
            </div>
            <div className="space-y-3">
              {content.medicationSimplified.map((med, index) => (
                <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h5 className="font-medium text-purple-900 mb-2">{med.name}</h5>
                  <p className="text-purple-800 mb-3">{med.purpose}</p>
                  
                  {med.commonSideEffects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-purple-900 mb-1">Common Side Effects:</p>
                      <p className="text-sm text-purple-700">{med.commonSideEffects.join(', ')}</p>
                    </div>
                  )}
                  
                  {med.importantNotes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">Important:</p>
                      <ul className="text-sm text-purple-700">
                        {med.importantNotes.map((note, noteIndex) => (
                          <li key={noteIndex} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Signs */}
        {content.warningSigns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h4 className="font-medium text-gray-900">Watch Out For These Signs</h4>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <ul className="space-y-2">
                {content.warningSigns.map((sign, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-800">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* When to See Doctor */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Urgent */}
          {content.whenToSeeDoctorUrgently.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-900">Call Doctor Right Away If:</h4>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <ul className="space-y-1 text-sm">
                  {content.whenToSeeDoctorUrgently.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-red-800">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Routine */}
          {content.whenToSeeDoctorRoutine.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Schedule an Appointment If:</h4>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <ul className="space-y-1 text-sm">
                  {content.whenToSeeDoctorRoutine.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-blue-800">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Educational Disclaimer */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Remember:</p>
              <p>This information is for education only. Always follow your doctor's specific instructions. 
                 If you have questions or concerns, contact your healthcare provider.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientEducationCard;
