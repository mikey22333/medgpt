"use client";

import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 medical-gradient rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">MedGPT Scholar</span>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-600">
            Last updated: July 1, 2025
          </p>
        </div>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              By accessing and using MedGPT Scholar ("Service"), you accept and agree to be bound by the terms and provision of this agreement. MedGPT Scholar is an AI-powered medical research assistant designed for healthcare professionals and researchers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Medical Disclaimer</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 font-medium">
                ⚠️ IMPORTANT MEDICAL DISCLAIMER
              </p>
            </div>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Not Medical Advice:</strong> MedGPT Scholar provides research assistance and information synthesis tools. It does NOT provide medical advice, diagnosis, or treatment recommendations.
              </p>
              <p>
                <strong>Professional Judgment Required:</strong> All information provided must be independently verified and interpreted by qualified healthcare professionals. Clinical decisions should never be based solely on AI-generated content.
              </p>
              <p>
                <strong>No Patient Care:</strong> This service is not intended for direct patient care, emergency situations, or real-time clinical decision making.
              </p>
              <p>
                <strong>Accuracy Limitations:</strong> While we strive for accuracy, AI-generated content may contain errors, omissions, or outdated information. Always consult primary sources and current medical literature.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Permitted Use</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Authorized Users:</strong> Healthcare professionals, medical researchers, students, and educators.</p>
              <p><strong>Permitted Activities:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Literature review and research assistance</li>
                <li>Academic and educational purposes</li>
                <li>Research methodology support</li>
                <li>Evidence synthesis and analysis</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Prohibited Use</h2>
            <div className="space-y-3 text-slate-700">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use the service for direct patient diagnosis or treatment</li>
                <li>Make clinical decisions based solely on AI outputs</li>
                <li>Share patient data or protected health information</li>
                <li>Use the service in emergency medical situations</li>
                <li>Attempt to reverse engineer or copy our AI models</li>
                <li>Use the service for illegal or harmful purposes</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. User Accounts and Subscriptions</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p><strong>Subscription Plans:</strong> We offer Free and Pro subscription tiers with different usage limits and features.</p>
              <p><strong>Payment Terms:</strong> Pro subscriptions are billed monthly. Fees are non-refundable except as required by law.</p>
              <p><strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Data and Privacy</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Query Data:</strong> We process your research queries to provide AI-generated responses. We do not store personal patient information.</p>
              <p><strong>Usage Analytics:</strong> We collect anonymized usage data to improve our service.</p>
              <p><strong>HIPAA Compliance:</strong> While we implement security measures, users must not input protected health information (PHI).</p>
              <p>For detailed information, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Intellectual Property</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Service Content:</strong> The MedGPT Scholar platform, including software, algorithms, and user interface, is our proprietary property.</p>
              <p><strong>User Content:</strong> You retain ownership of your research queries and any content you create using our service.</p>
              <p><strong>Research Data:</strong> We aggregate publicly available research from databases like PubMed, CrossRef, and others under fair use principles.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Limitation of Liability</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>No Medical Liability:</strong> We are not liable for any medical decisions, patient outcomes, or clinical consequences resulting from use of our service.</p>
              <p><strong>Service Availability:</strong> We strive for high uptime but do not guarantee uninterrupted service availability.</p>
              <p><strong>Accuracy Disclaimer:</strong> We are not liable for errors, omissions, or inaccuracies in AI-generated content.</p>
              <p><strong>Maximum Liability:</strong> Our total liability is limited to the amount you paid for the service in the 12 months preceding any claim.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Professional Standards</h2>
            <div className="space-y-3 text-slate-700">
              <p><strong>Continuing Education:</strong> Users should maintain current medical knowledge and follow professional guidelines.</p>
              <p><strong>Regulatory Compliance:</strong> Users must comply with all applicable medical, legal, and ethical standards in their jurisdiction.</p>
              <p><strong>Quality Assurance:</strong> Always verify AI-generated content against primary sources and clinical guidelines.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Updates and Modifications</h2>
            <div className="space-y-3 text-slate-700">
              <p>We may update these terms periodically. Significant changes will be communicated via email or platform notifications. Continued use constitutes acceptance of updated terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Governing Law</h2>
            <div className="space-y-3 text-slate-700">
              <p>These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through binding arbitration or in the courts of [Your Jurisdiction].</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact Information</h2>
            <div className="space-y-3 text-slate-700">
              <p>For questions about these terms, contact us at:</p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p><strong>Email:</strong> legal@medgptscholar.com</p>
                <p><strong>Address:</strong> [Your Company Address]</p>
                <p><strong>Support:</strong> support@medgptscholar.com</p>
              </div>
            </div>
          </section>
        </Card>

        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to MedGPT Scholar
          </Link>
        </div>
      </main>
    </div>
  );
}
