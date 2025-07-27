'use client';

import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
  structuredData?: object;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  medicalSpecialty?: string[];
  lastModified?: string;
  publishedTime?: string;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogType = 'website',
  ogImage = '/og-image.png',
  ogImageAlt = 'CliniSynth - AI Medical Research Assistant',
  twitterCard = 'summary_large_image',
  noIndex = false,
  structuredData,
  breadcrumbs,
  medicalSpecialty = [],
  lastModified,
  publishedTime,
}: SEOHeadProps) {
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
    'clinical research'
  ];
  const allKeywords = [...defaultKeywords, ...keywords];

  // Generate breadcrumb structured data
  const breadcrumbStructuredData = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://clinisynth.com${crumb.url}`
    }))
  } : null;

  // Generate medical article structured data
  const medicalArticleData = title && description ? {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": title,
    "description": description,
    "url": canonicalUrl || `https://clinisynth.com${typeof window !== 'undefined' ? window.location.pathname : ''}`,
    "publisher": {
      "@type": "MedicalOrganization",
      "name": "CliniSynth",
      "url": "https://clinisynth.com"
    },
    "medicalAudience": [
      {
        "@type": "MedicalAudience",
        "audienceType": "Healthcare Professional"
      },
      {
        "@type": "MedicalAudience", 
        "audienceType": "Medical Student"
      }
    ],
    ...(medicalSpecialty.length > 0 && {
      "specialty": medicalSpecialty.map(specialty => ({
        "@type": "MedicalSpecialty",
        "name": specialty
      }))
    }),
    ...(publishedTime && { "datePublished": publishedTime }),
    ...(lastModified && { "dateModified": lastModified }),
    "isAccessibleForFree": true,
    "educationalLevel": "Professional",
    "educationalUse": "Research"
  } : null;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      
      {/* Robots and Indexing */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={`https://clinisynth.com${ogImage}`} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:url" content={canonicalUrl || `https://clinisynth.com${typeof window !== 'undefined' ? window.location.pathname : ''}`} />
      <meta property="og:site_name" content="CliniSynth" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={`https://clinisynth.com${ogImage}`} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      <meta name="twitter:site" content="@clinisynth" />
      <meta name="twitter:creator" content="@clinisynth" />
      
      {/* Medical-specific meta tags */}
      <meta name="medical-disclaimer" content="This AI assistant is for educational and research purposes only. Always consult qualified healthcare professionals for medical advice." />
      <meta name="content-language" content="en-US" />
      <meta name="audience" content="Healthcare Professionals, Medical Students, Researchers" />
      
      {/* Time-based meta tags */}
      {lastModified && <meta name="last-modified" content={lastModified} />}
      {publishedTime && <meta name="article:published_time" content={publishedTime} />}
      
      {/* Structured Data */}
      {breadcrumbStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData)
          }}
        />
      )}
      
      {medicalArticleData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(medicalArticleData)
          }}
        />
      )}
      
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  );
}
