import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Tag, ArrowRight } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "Blog & Guides E-Commerce Algérie — EasyTradez",
  description:
    "Guides pratiques et concrets pour réussir dans l'e-commerce en Algérie : création de boutique, expédition Yalidine, réduction des retours COD et trésorerie DZD.",
};

interface Article {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  keyPoints: string[];
  publishedDate: string;
}

const ARTICLES: Article[] = [
  {
    slug: "creer-boutique-en-ligne-algerie",
    category: "Guide Pratique",
    readTime: "7 min de lecture",
    publishedDate: "Octobre 2026",
    title: "Comment Créer et Lancer Votre Boutique en Ligne en Algérie en 2026",
    summary:
      "Le guide pas-à-pas pour les entrepreneurs algériens : comment choisir sa niche de produits, créer son catalogue en dinars (DZD), paramétrer son formulaire de commande express sans carte bancaire et lancer ses premières campagnes TikTok et Instagram.",
    keyPoints: [
      "Pourquoi le modèle mono-produit (tunnel) cartonne sur TikTok DZ",
      "Éviter les erreurs classiques : zéro carte de crédit internationale requise",
      "Configurer les tarifs de livraison domicile et stop-desk pour vos clients",
      "Le premier jour de vente : ce qu'il faut préparer avant de lancer",
    ],
  },
  {
    slug: "guide-expedition-yalidine-zr-express",
    category: "Logistique & Transport",
    readTime: "6 min de lecture",
    publishedDate: "Octobre 2026",
    title: "Vendre avec Yalidine Express, ZR Express et Procolis : Le Guide Complet",
    summary:
      "Tout ce qu'il faut savoir sur l'expédition de colis en e-commerce algérien : différences entre livraison à domicile et retrait en agence (stop-desk), impression des bordereaux, délais moyens par région et encaissement des fonds retournés par le transporteur.",
    keyPoints: [
      "Comparatif domicile vs Stop-desk : pourquoi le stop-desk a moins d'échecs",
      "Génération automatique des bordereaux de livraison avec montant DZD exact",
      "Organisation des ramassages de colis au niveau de votre stock",
      "Récupération de votre argent (retours de caisse) auprès des agences",
    ],
  },
  {
    slug: "guide-cod-reduire-retours-colis-algerie",
    category: "Paiement à la livraison",
    readTime: "8 min de lecture",
    publishedDate: "Octobre 2026",
    title: "Le Guide Ultime du Paiement à la Livraison (COD) : Diviser Vos Retours par Deux",
    summary:
      "Le colis refusé est l'ennemi numéro un de la rentabilité d'un marchand en Algérie. Découvrez la méthode concrète pour faire passer votre taux de livraison réussie de 60% à plus de 85% grâce aux filtres anti-commandes abusives et au protocole d'appel de confirmation.",
    keyPoints: [
      "Filtrage automatique des numéros erronés (validation stricte 05, 06, 07)",
      "Le script d'appel de confirmation téléphonique en Darija qui fonctionne",
      "Gestion d'une liste noire de numéros suspects pour préserver vos frais d'envoi",
      "Comment inciter vos clients à récupérer leurs colis sous 48h",
    ],
  },
  {
    slug: "gestion-tresorerie-dzd-ecommerce",
    category: "Comptabilité & Gestion",
    readTime: "5 min de lecture",
    publishedDate: "Octobre 2026",
    title: "Gérer sa Trésorerie et Calculer ses Marges Réelles en Dinars (DZD)",
    summary:
      "Calculer son coût d'acquisition client (CAC), anticiper le décalage de trésorerie entre l'expédition et le versement du transporteur, et tenir une comptabilité simple et saine pour faire grandir son commerce en Algérie.",
    keyPoints: [
      "Formule de calcul de la marge nette en tenant compte du taux de retour",
      "Gestion du décalage de paiement (délai de reversement COD des transporteurs)",
      "Facturation et abonnements en DZD via BaridiMob et SATIM",
      "Tenir son registre sans se perdre dans des logiciels complexes",
    ],
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white selection:bg-[#2540ea] selection:text-white">
      {/* ── TOP NAV ── */}
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

      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-16">
        {/* ── HEADER ── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#bfdbfe] bg-[#2540ea]/15 border border-[#60a5fa]/30">
            <BookOpen className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span>Ressources & Guides E-Commerce Algérie</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Apprenez à vendre<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2540ea 100%)",
              }}
            >
              comme les meilleurs marchands.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed">
            Des conseils concrets, adaptés aux réalités du terrain algérien : logistique, réduction des retours, paiements et fiscalité.
          </p>
        </div>

        {/* ── ARTICLES GRID ── */}
        <section aria-label="Articles et guides e-commerce" className="space-y-8">
          {ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="rounded-3xl p-6 sm:p-8 border space-y-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(155deg, rgba(28, 44, 148, 0.2) 0%, rgba(10, 14, 38, 0.85) 100%)",
                borderColor: "rgba(96, 165, 250, 0.28)",
                boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2540ea]/20 text-[#bfdbfe] border border-[#60a5fa]/30 font-semibold">
                  <Tag className="w-3 h-3" />
                  {article.category}
                </span>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                  <span>·</span>
                  <span>{article.publishedDate}</span>
                </div>
              </div>

              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-white hover:text-sky-300 transition-colors"
                  style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                >
                  {article.title}
                </h2>
                <p className="text-sm text-white/75 mt-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {/* Key takeaways */}
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Dans ce guide :
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                  {article.keyPoints.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <span className="text-[#60a5fa] font-bold">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <span>Mettre en pratique sur EasyTradez</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* ── CALL TO ACTION BOX ── */}
        <div
          className="rounded-3xl p-8 sm:p-12 text-center space-y-6 border"
          style={{
            background: "linear-gradient(155deg, rgba(37, 64, 234, 0.3) 0%, rgba(10, 14, 38, 0.95) 100%)",
            borderColor: "rgba(96, 165, 250, 0.4)",
          }}
        >
          <h2
            className="text-2xl sm:text-3xl font-black text-white"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Vous avez des questions sur la vente en ligne en Algérie ?
          </h2>
          <p className="text-sm text-white/70 max-w-xl mx-auto">
            Notre équipe vous accompagne gratuitement pour configurer votre première boutique et vos tarifs de livraison.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-[#2540ea] hover:bg-[#1f35c5] text-white shadow-lg shadow-blue-900/50 transition-colors"
            >
              <span>Créer ma boutique gratuite</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span>Consulter les forfaits</span>
            </Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 EasyTradez Technologies · Oran, Algérie</p>
        <div className="flex justify-center gap-4">
          <Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Conditions</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/about" className="hover:text-white transition-colors">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
