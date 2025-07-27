import { Metadata } from 'next';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Footer from '@/components/landing/Footer';
import { generateSEOMetadata, commonSEOData } from '@/lib/seo';

// Generate metadata on the server side
export const metadata: Metadata = generateSEOMetadata(commonSEOData.homepage);

export default function LandingPage() {
  return (
    <>
      {/* Structured Data for Homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "CliniSynth",
            "description": "Free AI-powered medical research assistant for healthcare professionals and students",
            "url": "https://clinisynth.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://clinisynth.com/chat?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            },
            "sameAs": [
              "https://twitter.com/clinisynth",
              "https://linkedin.com/company/clinisynth"
            ],
            "publisher": {
              "@type": "MedicalOrganization",
              "name": "CliniSynth",
              "url": "https://clinisynth.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://clinisynth.com/logo.png"
              }
            }
          })
        }}
      />
      
      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is CliniSynth free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, CliniSynth is completely free for healthcare professionals, medical students, and researchers. We provide unlimited access to our AI medical research assistant."
                }
              },
              {
                "@type": "Question", 
                "name": "What medical databases does CliniSynth search?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "CliniSynth searches multiple trusted medical databases including PubMed, FDA databases, peer-reviewed medical journals, and scientific research repositories to provide evidence-based answers."
                }
              },
              {
                "@type": "Question",
                "name": "Is CliniSynth HIPAA compliant?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, CliniSynth follows strict security protocols and HIPAA compliance guidelines to protect sensitive medical information and user privacy."
                }
              },
              {
                "@type": "Question",
                "name": "Can CliniSynth replace medical consultation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, CliniSynth is designed for educational and research purposes only. It should not replace professional medical consultation, diagnosis, or treatment. Always consult qualified healthcare professionals for medical advice."
                }
              }
            ]
          })
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        <Navigation />
        
        <main id="main-content" role="main">
          <Hero />
          <Features />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
