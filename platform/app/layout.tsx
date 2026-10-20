import type { Metadata } from "next";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import "./globals.css";
import "@/styles/themes/index.css";
import { safeJsonLd } from "@/lib/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://easytradez.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EasyTradez — Créez votre Boutique en Ligne en Algérie | Paiement COD",
    template: "%s | EasyTradez Algérie",
  },
  description:
    "EasyTradez est la plateforme e-commerce algérienne conçue pour les marchands et créateurs. Créez votre boutique en 5 minutes avec paiement à la livraison (COD), intégration Yalidine & ZR Express, et comptabilité en DZD.",
  keywords: [
    "easytradez",
    "EasyTradez",
    "easy tradez",
    "easytrade",
    "créer boutique en ligne algérie",
    "shopify algérie",
    "e-commerce algérie",
    "boutique en ligne algérie",
    "paiement à la livraison algérie",
    "yalidine express",
    "zr express",
    "baridimob e-commerce",
    "edahabia cib",
    "dropshipping algérie",
    "easytradez.site",
  ],
  authors: [{ name: "EasyTradez", url: siteUrl }],
  creator: "EasyTradez",
  publisher: "EasyTradez",
  applicationName: "EasyTradez",
  alternates: {
    canonical: siteUrl,
    languages: {
      "fr-DZ": siteUrl,
      "ar-DZ": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    alternateLocale: ["ar_DZ"],
    url: siteUrl,
    siteName: "EasyTradez",
    title: "EasyTradez — Créer votre Boutique en Ligne en Algérie",
    description:
      "EasyTradez : Votre boutique e-commerce professionnelle en 5 minutes. Paiement à la livraison (COD), expédition nationale avec Yalidine & BaridiMob.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyTradez — Plateforme E-Commerce Algérie",
    description: "EasyTradez : Créez votre boutique en ligne en 5 minutes. Paiement à la livraison (COD) et gestion en DZD.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YaOz7TVsBnX-SLJ1gp4y7bFA69N11yvTf5-yaZ7Rkyo",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "EasyTradez",
      alternateName: ["EasyTrade", "Easy Tradez"],
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description: "Plateforme SaaS e-commerce pour créateurs et marchands en Algérie.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "EasyTradez",
      alternateName: ["EasyTrade", "Easy Tradez"],
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["fr-DZ", "ar-DZ"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#application`,
      name: "EasyTradez Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "DZD",
          name: "Plan Gratuit",
        },
        {
          "@type": "Offer",
          price: "2000",
          priceCurrency: "DZD",
          name: "Plan Pro",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700;900&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Cairo:wght@500;700;900&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Readex+Pro:wght@400;600;700&family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&family=Syne:wght@700;800;900&family=Unbounded:wght@700;900&family=Urbanist:wght@500;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||localStorage.getItem('app_theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t);if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-bg text-ink font-sans antialiased selection:bg-brand selection:text-white transition-colors duration-200">
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(10, 14, 38, 0.95)",
              border: "1px solid rgba(96, 165, 250, 0.4)",
              color: "#ffffff",
              backdropFilter: "blur(16px)",
              borderRadius: "14px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
