"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Award, 
  Sparkles, 
  FileText, 
  Stethoscope, 
  BookOpen, 
  Database,
  Filter,
  BarChart3,
  Shield,
  Download
} from "lucide-react";

const medgptModes = [
  {
    mode: "Research Mode",
    description: "Comprehensive research assistance for academic and clinical investigations",
    badge: "Most Popular",
    badgeColor: "bg-blue-500",
    gradient: "from-blue-50 to-white border-blue-200",
    features: [
      {
        icon: Search,
        title: "Advanced Literature Search",
        description: "Unified search across PubMed, CrossRef, EuropePMC, and OpenAlex with semantic understanding"
      },
      {
        icon: TrendingUp,
        title: "Meta-Analysis & Effect Sizes",
        description: "Automated statistical analysis with I² statistics and confidence intervals"
      },
      {
        icon: Award,
        title: "GRADE Quality Assessment",
        description: "Evidence certainty scoring with bias detection and recommendation strength"
      },
      {
        icon: FileText,
        title: "Research Report Export",
        description: "Publication-ready PDF reports with proper citations and methodology"
      }
    ]
  },
  {
    mode: "Doctor Mode",
    description: "Clinical decision support with evidence-based recommendations",
    badge: "Clinical Focus",
    badgeColor: "bg-green-500",
    gradient: "from-green-50 to-white border-green-200",
    features: [
      {
        icon: Stethoscope,
        title: "Clinical Decision Support",
        description: "Evidence-based treatment recommendations with risk-benefit analysis"
      },
      {
        icon: Sparkles,
        title: "Diagnostic Assistance",
        description: "Differential diagnosis suggestions based on symptoms and latest research"
      },
      {
        icon: Shield,
        title: "Safety Alerts & Contraindications",
        description: "Real-time FDA alerts, drug interactions, and safety considerations"
      },
      {
        icon: BarChart3,
        title: "Patient Outcome Predictions",
        description: "Evidence-based prognosis and treatment success probability estimates"
      }
    ]
  },
  {
    mode: "Source-Finder Mode",
    description: "Quick access to specific studies and research papers",
    badge: "Fast Access",
    badgeColor: "bg-purple-500",
    gradient: "from-purple-50 to-white border-purple-200",
    features: [
      {
        icon: Database,
        title: "Multi-Database Search",
        description: "Instant access to millions of papers across all major medical databases"
      },
      {
        icon: Filter,
        title: "Smart Filtering",
        description: "Advanced filters by study type, publication date, impact factor, and relevance"
      },
      {
        icon: BookOpen,
        title: "Full-Text Access",
        description: "Direct links to open access papers and institutional access integration"
      },
      {
        icon: Download,
        title: "Citation Management",
        description: "Export citations in APA, MLA, Vancouver, and other academic formats"
      }
    ]
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Three Powerful Modes for Every Medical Need
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            MedGPT Scholar adapts to your workflow with specialized modes for research, clinical practice, and literature discovery.
          </p>
        </motion.div>

        {/* Three-column mode comparison */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {medgptModes.map((mode, modeIndex) => (
            <motion.div
              key={modeIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: modeIndex * 0.1 }}
              className="relative"
            >
              <Card className={`bg-gradient-to-br ${mode.gradient} p-8 hover:shadow-xl transition-all duration-300 flex flex-col h-full`}>
                <div className="flex flex-col h-full">
                  {/* Mode Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {mode.mode}
                      </h3>
                      {mode.badge && (
                        <Badge className={`${mode.badgeColor} text-white px-2 py-1 text-xs font-medium`}>
                          {mode.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {mode.description}
                    </p>
                  </div>

                  {/* Mode Features List */}
                  <div className="flex-1">
                    {mode.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3 mb-4">
                        <div className={`w-8 h-8 ${mode.badgeColor} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mode CTA - Fixed at bottom */}
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a
                      href="/auth/login?redirectedFrom=/chat"
                      className={`w-full inline-flex items-center justify-center px-4 py-2 ${mode.badgeColor} text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm`}
                    >
                      Try {mode.mode}
                    </a>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to revolutionize your medical research?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Join thousands of medical professionals using MedGPT Scholar to make faster, more informed decisions.
            </p>
            <a
              href="/auth/login?redirectedFrom=/chat"
              className="inline-flex items-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try All Modes Free
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
