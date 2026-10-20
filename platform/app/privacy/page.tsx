import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, Mail, Phone, Lock, FileText } from "lucide-react";
import EasyTradeLogo from "@/components/brand/EasyTradeLogo";

export const metadata = {
  title: "Politique de Confidentialité — EasyTradez (Conforme Lois 09-04 & 18-07)",
  description:
    "Protection des données personnelles des marchands et acheteurs en Algérie conformément aux lois n° 09-04 et n° 18-07.",
};

export default function PrivacyPage() {
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
          <div className="w-14 h-14 rounded-2xl bg-[#2540ea]/20 border border-[#60a5fa]/40 flex items-center justify-center text-[#93c5fd]">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-white"
              style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
            >
              Politique de Confidentialité & Protection des Données
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Conformité Loi algérienne n° 09-04 et Loi n° 18-07 relative à la protection des personnes physiques · Version Octobre 2026
            </p>
          </div>
        </div>

        {/* Legal Notice Box */}
        <div className="rounded-2xl p-5 bg-sky-500/10 border border-sky-500/25 text-xs sm:text-sm text-sky-200 leading-relaxed">
          <strong>Cadre juridique en République Algérienne Démocratique et Populaire :</strong> Les traitements de données à caractère personnel effectués sur la plateforme EasyTradez sont soumis aux dispositions de la <strong>Loi n° 18-07 du 10 juin 2018</strong> relative à la protection des personnes physiques dans le traitement des données à caractère personnel et de la <strong>Loi n° 09-04 du 5 août 2009</strong> portant règles particulières relatives à la prévention et à la lutte contre les infractions liées aux technologies de l&apos;information et de la communication.
        </div>

        {/* Main Content Body */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              1. Responsable de Traitement
            </h2>
            <p>
              Le responsable du traitement des données pour la plateforme EasyTradez (accessible sur <em>easytradez.site</em>) est la société :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Raison sociale :</strong> EasyTradez Technologies (SARL en cours d&apos;immatriculation / Bêta)</li>
              <li><strong>Siège :</strong> Oran, Algérie</li>
              <li><strong>Délégué / Contact données :</strong> support@easytradez.site</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sky-400" />
              2. Catégories de Données Collectées
            </h2>
            <p>
              Dans le strict cadre de la fourniture du service e-commerce et de la livraison de commandes en Algérie, nous collectons :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wide text-sky-300">
                  A. Pour les Marchands (Créateurs de boutique)
                </h3>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                  <li>Nom, prénom et adresse e-mail.</li>
                  <li>Numéro de téléphone algérien (05, 06, 07).</li>
                  <li>Nom et sous-domaine de la boutique.</li>
                  <li>Données de facturation d&apos;abonnement en DZD (identifiants BaridiMob / SATIM).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wide text-emerald-300">
                  B. Pour les Acheteurs (Clients finaux des boutiques)
                </h3>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                  <li>Nom complet du destinataire.</li>
                  <li>Numéro de téléphone (pour joindre lors de la livraison).</li>
                  <li>Wilaya, commune et adresse de livraison ou point stop-desk choisi.</li>
                  <li>Détail des articles commandés et montant total en espèces (COD).</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic pt-1">
              Note importante : Nous ne collectons JAMAIS les coordonnées de cartes bancaires des acheteurs finaux, le paiement s&apos;effectuant exclusivement en espèces à la livraison.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-400" />
              3. Finalités du Traitement & Base Légale
            </h2>
            <p>Les données sont traitées pour des objectifs précis et licites :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Exécution de la commande et acheminement du colis :</strong> Transmission des coordonnées au livreur partenaire du marchand (ex : Yalidine, ZR Express, Procolis) pour prise de contact et remise contre paiement.</li>
              <li><strong>Consentement exprès au checkout :</strong> Une case à cocher obligatoire est requise sur le formulaire avant toute validation de commande.</li>
              <li><strong>Prévention des commandes abusives :</strong> Filtrage des numéros invalides et lutte contre les faux envois (retours COD) conformément à la loi 09-04.</li>
              <li><strong>Gestion des abonnements marchands :</strong> Facturation en DZD et activation des fonctionnalités de la plateforme.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Destinataires et Tiers Autorisés</h2>
            <p>
              EasyTradez s&apos;interdit formellement de vendre, louer ou commercialiser vos données personnelles à des tiers à des fins publicitaires.
            </p>
            <p>Les données peuvent être transmises uniquement à :</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Le marchand titulaire de la boutique où l&apos;achat a été effectué.</li>
              <li>Les prestataires logistiques agréés choisis par le marchand pour effectuer la livraison du colis.</li>
              <li>Les autorités administratives ou judiciaires algériennes en cas de réquisition légale conforme au droit algérien.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Durée de Conservation des Données</h2>
            <p>
              Les données relatives aux commandes sont conservées pendant la durée nécessaire à l&apos;exécution de la livraison et au traitement d&apos;éventuelles réclamations, puis archivées conformément aux obligations comptables et commerciales en vigueur en Algérie.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Vos Droits (Loi n° 18-07)</h2>
            <p>
              Conformément à la Loi 18-07, chaque personne physique dispose à tout moment des droits suivants sur ses données :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Droit d&apos;accès :</strong> Obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie.</li>
              <li><strong>Droit de rectification :</strong> Corriger des informations inexactes ou incomplètes (adresse erronée, numéro de téléphone).</li>
              <li><strong>Droit d&apos;effacement :</strong> Demander la suppression de vos données personnelles sous réserve des obligations légales de conservation.</li>
              <li><strong>Droit d&apos;opposition :</strong> Vous opposer pour des motifs légitimes au traitement de vos données.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" />
              7. Contact et Exercice de vos Droits
            </h2>
            <p>
              Pour exercer vos droits ou poser toute question concernant la confidentialité de vos données, vous pouvez vous adresser à notre équipe :
            </p>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1 text-xs">
              <p><strong>Email officiel :</strong> support@easytradez.site</p>
              <p><strong>Courrier :</strong> EasyTradez Technologies, Oran, Algérie</p>
              <p><strong>Délai de réponse :</strong> Nous nous engageons à traiter chaque demande dans un délai maximum de 30 jours ouvrés.</p>
            </div>
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
