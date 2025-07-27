'use client';

import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">CliniSynth</h1>
                <p className="text-sm text-gray-600">AI Medical Research Assistant</p>
              </div>
            </div>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-12 text-white">
            <h1 className="text-3xl font-bold mb-4">Cancellation & Refund Policy</h1>
            <p className="text-blue-100 text-lg">
              Your rights and our commitment to fair billing practices
            </p>
            <div className="text-sm text-blue-200 mt-4">
              Last Updated: July 26, 2025
            </div>
          </div>

          {/* Policy Content */}
          <div className="px-8 py-8 space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                At CliniSynth, we strive to provide exceptional AI-powered medical research assistance. 
                This policy outlines our cancellation and refund procedures for our subscription services. 
                We believe in transparency and fairness for all our healthcare professional users.
              </p>
            </section>

            {/* Subscription Plans */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🆓 Free Plan</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 3 queries per day</li>
                      <li>• No billing or cancellation required</li>
                      <li>• Always free to use</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">⚡ Pro Plan - $12/month</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 15 queries per day</li>
                      <li>• PDF export functionality</li>
                      <li>• Enhanced features</li>
                      <li>• Monthly billing cycle</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancellation Policy</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Easy Cancellation</h3>
                  <p className="text-gray-700">
                    You can cancel your Pro subscription at any time through your dashboard or by contacting our support team. 
                    No questions asked, no cancellation fees.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">How to Cancel</h3>
                  <ol className="text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Log in to your CliniSynth account</li>
                    <li>Go to your Dashboard</li>
                    <li>Click on "Manage Subscription"</li>
                    <li>Select "Cancel Subscription"</li>
                    <li>Confirm your cancellation</li>
                  </ol>
                  <p className="text-sm text-gray-600 mt-2">
                    Alternatively, email us at <a href="mailto:support@clinisynth.com" className="text-blue-600 hover:underline">support@clinisynth.com</a>
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Access After Cancellation</h3>
                  <p className="text-gray-700">
                    After cancellation, you will retain Pro access until the end of your current billing period. 
                    Your account will then automatically revert to the Free plan with 3 queries per day.
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Policy</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">✅ 7-Day Money-Back Guarantee</h3>
                  <p className="text-green-800">
                    We offer a full refund within 7 days of your initial Pro subscription purchase. 
                    This gives you time to evaluate our service risk-free.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Refund Eligibility:</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>First-time Pro subscribers within 7 days of initial purchase</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Technical issues preventing service usage (case-by-case basis)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Billing errors or duplicate charges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Renewal charges after the initial 7-day period</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Partial month refunds (except for technical issues)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Refund Process */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <ol className="text-gray-700 space-y-3 list-decimal list-inside">
                  <li>
                    <strong>Contact Support:</strong> Email us at <a href="mailto:support@clinisynth.com" className="text-blue-600 hover:underline">support@clinisynth.com</a>
                  </li>
                  <li>
                    <strong>Include Information:</strong> Your account email, subscription details, and reason for refund
                  </li>
                  <li>
                    <strong>Response Time:</strong> We'll respond within 24 hours on business days
                  </li>
                  <li>
                    <strong>Processing:</strong> Approved refunds are processed within 3-5 business days
                  </li>
                  <li>
                    <strong>Refund Method:</strong> Refunds are issued to the original payment method
                  </li>
                </ol>
              </div>
            </section>

            {/* Billing Issues */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Billing Issues</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Duplicate Charges</h3>
                  <p className="text-gray-700">
                    If you notice duplicate charges, please contact us immediately. We will investigate and 
                    provide a full refund for any confirmed duplicate transactions.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Failed Payments</h3>
                  <p className="text-gray-700">
                    If a payment fails, your Pro access will be temporarily suspended. Update your payment 
                    method in your dashboard to restore service. No penalties or late fees are charged.
                  </p>
                </div>

                <div className="border-l-4 border-teal-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Billing Disputes</h3>
                  <p className="text-gray-700">
                    For any billing disputes, please contact us before disputing with your bank. 
                    We're committed to resolving issues quickly and fairly.
                  </p>
                </div>
              </div>
            </section>

            {/* Medical Disclaimer */}
            <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 mb-3">⚠️ Important Medical Disclaimer</h2>
              <p className="text-yellow-800 text-sm leading-relaxed">
                CliniSynth provides AI-powered research assistance for educational and informational purposes only. 
                Our service is not intended as a substitute for professional medical advice, diagnosis, or treatment. 
                Refunds do not imply any warranty of medical accuracy or treatment outcomes. Always consult with 
                qualified healthcare providers for medical decisions.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  For questions about cancellations, refunds, or billing issues:
                </p>
                
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-900">Email:</strong> 
                    <a href="mailto:support@clinisynth.com" className="text-blue-600 hover:underline ml-2">
                      support@clinisynth.com
                    </a>
                  </div>
                  <div>
                    <strong className="text-gray-900">Response Time:</strong> 
                    <span className="text-gray-700 ml-2">Within 24 hours on business days</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Business Hours:</strong> 
                    <span className="text-gray-700 ml-2">Monday - Friday, 9:00 AM - 6:00 PM (EST)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy Changes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cancellation & Refund Policy from time to time. Changes will be posted on this page 
                with an updated "Last Updated" date. Continued use of our services after changes constitutes acceptance 
                of the updated policy. We recommend reviewing this policy periodically.
              </p>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-600 text-center">
                This policy is effective as of July 26, 2025. For the most current version, 
                please visit this page at clinisynth.com/cancellation-refund
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
