import { Metadata } from 'next';
import { generateSEOMetadata, commonSEOData } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata(commonSEOData.chat);

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Chat Page Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "CliniSynth Medical Research Chat",
            "description": "AI-powered medical research chat interface for healthcare professionals",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Evidence-based medical answers",
              "PubMed database integration", 
              "Citation tracking",
              "Real-time research assistance",
              "HIPAA compliant conversations"
            ],
            "audience": {
              "@type": "MedicalAudience",
              "audienceType": "Healthcare Professional"
            }
          })
        }}
      />
      {children}
    </>
  );
}
