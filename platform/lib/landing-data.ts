export const TICKER_ITEMS = [
  "Paiement à la livraison (COD)",
  "Livraison partout en Algérie",
  "Yalidine Express & ZR Express",
  "Comptabilité en DZD",
  "0% de commission sur vos ventes",
  "Boutique légère pour mobile 3G/4G",
  "Bordereaux d'expédition prêts",
  "Aucune carte bancaire requise pour commencer",
  "Support en Darija & Français",
  "Mise en ligne en 5 minutes",
];

export const FEATURES = [
  {
    num: "01",
    title: "Paiement à la livraison (COD)",
    body: "Le mode d'achat utilisé par la quasi-totalité des clients en Algérie. Vos acheteurs commandent simplement avec leur nom et téléphone, puis règlent en espèces au livreur.",
    tag: "Standard Algérie",
  },
  {
    num: "02",
    title: "Boutique ou Tunnel de vente",
    body: "Adaptez votre format selon votre activité : boutique multi-produits avec panier et catégories, ou tunnel mono-produit direct conçu pour convertir vos visiteurs TikTok et Instagram.",
    tag: "Multi-formats",
  },
  {
    num: "03",
    title: "Tarifs de livraison personnalisés",
    body: "Définissez vos tarifs de livraison à domicile et stop-desk selon les destinations, ou appliquez un tarif standardisé en un seul clic.",
    tag: "Livraison flexible",
  },
  {
    num: "04",
    title: "Bordereaux de livraison prêts à imprimer",
    body: "Générez directement vos bordereaux d'expédition avec l'adresse du client et le montant exact en DZD à encaisser par le transporteur.",
    tag: "Logistique claire",
  },
  {
    num: "05",
    title: "Conçu pour le mobile et les réseaux 3G/4G",
    body: "En Algérie, la grande majorité des commandes s'effectuent sur smartphone. Les pages sont allégées pour s'afficher rapidement, même avec une connexion mobile modeste.",
    tag: "Mobile-first",
  },
  {
    num: "06",
    title: "Filtrage anti-commandes abusives",
    body: "Vérification stricte du format des numéros algériens (05, 06, 07), limitation des envois multiples et liste noire personnalisable pour préserver votre stock et votre trésorerie.",
    tag: "Sécurité & Contrôle",
  },
];

export const TRUST_METRICS = [
  {
    value: "100%",
    suffix: " COD",
    label: "Paiement à la livraison",
    detail: "Vos acheteurs règlent en espèces sans carte bancaire",
  },
  {
    value: "0%",
    suffix: "",
    label: "Commission sur vos ventes",
    detail: "Vous conservez 100% de vos marges commerciales",
  },
  {
    value: "0",
    suffix: " DZD",
    label: "Pour démarrer",
    detail: "Forfait gratuit actif immédiatement sans engagement",
  },
  {
    value: "5",
    suffix: " min",
    label: "Mise en ligne rapide",
    detail: "Votre boutique prête immédiatement avec son adresse sécurisée",
  },
];

export const STATS = TRUST_METRICS.map((m) => ({
  target: m.value === "0" ? 0 : 100,
  suffix: m.suffix,
  label: m.label,
  valueText: m.value,
  detail: m.detail,
}));

export const STEPS = [
  {
    step: "Étape 01",
    title: "Créez votre compte en 60 secondes",
    body: "Renseignez votre nom et numéro de téléphone. Votre boutique et son adresse web sécurisée sont immédiatement prêtes.",
  },
  {
    step: "Étape 02",
    title: "Ajoutez vos produits en Dinars (DZD)",
    body: "Téléversez vos photos, renseignez vos descriptions et fixez vos prix en dinars algériens en toute clarté.",
  },
  {
    step: "Étape 03",
    title: "Expédiez et encaissez vos ventes",
    body: "Recevez les commandes de vos clients, confiez les colis à votre transporteur (Yalidine, ZR Express ou autre), et encaissez les règlements en espèces.",
  },
];

export const FAQ_QUESTIONS = [
  {
    question: "EasyTradez prélève-t-il une commission sur mes commandes ?",
    answer:
      "Non, 0% de commission. Vous conservez l'intégralité de vos marges sur chaque vente. Notre modèle économique repose uniquement sur des forfaits d'abonnement fixes transparents (dont un forfait Gratuit pour démarrer sans frais).",
  },
  {
    question: "Que se passe-t-il si mon client refuse le colis ?",
    answer:
      "Le colis retourne chez le livreur et la commande est marquée \"retournée\" dans votre tableau de bord. Vous pouvez relancer le client par téléphone. Nos outils de vérification des numéros 05/06/07 réduisent les faux envois dès le départ.",
  },
  {
    question: "Quels livreurs puis-je utiliser ?",
    answer:
      "Yalidine, ZR Express et Procolis sont intégrés. Vous connectez votre propre compte chez le livreur et gérez vos tarifs.",
  },
  {
    question: "Comment je paie mon abonnement ?",
    answer:
      "En DZD, par BaridiMob ou carte Edahabia/CIB. Vos clients, eux, paient toujours en espèces à la livraison.",
  },
  {
    question: "Puis-je migrer depuis Shopify ou YouCan ?",
    answer:
      "Oui, contactez-nous par email à support@easytradez.site et nous vous aidons à importer vos produits.",
  },
  {
    question: "Qui a accès aux données de mes clients ?",
    answer:
      "Personne d'autre que vous et votre livreur, uniquement pour la livraison. Voir notre politique de confidentialité.",
  },
  {
    question: "Le support parle-t-il darija ?",
    answer:
      "Oui, par email, réponse sous 24h ouvrées.",
  },
  {
    question: "Et si la plateforme a une panne ?",
    answer:
      "Notre objectif est 99% de disponibilité. Nous communiquons ouvertement sur les incidents.",
  },
];

export interface PricingPlan {
  id: "free" | "pro" | "business";
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  storesLimit: string;
  productsLimit: string;
  features: string[];
  cta: string;
  href: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    badge: "Démarrage",
    tagline: "Idéal pour tester et lancer votre première boutique sans aucun risque.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    storesLimit: "1 Boutique active",
    productsLimit: "Jusqu'à 10 produits",
    features: [
      "1 Boutique active",
      "Jusqu'à 10 produits",
      "4 Thèmes standards personnalisables",
      "Paiement à la livraison (COD) partout en Algérie",
      "Gestion des commandes & bordereaux",
      "Analytiques sur 7 jours",
      "Hébergement rapide et sécurisé (SSL inclus)",
    ],
    cta: "Commencer gratuitement",
    href: "/register?plan=free",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Le plus populaire",
    popular: true,
    tagline: "Pour les marchands et créateurs de marques en pleine expansion.",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
    storesLimit: "Jusqu'à 5 Boutiques & Tunnels",
    productsLimit: "Produits illimités",
    features: [
      "Jusqu'à 5 Boutiques & Tunnels actifs",
      "Produits et variantes illimités",
      "Tous les 10 Thèmes Premium débloqués",
      "Génération IA illimitée (descriptions & textes)",
      "Sous-domaine dédié & Domaine personnalisé (.dz, .com)",
      "Tarifs de livraison modifiables en masse (1 clic)",
      "Comparateur de tunnels & Analytiques complètes",
      "Support prioritaire 7j/7",
    ],
    cta: "Choisir le forfait Pro",
    href: "/register?plan=pro",
  },
  {
    id: "business",
    name: "Business",
    badge: "Agences & Équipes",
    tagline: "Pour les agences e-commerce, grossistes et gros volumes de vente.",
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    storesLimit: "Boutiques illimitées",
    productsLimit: "Produits illimités",
    features: [
      "Boutiques & Tunnels de vente illimités",
      "Tous les avantages du forfait Pro inclus",
      "Accès multi-utilisateurs & permissions d'équipe",
      "Génération IA haute priorité sans file d'attente",
      "Export avancé des commandes (format transporteurs)",
      "Hébergement Cloud Haute Performance Dédié",
      "Gestionnaire de compte dédié & Support VIP 24/7",
    ],
    cta: "Choisir le forfait Business",
    href: "/register?plan=business",
  },
];
