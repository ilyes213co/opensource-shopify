import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, HelpCircle, CreditCard, Banknote, Sparkles } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";
import { PRICING_PLANS } from "@/lib/landing-data";

export const metadata = {
  title: "Tarifs Transparents en Dinars (DZD) — EasyTradez",
  description:
    "Forfaits sans surprise pour créer votre boutique en ligne en Algérie. 0% de commission sur vos ventes. Démarrez gratuitement sans carte bancaire.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white selection:bg-[#2540ea] selection:text-white">
      {/* ── TOP NAVIGATION ── */}
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
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl bg-[#2540ea] hover:bg-[#1f35c5] transition-colors shadow-md"
          >
            <span>Démarrer Gratuitement</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-20">
        {/* ── HEADER ── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#bfdbfe] bg-[#2540ea]/15 border border-[#60a5fa]/30">
            <span>Tarification 100% en Dinars Algériens (DZD)</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Des forfaits transparents,<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2540ea 100%)",
              }}
            >
              sans commission cachée.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed">
            Vous conservez l&apos;intégralité de vos bénéfices. Choisissez l&apos;offre adaptée à votre activité et changez à tout moment sans engagement.
          </p>
        </div>

        {/* ── CRITICAL CLARIFICATION: MARCHAND VS CLIENT FINAL ── */}
        <section
          aria-label="Distinction importante des modes de paiement"
          className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(37, 64, 234, 0.15) 0%, rgba(10, 14, 38, 0.8) 100%)",
            borderColor: "rgba(96, 165, 250, 0.35)",
            boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Règle d&apos;or sur les paiements en Algérie</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Qui paie par carte et qui paie en espèces ?
              </h2>
              <p className="text-sm text-white/75 leading-relaxed">
                Une confusion fréquente existe dans le e-commerce maghrébin. Chez EasyTradez, la distinction est limpide et respecte les habitudes d&apos;achat réelles en Algérie.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Marchand */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Vous (Le Marchand)</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Règle uniquement son abonnement mensuel ou annuel EasyTradez en DZD via <strong>BaridiMob</strong>, carte <strong>Edahabia / CIB</strong> ou virement local.
                </p>
              </div>

              {/* Client final */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Banknote className="w-4 h-4" />
                  <span>Vos Acheteurs (Clients finaux)</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Ne paient <strong>JAMAIS</strong> par carte. Ils règlent exclusivement <strong>en espèces à la livraison (COD)</strong> entre les mains du livreur (Yalidine, ZR Express, etc.).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section aria-label="Nos forfaits d'abonnement" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const isFree = plan.id === "free";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1 ${
                  isPopular ? "lg:-translate-y-2" : ""
                }`}
                style={{
                  background: isPopular
                    ? "linear-gradient(165deg, rgba(37, 64, 234, 0.3) 0%, rgba(10, 14, 38, 0.95) 100%)"
                    : "linear-gradient(155deg, rgba(28, 44, 148, 0.18) 0%, rgba(10, 14, 38, 0.85) 100%)",
                  borderColor: isPopular ? "rgba(147, 197, 253, 0.6)" : "rgba(96, 165, 250, 0.25)",
                  boxShadow: isPopular
                    ? "0 20px 50px -10px rgba(37, 64, 234, 0.4)"
                    : "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
                }}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white bg-[#2540ea] border border-white/30 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-[#93c5fd]" />
                    <span>Recommandé</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                      {plan.badge}
                    </span>
                    <span className="text-xs text-[#93c5fd] font-semibold">{plan.storesLimit}</span>
                  </div>

                  <h3
                    className="text-2xl font-black text-white"
                    style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                  >
                    {plan.name}
                  </h3>

                  <p className="text-xs text-white/60 mt-1 min-h-[36px]">{plan.tagline}</p>

                  <div className="my-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white">
                        {isFree ? "0" : plan.monthlyPrice.toLocaleString("fr-DZ")}
                      </span>
                      <span className="text-base font-bold text-white/70">DZD</span>
                      <span className="text-xs text-white/50">{isFree ? "/ gratuit" : "/ mois"}</span>
                    </div>
                    {!isFree && (
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                        Ou {plan.yearlyPrice.toLocaleString("fr-DZ")} DZD / an (2 mois offerts)
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                      Fonctionnalités incluses :
                    </p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80">
                        <Check className="w-4 h-4 text-[#60a5fa] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isPopular
                      ? "bg-[#2540ea] hover:bg-[#1f35c5] text-white shadow-lg shadow-blue-900/50"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <span>{plan.cta}</span>
                </Link>
              </div>
            );
          })}
        </section>

        {/* ── FAQ TARIFS ── */}
        <section aria-label="Questions fréquentes sur la tarification" className="max-w-4xl mx-auto space-y-6 pt-10">
          <div className="text-center space-y-2">
            <h2
              className="text-2xl sm:text-3xl font-black text-white"
              style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
            >
              Questions fréquentes sur les tarifs
            </h2>
            <p className="text-sm text-white/60">
              Des réponses claires pour lever toutes vos interrogations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Y a-t-il vraiment 0% de commission ?
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Oui, rigoureusement 0%. EasyTradez n&apos;est pas intermédiaire de vos ventes. Vos clients paient le livreur, qui vous verse l&apos;intégralité de vos fonds en DZD.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Comment régler mon abonnement ?
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Vous pouvez payer en dinars (DZD) par virement BaridiMob, carte Edahabia ou CIB. Aucune devise étrangère (EUR/USD) n&apos;est requise.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Puis-je changer ou annuler mon forfait ?
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Absolument. Nos forfaits sont sans engagement. Vous pouvez passer d&apos;une formule à une autre ou repasser sur la formule gratuite à tout instant depuis votre tableau de bord.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Dois-je payer pour les mises à jour ?
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Non. Toutes les améliorations, nouveaux thèmes et optimisations de performance sont automatiquement déployés sans frais supplémentaires.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 EasyTradez Technologies · Oran, Algérie</p>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">Conditions générales</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/about" className="hover:text-white transition-colors">À propos</Link>
        </div>
      </footer>
    </div>
  );
}
