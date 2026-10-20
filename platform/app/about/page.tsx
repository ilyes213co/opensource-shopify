import React from "react";
import Link from "next/link";
import { ArrowLeft, Users, Target, HeartHandshake, MapPin, Mail, ShieldAlert } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "À Propos & Notre Vision — EasyTradez Algérie",
  description:
    "Découvrez l'histoire d'EasyTradez : pourquoi nous construisons une infrastructure e-commerce 100% adaptée au marché et aux marchands algériens.",
};

export default function AboutPage() {
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
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-16">
        {/* ── HERO ── */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#bfdbfe] bg-[#2540ea]/15 border border-[#60a5fa]/30">
            <span>Qui Sommes-Nous · Mission & Authenticité</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Construire l&apos;e-commerce<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2540ea 100%)",
              }}
            >
              adapté à la réalité algérienne.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            Pas de faux chiffres, pas de jargon importé. Voici pourquoi EasyTradez existe et comment nous voulons soutenir concrètement les créateurs et marchands en Algérie.
          </p>
        </div>

        {/* ── L'HISTOIRE / LE CONSTAT ── */}
        <section
          aria-label="Pourquoi nous avons créé EasyTradez"
          className="rounded-3xl p-8 sm:p-10 border space-y-6"
          style={{
            background: "linear-gradient(155deg, rgba(28, 44, 148, 0.2) 0%, rgba(10, 14, 38, 0.85) 100%)",
            borderColor: "rgba(96, 165, 250, 0.28)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2540ea]/20 border border-[#60a5fa]/30 flex items-center justify-center text-[#93c5fd]">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Le constat de départ</h2>
          </div>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            Pendant des années, les vendeurs en Algérie ont dû se battre avec des solutions inadaptées : devoir chercher des cartes bancaires internationales au marché noir pour payer des abonnements mensuels en devises (Shopify, Wix), des plateformes qui ignorent le paiement à la livraison (COD) et qui ne sont pas adaptées au marché algérien.
          </p>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            Nous avons conçu <strong>EasyTradez</strong> avec une conviction claire : les marchands algériens méritent une plateforme pensée dès la première ligne de code pour leur écosystème.
          </p>
        </section>

        {/* ── ENGAGEMENTS & VALEURS ── */}
        <section aria-label="Nos principes fondamentaux" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">100% en Dinar (DZD)</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Tout est libellé et facturé en dinars. Vous pouvez régler votre forfait via BaridiMob ou carte Edahabia sans avoir besoin d&apos;Euros ou de Dollars.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Zéro Commission Cachée</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              0% prélevé sur vos commandes. Vos marges commerciales vous reviennent intégralement. Notre modèle repose uniquement sur des forfaits fixes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Anti-Colis Refusés</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Outils intégrés pour valider les numéros de téléphone et réduire drastiquement le taux de retour de colis (retour COD).
            </p>
          </div>
        </section>

        {/* ── PHASE BÊTA ACTIVE (TRANSPARENCE TOTALE) ── */}
        <section
          aria-label="Statut du projet et phase bêta"
          className="rounded-2xl p-6 sm:p-8 bg-amber-500/10 border border-amber-500/25 space-y-3"
        >
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <span>ℹ️ Statut actuel : Version Bêta Active (2026)</span>
          </div>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Plutôt que d&apos;inventer des millions d&apos;utilisateurs fictifs, nous préférons être 100% sincères : <strong>EasyTradez est actuellement en version bêta active</strong>. Nous accueillons les marchands pionniers, nous écoutons chaque retour et nous déployons des mises à jour quotidiennes pour répondre aux besoins concrets du terrain.
          </p>
        </section>

        {/* ── IDENTITÉ LÉGALE & CONTACT ── */}
        <section
          aria-label="Informations légales et siège"
          className="rounded-3xl p-8 border space-y-6"
          style={{
            background: "rgba(10, 14, 38, 0.7)",
            borderColor: "rgba(96, 165, 250, 0.25)",
          }}
        >
          <h2 className="text-xl font-bold text-white">Identité légale et coordonnées</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/80">
            <div className="space-y-1">
              <span className="text-white/40 uppercase font-semibold">Raison Sociale</span>
              <p className="font-bold text-white">EasyTradez Technologies</p>
              <p className="text-white/60">Société à Responsabilité Limitée (SARL en cours d&apos;immatriculation / Bêta)</p>
            </div>

            <div className="space-y-1">
              <span className="text-white/40 uppercase font-semibold">Localisation</span>
              <p className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                Oran, Algérie
              </p>
              <p className="text-white/60">Équipe technique & support basée en Algérie</p>
            </div>

            <div className="space-y-1">
              <span className="text-white/40 uppercase font-semibold">Contact Support</span>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                support@easytradez.site
              </p>
              <p className="text-white/60">Réponse sous 24h ouvrées</p>
            </div>

            <div className="space-y-1">
              <span className="text-white/40 uppercase font-semibold">Assistance Directe</span>
              <p className="font-bold text-white">support@easytradez.site</p>
              <p className="text-white/60">Équipe dédiée à votre écoute</p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="text-center pt-6">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm bg-[#2540ea] hover:bg-[#1f35c5] text-white shadow-xl shadow-blue-900/50 transition-colors"
          >
            <span>Rejoindre les premiers marchands</span>
          </Link>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 EasyTradez Technologies · Oran, Algérie</p>
        <div className="flex justify-center gap-4">
          <Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Conditions</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
