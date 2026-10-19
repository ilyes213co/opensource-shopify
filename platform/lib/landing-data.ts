export const TICKER_ITEMS = [
  "Paiement à la livraison",
  "Algérie · الجزائر",
  "Yalidine & ZR Express",
  "Comptabilité en DZD",
  "58 Wilayas couvertes",
  "Boutique 100% Mobile",
  "Certificat SSL Sécurisé",
  "Zéro Carte Bancaire requise",
  "Support Darija & Français",
  "Ouverture en 5 minutes",
];

export const FEATURES = [
  {
    num: "01",
    title: "Paiement à la livraison",
    body: "Le standard incontournable en Algérie. Vos clients règlent en espèces à la remise du colis par le livreur. Zéro friction, confiance maximale.",
    tag: "Standard Algérie",
  },
  {
    num: "02",
    title: "IA intégrée",
    body: "Génération de boutiques stylées et fiches produits captivantes grâce à l'IA en moins d'une minute.",
    tag: "Intelligent",
  },
  {
    num: "03",
    title: "Livraison Intégrée",
    body: "Bordereaux de livraison imprimables avec le montant à encaisser.",
    tag: "58 Wilayas",
  },
  {
    num: "04",
    title: "Déploiement rapide",
    body: "Votre boutique sera en ligne dans moins d'une minute, prête à recevoir des commandes et à convertir vos visiteurs.",
    tag: "< 60 secondes",
  },
  {
    num: "05",
    title: "100% Mobile-first",
    body: "9 commandes sur 10 se font sur smartphone en Algérie. Les vitrines sont calibrées pour se charger instantanément même en connexion 3G/4G.",
    tag: "Ultra-rapide",
  },
  {
    num: "06",
    title: "Protection Anti-Faux Ordres",
    body: "Certificat SSL inclus, filtres intelligents pour bloquer les commandes frauduleuses ou spams et infrastructure cloud toujours en ligne.",
    tag: "Sécurité Pro",
  },
];

export const STATS = [
  { target: 99, suffix: "%", label: "Disponibilité garantie" },
  { target: 58, suffix: "", label: "Wilayas couvertes" },
  { target: 5, suffix: "min", label: "Pour ouvrir sa boutique" },
  { target: 0, suffix: " DZD", label: "Pour commencer" },
];

export const STEPS = [
  {
    step: "Étape 01",
    title: "Créez votre compte en 60s",
    body: "Renseignez votre nom et numéro de téléphone. Votre boutique et son sous-domaine sont immédiatement configurés.",
  },
  {
    step: "Étape 02",
    title: "Ajoutez vos produits en DZD",
    body: "Importez vos photos, décrivez vos articles et fixez vos tarifs en dinars algériens en toute simplicité grâce à nos modèles.",
  },
  {
    step: "Étape 03",
    title: "Encaissez à la livraison",
    body: "Recevez vos premières commandes en direct, expédiez avec Yalidine ou ZR Express, et encaissez vos paiements en espèces.",
  },
];

export const FAQ_QUESTIONS = [
  {
    question: "Comment fonctionne le paiement à la livraison (COD) sur EasyTradez ?",
    answer:
      "EasyTradez est conçu spécifiquement pour les habitudes d'achat en Algérie. Vos clients n'ont pas besoin de carte bancaire : ils remplissent un formulaire direct en 30 secondes (Nom, Téléphone, Wilaya, Commune) et règlent le montant de leur commande en espèces lors de la remise du colis par le livreur.",
  },
  {
    question: "Puis-je intégrer Yalidine Express, ZR Express ou d'autres transporteurs ?",
    answer:
      "Absolument. Vous pouvez connecter vos transporteurs habituels (Yalidine Express, ZR Express, Procolis, etc.) pour automatiser l'édition des bordereaux d'expédition et afficher directement les tarifs de livraison à domicile ou stop-desk pour les 58 wilayas.",
  },
  {
    question: "Ai-je besoin d'une carte bancaire internationale pour utiliser EasyTradez ?",
    answer:
      "Non, aucune carte bancaire internationale (Visa / Mastercard) n'est requise. Les marchands algériens peuvent activer leur compte et régler leurs forfaits via BaridiMob, carte Edahabia ou virement bancaire local.",
  },
  {
    question: "Puis-je créer à la fois un funnel mono-produit et une boutique catalogue ?",
    answer:
      "Oui. EasyTradez supporte nativement deux architectures de vente : le funnel mono-produit (idéal pour les lancements sponsorisés TikTok/Instagram Ads avec fort taux de conversion) et la boutique multi-produits avec gestion de catégories, navigation par rayons et panier.",
  },
  {
    question: "Les boutiques sont-elles optimisées pour les téléphones portables ?",
    answer:
      "100% mobile-first. En Algérie, plus de 92% des achats en ligne se font sur smartphone. Nos vitrines sont ultralégères, pensées pour les réseaux mobiles 3G/4G, et se chargent en moins d'une seconde.",
  },
  {
    question: "Combien de temps faut-il pour mettre ma boutique en ligne ?",
    answer:
      "Moins de 5 minutes. Notre assistant de création guidé et notre IA vous permettent de choisir un thème, importer votre logo, saisir votre produit vedette et obtenir une URL publique active immédiatement.",
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
      "Paiement à la livraison (COD) 58 wilayas",
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
      "Tarifs 58 wilayas modifiables en masse (1 clic)",
      "Comparateur de tunnels & Analytiques complètes",
      "Support prioritaire WhatsApp 7j/7",
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

