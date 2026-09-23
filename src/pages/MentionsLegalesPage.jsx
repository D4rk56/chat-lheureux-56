import React from 'react';
import { ShieldCheck, Building2, Server, Lock, Copyright } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-title text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
          Mentions Légales & RGPD
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Dernière mise à jour : 2026 — Association Chat L'Heureux 56
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
        
        {/* Éditeur */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#d24de3] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-title text-lg sm:text-xl font-black text-gray-900">
              1. Éditeur du site
            </h2>
          </div>
          <div className="space-y-1.5 pl-1">
            <p><strong>Nom de l'association :</strong> Chat L'Heureux 56</p>
            <p><strong>Forme juridique :</strong> Association déclarée régie par la loi du 1er juillet 1901 (à but non lucratif)</p>
            <p><strong>Siège social :</strong> Colpo (56390), Morbihan, Bretagne, France</p>
            <p><strong>Numéro SIREN :</strong> 930 923 800</p>
            <p><strong>Numéro SIRET :</strong> 930 923 800 00013</p>
            <p><strong>Présidente & Directrice de publication :</strong> Marina Loric</p>
            <p><strong>Contact e-mail :</strong> <a href="mailto:asso.chatslheureux@gmail.com" className="text-[#d24de3] underline font-bold">asso.chatslheureux@gmail.com</a></p>
            <p><strong>Téléphone :</strong> 06 61 50 88 28</p>
          </div>
        </section>

        {/* Hébergement */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="font-title text-lg sm:text-xl font-black text-gray-900">
              2. Hébergement & Infrastructure
            </h2>
          </div>
          <div className="space-y-2 pl-1">
            <p>
              <strong>Hébergeur Frontend :</strong> Netlify, Inc., 44 Montgomery Street, Suite 300, San Francisco, CA 94104, États-Unis.
            </p>
            <p>
              <strong>Base de données Cloud :</strong> Google Cloud Platform / Firebase (Firestore) - Hébergement conforme aux normes de sécurité et de protection des données.
            </p>
          </div>
        </section>

        {/* Données personnelles & RGPD */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#d24de3] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-title text-lg sm:text-xl font-black text-gray-900">
              3. Protection des Données Personnelles (RGPD)
            </h2>
          </div>
          <div className="space-y-2.5 pl-1">
            <p>
              Les données personnelles transmises (nom, e-mail, téléphone) lors de vos demandes d'adoption, de dons ou de candidatures pour devenir famille d'accueil sont uniquement destinées au traitement de votre demande par le bureau de l'association.
            </p>
            <p>
              Ces informations ne sont en aucun cas cédées, vendues ou louées à des tiers.
            </p>
            <p>
              Conformément à la réglementation européenne (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment par simple e-mail à : <strong>asso.chatslheureux@gmail.com</strong>.
            </p>
          </div>
        </section>

        {/* Propriété intellectuelle */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Copyright className="w-5 h-5" />
            </div>
            <h2 className="font-title text-lg sm:text-xl font-black text-gray-900">
              4. Propriété intellectuelle & Crédits
            </h2>
          </div>
          <div className="space-y-2 pl-1">
            <p>
              L'ensemble des photographies de chats, textes et logos publiés sur ce site sont la propriété exclusive de l'association Chat L'Heureux 56 ou font l'objet d'une autorisation de publication accordée par leurs auteurs (adoptants, familles d'accueil, bénévoles).
            </p>
            <p>
              Toute reproduction ou utilisation sans autorisation préalable écrite est formellement interdite.
            </p>
          </div>
        </section>

      </div>

    </main>
  );
}
