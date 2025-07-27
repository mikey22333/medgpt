import { Metadata } from 'next';
import { generateSEOMetadata, commonSEOData } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata(commonSEOData.documentation);

export default function DocumentationPage() {
  return (
    <>
      {/* Documentation Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": "CliniSynth Documentation - Complete User Guide",
            "description": "Complete guide to using CliniSynth AI medical research assistant effectively",
            "author": {
              "@type": "Organization",
              "name": "CliniSynth Team"
            },
            "publisher": {
              "@type": "MedicalOrganization",
              "name": "CliniSynth",
              "logo": {
                "@type": "ImageObject",
                "url": "https://clinisynth.com/logo.png"
              }
            },
            "dateModified": new Date().toISOString(),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://clinisynth.com/documentation"
            },
            "audience": {
              "@type": "MedicalAudience",
              "audienceType": "Healthcare Professional"
            }
          })
        }}
      />
      
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CliniSynth Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Complete guide to using CliniSynth AI medical research assistant for evidence-based healthcare research.
            </p>
          </header>

          <nav className="mb-8" aria-label="Documentation navigation">
            <h2 className="text-2xl font-semibold mb-4">Table of Contents</h2>
            <ul className="space-y-2">
              <li><a href="#getting-started" className="text-blue-600 hover:underline">Getting Started</a></li>
              <li><a href="#features" className="text-blue-600 hover:underline">Key Features</a></li>
              <li><a href="#medical-databases" className="text-blue-600 hover:underline">Medical Databases</a></li>
              <li><a href="#best-practices" className="text-blue-600 hover:underline">Best Practices</a></li>
              <li><a href="#security" className="text-blue-600 hover:underline">Security & HIPAA</a></li>
            </ul>
          </nav>

          <main>
            <section id="getting-started" className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Getting Started</h2>
              <div className="prose prose-lg max-w-none">
                <p>
                  CliniSynth is a free AI-powered medical research assistant designed for healthcare 
                  professionals, medical students, and researchers. Our platform provides evidence-based 
                  answers with citations from trusted medical databases.
                </p>
                <h3>Quick Start Guide</h3>
                <ol>
                  <li>Create your free account or sign in</li>
                  <li>Navigate to the Chat interface</li>
                  <li>Ask medical questions in natural language</li>
                  <li>Review evidence-based answers with citations</li>
                  <li>Export results as PDF for reference</li>
                </ol>
              </div>
            </section>

            <section id="features" className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Key Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold mb-3">Evidence-Based Answers</h3>
                  <p>All responses include citations from peer-reviewed medical literature and trusted databases.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold mb-3">Multi-Database Search</h3>
                  <p>Searches PubMed, FDA databases, and scientific research repositories simultaneously.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold mb-3">PDF Export</h3>
                  <p>Export research summaries with clickable citations for offline reference.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold mb-3">HIPAA Compliant</h3>
                  <p>Secure, compliant platform suitable for healthcare professionals.</p>
                </div>
              </div>
            </section>

            <section id="medical-databases" className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Medical Databases</h2>
              <div className="prose prose-lg max-w-none">
                <p>CliniSynth integrates with multiple trusted medical databases:</p>
                <ul>
                  <li><strong>PubMed:</strong> MEDLINE database of biomedical literature</li>
                  <li><strong>FDA Databases:</strong> Drug approvals, safety information, and clinical trials</li>
                  <li><strong>Semantic Scholar:</strong> AI-powered scientific literature search</li>
                  <li><strong>Peer-reviewed Journals:</strong> Direct access to recent medical publications</li>
                </ul>
              </div>
            </section>

            <section id="best-practices" className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Best Practices</h2>
              <div className="prose prose-lg max-w-none">
                <h3>Asking Effective Questions</h3>
                <ul>
                  <li>Be specific about medical conditions, treatments, or research topics</li>
                  <li>Include relevant patient demographics when appropriate</li>
                  <li>Ask for specific types of evidence (RCTs, meta-analyses, etc.)</li>
                  <li>Request comparisons between treatment options</li>
                </ul>
                
                <h3>Interpreting Results</h3>
                <ul>
                  <li>Always review cited sources for context</li>
                  <li>Consider publication dates and sample sizes</li>
                  <li>Look for consensus across multiple studies</li>
                  <li>Remember: This is for research purposes, not direct patient care</li>
                </ul>
              </div>
            </section>

            <section id="security" className="mb-12">
              <h2 className="text-3xl font-semibold mb-6">Security & HIPAA Compliance</h2>
              <div className="prose prose-lg max-w-none">
                <p>
                  CliniSynth follows strict security protocols to protect user data and maintain 
                  HIPAA compliance for healthcare professionals.
                </p>
                <ul>
                  <li>End-to-end encryption for all communications</li>
                  <li>No patient data storage or logging</li>
                  <li>Secure authentication and session management</li>
                  <li>Regular security audits and updates</li>
                </ul>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <p className="text-yellow-800 font-medium">
                    <strong>Medical Disclaimer:</strong> CliniSynth is for educational and research 
                    purposes only. Always consult qualified healthcare professionals for medical 
                    advice, diagnosis, or treatment decisions.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}