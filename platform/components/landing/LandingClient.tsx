"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Minus,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Banknote,
  CheckCircle2,
  Mail,
} from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";
import ThreeAmbientScene from "@/components/brand/ThreeAmbientScene";

import {
  TICKER_ITEMS,
  FEATURES,
  TRUST_METRICS,
  STEPS,
  FAQ_QUESTIONS,
  PRICING_PLANS,
} from "@/lib/landing-data";

export default function LandingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Dynamic card glow on mouse move
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", `${x.toFixed(1)}%`);
    card.style.setProperty("--my", `${y.toFixed(1)}%`);
  };

  return (
    <div className="min-h-screen bg-[#06060f] text-white selection:bg-[#2540ea] selection:text-white relative">
      {/* ── STICKY NAVIGATION ── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-2xl transition-colors duration-300"
        style={{
          background: "rgba(6, 6, 15, 0.88)",
          borderBottom: "1px solid var(--border, rgba(96, 165, 250, 0.28))",
        }}
      >
        <EasyTradeLogo size={34} href="/" />

        {/* Center links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-white/70">
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">
            Comment ça marche
          </a>
          <a href="#features" className="hover:text-white transition-colors duration-200">
            Fonctionnalités
          </a>
          <Link href="/pricing" className="hover:text-white transition-colors duration-200">
            Tarifs
          </Link>
          <a href="#trust" className="hover:text-white transition-colors duration-200">
            Notre Mission
          </a>
          <a href="#faq" className="hover:text-white transition-colors duration-200">
            FAQ
          </a>
          <Link href="/blog" className="hover:text-white transition-colors duration-200">
            Guides &amp; Blog
          </Link>
        </div>

        {/* Right CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-white/70 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, var(--g, #2540ea) 0%, var(--gd, #1a2ca3) 100%)",
              boxShadow: "0 8px 24px -4px var(--g-glow, rgba(37, 64, 234, 0.6))",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span>Créer Ma Boutique</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section
        id="hero"
        className="relative min-h-[84vh] flex items-center justify-center text-center px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden"
      >
        {/* Three.js 3D interactive ambient canvas */}
        <ThreeAmbientScene opacity={0.88} interactive={true} />

        {/* Radial subtle glowing overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 50% 45%, var(--g-subtle, rgba(37, 64, 234, 0.18)) 0%, transparent 72%),
              radial-gradient(ellipse at bottom, rgba(6, 6, 15, 1) 0%, transparent 65%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-[920px] mx-auto space-y-6">
          {/* Top pill badge */}
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-bold text-[#bfdbfe] border backdrop-blur-md shadow-lg"
            style={{
              background: "rgba(37, 64, 234, 0.16)",
              borderColor: "rgba(96, 165, 250, 0.4)",
              boxShadow: "0 0 24px var(--g-subtle, rgba(37, 64, 234, 0.35))",
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-[#60a5fa]"
              style={{
                animation: "pulse-dot 2s ease infinite",
              }}
            />
            <span>EasyTradez · Plateforme E-Commerce Algérie 🇩🇿</span>
          </div>

          {/* Hero H1 */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08]"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Votre boutique<br />en ligne,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #ffffff 0%, var(--gl, #93c5fd) 40%, var(--g, #2540ea) 90%)",
                filter: "drop-shadow(0 0 24px var(--g-glow, rgba(37, 64, 234, 0.5)))",
              }}
            >
              en 5 minutes.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Créez votre boutique ou tunnel mono-produit sans carte bancaire internationale. Encaissez en espèces à la livraison (COD) partout en Algérie avec Yalidine, ZR Express et Procolis.
          </p>

          {/* CTAs */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-center">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base text-white shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, var(--g, #2540ea) 0%, var(--gd, #1a2ca3) 100%)",
                  boxShadow: "0 14px 40px -8px var(--g-glow, rgba(37, 64, 234, 0.6))",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <span>Créer ma boutique gratuite</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Sincere subtext under CTA */}
            <p className="text-xs text-white/60 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aucune carte bancaire requise pour commencer
              </span>
              <span>·</span>
              <span className="text-white/70">Forfait gratuit actif immédiatement</span>
              <span>·</span>
              <span className="text-sky-300">0% de commission sur vos ventes</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── TICKER BANNER (INFINITE SCROLL) ── */}
      <div
        className="overflow-hidden py-4 border-y"
        style={{
          borderColor: "var(--border, rgba(96, 165, 250, 0.28))",
          background:
            "linear-gradient(90deg, rgba(10, 14, 38, 0.8) 0%, rgba(26, 44, 163, 0.15) 50%, rgba(10, 14, 38, 0.8) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="animate-marquee gap-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 text-sm font-semibold text-white/70 whitespace-nowrap">
              <span>{item}</span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: "var(--gl, #93c5fd)",
                  boxShadow: "0 0 8px var(--gl, #93c5fd)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── TRUST METRICS BELT (SOLID STATIC NUMBERS - ZERO "0" FLICKER) ── */}
      <div
        id="stats"
        className="py-16 px-6 border-y"
        style={{
          background:
            "linear-gradient(180deg, rgba(37, 64, 234, 0.18) 0%, rgba(10, 14, 38, 0.85) 100%)",
          borderColor: "rgba(96, 165, 250, 0.4)",
          boxShadow: "inset 0 0 40px var(--g-subtle, rgba(37, 64, 234, 0.22))",
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {TRUST_METRICS.map((stat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
                style={{
                  color: "var(--gl, #93c5fd)",
                  fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                  textShadow: "0 0 30px var(--g-glow, rgba(37, 64, 234, 0.6))",
                }}
              >
                {stat.value}
                {stat.suffix}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                {stat.label}
              </div>
              <p className="text-[11px] sm:text-xs text-white/60 max-w-[200px] mx-auto leading-tight hidden sm:block">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS / STEPS ── */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="space-y-3 mb-14 text-center">
          <span
            className="text-xs font-black uppercase tracking-[3px]"
            style={{
              color: "var(--gl, #93c5fd)",
              textShadow: "0 0 16px var(--g-glow, rgba(37, 64, 234, 0.6))",
            }}
          >
            Démarrage Express
          </span>
          <h2
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Comment ça marche ?
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            Trois étapes simples pour commencer à vendre en ligne partout en Algérie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl p-8 space-y-4 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              style={{
                background:
                  "linear-gradient(155deg, rgba(28, 44, 148, 0.35) 0%, rgba(10, 14, 38, 0.85) 100%)",
                border: "1px solid var(--border, rgba(96, 165, 250, 0.28))",
                boxShadow: "0 12px 36px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Vertical glowing accent line on left */}
              <div
                className="absolute top-0 left-0 bottom-0 w-1"
                style={{
                  background:
                    "linear-gradient(180deg, var(--gl, #60a5fa), var(--g, #2540ea))",
                }}
              />

              <div
                className="inline-block text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg border text-[#bfdbfe]"
                style={{
                  background: "rgba(37, 64, 234, 0.26)",
                  borderColor: "rgba(147, 197, 253, 0.4)",
                  boxShadow: "0 0 12px var(--g-subtle, rgba(37, 64, 234, 0.3))",
                }}
              >
                {s.step}
              </div>

              <h3
                className="text-xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
              >
                {s.title}
              </h3>

              <p className="text-sm text-white/70 leading-relaxed font-normal">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION (FACTUAL & HONEST) ── */}
      <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="space-y-3 mb-14 text-center md:text-left">
          <span
            className="text-xs font-black uppercase tracking-[3px]"
            style={{
              color: "var(--gl, #93c5fd)",
              textShadow: "0 0 16px var(--g-glow, rgba(37, 64, 234, 0.6))",
            }}
          >
            Fonctionnalités
          </span>
          <h2
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Tout ce qu&apos;il faut<br />pour vendre en Algérie
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-2xl">
            Une infrastructure tout-en-un pensée pour le marché algérien, sans carte de crédit internationale, sans complications techniques.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => (
            <div
              key={idx}
              onMouseMove={handleCardMouseMove}
              className="group relative rounded-3xl p-8 flex flex-col justify-between min-h-[250px] transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              style={{
                background:
                  "linear-gradient(155deg, rgba(28, 44, 148, 0.35) 0%, rgba(10, 14, 38, 0.85) 100%)",
                border: "1px solid var(--border, rgba(96, 165, 250, 0.28))",
                boxShadow: "0 12px 36px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {/* Dynamic mouse cursor radial light */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), var(--g-glow, rgba(37, 64, 234, 0.5)) 0%, transparent 65%)",
                }}
              />

              {/* Glowing top accent border on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--gl, #93c5fd), var(--g, #2540ea), transparent)",
                }}
              />

              {/* Card top */}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border text-white/80"
                  style={{
                    background: "rgba(37, 64, 234, 0.2)",
                    borderColor: "var(--border, rgba(96, 165, 250, 0.3))",
                  }}
                >
                  {feat.tag}
                </span>
                <span
                  className="text-2xl font-black transition-all duration-300 group-hover:scale-110"
                  style={{
                    color: "var(--gl, #60a5fa)",
                    fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                  }}
                >
                  {feat.num}
                </span>
              </div>

              {/* Card body */}
              <div className="relative z-10 space-y-2">
                <h3
                  className="text-xl font-extrabold text-white tracking-tight"
                  style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-normal">{feat.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="space-y-4 mb-14 text-center">
          <span
            className="text-xs font-black uppercase tracking-[3px]"
            style={{
              color: "var(--gl, #93c5fd)",
              textShadow: "0 0 16px var(--g-glow, rgba(37, 64, 234, 0.6))",
            }}
          >
            Tarification Transparente
          </span>
          <h2
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Des forfaits clairs, adaptés au marché algérien
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Zéro commission sur vos ventes. Démarrez gratuitement et passez à la formule supérieure quand vos commandes décollent.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="pt-6 flex items-center justify-center">
            <div
              className="inline-flex items-center p-1.5 rounded-2xl border backdrop-blur-xl"
              style={{
                background: "rgba(10, 14, 38, 0.8)",
                borderColor: "rgba(96, 165, 250, 0.3)",
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-[#2540ea] text-white shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Facturation Mensuelle
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                  billingCycle === "yearly"
                    ? "bg-[#2540ea] text-white shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>Facturation Annuelle</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  -17% (2 mois offerts)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((p) => {
            const isYearly = billingCycle === "yearly";
            const displayPrice = isYearly ? p.yearlyPrice : p.monthlyPrice;
            const formattedPrice = displayPrice.toLocaleString("fr-DZ");
            const isFree = p.id === "free";

            return (
              <div
                key={p.id}
                onMouseMove={handleCardMouseMove}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                  p.popular ? "lg:-translate-y-2" : ""
                }`}
                style={{
                  background: p.popular
                    ? "linear-gradient(165deg, rgba(37, 64, 234, 0.32) 0%, rgba(10, 14, 38, 0.95) 100%)"
                    : "linear-gradient(155deg, rgba(28, 44, 148, 0.22) 0%, rgba(10, 14, 38, 0.85) 100%)",
                  border: p.popular
                    ? "2px solid rgba(147, 197, 253, 0.6)"
                    : "1px solid var(--border, rgba(96, 165, 250, 0.28))",
                  boxShadow: p.popular
                    ? "0 20px 50px -10px rgba(37, 64, 234, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)"
                    : "0 12px 36px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Popular floating badge */}
                {p.popular && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #2540ea 0%, #1a2ca3 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      boxShadow: "0 4px 16px rgba(37, 64, 234, 0.6)",
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#93c5fd]" />
                    <span>Le plus populaire</span>
                  </div>
                )}

                <div>
                  {/* Tier Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg border"
                      style={{
                        background: p.popular ? "rgba(37, 64, 234, 0.35)" : "rgba(255, 255, 255, 0.05)",
                        borderColor: p.popular ? "rgba(147, 197, 253, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        color: p.popular ? "#bfdbfe" : "rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      {p.badge}
                    </span>
                    <span className="text-xs font-semibold text-white/50">{p.storesLimit}</span>
                  </div>

                  <h3
                    className="text-2xl font-black text-white tracking-tight"
                    style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                  >
                    {p.name}
                  </h3>

                  <p className="text-xs text-white/60 mt-1.5 min-h-[36px] leading-relaxed">
                    {p.tagline}
                  </p>

                  {/* Price display */}
                  <div className="my-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-4xl md:text-5xl font-black tracking-tight text-white"
                        style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                      >
                        {isFree ? "0" : formattedPrice}
                      </span>
                      <span className="text-lg font-bold text-white/70">DZD</span>
                      <span className="text-xs text-white/50">
                        {isFree ? "/ pour toujours" : isYearly ? "/ an" : "/ mois"}
                      </span>
                    </div>
                    {isYearly && !isFree && (
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                        Soit environ {Math.round(p.yearlyPrice / 12).toLocaleString("fr-DZ")} DZD / mois
                      </p>
                    )}
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                      Ce qui est inclus :
                    </p>
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-white/80">
                        <Check className="w-4 h-4 text-[#60a5fa] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA button */}
                <Link
                  href={p.href}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                    p.popular
                      ? "text-white shadow-xl hover:brightness-110"
                      : "text-white hover:bg-white/10"
                  }`}
                  style={{
                    background: p.popular
                      ? "linear-gradient(135deg, var(--g, #2540ea) 0%, var(--gd, #1a2ca3) 100%)"
                      : "rgba(255, 255, 255, 0.06)",
                    border: p.popular
                      ? "1px solid rgba(255, 255, 255, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: p.popular
                      ? "0 10px 28px -6px var(--g-glow, rgba(37, 64, 234, 0.6))"
                      : "none",
                  }}
                >
                  <span>{p.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Trust & payment methods banner under pricing */}
        <div
          className="mt-12 rounded-3xl p-6 sm:p-8 border flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/75"
          style={{
            background: "rgba(10, 14, 38, 0.75)",
            borderColor: "rgba(96, 165, 250, 0.25)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-sm text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Clarification importante sur les paiements</span>
            </div>
            <p className="text-white/60 text-xs">
              Seul le marchand règle son abonnement en DZD (BaridiMob, Edahabia, SATIM). Les acheteurs finaux règlent toujours en espèces à la livraison.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">✓ BaridiMob</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">✓ Carte Edahabia / CIB</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">✓ 0% commission</span>
            <Link
              href="/pricing"
              className="text-sky-400 hover:text-sky-300 underline font-bold"
            >
              Voir la page tarifs détaillée →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION "POURQUOI NOUS FAIRE CONFIANCE" (SINCÈRE & BÊTA ACTIVE) ── */}
      <section id="trust" className="py-20 px-6 md:px-12 max-w-5xl mx-auto relative z-10">
        <div
          className="rounded-3xl p-8 sm:p-12 border relative overflow-hidden space-y-6 text-center"
          style={{
            background: "linear-gradient(155deg, rgba(28, 44, 148, 0.3) 0%, rgba(10, 14, 38, 0.9) 100%)",
            borderColor: "rgba(96, 165, 250, 0.35)",
            boxShadow: "0 16px 45px -10px rgba(0, 0, 0, 0.7)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">
            <span>Transparence &amp; Authenticité</span>
          </div>

          <h2
            className="text-2xl sm:text-4xl font-black text-white"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Pourquoi nous faire confiance ?
          </h2>

          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Sur Internet, trop de plateformes affichent de faux chiffres, des compteurs gonflés ou de faux témoignages. Chez <strong>EasyTradez</strong>, nous choisissons la vérité :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-sm">En Version Bêta Active</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Le projet est jeune et en plein développement. Nous échangeons quotidiennement avec nos marchands pour adapter chaque outil à la réalité du terrain.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-sm">Équipe Basée en Algérie</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Notre équipe technique et support est basée à Oran. Nous parlons votre langue (Darija &amp; Français) et comprenons les réalités locales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-sm">Sans Engagement</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Testez gratuitement sans renseigner de carte bancaire. Vous êtes libre d&apos;arrêter à tout moment si la plateforme ne vous convient pas.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 underline"
            >
              <span>En savoir plus sur notre histoire et notre équipe à Oran</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (10 FACTUAL QUESTIONS) ── */}
      <section id="faq" className="py-20 px-6 md:px-12 max-w-5xl mx-auto relative z-10">
        <div className="space-y-3 mb-14 text-center">
          <span
            className="text-xs font-black uppercase tracking-[3px]"
            style={{
              color: "var(--gl, #93c5fd)",
              textShadow: "0 0 16px var(--g-glow, rgba(37, 64, 234, 0.6))",
            }}
          >
            Foire Aux Questions
          </span>
          <h2
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
          >
            Questions Fréquentes
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            Toutes les réponses transparentes pour démarrer et vendre en ligne en toute sérénité.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_QUESTIONS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl transition-all duration-200 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(155deg, rgba(28, 44, 148, 0.25) 0%, rgba(10, 14, 38, 0.8) 100%)",
                  border: isOpen
                    ? "1px solid rgba(96, 165, 250, 0.55)"
                    : "1px solid var(--border, rgba(96, 165, 250, 0.2))",
                  boxShadow: isOpen
                    ? "0 10px 30px -8px rgba(37, 64, 234, 0.35)"
                    : "0 4px 16px rgba(0, 0, 0, 0.4)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                >
                  <span className="font-bold text-base md:text-lg text-white">
                    {item.question}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200"
                    style={{
                      background: isOpen ? "var(--g, #2540ea)" : "rgba(255, 255, 255, 0.05)",
                      borderColor: isOpen ? "var(--gl, #93c5fd)" : "rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {isOpen ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white/70" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm md:text-base text-white/75 leading-relaxed border-t border-white/5">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION BOX ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto relative z-10 text-center">
        <div
          className="rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl"
          style={{
            background:
              "linear-gradient(155deg, rgba(28, 44, 148, 0.4) 0%, rgba(10, 14, 38, 0.9) 100%)",
            border: "1px solid rgba(96, 165, 250, 0.45)",
            boxShadow:
              "0 28px 70px -15px rgba(0, 0, 0, 0.8), 0 0 40px var(--g-subtle, rgba(37, 64, 234, 0.2))",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Radial glow dome */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[260px] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, var(--g-glow, rgba(37, 64, 234, 0.6)) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 space-y-6">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight"
              style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
            >
              Prêt à lancer<br />votre boutique ?
            </h2>

            <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto">
              Rejoignez dès aujourd&apos;hui les premiers marchands qui testent et développent leur commerce en Algérie.
            </p>

            <div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base text-white shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, var(--g, #2540ea) 0%, var(--gd, #1a2ca3) 100%)",
                  boxShadow: "0 14px 40px -8px var(--g-glow, rgba(37, 64, 234, 0.6))",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <span>Créer ma boutique gratuite</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPREHENSIVE TRUST FOOTER WITH CLEAR PROFESSIONAL EMAIL ── */}
      <footer
        className="py-14 px-6 md:px-12 border-t text-center space-y-6 relative z-10"
        style={{
          borderColor: "var(--border, rgba(96, 165, 250, 0.28))",
          background: "rgba(6, 6, 15, 0.96)",
        }}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇩🇿</span>
              <span className="font-extrabold text-white text-base">EasyTradez</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Bêta Algérie
              </span>
            </div>

            {/* Prominent professional email address */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Contact &amp; Assistance :</span>
              <a
                href="mailto:support@easytradez.site"
                className="text-sky-400 hover:text-sky-300 font-bold underline transition-colors"
              >
                support@easytradez.site
              </a>
            </div>
          </div>

          {/* Legal details & Location */}
          <div className="text-xs text-white/50 leading-relaxed max-w-3xl mx-auto space-y-1">
            <p className="font-medium text-white/70">
              Édité par <strong>EasyTradez Technologies</strong> (SARL en cours d&apos;immatriculation / Bêta) · Siège : Oran, Algérie.
            </p>
            <p>
              Conformité Loi n° 09-04 relative aux infractions TIC et Loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.
            </p>
          </div>

          {/* Sincere navigation footer links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/70 pt-2 font-medium">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Tarifs
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              À Propos
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog &amp; Guides
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Conditions Générales (CGU)
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Protection des Données
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Connexion Marchand
            </Link>
            <Link href="/register" className="hover:text-white transition-colors text-sky-400 font-bold">
              Inscription Gratuite
            </Link>
          </div>

          <p className="text-[11px] text-white/40 pt-2">
            © 2026 EasyTradez. Conçu avec fierté pour les entrepreneurs et créateurs en Algérie.
          </p>
        </div>
      </footer>
    </div>
  );
}
