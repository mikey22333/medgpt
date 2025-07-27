import { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="documentation-page">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {children}
      </div>
      
      {/* Medical Documentation FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I get started with CliniSynth?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Create a free account, navigate to the Chat interface, and start asking medical questions in natural language. CliniSynth will provide evidence-based answers with citations from trusted medical databases."
                }
              },
              {
                "@type": "Question",
                "name": "What medical databases does CliniSynth search?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "CliniSynth searches PubMed/MEDLINE, FDA databases, Semantic Scholar, and peer-reviewed medical journals to provide comprehensive, evidence-based medical research."
                }
              },
              {
                "@type": "Question",
                "name": "Is CliniSynth HIPAA compliant?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, CliniSynth follows strict security protocols including end-to-end encryption, no patient data storage, secure authentication, and regular security audits to maintain HIPAA compliance."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export research results from CliniSynth?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can export research summaries as PDF files with clickable citations for offline reference and professional documentation."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
