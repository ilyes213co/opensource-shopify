"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Swords,
  Trophy,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Plus,
  RefreshCw,
  HelpCircle,
  Calendar,
  Layers,
  ChevronDown,
  CheckCircle2,
  Crown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { analyticsApi } from "@/lib/api";
import { useUserPlan } from "@/lib/use-user-plan";

// ─── Palette de couleurs pour jusqu'à 5 funnels ──────────────────────────────
const FUNNEL_PALETTE = [
  "#2540EA", // Brand Indigo / Blue
  "#8B5CF6", // Purple / Violet
  "#10B981", // Emerald / Vert
  "#F59E0B", // Amber / Doré
  "#EC4899", // Pink / Rose
];

type PeriodKey = "today" | "7d" | "30d" | "90d" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 derniers jours" },
  { key: "30d", label: "30 derniers jours" },
  { key: "90d", label: "90 derniers jours" },
  { key: "custom", label: "Personnalisé" },
];

function formatCurrency(val: number): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1).replace(".0", "")}M DZD`;
  }
  return `${Math.round(val).toLocaleString("fr-FR")} DZD`;
}

function formatNumber(val: number): string {
  return Math.round(val).toLocaleString("fr-FR");
}

export default function FunnelsBattlePage() {
  const userPlan = useUserPlan();
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedFunnelIds, setSelectedFunnelIds] = useState<string[]>([]);
  const [metricTab, setMetricTab] = useState<"revenue" | "views">("revenue");

  // Requête API vers /api/analytics/compare
  // Seule source de vérité : calcul effectué sur le backend FastAPI
  const isPlanAllowed = !userPlan.isLoading && userPlan.canCompareFunnels;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "funnels-battle",
      period,
      period === "custom" ? customFrom : null,
      period === "custom" ? customTo : null,
      selectedFunnelIds.sort().join(","),
    ],
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (period === "custom" && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      }
      if (selectedFunnelIds.length > 0) {
        params.store_ids = selectedFunnelIds.join(",");
      }
      return analyticsApi.compare(params);
    },
    enabled: isPlanAllowed,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Map des funnels comparés par ID pour infobulles et styles
  const funnelsMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (data?.funnels) {
      data.funnels.forEach((f: any, idx: number) => {
        map[f.id] = {
          ...f,
          color: FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length],
        };
      });
    }
    return map;
  }, [data?.funnels]);

  // Synchronise les funnels sélectionnés à la première réponse si non encore définis
  const availableFunnels = data?.available_funnels || [];
  const funnelsList = data?.funnels || [];

  // ─── Écran Verrouillé : Compte Gratuit (Refus par défaut, 403) ──────────────
  if (!userPlan.isLoading && !userPlan.canCompareFunnels) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {/* Entête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide border border-accent/20">
              <Swords className="w-3.5 h-3.5" />
              <span>Comparateur de rentabilité</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
                PRO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Funnels Battle ⚔️
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Comparez vos tunnels de vente sur la même période pour identifier le plus rentable.
            </p>
          </div>

          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Passer à Pro pour débloquer</span>
          </Link>
        </div>

        {/* Aperçu flouté en arrière-plan avec carte d'upgrade centrale */}
        <div className="relative rounded-3xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-slate-50 dark:bg-white/[0.02] p-6 sm:p-10 shadow-sm min-h-[500px] flex items-center justify-center">
          {/* Faux tableau flouté en fond */}
          <div className="absolute inset-0 p-8 filter blur-md opacity-30 select-none pointer-events-none space-y-6">
            <div className="h-28 rounded-2xl bg-gradient-to-r from-accent/20 to-purple-500/20" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="grid grid-cols-5 gap-4">
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>

          {/* Carte centrale d'incitation à l'upgrade */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 max-w-xl w-full rounded-2xl border border-accent/20 dark:border-white/[0.12] bg-white/95 dark:bg-[#0c0d1c]/95 backdrop-blur-xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 via-purple-500/10 to-accent/25 border border-accent/30 text-accent dark:text-sky flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Funnels Battle est réservé aux membres Pro & Business
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Comparez jusqu&apos;à 5 funnels simultanément. Identifiez votre vainqueur basé
                strictement sur le chiffre d&apos;affaires réellement livré et coupez les tunnels
                non rentables.
              </p>
            </div>

            {/* Avantages clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Classement sur CA livré réel</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Comparaison jusqu&apos;à 5 funnels</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Graphique journalier des ventes</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Détection du funnel le plus efficace</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/upgrade"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Débloquer le Pack Pro (9 900 DZD/mois)</span>
                <Crown className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Vue Principale pour Pro et Business ───────────────────────────────────
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* ── Entête & Sélecteurs ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide border border-accent/20">
            <Swords className="w-3.5 h-3.5" />
            <span>Comparateur multi-funnels</span>
            <span className="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
              {userPlan.planName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Funnels Battle ⚔️
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comparez la rentabilité de vos funnels de vente. Classement déterminé par le CA livré.
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.05] p-1 border border-slate-200 dark:border-white/[0.08]">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === opt.key
                    ? "bg-white dark:bg-accent text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dates personnalisées si mode custom */}
      {period === "custom" && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Du :</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#12121C] text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Au :</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#12121C] text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* ── Sélecteur de Funnels (Pills) si le marchand a plus de 2 funnels ── */}
      {availableFunnels.length > 2 && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Funnels dans la Battle ({selectedFunnelIds.length > 0 ? selectedFunnelIds.length : Math.min(5, availableFunnels.length)} sur {availableFunnels.length}) :
            </span>
            <span className="text-slate-400">Sélectionnez entre 2 et 5 funnels</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableFunnels.map((f: any) => {
              const isSelected =
                selectedFunnelIds.length === 0
                  ? availableFunnels.slice(0, 5).some((af: any) => af.id === f.id)
                  : selectedFunnelIds.includes(f.id);

              return (
                <button
                  key={f.id}
                  onClick={() => {
                    const currentSelected =
                      selectedFunnelIds.length === 0
                        ? availableFunnels.slice(0, 5).map((af: any) => af.id)
                        : selectedFunnelIds;
                    if (isSelected) {
                      if (currentSelected.length <= 2) return;
                      setSelectedFunnelIds(currentSelected.filter((id: string) => id !== f.id));
                    } else {
                      if (currentSelected.length >= 5) return;
                      setSelectedFunnelIds([...currentSelected, f.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/[0.08] hover:border-accent/40"
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Squelette de chargement ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200 dark:bg-white/[0.04]" />
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-white/[0.04]" />
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-white/[0.04]" />
        </div>
      )}

      {/* ── Erreur lisible ─────────────────────────────────────────────────── */}
      {!isLoading && isError && (
        <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-bold text-base">Impossible de charger la Battle</h3>
            <p className="text-xs text-red-500 dark:text-red-300">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Une erreur est survenue lors de l'agrégation des données des funnels."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      {/* ── État Vide : Moins de 2 Funnels Disponibles ───────────────────────── */}
      {!isLoading && !isError && data && !data.has_enough_funnels && (
        <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {data.total_available_funnels === 1
                ? "Il vous manque un deuxième funnel pour lancer la Battle"
                : "Aucun funnel actif trouvé"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {data.total_available_funnels === 1
                ? "Vous possédez actuellement 1 seul tunnel de vente actif. Pour comparer les performances et déterminer le meilleur, créez un second funnel."
                : "Créez au moins 2 funnels pour comparer leurs chiffres d'affaires et taux de conversion."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/funnel"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un nouveau funnel</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Contenu Funnels Battle : Données Chargées ───────────────────────── */}
      {!isLoading && !isError && data && data.has_enough_funnels && (
        <div className="space-y-8">
          {/* ── Bannière Vainqueur / Synthèse ─────────────────────────────────── */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
              data.has_winner
                ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5"
                : "border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    data.has_winner
                      ? "bg-amber-500 text-white shadow-amber-500/25"
                      : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/60"
                  }`}
                >
                  <Trophy className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {data.has_winner ? "Vainqueur de la Battle" : "Résultat de la Battle"}
                    </span>
                    {data.has_winner && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                        TOP 1
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {data.has_winner && data.winner
                      ? data.winner.name
                      : "Aucun vainqueur sur cette période"}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {data.synthesis}
                  </p>
                </div>
              </div>

              {data.has_winner && data.winner && (
                <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-amber-500/20">
                  <p className="text-[10px] font-bold uppercase text-slate-400">CA Livré Vainqueur</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(data.winner.delivered_revenue)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {data.winner.delivered_orders_count} commande(s) livrée(s)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Cartes de Synthèse Rapide par Funnel ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {funnelsList.map((f: any, idx: number) => {
              const color = FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length];
              return (
                <div
                  key={f.id}
                  className={`rounded-2xl p-4 border bg-white dark:bg-white/[0.02] shadow-xs flex flex-col justify-between space-y-3 transition-all hover:border-accent/40 ${
                    f.is_winner
                      ? "border-amber-500/40 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {f.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {f.is_winner && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          🏆 #1
                        </span>
                      )}
                      {!f.is_winner && (
                        <span className="text-[11px] font-bold text-slate-400">
                          #{f.rank}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400">CA Livré</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(f.delivered_revenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {f.pending_revenue > 0 ? (
                        <span>+{formatCurrency(f.pending_revenue)} en attente</span>
                      ) : (
                        <span>0 DZD en attente</span>
                      )}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{formatNumber(f.views)} vues</span>
                    <span className="font-semibold">{f.conversion_rate}% conv.</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Graphique Groupé Recharts ────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Évolution temporelle comparée
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Progression journalière segmentée par tunnel sur le fuseau horaire Algérie.
                </p>
              </div>

              {/* Onglets métrique graphique */}
              <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.05] p-1 border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto">
                <button
                  onClick={() => setMetricTab("revenue")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    metricTab === "revenue"
                      ? "bg-white dark:bg-accent text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  CA Livré (DZD)
                </button>
                <button
                  onClick={() => setMetricTab("views")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    metricTab === "views"
                      ? "bg-white dark:bg-accent text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Visites
                </button>
              </div>
            </div>

            <div className="h-72 sm:h-84 w-full">
              {data.daily_series && data.daily_series.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily_series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 11 }}
                      tickFormatter={(v) => (metricTab === "revenue" ? formatCurrency(v) : `${v}`)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white/95 dark:bg-[#12121C]/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
                              <p className="font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-white/[0.08]">
                                {label}
                              </p>
                              {payload.map((item: any, idx: number) => {
                                const fid = item.dataKey.replace("revenue_", "").replace("views_", "");
                                const fname = funnelsMap[fid]?.name || item.name;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                      />
                                      <span className="text-slate-600 dark:text-white/70 truncate max-w-[120px]">
                                        {fname}
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {metricTab === "revenue"
                                        ? formatCurrency(item.value)
                                        : `${item.value} vues`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      formatter={(val) => {
                        const fid = val.replace("revenue_", "").replace("views_", "");
                        return (
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {funnelsMap[fid]?.name || val}
                          </span>
                        );
                      }}
                    />
                    {funnelsList.map((f: any, idx: number) => (
                      <Bar
                        key={f.id}
                        dataKey={metricTab === "revenue" ? `revenue_${f.id}` : `views_${f.id}`}
                        name={f.name}
                        fill={FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Aucune donnée temporelle à afficher pour cette période.
                </div>
              )}
            </div>
          </div>

          {/* ── Tableau Comparatif Détaillé (Desktop) & Cartes (Mobile) ──────── */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Tableau de bord comparatif
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classement trié par Chiffre d&apos;Affaires livré décroissant.
                </p>
              </div>
            </div>

            {/* Version Bureau (Desktop Table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.01] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-12 text-center">Rang</th>
                    <th className="py-3.5 px-4">Funnel</th>
                    <th className="py-3.5 px-4">CA Livré (Principal)</th>
                    <th className="py-3.5 px-4">CA En Attente</th>
                    <th className="py-3.5 px-4">Visites</th>
                    <th className="py-3.5 px-4">Clics WA</th>
                    <th className="py-3.5 px-4">Commandes</th>
                    <th className="py-3.5 px-4">Taux Conv. WA</th>
                    <th className="py-3.5 px-4">Valeur / Visite</th>
                    <th className="py-3.5 px-4">Panier Moyen</th>
                    <th className="py-3.5 px-4">Distinction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {funnelsList.map((f: any, idx: number) => {
                    const color = FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length];
                    return (
                      <tr
                        key={f.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                          f.is_winner ? "bg-amber-500/5 dark:bg-amber-500/[0.03]" : ""
                        }`}
                      >
                        {/* Rang */}
                        <td className="py-4 px-4 text-center font-black">
                          {f.is_winner ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs shadow-xs">
                              1
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">#{f.rank}</span>
                          )}
                        </td>

                        {/* Nom du funnel */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                {f.name}
                              </p>
                              <a
                                href={`https://${f.slug}.easytrade.dz`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-accent hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>{f.slug}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* CA Livré */}
                        <td className="py-4 px-4 font-black text-sm text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(f.delivered_revenue)}
                          <span className="block text-[10px] font-normal text-slate-400">
                            {f.delivered_orders_count} livrée(s)
                          </span>
                        </td>

                        {/* CA En Attente (Grisé) */}
                        <td className="py-4 px-4 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          <span className="font-semibold">
                            {formatCurrency(f.pending_revenue)}
                          </span>
                          <span className="block text-[10px]">
                            {f.pending_orders_count} en cours
                          </span>
                        </td>

                        {/* Visites */}
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {formatNumber(f.views)}
                        </td>

                        {/* Clics WA */}
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {formatNumber(f.whatsapp_clicks)}
                        </td>

                        {/* Commandes & Taux de commande */}
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <span className="font-semibold">{f.orders_count}</span>
                          <span className="block text-[10px] text-slate-400">
                            {f.order_rate}% des vues
                          </span>
                        </td>

                        {/* Taux Conv WA */}
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {f.conversion_rate}%
                        </td>

                        {/* Valeur par Visite */}
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {f.revenue_per_visit.toFixed(1)} DZD
                        </td>

                        {/* Panier Moyen Livré */}
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {formatCurrency(f.aov)}
                        </td>

                        {/* Badges / Distinction */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {f.is_winner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              <Trophy className="w-3 h-3" />
                              <span>Vainqueur</span>
                            </span>
                          )}
                          {f.is_most_efficient && !f.is_winner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              <Zap className="w-3 h-3" />
                              <span>Plus efficace</span>
                            </span>
                          )}
                          {f.is_low_sample && (
                            <span
                              className="text-[10px] text-slate-400 italic"
                              title="Moins de 30 visites enregistrées sur la période"
                            >
                              Échantillon faible
                            </span>
                          )}
                          {!f.is_winner && !f.is_most_efficient && !f.is_low_sample && (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Version Mobile (Cartes empilées) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
              {funnelsList.map((f: any, idx: number) => {
                const color = FUNNEL_PALETTE[idx % FUNNEL_PALETTE.length];
                return (
                  <div key={f.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {f.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {f.is_winner && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                            🏆 #1
                          </span>
                        )}
                        {!f.is_winner && (
                          <span className="text-xs font-bold text-slate-400">#{f.rank}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <div>
                        <p className="text-[10px] text-slate-400">CA Livré (Principal)</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(f.delivered_revenue)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {f.delivered_orders_count} livrée(s)
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400">CA En Attente</p>
                        <p className="text-sm font-semibold text-slate-500">
                          {formatCurrency(f.pending_revenue)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {f.pending_orders_count} en cours
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div>
                        <p className="text-slate-400 text-[10px]">Visites</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {formatNumber(f.views)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">Clics WA</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {formatNumber(f.whatsapp_clicks)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">Conv. WA</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {f.conversion_rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Notes Méthodologiques & Légende ──────────────────────────────── */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-4 h-4 text-accent" />
              <span>Notes méthodologiques & règles de calcul</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 leading-relaxed">
              <li>
                <strong>Critère principal :</strong> Le chiffre d&apos;affaires (CA) de la Battle prend en compte exclusivement les commandes avec le statut <em>Livrée</em> (<code>delivered</code>). Les commandes en cours (confirmées et expédiées) sont mentionnées à titre indicatif et ne modifient pas le classement.
              </li>
              <li>
                <strong>Filtrage de la période :</strong> La période s&apos;applique strictement sur la date de création de la commande (<code>orders.created_at</code>).
              </li>
              <li>
                <strong>Visites :</strong> Les visites correspondent aux vues totales de page (non dédupliquées).
              </li>
              <li>
                <strong>Indicateur d&apos;efficacité :</strong> L&apos;attribution du badge « Plus efficace » requiert un échantillon minimum de 30 visites pour garantir la pertinence statistique.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
