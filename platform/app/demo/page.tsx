import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles, ShoppingBag, Eye, CheckCircle2 } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "Boutiques Démo & Exemples Réels — EasyTradez",
  description:
    "Découvrez 3 boutiques de démonstration configurées pour le marché algérien : cosmétique, mode et électronique. Testez l'expérience client et le checkout COD.",
};

interface DemoStore {
  id: string;
  category: "Cosmétique & Soins" | "Mode & Vêtements" | "High-Tech & Électronique";
  name: string;
  tagline: string;
  wilayaOrigin: string;
  themeName: string;
  accentColor: string;
  description: string;
  features: string[];
  sampleProducts: { name: string; priceDzd: number; note: string }[];
  deliveryInfo: string;
  previewUrl: string;
}

const DEMO_STORES: DemoStore[] = [
  {
    id: "botanica-dz",
    category: "Cosmétique & Soins",
    name: "Botanica DZ — Soins Naturels",
    tagline: "Sérums botaniques purs & cosmétiques artisanaux d'Algérie",
    wilayaOrigin: "Blida / Alger",
    themeName: "Blossom Lavender (Pastel & Élégance)",
    accentColor: "#9d4edd",
    description:
      "Une boutique épurée mettant en valeur des soins bio (huile de pépins de figue de barbarie, sérum vitamine C). Le formulaire COD est court pour maximiser le taux de conversion sur Instagram.",
    features: [
      "Tunnel direct mono-produit ou boutique multi-articles",
      "Calcul automatique livraison domicile (600 DZD) / stop-desk (400 DZD)",
      "Vérification stricte numéro algérien (05/06/07)",
      "Bordereau prêt pour expédition Yalidine",
    ],
    sampleProducts: [
      { name: "Sérum Huile Pure de Figue de Barbarie (30ml)", priceDzd: 3400, note: "Meilleure vente" },
      { name: "Savon Artisanal au Lait de Chèvre & Miel", priceDzd: 850, note: "Pack de 2" },
      { name: "Eau Florale de Rose de Blida (200ml)", priceDzd: 1200, note: "100% naturel" },
    ],
    deliveryInfo: "Expédition 58 wilayas en 24-48h avec Yalidine Express",
    previewUrl: "/register?template=cosmetics",
  },
  {
    id: "dz-streetwear",
    category: "Mode & Vêtements",
    name: "DzStreet — Urban Fashion",
    tagline: "Streetwear algérien contemporain, coupes oversize & coton lourd",
    wilayaOrigin: "Oran",
    themeName: "Monochrome (Minimaliste & Impactant)",
    accentColor: "#ffffff",
    description:
      "Design ultra-moderne taillé pour la jeunesse et les créateurs TikTok. Sélecteur de tailles (S à XXL), guide de mensurations et commande immédiate en 2 clics.",
    features: [
      "Sélecteur de variantes (Tailles & Couleurs)",
      "Affichage clair des stocks disponibles",
      "Bouton WhatsApp pour questions de mensuration",
      "Page optimisée pour chargement ultra-rapide en 4G",
    ],
    sampleProducts: [
      { name: "Hoodie Oversized 'El Bahdja' Heavy Cotton (420 GSM)", priceDzd: 4900, note: "Édition limitée" },
      { name: "T-Shirt Boxy Fit 'Casbah Nights' Noir", priceDzd: 2600, note: "100% Coton" },
      { name: "Cargo Pants Utility avec poches tactiques", priceDzd: 5200, note: "Coupe relax" },
    ],
    deliveryInfo: "Livraison ZR Express à domicile partout en Algérie",
    previewUrl: "/register?template=streetwear",
  },
  {
    id: "electrovolt",
    category: "High-Tech & Électronique",
    name: "TechVolt — Accessoires & Audio",
    tagline: "Écouteurs TWS, chargeurs rapides GaN et accessoires connectés",
    wilayaOrigin: "Sétif / Alger",
    themeName: "Phantom (Cyberpunk & Néon Cyan)",
    accentColor: "#00f0ff",
    description:
      "Pensé pour le matériel électronique : fiches techniques détaillées, badges de garantie 6 mois et réassurance contre la casse lors du transport.",
    features: [
      "Fiche technique structurée avec spécifications",
      "Badges de garantie 6 mois & échange sous 48h",
      "Tarifs de livraison personnalisés par wilaya",
      "Confirmation instantanée par SMS / WhatsApp",
    ],
    sampleProducts: [
      { name: "Écouteurs TWS Réduction de Bruit Active (ANC)", priceDzd: 4200, note: "Garantie 6 mois" },
      { name: "Chargeur Rapide GaN 65W Double Port USB-C", priceDzd: 3100, note: "Ultra-compact" },
      { name: "Support Smartphone Voiture Magnétique Rotatif", priceDzd: 1800, note: "Universel" },
    ],
    deliveryInfo: "Expédition sécurisée sous emballage antichoc avec Procolis",
    previewUrl: "/register?template=electronics",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white selection:bg-[#2540ea] selection:text-white">
      {/* ── TOP BAR ── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-2xl border-b"
        style={{
          background: "rgba(6, 6, 15, 0.85)",
          borderColor: "rgba(96, 165, 250, 0.25)",
        }}
      >
        <EasyTradeLogo size={32} href="/" />

        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/" className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Accueil</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl bg-[#2540ea] hover:bg-[#1f35c5] transition-colors shadow-md"
          >
            <span>Créer Ma Boutique</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-16">
        {/* ── HEADER ── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#bfdbfe] bg-[#2540ea]/15 border border-[#60a5fa]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span>Exemples Réels & Démonstrations</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Voyez comment vos clients<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2540ea 100%)",
              }}
            >
              achètent sur EasyTradez.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed">
            Trois exemples complets représentant les secteurs les plus actifs du commerce en ligne algérien. Chaque boutique est conçue pour être fluide, rapide et axée sur le paiement à la livraison (COD).
          </p>
        </div>

        {/* ── DEMO STORES LIST ── */}
        <section aria-label="Boutiques d'exemples" className="space-y-12">
          {DEMO_STORES.map((store, index) => (
            <div
              key={store.id}
              className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(155deg, rgba(28, 44, 148, 0.22) 0%, rgba(10, 14, 38, 0.9) 100%)",
                borderColor: "rgba(96, 165, 250, 0.3)",
                boxShadow: "0 14px 40px -10px rgba(0, 0, 0, 0.7)",
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left col: Details */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2540ea]/30 border border-[#60a5fa]/40 text-[#bfdbfe]">
                      Exemple #{index + 1} · {store.category}
                    </span>
                    <span className="text-xs text-white/50">
                      Origine : {store.wilayaOrigin}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-2xl sm:text-3xl font-black text-white"
                      style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                    >
                      {store.name}
                    </h2>
                    <p className="text-sm text-sky-300 font-medium mt-1">{store.tagline}</p>
                  </div>

                  <p className="text-sm text-white/75 leading-relaxed">
                    {store.description}
                  </p>

                  {/* Highlights list */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                      Points forts de cette configuration :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                      {store.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Carrier notice */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 flex items-center gap-2.5">
                    <span className="text-base">📦</span>
                    <span>{store.deliveryInfo}</span>
                  </div>
                </div>

                {/* Right col: Products preview card */}
                <div className="lg:col-span-5 rounded-2xl p-6 bg-[#06060f]/80 border border-white/15 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#93c5fd]" />
                      Articles en vitrine
                    </span>
                    <span className="text-[11px] text-white/40">DZD (TTC)</span>
                  </div>

                  <div className="space-y-3">
                    {store.sampleProducts.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white">{p.name}</p>
                          <span className="text-[10px] text-emerald-400">{p.note}</span>
                        </div>
                        <div className="text-right font-bold text-white shrink-0 pl-3">
                          {p.priceDzd.toLocaleString("fr-DZ")} DZD
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3">
                    <Link
                      href={store.previewUrl}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#2540ea] hover:bg-[#1f35c5] text-white transition-colors shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Utiliser ce modèle de boutique</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── CALL TO ACTION ── */}
        <div
          className="rounded-3xl p-8 sm:p-12 text-center space-y-6 border"
          style={{
            background: "linear-gradient(155deg, rgba(37, 64, 234, 0.3) 0%, rgba(10, 14, 38, 0.95) 100%)",
            borderColor: "rgba(96, 165, 250, 0.4)",
          }}
        >
          <h2
            className="text-2xl sm:text-4xl font-black text-white"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Prêt à lancer votre propre boutique ?
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
            Sélectionnez votre thème, ajoutez vos produits et commencez à accepter les commandes de vos clients en quelques minutes.
          </p>
          <div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-[#06060f] hover:bg-white/90 transition-all shadow-xl"
            >
              <span>Créer Ma Boutique Gratuite</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 EasyTradez Technologies · Fait avec fierté à Oran, Algérie</p>
        <div className="flex justify-center gap-4">
          <Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Conditions</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
