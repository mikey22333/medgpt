"use client";

import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Logo />
              <span className="text-xl font-bold text-slate-900">CliniSynth</span>
            </Link>
            <Link 
              href="/" 
              className="text-primary hover:text-primary/80 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-slate-600">
            Last updated: July 1, 2025
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-green-600">
            <Shield className="w-5 h-5" />
            <span className="font-medium">HIPAA Compliant • SOC 2 Certified</span>
          </div>
        </div>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-2 text-primary" />
              1. Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Account Information</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Email address and name</li>
                  <li>• Professional credentials and institution</li>
                  <li>• Subscription and billing information</li>
                  <li>• Account preferences and settings</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Usage Data</h3>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• Research queries and search terms (anonymized)</li>
                  <li>• Feature usage patterns</li>
                  <li>• Session duration and frequency</li>
                  <li>• Technical performance metrics</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">⚠️ What We DON'T Collect</h3>
                <ul className="text-amber-800 space-y-1 text-sm">
                  <li>• Patient data or protected health information (PHI)</li>
                  <li>• Clinical records or patient identifiers</li>
                  <li>• Personal medical information</li>
                  <li>• Sensitive research data beyond anonymized queries</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center">
              <Database className="w-6 h-6 mr-2 text-primary" />
              2. How We Use Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Service Delivery</h3>
                <ul className="text-slate-700 space-y-1 text-sm">
                  <li>• Provide AI-powered research assistance</li>
                  <li>• Generate evidence summaries and analyses</li>
                  <li>• Maintain your account and preferences</li>
                  <li>• Process subscription payments</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Service Improvement</h3>
                <ul className="text-slate-700 space-y-1 text-sm">
                  <li>• Enhance AI model performance</li>
                  <li>• Improve user experience and features</li>
                  <li>• Analyze usage patterns (anonymized)</li>
                  <li>• Provide customer support</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center">
              <Lock className="w-6 h-6 mr-2 text-primary" />
              3. Data Security & Protection
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900">Encryption</h3>
                  <p className="text-sm text-slate-600">End-to-end encryption for all data transmission</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900">Access Control</h3>
                  <p className="text-sm text-slate-600">Multi-factor authentication and role-based access</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Database className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900">Secure Storage</h3>
                  <p className="text-sm text-slate-600">SOC 2 compliant cloud infrastructure</p>
                </div>
              </div>
              
              <div className="bg-slate-900 text-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">Security Measures Include:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-1">
                    <li>• AES-256 data encryption</li>
                    <li>• Regular security audits</li>
                    <li>• Intrusion detection systems</li>
                    <li>• Secure API endpoints</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• Data backup and recovery</li>
                    <li>• Employee security training</li>
                    <li>• Incident response procedures</li>
                    <li>• Third-party security assessments</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-primary" />
              4. Data Sharing & Disclosure
            </h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">🚫 We Do NOT Share</h3>
                <ul className="text-red-800 space-y-1 text-sm">
                  <li>• Personal research queries or content</li>
                  <li>• Individual user behavior or preferences</li>
                  <li>• Account information with third parties</li>
                  <li>• Data for marketing or advertising purposes</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">✅ Limited Sharing Scenarios</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Service providers (hosting, payment processing) under strict agreements</li>
                  <li>• Legal compliance when required by law</li>
                  <li>• Anonymized, aggregated usage statistics for research</li>
                  <li>• Business transfers (with user notification)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. HIPAA Compliance</h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Our HIPAA Commitment</h3>
                <p className="text-green-800 text-sm mb-2">
                  While CliniSynth is designed with healthcare privacy in mind, it is not intended for processing PHI.
                </p>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• We implement technical safeguards for data protection</li>
                  <li>• Administrative controls limit data access</li>
                  <li>• Physical security protects our infrastructure</li>
                  <li>• Regular compliance audits ensure adherence</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">User Responsibility</h3>
                <p className="text-amber-800 text-sm">
                  Users must NOT input protected health information (PHI) including patient names, dates of birth, social security numbers, or other identifiers into CliniSynth.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Your Privacy Rights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Access & Control</h3>
                <ul className="text-slate-700 space-y-1 text-sm">
                  <li>• View your account data</li>
                  <li>• Update personal information</li>
                  <li>• Download your data</li>
                  <li>• Delete your account</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Privacy Controls</h3>
                <ul className="text-slate-700 space-y-1 text-sm">
                  <li>• Opt out of analytics</li>
                  <li>• Manage communications</li>
                  <li>• Request data portability</li>
                  <li>• Report privacy concerns</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Data Retention</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion to allow recovery.</p>
              <p><strong>Usage Analytics:</strong> Anonymized data may be retained for up to 2 years for service improvement.</p>
              <p><strong>Billing Records:</strong> Maintained for 7 years as required by financial regulations.</p>
              <p><strong>Research Queries:</strong> Anonymized queries may be retained to improve AI model performance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. International Data Transfers</h2>
            <div className="space-y-3 text-slate-700">
              <p>
                CliniSynth operates globally. Your data may be processed in countries where we operate, including the United States and European Union. We ensure appropriate safeguards are in place for international transfers.
              </p>
              <p><strong>EU Users:</strong> We comply with GDPR requirements and use Standard Contractual Clauses for data transfers.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Cookies & Tracking</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Essential Cookies:</strong> Required for authentication and basic functionality.</p>
              <p><strong>Analytics Cookies:</strong> Help us understand usage patterns (can be disabled).</p>
              <p><strong>No Advertising:</strong> We do not use tracking cookies for advertising purposes.</p>
              <p>You can manage cookie preferences in your browser settings.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Updates to This Policy</h2>
            <div className="space-y-3 text-slate-700">
              <p>
                We may update this Privacy Policy periodically. Significant changes will be communicated via email and prominently displayed on our platform. The "Last updated" date at the top indicates the most recent revision.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Contact & Data Protection Officer</h2>
            <div className="space-y-3 text-slate-700">
              <p>For privacy-related questions, concerns, or requests:</p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p><strong>Privacy Team:</strong> privacy@clinisynth.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@clinisynth.com</p>
                <p><strong>Address:</strong> [Your Company Address]</p>
                <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Regulatory Compliance</h2>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">GDPR</h3>
                <p className="text-sm text-blue-700">European Union compliance</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900">CCPA</h3>
                <p className="text-sm text-green-700">California privacy rights</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900">HIPAA</h3>
                <p className="text-sm text-purple-700">Healthcare privacy standards</p>
              </div>
            </div>
          </section>
        </Card>

        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to CliniSynth
          </Link>
        </div>
      </main>
    </div>
  );
}
