import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale, Clock, ShieldCheck } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) — EasyTradez Algérie",
  description:
    "Conditions contractuelles, annulation, remboursement, SLA support et juridiction algérienne pour la plateforme EasyTradez.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-slate-200 py-16 px-4 sm:px-6 lg:px-8 selection:bg-[#2540ea] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <EasyTradeLogo size={30} href="/" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* Title Block */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-white"
              style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
            >
              Conditions Générales d&apos;Utilisation (CGU)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Contrat régissant l&apos;accès et l&apos;utilisation des services EasyTradez Technologies · Version Octobre 2026
            </p>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              1. Objet du Service & Acceptation
            </h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation ont pour objet de définir les modalités selon lesquelles la société <strong>EasyTradez Technologies</strong> met à disposition de ses utilisateurs (« le Marchand ») sa solution logicielle hébergée (SaaS) permettant la création, l&apos;hébergement et la gestion de boutiques en ligne et de tunnels de vente orientés vers le marché algérien.
            </p>
            <p>
              Toute inscription ou utilisation de la plateforme implique l&apos;adhésion pleine et entière, sans réserve, aux présentes CGU.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              2. Compte Marchand & Slugs Réservés
            </h2>
            <p>
              Pour créer une boutique, le marchand doit fournir des informations exactes et vérifiables (nom, numéro de téléphone algérien actif, adresse email).
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
              <strong>Protection des marques déposées :</strong> Il est strictement interdit d&apos;enregistrer une adresse de boutique ou un sous-domaine reprenant des marques de renommée ou protégées par le droit algérien et international (ex. Apple, Adidas, Nike, Samsung, etc.). Tout compte violant cette interdiction sera automatiquement suspendu ou renommé sans préavis.
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              3. Responsabilité du Marchand sur ses Produits, son Nom de Boutique et ses Ventes
            </h2>
            <p>
              Le Marchand demeure seul et unique responsable des articles proposés à la vente sur sa boutique ainsi que du nom commercial et du slug choisis pour son espace. Le marchand garantit formellement que son nom de boutique et son identité visuelle ne violent aucun droit de propriété intellectuelle, marque déposée ou droit de tiers. EasyTradez se réserve le droit de renommer ou de suspendre immédiatement et sans préavis toute boutique en violation de cette disposition.
            </p>
            <p>
              Le Marchand s&apos;engage formellement à respecter la législation algérienne relative au commerce, à la protection du consommateur (Loi 09-03) et aux règles de facturation.
            </p>
            <p>
              EasyTradez agit exclusivement en qualité de prestataire technique et hébergeur au sens de la Loi 09-04. EasyTradez n&apos;est en aucun cas partie aux contrats de vente conclus entre le Marchand et ses clients finaux, ni responsable de la qualité ou de la conformité des marchandises livrées.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Abonnements, Tarifs en DZD & Modalités de Règlement</h2>
            <p>
              Les forfaits (Gratuit, Pro, Business) sont libellés en <strong>Dinars Algériens (DZD)</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>0% de commission :</strong> EasyTradez ne prélève aucun pourcentage sur le chiffre d&apos;affaires généré par les commandes de vos clients.</li>
              <li><strong>Règlement des abonnements :</strong> Le Marchand règle son abonnement mensuel ou annuel par carte CIB, carte Edahabia via les services BaridiMob / SATIM, ou virement bancaire local.</li>
              <li><strong>Clients finaux :</strong> Le client final règle ses commandes directement auprès du transporteur en espèces à la livraison (COD).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Annulation et Résiliation sans Engagement</h2>
            <p>
              Nos forfaits payants sont souscrits <strong>sans engagement de durée</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Le Marchand peut résilier ou modifier son forfait à tout moment depuis son tableau de bord en 1 clic.</li>
              <li>En cas de non-renouvellement, la boutique reste accessible avec les limites du forfait Gratuit (1 boutique, 10 produits), sans interruption brutale de service pour ses clients.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Politique de Remboursement</h2>
            <p>
              Si vous souscrivez un forfait payant (Pro ou Business) et que vous estimez que le service ne correspond pas à vos attentes techniques, vous disposez d&apos;un délai de <strong>7 jours calendaires</strong> à compter de la date de paiement pour demander un remboursement intégral, à condition de ne pas avoir dépassé un volume de 50 commandes traitées.
            </p>
            <p>
              Les demandes de remboursement doivent être formulées par écrit à <em>support@easytradez.site</em> avec la référence de transaction BaridiMob / SATIM.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              7. Qualité de Service (SLA) & Support
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="font-bold text-white">Disponibilité de la plateforme</span>
                <p className="text-slate-400">
                  EasyTradez s&apos;efforce d&apos;assurer une disponibilité minimale de 99,5% hors périodes de maintenance programmées notifiées à l&apos;avance.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="font-bold text-white">Délai de réponse Support (SLA)</span>
                <p className="text-slate-400">
                  Notre équipe d&apos;assistance basée en Algérie s&apos;engage à répondre à toute demande sous <strong>24 heures ouvrées</strong> par e-mail ou sur le canal direct WhatsApp.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              8. Droit Applicable & Règlement des Litiges
            </h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation sont régies et interprétées exclusivement selon le <strong>droit de la République Algérienne Démocratique et Populaire</strong>.
            </p>
            <p>
              En cas de différend ou de litige relatif à la formation, l&apos;exécution ou l&apos;interprétation du présent contrat, les parties s&apos;engagent à rechercher préalablement une solution amiable. À défaut d&apos;accord amiable sous un délai de trente (30) jours, compétence exclusive est attribuée aux <strong>tribunaux compétents de la juridiction d&apos;Oran</strong>.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la page d&apos;accueil EasyTradez</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
