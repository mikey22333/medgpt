import { Metadata } from 'next';

export interface SEOPageProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  lastModified?: string;
  publishedTime?: string;
  medicalSpecialty?: string[];
}

export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage = '/og-image.png',
  ogType = 'website',
  noIndex = false,
  lastModified,
  publishedTime,
}: SEOPageProps): Metadata {
  const fullTitle = title 
    ? `${title} | CliniSynth - AI Medical Research Assistant`
    : 'CliniSynth - Free AI Medical Research Assistant';
  
  const defaultDescription = "Free AI-powered medical research assistant for healthcare professionals and students. Get evidence-based medical answers with citations from PubMed, FDA, and scientific databases.";
  const metaDescription = description || defaultDescription;
  
  const defaultKeywords = [
    'medical research assistant',
    'AI healthcare',
    'PubMed search',
    'medical citations',
    'healthcare AI',
    'medical literature',
    'evidence-based medicine',
    'clinical research',
    'medical students',
    'healthcare professionals'
  ];
  const allKeywords = [...defaultKeywords, ...keywords];

  return {
    title: fullTitle,
    description: metaDescription,
    keywords: allKeywords,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonicalUrl || 'https://clinisynth.com',
      siteName: 'CliniSynth',
      title: fullTitle,
      description: metaDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || 'CliniSynth - AI Medical Research Assistant',
          type: 'image/png',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
      creator: '@clinisynth',
      site: '@clinisynth',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'medical-disclaimer': 'This AI assistant is for educational and research purposes only. Always consult qualified healthcare professionals for medical advice.',
      'content-language': 'en-US',
      'audience': 'Healthcare Professionals, Medical Students, Researchers',
      ...(lastModified && { 'last-modified': lastModified }),
      ...(publishedTime && { 'article:published_time': publishedTime }),
    }
  };
}

// Pre-defined metadata for common pages
export const commonSEOData = {
  homepage: {
    title: 'Free AI Medical Research Assistant',
    description: 'Get instant, evidence-based medical answers with citations from PubMed, FDA, and scientific databases. Free AI-powered assistant for healthcare professionals and medical students.',
    keywords: [
      'free medical AI',
      'healthcare research tool',
      'medical database search',
      'clinical decision support',
      'evidence-based medicine',
      'medical literature review',
      'PubMed AI search',
      'healthcare professionals',
      'medical students',
      'research automation'
    ],
    canonicalUrl: 'https://clinisynth.com'
  },
  
  chat: {
    title: 'AI Medical Research Chat',
    description: 'Chat with our AI medical research assistant. Get evidence-based answers with citations from trusted medical databases including PubMed, FDA, and peer-reviewed journals.',
    keywords: [
      'medical AI chat',
      'healthcare chatbot',
      'medical questions',
      'clinical research chat',
      'AI medical consultant',
      'medical knowledge base'
    ],
    canonicalUrl: 'https://clinisynth.com/chat'
  },
  
  documentation: {
    title: 'Documentation & User Guide',
    description: 'Complete guide to using CliniSynth AI medical research assistant. Learn how to get the most accurate medical answers with proper citations.',
    keywords: [
      'medical AI documentation',
      'healthcare AI guide',
      'medical research tutorial',
      'clinical AI instructions',
      'evidence-based research guide'
    ],
    canonicalUrl: 'https://clinisynth.com/documentation'
  },
  
  security: {
    title: 'Security & HIPAA Compliance',
    description: 'Learn about CliniSynth\'s security measures, HIPAA compliance, and data protection for healthcare professionals and medical institutions.',
    keywords: [
      'HIPAA compliant AI',
      'medical data security',
      'healthcare privacy',
      'secure medical AI',
      'clinical data protection',
      'medical information security'
    ],
    canonicalUrl: 'https://clinisynth.com/security'
  },
  
  pricing: {
    title: 'Pricing & Plans',
    description: 'CliniSynth offers free AI-powered medical research assistance. Explore our plans for individual healthcare professionals and medical institutions.',
    keywords: [
      'free medical AI',
      'healthcare AI pricing',
      'medical research plans',
      'clinical AI subscription',
      'affordable healthcare AI'
    ],
    canonicalUrl: 'https://clinisynth.com/pricing'
  }
};

// Medical specialty keywords for different medical fields
export const medicalSpecialtyKeywords = {
  cardiology: [
    'cardiology AI',
    'heart disease research',
    'cardiovascular medicine',
    'cardiac research assistant',
    'ECG interpretation AI'
  ],
  oncology: [
    'oncology AI',
    'cancer research assistant',
    'tumor research',
    'oncology literature',
    'cancer treatment AI'
  ],
  neurology: [
    'neurology AI',
    'brain research assistant',
    'neurological conditions',
    'neuroscience AI',
    'neuroimaging AI'
  ],
  pediatrics: [
    'pediatric AI',
    'child healthcare AI',
    'pediatric research',
    'children medicine AI',
    'pediatric literature'
  ],
  psychiatry: [
    'psychiatric AI',
    'mental health research',
    'psychology AI assistant',
    'psychiatric literature',
    'mental health AI'
  ],
  radiology: [
    'radiology AI',
    'medical imaging AI',
    'diagnostic imaging',
    'radiological AI assistant',
    'medical scan analysis'
  ]
};
