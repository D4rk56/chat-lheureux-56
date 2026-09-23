import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  Home, 
  Users, 
  Phone, 
  Mail, 
  ChevronDown,
  ArrowRight,
  Stethoscope,
  ExternalLink
} from 'lucide-react';

export default function AssociationPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "Comment fonctionne l'accueil en Famille d'Accueil (FA) ?",
      a: "N'ayant pas de refuge avec des cages, chaque chat sauvé est confié à un bénévole qui l'accueille chez lui. L'association prend en charge l'ensemble des frais vétérinaires et fournit si besoin le matériel et l'alimentation. La FA apporte son amour, sa présence et son attention jusqu'à l'adoption."
    },
    {
      q: "Comment devenir Famille d'Accueil pour l'association ?",
      a: "Être Famille d'Accueil consiste à héberger temporairement un chat ou des chatons jusqu'à leur adoption. Les frais vétérinaires sont 100% pris en charge par l'association !\n\n👉 Vous pouvez formaliser votre candidature en remplissant notre formulaire officiel : https://docs.google.com/forms/d/e/1FAIpQLSe2_gn8dq66LJu-AWQ90dI-DRc2FP5NdD88cNcgoAyEX7IHfA/viewform"
    },
    {
      q: "Quelles sont les démarches pour adopter un chat chez vous ?",
      a: "1. Repérez un chat coup de cœur sur notre catalogue.\n2. Remplissez le questionnaire préalable d'adoption en ligne : https://docs.google.com/forms/d/e/1FAIpQLScNaXx_ZzAWX6_UdybeZK2V77Gbp_FVD304-GuGwi8LGr-7yA/viewform\n3. Nous échangeons par téléphone et organisons une visite dans sa famille d'accueil dans le Morbihan.\n4. Si le coup de cœur est mutuel, nous formalisons le contrat officiel d'adoption."
    },
    {
      q: "Puis-je faire un don matériel à l'association ?",
      a: "Oui avec grand plaisir ! Nous avons un besoin constant de croquettes de qualité, pâtées, litière agglomérante, paniers douillets, arbres à chats, couvertures et antiparasitaires. Contactez-nous pour convenir d'un point de dépôt (secteur Colpo / Vannes)."
    }
  ];

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      
      {/* En-tête */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Association Loi 1901 • Colpo (Morbihan)</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          L'Association Chat L'Heureux 56
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
          Fondée par des passionnés de protection animale, notre association œuvre au quotidien dans le Morbihan pour secourir, soigner et offrir un nouveau départ aux chats abandonnés.
        </p>
      </div>

      {/* Présentation Générale */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 mb-12 bg-white border border-pink-100/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <span className="text-xs font-black uppercase tracking-wider text-[#d24de3] block mb-2">
              Notre Mission
            </span>
            <h2 className="font-title text-2xl sm:text-3xl font-black text-gray-900 mb-4">
              Sauver, soigner, et aimer sans compter
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mb-4">
              En France, des milliers de chats errent sans protection ou sont abandonnés chaque année. L'association <strong>Chat L'Heureux 56</strong> a pour vocation de leur offrir une véritable chance.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Nous intervenons prioritairement auprès des chats errants ou en détresse dans le Morbihan pour stopper la prolifération par la stérilisation, soigner les blessures ou maladies, et préparer nos protégés à une adoption réussie.
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="glass-card rounded-2xl p-4 bg-pink-50/50 border border-pink-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                100%
              </div>
              <div>
                <strong className="block text-xs font-bold text-gray-900">Familles d'accueil</strong>
                <span className="text-[11px] text-gray-500">Pas de cages, un vrai foyer</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-blue-50/50 border border-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                56
              </div>
              <div>
                <strong className="block text-xs font-bold text-gray-900">Morbihan & Bretagne</strong>
                <span className="text-[11px] text-gray-500">Réseau solidaire local</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                Loi 1901
              </div>
              <div>
                <strong className="block text-xs font-bold text-gray-900">SIREN 930 923 800</strong>
                <span className="text-[11px] text-gray-500">Association d'intérêt général déclarée</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Les 4 Piliers */}
      <section className="mb-16">
        <h2 className="font-title text-2xl sm:text-3xl font-black text-gray-900 text-center mb-8">
          Nos 4 engagements majeurs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#d24de3] flex items-center justify-center text-lg mb-3">
              <Heart className="w-5 h-5 fill-[#d24de3]" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              1. Sauvetage & Prise en charge
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Mise en sécurité immédiate des chats en situation d'urgence ou d'abandon, prise de contact avec les vétérinaires et mise en quarantaine sanitaire.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              2. Soins vétérinaires rigoureux
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Stérilisation, identification I-CAD, protocole vaccinal complet, vermifugeage et tests sanitaires systématiques.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#d24de3] flex items-center justify-center text-lg mb-3">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              3. Hébergement familial bienveillant
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Les chats vivent dans nos familles d'accueil pour être sociabilisés, câlinés et habitués à une vie de famille sereine.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              4. Adoption responsable & Suivi
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Sélection rigoureuse des adoptants pour s'assurer de la compatibilité du mode de vie, avec un contrat officiel et un accompagnement dans la durée.
            </p>
          </div>
        </div>
      </section>

      {/* Équipe & Contact */}
      <section className="glass-card rounded-3xl p-8 bg-slate-900 text-white mb-16 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1">
              Direction de l'association
            </span>
            <h3 className="font-title text-2xl font-black mb-2">
              Marina Loric
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md">
              Présidente et fondatrice de Chat L'Heureux 56. À votre écoute pour toute question sur l'adoption, les dons ou pour devenir famille d'accueil.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe2_gn8dq66LJu-AWQ90dI-DRc2FP5NdD88cNcgoAyEX7IHfA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-gradient text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md hover:opacity-95"
            >
              <Home className="w-4 h-4" />
              <span>Devenir Famille d'Accueil</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="tel:0661508828"
              className="inline-flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>06 61 50 88 28</span>
            </a>
            <a
              href="mailto:asso.chatslheureux@gmail.com"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all border border-slate-700"
            >
              <Mail className="w-4 h-4 text-pink-400" />
              <span>Nous écrire</span>
            </a>
          </div>
        </div>
      </section>

      {/* Accordéon FAQ */}
      <section className="mb-12">
        <h2 className="font-title text-2xl sm:text-3xl font-black text-gray-900 text-center mb-8">
          Foire Aux Questions
        </h2>
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div 
              key={idx}
              className="glass-card rounded-2xl bg-white border border-gray-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-title font-bold text-sm sm:text-base text-gray-900 hover:text-[#d24de3] transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-180 text-[#d24de3]' : ''
                  }`} 
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 whitespace-pre-line animate-in fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
