"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storesApi, productsApi } from "@/lib/api";
import type { Product } from "@/types/database";
import type { Store } from "@/types/store";
import { safeString } from "@/lib/utils";
import { toast } from "sonner";
import FunnelPage from "@/components/FunnelPage";
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  FileText,
  ExternalLink,
  ZoomIn,
  Maximize2,
} from "lucide-react";

interface FunnelEditorViewProps {
  storeId: string;
}

export default function FunnelEditorView({ storeId }: FunnelEditorViewProps) {
  const queryClient = useQueryClient();

  // Load store
  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useQuery<Store>({
    queryKey: ["store", storeId],
    queryFn: () => storesApi.getOne(storeId),
    enabled: Boolean(storeId),
  });

  // Load products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["store-products", storeId],
    queryFn: () => productsApi.getByStore(storeId),
    enabled: Boolean(storeId),
  });

  const starProduct = products[0];

  // Viewport mode & Zoom
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"offer" | "checkout" | "trust" | "details">("offer");
  const [zoomLevel, setZoomLevel] = useState<"fit" | 1 | 0.85 | 0.75>("fit");

  // Measured canvas dimensions for responsive auto-fit
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvasRef.current);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Desktop canvas width and scale factor
  const desktopBaseWidth = 1040;
  const desktopScale = useMemo(() => {
    if (viewportMode === "mobile") return 1;
    if (zoomLevel === 1) return 1;
    if (zoomLevel === 0.85) return 0.85;
    if (zoomLevel === 0.75) return 0.75;
    // Mode "fit" : s'adapte précisément à la largeur disponible avec marge de 32px
    if (!canvasDimensions.width || canvasDimensions.width >= desktopBaseWidth + 48) return 1;
    return Math.max(0.42, Math.min(1, (canvasDimensions.width - 48) / desktopBaseWidth));
  }, [viewportMode, zoomLevel, canvasDimensions.width]);

  // Mobile scale factor if height is restricted
  const mobileScale = useMemo(() => {
    if (viewportMode !== "mobile") return 1;
    const phoneHeight = 820;
    if (!canvasDimensions.height || canvasDimensions.height >= phoneHeight + 40) return 1;
    return Math.max(0.65, Math.min(1, (canvasDimensions.height - 40) / phoneHeight));
  }, [viewportMode, canvasDimensions.height]);

  // Funnel fields state
  const [slogan, setSlogan] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [price, setPrice] = useState("");
  const [wasPrice, setWasPrice] = useState("");
  const [discountBadge, setDiscountBadge] = useState("");
  const [taxnote, setTaxnote] = useState("");

  const [shippingHead, setShippingHead] = useState("");
  const [ctaButton, setCtaButton] = useState("");
  const [stickyCtaLabel, setStickyCtaLabel] = useState("");

  const [trust1Title, setTrust1Title] = useState("");
  const [trust1Sub, setTrust1Sub] = useState("");
  const [trust2Title, setTrust2Title] = useState("");
  const [trust2Sub, setTrust2Sub] = useState("");
  const [trust3Title, setTrust3Title] = useState("");
  const [trust3Sub, setTrust3Sub] = useState("");

  const [productDescription, setProductDescription] = useState("");
  const [footerText, setFooterText] = useState("");

  // Initialize from store overrides and product
  useEffect(() => {
    if (!store) return;
    const overrides = ((store as any).content_overrides || {}) as Record<string, any>;

    setSlogan(
      safeString(
        overrides.slogan,
        store.slogan || "Livraison express 58 wilayas · Paiement à la réception"
      )
    );
    setProductTitle(
      safeString(
        overrides.product_title,
        starProduct?.name || store.name || "Produit Funnel"
      )
    );
    setPrice(
      overrides.price !== undefined && overrides.price !== null
        ? String(overrides.price)
        : starProduct?.price
        ? String(starProduct.price)
        : "4500"
    );
    setWasPrice(
      overrides.was_price !== undefined && overrides.was_price !== null
        ? String(overrides.was_price)
        : starProduct?.original_price
        ? String(starProduct.original_price)
        : starProduct?.price
        ? String(Math.round(starProduct.price * 1.3))
        : "6500"
    );
    setDiscountBadge(safeString(overrides.discount_badge, "-35% OFF"));
    setTaxnote(
      safeString(
        overrides.taxnote,
        "Paiement à la livraison · Vérification du colis autorisée"
      )
    );

    setShippingHead(
      safeString(overrides.shipping_head, "Informations de livraison rapide")
    );
    setCtaButton(
      safeString(
        overrides.cta_button,
        "COMMANDER MAINTENANT (Paiement à la livraison)"
      )
    );
    setStickyCtaLabel(
      safeString(overrides.sticky_cta_label, "COMMANDER - PAIEMENT À LA LIVRAISON")
    );

    setTrust1Title(safeString(overrides.trust_1_title, "Livraison 58 Wilayas"));
    setTrust1Sub(
      safeString(overrides.trust_1_sub, "À domicile ou en point relais 24-48h")
    );
    setTrust2Title(safeString(overrides.trust_2_title, "Paiement à la livraison"));
    setTrust2Sub(
      safeString(overrides.trust_2_sub, "Inspectez votre colis avant de payer")
    );
    setTrust3Title(safeString(overrides.trust_3_title, "Produit 100% Garanti"));
    setTrust3Sub(
      safeString(overrides.trust_3_sub, "Échange gratuit en cas de non-conformité")
    );

    setProductDescription(
      safeString(
        overrides.product_description,
        starProduct?.description ||
          "Profitez de notre offre exclusive sur ce produit sélectionné pour sa qualité exceptionnelle."
      )
    );
    setFooterText(
      safeString(
        overrides.footer_text,
        "EasyTradez · Plateforme E-commerce Algérie · Tous droits réservés"
      )
    );
  }, [store, starProduct]);

  // Reactive preview store with current edits
  const previewStore = useMemo(() => {
    if (!store) return null;
    const parsedPrice = parseFloat(price);
    const parsedWasPrice = parseFloat(wasPrice);

    return {
      ...store,
      slogan: slogan.trim(),
      content_overrides: {
        ...((store as any).content_overrides || {}),
        slogan: slogan.trim(),
        product_title: productTitle.trim(),
        price: !isNaN(parsedPrice) ? parsedPrice : undefined,
        was_price: !isNaN(parsedWasPrice) ? parsedWasPrice : undefined,
        discount_badge: discountBadge.trim(),
        taxnote: taxnote.trim(),
        shipping_head: shippingHead.trim(),
        cta_button: ctaButton.trim(),
        sticky_cta_label: stickyCtaLabel.trim(),
        trust_1_title: trust1Title.trim(),
        trust_1_sub: trust1Sub.trim(),
        trust_2_title: trust2Title.trim(),
        trust_2_sub: trust2Sub.trim(),
        trust_3_title: trust3Title.trim(),
        trust_3_sub: trust3Sub.trim(),
        product_description: productDescription.trim(),
        footer_text: footerText.trim(),
      },
    };
  }, [
    store,
    slogan,
    productTitle,
    price,
    wasPrice,
    discountBadge,
    taxnote,
    shippingHead,
    ctaButton,
    stickyCtaLabel,
    trust1Title,
    trust1Sub,
    trust2Title,
    trust2Sub,
    trust3Title,
    trust3Sub,
    productDescription,
    footerText,
  ]);

  // Reactive preview product
  const previewProduct: any = useMemo(() => {
    const base = starProduct || {
      id: "preview-star-product",
      store_id: store?.id || "",
      name: store?.name || "Produit Star",
      description: "Description de démonstration",
      price: 4500,
      original_price: 6500,
      images: [store?.cover_url || ""].filter(Boolean),
      options: [],
      category: "Général",
      status: "active",
    };
    const parsedPrice = parseFloat(price);
    const parsedWasPrice = parseFloat(wasPrice);

    return {
      ...base,
      name: productTitle || base.name,
      description: productDescription || base.description,
      price: !isNaN(parsedPrice) ? parsedPrice : base.price,
      original_price: !isNaN(parsedWasPrice) ? parsedWasPrice : base.original_price,
    };
  }, [starProduct, store, productTitle, productDescription, price, wasPrice]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error("Tunnel introuvable");

      const parsedPrice = parseFloat(price);
      const parsedWasPrice = parseFloat(wasPrice);

      const payload: Record<string, any> = {
        ...((store as any).content_overrides || {}),
        slogan: slogan.trim(),
        product_title: productTitle.trim(),
        price: !isNaN(parsedPrice) ? parsedPrice : undefined,
        was_price: !isNaN(parsedWasPrice) ? parsedWasPrice : undefined,
        discount_badge: discountBadge.trim(),
        taxnote: taxnote.trim(),
        shipping_head: shippingHead.trim(),
        cta_button: ctaButton.trim(),
        sticky_cta_label: stickyCtaLabel.trim(),
        trust_1_title: trust1Title.trim(),
        trust_1_sub: trust1Sub.trim(),
        trust_2_title: trust2Title.trim(),
        trust_2_sub: trust2Sub.trim(),
        trust_3_title: trust3Title.trim(),
        trust_3_sub: trust3Sub.trim(),
        product_description: productDescription.trim(),
        footer_text: footerText.trim(),
      };

      const res = await fetch(`/api/stores/${store.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_overrides: payload }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erreur lors de la sauvegarde du funnel");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", storeId] });
      toast.success("Tunnel publié avec succès !", {
        description: "Vos modifications sont visibles en direct sur votre page de vente.",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Impossible d'enregistrer les modifications");
    },
  });

  // Reset to original
  const handleReset = () => {
    if (!store) return;
    const overrides = ((store as any).content_overrides || {}) as Record<string, any>;
    setSlogan(safeString(overrides.slogan, store.slogan || ""));
    setProductTitle(safeString(overrides.product_title, starProduct?.name || store.name || ""));
    setPrice(overrides.price !== undefined ? String(overrides.price) : String(starProduct?.price || ""));
    setWasPrice(overrides.was_price !== undefined ? String(overrides.was_price) : String(starProduct?.original_price || ""));
    setDiscountBadge(safeString(overrides.discount_badge, "-35% OFF"));
    setTaxnote(safeString(overrides.taxnote, "Paiement à la livraison · Vérification du colis autorisée"));
    setShippingHead(safeString(overrides.shipping_head, "Informations de livraison rapide"));
    setCtaButton(safeString(overrides.cta_button, "COMMANDER MAINTENANT (Paiement à la livraison)"));
    setStickyCtaLabel(safeString(overrides.sticky_cta_label, "COMMANDER - PAIEMENT À LA LIVRAISON"));
    setTrust1Title(safeString(overrides.trust_1_title, "Livraison 58 Wilayas"));
    setTrust1Sub(safeString(overrides.trust_1_sub, "À domicile ou en point relais 24-48h"));
    setTrust2Title(safeString(overrides.trust_2_title, "Paiement à la livraison"));
    setTrust2Sub(safeString(overrides.trust_2_sub, "Inspectez votre colis avant de payer"));
    setTrust3Title(safeString(overrides.trust_3_title, "Produit 100% Garanti"));
    setTrust3Sub(safeString(overrides.trust_3_sub, "Échange gratuit en cas de non-conformité"));
    setProductDescription(safeString(overrides.product_description, starProduct?.description || ""));
    setFooterText(safeString(overrides.footer_text, "EasyTradez · Plateforme E-commerce Algérie · Tous droits réservés"));
    toast.info("Valeurs réinitialisées aux données sauvegardées");
  };

  const liveUrl = store?.published_url || (store?.slug ? `/${store.slug}` : `/dashboard/funnel/${storeId}`);

  // Loading state
  if (isStoreLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Chargement de votre tunnel...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (storeError || !store) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <p className="text-red-400 font-semibold">Tunnel introuvable ou erreur de chargement</p>
          <Link
            href="/dashboard/funnel"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux funnels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* ── TOP BAR FIXE (HAUTEUR OPTIMISÉE H-14) ── */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/dashboard/funnel/${store.id}`}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Quitter l'éditeur et revenir au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
              Tunnel
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[240px]">
              {store.name}
            </h1>
          </div>
        </div>

        {/* Commandes centrales & boutons d'action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Switcher Viewport Ordinateur / Mobile */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewportMode("desktop")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewportMode === "desktop"
                  ? "bg-accent text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Aperçu Ordinateur (Desktop)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bureau</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode("mobile")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewportMode === "mobile"
                  ? "bg-accent text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Aperçu Mobile (iPhone)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden lg:inline">Réinitialiser</span>
          </button>

          {/* Live Link */}
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-accent" />
            <span>Voir en direct</span>
          </a>

          {/* Enregistrer et publier */}
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-bold transition-all shadow-sm shadow-accent/25 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Publier</span>
          </button>
        </div>
      </header>

      {/* ── CORPS DE L'ÉDITEUR : PLEINE LARGEUR & HAUTEUR 100% ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* COLONNE GAUCHE : FORMULAIRE D'ÉDITION ÉPURÉ & OPTIMISÉ */}
        <aside className="w-full lg:w-[370px] xl:w-[390px] border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/70 flex flex-col shrink-0 h-full overflow-hidden">
          {/* Onglets compacts */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("offer")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  activeTab === "offer"
                    ? "bg-accent text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Offre</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("checkout")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  activeTab === "checkout"
                    ? "bg-accent text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Commande</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trust")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  activeTab === "trust"
                    ? "bg-accent text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Garanties</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  activeTab === "details"
                    ? "bg-accent text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Détails</span>
              </button>
            </div>
          </div>

          {/* Champs de saisie scrollables */}
          <div className="p-3.5 sm:p-4 space-y-4 flex-1 overflow-y-auto select-text">
            {/* ── ONGLET 1 : OFFRE & ACCROCHE ── */}
            {activeTab === "offer" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-2.5">
                  <p className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Accroche &amp; Proposition de Valeur
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Textes stratégiques affichés tout en haut de votre page de vente.
                  </p>
                </div>

                {/* Slogan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Barre d&apos;annonce (Slogan tout en haut)
                  </label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Livraison express 58 wilayas · Paiement à la réception"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Titre Produit / Accroche */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200">
                      Titre d&apos;accroche du produit (H1)
                    </label>
                    <span className="text-[9px] text-slate-500">{productTitle.length}/100</span>
                  </div>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="Nom du produit ou promesse principale"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors font-medium"
                  />
                </div>

                {/* Prix & Ancien Prix */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-200 mb-1">
                      Prix de vente (DA)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="4500"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-200 mb-1">
                      Ancien prix barré (DA)
                    </label>
                    <input
                      type="number"
                      value={wasPrice}
                      onChange={(e) => setWasPrice(e.target.value)}
                      placeholder="6900"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 line-through placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* Badge Promotionnel */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Badge de réduction / Promo
                  </label>
                  <input
                    type="text"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="-35% OFF"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Note de réassurance sous le prix */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Note de réassurance (sous le prix)
                  </label>
                  <input
                    type="text"
                    value={taxnote}
                    onChange={(e) => setTaxnote(e.target.value)}
                    placeholder="Paiement à la livraison · Vérification du colis autorisée"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            )}

            {/* ── ONGLET 2 : COMMANDE & CTA ── */}
            {activeTab === "checkout" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    Formulaire &amp; Boutons de Commande
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Personnalisez le libellé d&apos;achat direct et les titres du bon de commande COD.
                  </p>
                </div>

                {/* Titre du formulaire */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Titre du formulaire de livraison
                  </label>
                  <input
                    type="text"
                    value={shippingHead}
                    onChange={(e) => setShippingHead(e.target.value)}
                    placeholder="Informations de livraison rapide"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Bouton CTA Principal */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Bouton de commande principal (CTA)
                  </label>
                  <input
                    type="text"
                    value={ctaButton}
                    onChange={(e) => setCtaButton(e.target.value)}
                    placeholder="COMMANDER MAINTENANT (Paiement à la livraison)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Bouton Flottant Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Texte du bouton flottant (Mobile)
                  </label>
                  <input
                    type="text"
                    value={stickyCtaLabel}
                    onChange={(e) => setStickyCtaLabel(e.target.value)}
                    placeholder="COMMANDER - PAIEMENT À LA LIVRAISON"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            )}

            {/* ── ONGLET 3 : GARANTIES & CONFIANCE ── */}
            {activeTab === "trust" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2.5">
                  <p className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    Badges de Réassurance &amp; Confiance
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Réduisez les abandons et retours en rassurant vos clients.
                  </p>
                </div>

                {/* Garantie 1 */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <p className="text-[11px] font-bold text-accent">Garantie 1 (Livraison)</p>
                  <input
                    type="text"
                    value={trust1Title}
                    onChange={(e) => setTrust1Title(e.target.value)}
                    placeholder="Livraison 58 Wilayas"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={trust1Sub}
                    onChange={(e) => setTrust1Sub(e.target.value)}
                    placeholder="À domicile ou en point relais 24-48h"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Garantie 2 */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <p className="text-[11px] font-bold text-accent">Garantie 2 (Paiement)</p>
                  <input
                    type="text"
                    value={trust2Title}
                    onChange={(e) => setTrust2Title(e.target.value)}
                    placeholder="Paiement à la livraison"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={trust2Sub}
                    onChange={(e) => setTrust2Sub(e.target.value)}
                    placeholder="Inspectez votre colis avant de payer"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Garantie 3 */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <p className="text-[11px] font-bold text-accent">Garantie 3 (Qualité)</p>
                  <input
                    type="text"
                    value={trust3Title}
                    onChange={(e) => setTrust3Title(e.target.value)}
                    placeholder="Produit 100% Garanti"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={trust3Sub}
                    onChange={(e) => setTrust3Sub(e.target.value)}
                    placeholder="Échange gratuit en cas de non-conformité"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {/* ── ONGLET 4 : DESCRIPTION & PIED DE PAGE ── */}
            {activeTab === "details" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2.5">
                  <p className="text-[11px] font-semibold text-purple-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    Contenu Détaillé &amp; Pied de Page
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Description de présentation du produit et mention officielle de réassurance en bas de page.
                  </p>
                </div>

                {/* Description du produit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200">
                      Description du produit (Onglet Description)
                    </label>
                    <span className="text-[9px] text-slate-500">{productDescription.length} car.</span>
                  </div>
                  <textarea
                    rows={5}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Détaillez les avantages clés de votre produit..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors leading-relaxed resize-y"
                  />
                </div>

                {/* Footer text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Texte de bas de page (Footer)
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="EasyTradez · Plateforme E-commerce Algérie · Tous droits réservés"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* COLONNE DROITE : APERÇU INTERACTIF SCALÉ & PARFAITEMENT AJUSTÉ À L'ÉCRAN */}
        <main
          ref={canvasRef}
          className="flex-1 bg-slate-950/95 flex flex-col min-h-0 min-w-0 overflow-hidden relative"
        >
          {/* Barre d'état & Contrôle de zoom */}
          <div className="h-8 border-b border-slate-800 bg-slate-900/80 px-3 sm:px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Aperçu en direct (mise à jour instantanée)</span>
              <span className="sm:hidden">Aperçu direct</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Zoom Switcher */}
              {viewportMode === "desktop" && (
                <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800 text-[10px]">
                  <span className="text-slate-500 flex items-center gap-0.5 mr-1">
                    <ZoomIn className="w-2.5 h-2.5" />
                    Zoom :
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel("fit")}
                    className={`px-1.5 py-0.5 rounded ${
                      zoomLevel === "fit" ? "bg-accent text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                    title="Ajuster automatiquement à la largeur disponible"
                  >
                    Ajuster ({Math.round(desktopScale * 100)}%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className={`px-1 py-0.5 rounded ${
                      zoomLevel === 1 ? "bg-accent text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(0.85)}
                    className={`px-1 py-0.5 rounded ${
                      zoomLevel === 0.85 ? "bg-accent text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    85%
                  </button>
                </div>
              )}

              <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                {viewportMode === "desktop" ? "1040px Desktop" : "380px Mobile"}
              </span>
            </div>
          </div>

          {/* Espace Canvas scrollable avec centrage parfait */}
          <div className="flex-1 overflow-auto p-3 sm:p-5 flex items-start justify-center min-w-0">
            {viewportMode === "desktop" ? (
              <div
                className="transition-transform duration-150 origin-top shrink-0"
                style={{
                  width: `${desktopBaseWidth}px`,
                  transform: `scale(${desktopScale})`,
                  marginBottom: desktopScale < 1 ? `-${Math.round((1 - desktopScale) * 100)}%` : 0,
                }}
              >
                <div className="w-full rounded-2xl border border-slate-800 shadow-2xl bg-white overflow-hidden text-slate-900">
                  {previewStore && (
                    <FunnelPage
                      key={JSON.stringify(previewStore.content_overrides)}
                      store={previewStore as any}
                      product={previewProduct}
                      theme={(store.theme as any) || "crimson"}
                      isEditable={false}
                      isPreview={true}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div
                className="transition-transform duration-150 origin-top shrink-0"
                style={{
                  transform: `scale(${mobileScale})`,
                }}
              >
                <div className="w-[380px] h-[780px] rounded-[40px] border-[9px] border-slate-800 shadow-2xl bg-white overflow-y-auto overflow-x-hidden text-slate-900 relative">
                  {/* Dynamic Island Notch */}
                  <div className="sticky top-0 left-0 right-0 h-6 bg-slate-900 z-50 flex items-center justify-center">
                    <div className="w-20 h-3 bg-black rounded-full" />
                  </div>
                  {previewStore && (
                    <FunnelPage
                      key={JSON.stringify(previewStore.content_overrides)}
                      store={previewStore as any}
                      product={previewProduct}
                      theme={(store.theme as any) || "crimson"}
                      isEditable={false}
                      isPreview={true}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
