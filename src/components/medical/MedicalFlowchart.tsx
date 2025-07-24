import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, Heart, Brain, Pill, Activity, Stethoscope, Eye, Wind, Bone, Baby, Users } from "lucide-react";

interface MedicalFlowchartProps {
  content: string;
  patientFriendly?: boolean;
}

export function MedicalFlowchart({ content, patientFriendly = false }: MedicalFlowchartProps) {
  // Detect medical condition and generate appropriate flowchart
  const detectMedicalCondition = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    // Cardiovascular conditions
    if (lowerContent.includes('stroke') || lowerContent.includes('cerebrovascular')) {
      return 'stroke';
    }
    if (lowerContent.includes('heart attack') || lowerContent.includes('myocardial infarction') || lowerContent.includes('coronary')) {
      return 'heartAttack';
    }
    if (lowerContent.includes('hypertension') || lowerContent.includes('blood pressure') || lowerContent.includes('bp')) {
      return 'hypertension';
    }
    if (lowerContent.includes('diabetes') || lowerContent.includes('blood sugar') || lowerContent.includes('glucose')) {
      return 'diabetes';
    }
    
    // Respiratory conditions
    if (lowerContent.includes('asthma') || lowerContent.includes('bronchodilator')) {
      return 'asthma';
    }
    if (lowerContent.includes('copd') || lowerContent.includes('chronic obstructive')) {
      return 'copd';
    }
    
    // Other conditions
    if (lowerContent.includes('depression') || lowerContent.includes('anxiety') || lowerContent.includes('mental health')) {
      return 'mentalHealth';
    }
    if (lowerContent.includes('osteoporosis') || lowerContent.includes('bone density')) {
      return 'osteoporosis';
    }
    if (lowerContent.includes('pregnancy') || lowerContent.includes('prenatal')) {
      return 'pregnancy';
    }
    
    // Default to general treatment approach
    return 'general';
  };

  const getFlowchartData = (condition: string) => {
    const flowcharts = {
      stroke: {
        title: "Stroke Prevention & Management",
        icon: Brain,
        color: "blue",
        pathways: [
          {
            title: "Initial Assessment",
            description: "Evaluate stroke etiology and risk factors",
            icon: Activity,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Atrial Fibrillation",
            description: "Irregular heart rhythm increases clot risk",
            icon: Heart,
            medications: ["Warfarin", "Apixaban", "Rivaroxaban"],
            className: "bg-red-50 border-red-200"
          },
          {
            title: "Antiplatelet Therapy",
            description: "Prevent platelet aggregation",
            icon: Pill,
            medications: ["Aspirin", "Clopidogrel"],
            className: "bg-blue-50 border-blue-200"
          }
        ]
      },
      
      heartAttack: {
        title: "Heart Attack Prevention & Management",
        icon: Heart,
        color: "red",
        pathways: [
          {
            title: "Risk Assessment",
            description: "Evaluate cardiovascular risk factors",
            icon: Activity,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Acute Management",
            description: "Immediate intervention for STEMI/NSTEMI",
            icon: Stethoscope,
            medications: ["Aspirin", "Clopidogrel", "Metoprolol"],
            className: "bg-red-50 border-red-200"
          },
          {
            title: "Long-term Prevention",
            description: "Secondary prevention strategies",
            icon: Pill,
            medications: ["Statin", "ACE inhibitor", "Beta-blocker"],
            className: "bg-green-50 border-green-200"
          }
        ]
      },
      
      hypertension: {
        title: "Hypertension Management",
        icon: Activity,
        color: "orange",
        pathways: [
          {
            title: "Blood Pressure Assessment",
            description: "Confirm diagnosis with multiple readings",
            icon: Activity,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Lifestyle Modifications",
            description: "Diet, exercise, weight management",
            icon: Heart,
            medications: ["DASH diet", "Exercise", "Weight loss"],
            className: "bg-yellow-50 border-yellow-200"
          },
          {
            title: "Pharmacotherapy",
            description: "Antihypertensive medications",
            icon: Pill,
            medications: ["ACE inhibitor", "ARB", "Thiazide", "Amlodipine"],
            className: "bg-orange-50 border-orange-200"
          }
        ]
      },
      
      diabetes: {
        title: "Diabetes Management",
        icon: Activity,
        color: "purple",
        pathways: [
          {
            title: "Diagnosis & Assessment",
            description: "HbA1c, fasting glucose, complications screening",
            icon: Activity,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Lifestyle Interventions",
            description: "Diet modification and physical activity",
            icon: Heart,
            medications: ["Carb counting", "Exercise plan", "Weight management"],
            className: "bg-green-50 border-green-200"
          },
          {
            title: "Glycemic Control",
            description: "Medications to control blood sugar",
            icon: Pill,
            medications: ["Metformin", "Insulin", "GLP-1 agonist"],
            className: "bg-purple-50 border-purple-200"
          }
        ]
      },
      
      asthma: {
        title: "Asthma Management",
        icon: Wind,
        color: "blue",
        pathways: [
          {
            title: "Asthma Assessment",
            description: "Spirometry, peak flow, symptom control",
            icon: Wind,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Controller Therapy",
            description: "Daily medications for long-term control",
            icon: Pill,
            medications: ["ICS", "LABA", "LTRA"],
            className: "bg-blue-50 border-blue-200"
          },
          {
            title: "Rescue Therapy",
            description: "Quick-relief medications for acute symptoms",
            icon: Activity,
            medications: ["Albuterol", "Levalbuterol"],
            className: "bg-red-50 border-red-200"
          }
        ]
      },
      
      general: {
        title: "Medical Management Approach",
        icon: Stethoscope,
        color: "green",
        pathways: [
          {
            title: "Clinical Assessment",
            description: "History, physical exam, diagnostic tests",
            icon: Stethoscope,
            medications: [],
            className: "bg-gray-50 border-gray-200"
          },
          {
            title: "Treatment Planning",
            description: "Evidence-based intervention strategies",
            icon: Brain,
            medications: ["Lifestyle modifications", "Risk factor control"],
            className: "bg-green-50 border-green-200"
          },
          {
            title: "Monitoring & Follow-up",
            description: "Regular assessment and adjustment",
            icon: Activity,
            medications: ["Clinical monitoring", "Patient education"],
            className: "bg-blue-50 border-blue-200"
          }
        ]
      }
    };
    
    return flowcharts[condition as keyof typeof flowcharts] || flowcharts.general;
  };

  const condition = detectMedicalCondition(content);
  const flowchartData = getFlowchartData(condition);

  const FlowStep = ({ 
    icon: Icon, 
    title, 
    description, 
    medications, 
    className = "",
    isDecision = false 
  }: {
    icon: any;
    title: string;
    description: string;
    medications?: string[];
    className?: string;
    isDecision?: boolean;
  }) => (
    <div className={`p-4 rounded-lg border-2 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      {medications && medications.length > 0 && (
        <div className="space-y-1">
          {medications.map((med, index) => (
            <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
              {med}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const Arrow = ({ direction = "down", className = "" }: { direction?: "down" | "right"; className?: string }) => (
    <div className={`flex justify-center items-center ${className}`}>
      {direction === "down" ? (
        <ArrowDown className="h-6 w-6 text-gray-400" />
      ) : (
        <ArrowRight className="h-6 w-6 text-gray-400" />
      )}
    </div>
  );

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <flowchartData.icon className={`h-5 w-5 text-${flowchartData.color}-600`} />
          {patientFriendly ? `Understanding ${flowchartData.title}` : flowchartData.title}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {patientFriendly 
            ? "A visual guide to help you understand your care plan" 
            : "Evidence-based clinical approach and management pathway"
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Dynamic Pathways */}
          {flowchartData.pathways.map((pathway, index) => (
            <div key={index}>
              <FlowStep
                icon={pathway.icon}
                title={patientFriendly ? pathway.title.replace(/Assessment|Pharmacotherapy|Diagnosis/, (match) => {
                  switch(match) {
                    case 'Assessment': return 'Evaluation';
                    case 'Pharmacotherapy': return 'Medication Treatment';
                    case 'Diagnosis': return 'Testing';
                    default: return match;
                  }
                }) : pathway.title}
                description={patientFriendly ? pathway.description.replace(/HbA1c|BP|antiplatelet/gi, (match) => {
                  switch(match.toLowerCase()) {
                    case 'hba1c': return 'blood sugar test';
                    case 'bp': return 'blood pressure';
                    case 'antiplatelet': return 'blood thinner';
                    default: return match;
                  }
                }) : pathway.description}
                medications={pathway.medications}
                className={pathway.className}
              />
              {index < flowchartData.pathways.length - 1 && <Arrow />}
            </div>
          ))}
          
          {/* Clinical Decision Points */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 text-yellow-800">Key Clinical Considerations:</h5>
            <ul className="text-xs text-yellow-700 space-y-1">
              {condition === 'stroke' && (
                <>
                  <li>• <strong>AFib detected?</strong> → Anticoagulation (consider CHA₂DS₂-VASc score)</li>
                  <li>• <strong>Large artery atherosclerosis?</strong> → Antiplatelet + statin</li>
                  <li>• <strong>Small vessel disease?</strong> → Antiplatelet + BP control</li>
                </>
              )}
              {condition === 'heartAttack' && (
                <>
                  <li>• <strong>STEMI present?</strong> → Primary PCI within 90 minutes</li>
                  <li>• <strong>High-risk NSTEMI?</strong> → Early invasive strategy</li>
                  <li>• <strong>Contraindications?</strong> → Alternative therapies</li>
                </>
              )}
              {condition === 'hypertension' && (
                <>
                  <li>• <strong>Stage 1 HTN?</strong> → Lifestyle + single agent</li>
                  <li>• <strong>Stage 2 HTN?</strong> → Combination therapy</li>
                  <li>• <strong>Resistant HTN?</strong> → Specialist referral</li>
                </>
              )}
              {condition === 'diabetes' && (
                <>
                  <li>• <strong>HbA1c &gt; 9%?</strong> → Dual therapy or insulin</li>
                  <li>• <strong>CVD risk factors?</strong> → GLP-1 agonist or SGLT2i</li>
                  <li>• <strong>Hypoglycemia risk?</strong> → Avoid sulfonylureas</li>
                </>
              )}
              {condition === 'asthma' && (
                <>
                  <li>• <strong>Well-controlled?</strong> → Continue current therapy</li>
                  <li>• <strong>Poorly controlled?</strong> → Step up therapy</li>
                  <li>• <strong>Severe exacerbation?</strong> → Systemic corticosteroids</li>
                </>
              )}
              {condition === 'general' && (
                <>
                  <li>• <strong>Evidence-based guidelines</strong> → Follow clinical protocols</li>
                  <li>• <strong>Patient preferences</strong> → Shared decision making</li>
                  <li>• <strong>Comorbidities</strong> → Consider drug interactions</li>
                </>
              )}
            </ul>
          </div>
          
          {/* Implementation Timeline */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-sm mb-2 text-blue-800">
              {patientFriendly ? "Your Care Timeline:" : "Implementation Timeline:"}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-medium text-blue-700">
                  {patientFriendly ? "Right Now (Today)" : "Immediate (0-24h)"}
                </p>
                <p className="text-blue-600">
                  {condition === 'stroke' && (patientFriendly ? "Start protective medications, monitor blood pressure" : "Acute antiplatelet, BP control")}
                  {condition === 'heartAttack' && (patientFriendly ? "Blood thinners to protect your heart" : "Antiplatelet, anticoagulation")}
                  {condition === 'hypertension' && (patientFriendly ? "Confirm high blood pressure, check your risk" : "Confirm diagnosis, assess risk")}
                  {condition === 'diabetes' && (patientFriendly ? "Check blood sugar levels regularly" : "Glucose monitoring, ketone check")}
                  {condition === 'asthma' && (patientFriendly ? "Use your rescue inhaler, check breathing" : "Peak flow, rescue inhaler")}
                  {condition === 'general' && (patientFriendly ? "Initial check-up and immediate care" : "Initial assessment, stabilization")}
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700">
                  {patientFriendly ? "This Week" : "Short-term (1-7 days)"}
                </p>
                <p className="text-blue-600">
                  {condition === 'stroke' && (patientFriendly ? "Start long-term prevention medications" : "Initiate long-term prevention")}
                  {condition === 'heartAttack' && (patientFriendly ? "Begin heart protection medications" : "Secondary prevention drugs")}
                  {condition === 'hypertension' && (patientFriendly ? "Start blood pressure medication" : "Start antihypertensive")}
                  {condition === 'diabetes' && (patientFriendly ? "Begin diabetes medication (usually Metformin)" : "Metformin initiation")}
                  {condition === 'asthma' && (patientFriendly ? "Start daily controller medication" : "Controller therapy start")}
                  {condition === 'general' && (patientFriendly ? "Begin your treatment plan" : "Treatment initiation")}
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700">
                  {patientFriendly ? "Ongoing Care" : "Long-term (ongoing)"}
                </p>
                <p className="text-blue-600">
                  {condition === 'stroke' && (patientFriendly ? "Healthy lifestyle changes, regular check-ups" : "Risk factor modification")}
                  {condition === 'heartAttack' && (patientFriendly ? "Heart-healthy living, regular monitoring" : "Lifestyle changes, monitoring")}
                  {condition === 'hypertension' && (patientFriendly ? "Regular blood pressure checks, medication adjustments" : "BP monitoring, titration")}
                  {condition === 'diabetes' && (patientFriendly ? "Regular blood sugar monitoring, complication prevention" : "HbA1c monitoring, complications")}
                  {condition === 'asthma' && (patientFriendly ? "Monitor breathing, adjust medications as needed" : "Asthma control assessment")}
                  {condition === 'general' && (patientFriendly ? "Regular follow-ups, treatment adjustments" : "Ongoing monitoring, adjustment")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
