import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles, ShoppingBag, Eye, CheckCircle2 } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "Boutiques Démo & Exemples Réels — EasyTradez Algérie",
  description:
    "Découvrez 3 boutiques réelles en ligne propulsées par EasyTradez : NovaTech Store, SportStyle DZ et Maison Guanzo. Testez l'expérience client et le checkout COD.",
};

interface DemoStore {
  id: string;
  slug: string;
  category: string;
  name: string;
  tagline: string;
  wilayaOrigin: string;
  themeName: string;
  description: string;
  features: string[];
  sampleProducts: { name: string; priceDzd: number; note: string }[];
  deliveryInfo: string;
  storeUrl: string;
}

const DEMO_STORES: DemoStore[] = [
  {
    id: "novatech-store",
    slug: "novatech-store",
    category: "Mode & T-shirts Urbains",
    name: "NovaTech Store",
    tagline: "Collections graphiques modernes & streetwear épuré",
    wilayaOrigin: "Alger / Oran",
    themeName: "Modern Minimalist",
    description:
      "Boutique mono/multi-articles optimisée pour le trafic issu des réseaux sociaux (TikTok & Instagram). Formulaire COD ultra-rapide avec calcul automatique de livraison.",
    features: [
      "Formulaire de commande express (nom, téléphone, wilaya, commune)",
      "Vérification automatique du numéro algérien (05/06/07)",
      "Calcul des frais de livraison domicile / stop-desk",
      "Expédition prête pour synchronisation transporteur",
    ],
    sampleProducts: [
      { name: "T-shirt Wolf Graphic Edition", priceDzd: 3400, note: "Article vedette" },
    ],
    deliveryInfo: "Expédition partout en Algérie avec suivi de colis",
    storeUrl: "/novatech-store",
  },
  {
    id: "sportstyle-dz",
    slug: "sportstyle-dz",
    category: "Vêtements & Sportswear",
    name: "SportStyle DZ",
    tagline: "Équipements sportifs et tenues de performance pour athlètes",
    wilayaOrigin: "Blida / Alger",
    themeName: "Dynamic Sport",
    description:
      "Vitrine dynamique avec mise en avant immédiate des stocks disponibles, avis clients et commande sans carte bancaire.",
    features: [
      "Sélection rapide de variantes et quantités",
      "Badge de réassurance livraison rapide",
      "Processus de validation téléphonique intégré",
      "Zéro friction : paiement en espèces à la livraison",
    ],
    sampleProducts: [
      { name: "Tenue Sport Pro Athlète", priceDzd: 10000, note: "Qualité premium" },
    ],
    deliveryInfo: "Livraison rapide à domicile ou point relais",
    storeUrl: "/sportstyle-dz",
  },
  {
    id: "maison-guanzo",
    slug: "maison-guanzo",
    category: "Accessoires & Mode Urbaine",
    name: "Maison Guanzo",
    tagline: "Prêt-à-porter contemporain et pièces tendance pour le quotidien",
    wilayaOrigin: "Constantine / Alger",
    themeName: "Urban Boutique",
    description:
      "Design soigné conçu pour valoriser les détails produits et maximiser le taux de confirmation des commandes.",
    features: [
      "Fiche produit immersive avec galerie de visuels",
      "Tarifs de livraison personnalisés par wilaya",
      "Protection contre les commandes répétitives suspectes",
      "Tableau de bord de suivi en temps réel",
    ],
    sampleProducts: [
      { name: "T-Shirt Urban Collection", priceDzd: 3400, note: "Édition limitée" },
    ],
    deliveryInfo: "Livraison nationale avec bordereau d'expédition",
    storeUrl: "/maison-guanzo",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white selection:bg-[#2540ea] selection:text-white">
      {/* ── HEADER NAVIGATION ── */}
      <header className="border-b border-white/10 bg-[#06060f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <EasyTradeLogo size={32} href="/" />
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
              Vitrine Démonstration
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#2540ea] hover:bg-[#1f35c5] text-white transition-colors shadow-lg"
            >
              Créer Ma Boutique
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-24 space-y-20">
        {/* Intro */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#bfdbfe] bg-[#2540ea]/15 border border-[#60a5fa]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span>3 Exemples Réels en Ligne</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Découvrez nos boutiques<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2540ea 100%)",
              }}
            >
              en action réelle.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed">
            Consultez 3 exemples fonctionnels déployés sur EasyTradez. Chaque boutique est accessible directement et permet de tester le formulaire de commande avec paiement à la livraison (COD).
          </p>
        </div>

        {/* Store Cards */}
        <section aria-label="Boutiques d'exemples" className="space-y-10">
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
                {/* Left col */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2540ea]/30 border border-[#60a5fa]/40 text-[#bfdbfe]">
                      Boutique #{index + 1} · {store.category}
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

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                      Fonctionnalités activées :
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

                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 flex items-center gap-2.5">
                    <span className="text-base">📦</span>
                    <span>{store.deliveryInfo}</span>
                  </div>
                </div>

                {/* Right col: Direct link card */}
                <div className="lg:col-span-5 rounded-2xl p-6 bg-[#06060f]/80 border border-white/15 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#93c5fd]" />
                      Catalogue en ligne
                    </span>
                    <span className="text-[11px] text-white/40">DZD (TTC)</span>
                  </div>

                  <div className="space-y-3">
                    {store.sampleProducts.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
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

                  <div className="pt-2">
                    <Link
                      href={store.storeUrl}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold bg-[#2540ea] hover:bg-[#1f35c5] text-white transition-colors shadow-md group"
                    >
                      <Eye className="w-4 h-4 text-[#93c5fd]" />
                      <span>Visiter la boutique démo</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
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
            Testez sans aucun risque avec notre forfait Gratuit : sans carte bancaire, sans engagement et prêt en 5 minutes.
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

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 EasyTradez Technologies · Plateforme e-commerce pour l&apos;Algérie</p>
        <div className="flex justify-center gap-4">
          <Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Conditions</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
