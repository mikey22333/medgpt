import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RedirectGuard } from "@/components/auth/RedirectGuard";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
  ],
}

export const metadata: Metadata = {
  title: {
    default: "CliniSynth - Free AI Medical Research Assistant",
    template: "%s | CliniSynth - AI Medical Research Assistant"
  },
  description: "Free AI-powered medical research assistant for healthcare professionals and students. Get evidence-based medical answers with citations from PubMed, FDA, and scientific databases using open-source AI.",
  keywords: [
    "medical research assistant",
    "AI healthcare",
    "PubMed search",
    "medical citations",
    "healthcare AI",
    "medical literature",
    "evidence-based medicine",
    "clinical research",
    "medical students",
    "healthcare professionals",
    "free medical AI",
    "medical knowledge base",
    "clinical decision support",
    "medical database search",
    "research automation"
  ],
  authors: [{ name: "CliniSynth Team" }],
  creator: "CliniSynth",
  publisher: "CliniSynth",
  category: "Healthcare Technology",
  classification: "Medical Research Tools",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clinisynth.com',
    siteName: 'CliniSynth',
    title: 'CliniSynth - Free AI Medical Research Assistant',
    description: 'Free AI-powered medical research assistant for healthcare professionals and students. Get evidence-based medical answers with citations from PubMed, FDA, and scientific databases.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CliniSynth - AI Medical Research Assistant',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CliniSynth - Free AI Medical Research Assistant',
    description: 'Free AI-powered medical research assistant for healthcare professionals and students.',
    images: ['/twitter-image.png'],
    creator: '@clinisynth',
    site: '@clinisynth',
  },
  alternates: {
    canonical: 'https://clinisynth.com',
    languages: {
      'en-US': 'https://clinisynth.com',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: '/favicon.svg',
      },
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0066cc',
      },
    ],
  },
  other: {
    'msapplication-TileColor': '#0066cc',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/Inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Structured Data - Medical Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalOrganization",
              "name": "CliniSynth",
              "description": "Free AI-powered medical research assistant for healthcare professionals and students",
              "url": "https://clinisynth.com",
              "logo": "https://clinisynth.com/logo.png",
              "sameAs": [
                "https://twitter.com/clinisynth",
                "https://linkedin.com/company/clinisynth"
              ],
              "medicalSpecialty": [
                "Medical Research",
                "Clinical Decision Support",
                "Evidence-Based Medicine"
              ],
              "areaServed": "Worldwide",
              "serviceType": "Medical Research Assistant",
              "priceRange": "Free"
            })
          }}
        />
        
        {/* Structured Data - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CliniSynth",
              "description": "AI-powered medical research assistant providing evidence-based answers with citations",
              "url": "https://clinisynth.com",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web Browser",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0.0",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <RedirectGuard />
          {children}
        </AuthProvider>
        
        {/* Google Analytics - Replace with your GA4 tracking ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_TRACKING_ID', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
        
        {/* Clarity - Microsoft's user behavior analytics */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
          `}
        </Script>
      </body>
    </html>
  );
}
