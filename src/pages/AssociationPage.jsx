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
  ExternalLink,
  MapPin,
  CheckCircle2,
  HeartHandshake
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
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* En-tête */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Association Loi 1901 • Colpo (Morbihan)</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          L'Association Chat L'Heureux 56
        </h1>
        <p className="text-xs sm:text-base text-gray-600 font-medium leading-relaxed">
          Fondée par des passionnés de protection animale, notre association œuvre au quotidien dans le Morbihan pour secourir, soigner et offrir un nouveau départ aux chats abandonnés.
        </p>
      </div>

      {/* Présentation Générale : Encart Notre Mission Élargi & Illustré */}
      <section className="glass-card rounded-[2.5rem] p-6 sm:p-10 lg:p-12 mb-16 sm:mb-20 bg-white border border-pink-100/90 shadow-xs relative overflow-hidden">
        {/* Lueur d'ambiance décorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 via-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Colonne Gauche : Mission & Valeurs */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-[#d24de3]" />
              <span>Notre Mission & Vocation</span>
            </div>

            <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Sauver, soigner, et aimer <span className="text-brand-gradient">sans compter</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mb-4">
              En France, des milliers de chats errent sans protection ou sont abandonnés chaque année. L'association <strong>Chat L'Heureux 56</strong>, basée à <strong>Colpo dans le Morbihan</strong>, a pour vocation de leur offrir une véritable seconde chance dans un cadre bienveillant et sécurisant.
            </p>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mb-6">
              Nous intervenons prioritairement auprès des félins en situation de détresse pour stopper la prolifération par la stérilisation obligatoire, prodiguer les soins vétérinaires nécessaires, et préparer chacun de nos protégés à une adoption réussie pour la vie.
            </p>

            {/* Checklist illustrée avec icônes distinctives */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs sm:text-sm text-gray-700 font-semibold">
                  Mise en sécurité immédiate et trappage en douceur dans tout le Morbihan.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-pink-50 text-[#d24de3] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#d24de3]" />
                </div>
                <span className="text-xs sm:text-sm text-gray-700 font-semibold">
                  100% en Familles d'Accueil bienveillantes : zéro box, zéro cage, sociabilisation continue.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7db1f9]" />
                </div>
                <span className="text-xs sm:text-sm text-gray-700 font-semibold">
                  Parcours vétérinaire rigoureux : stérilisation, identification I-CAD, vaccins et tests sanitaires.
                </span>
              </div>
            </div>
          </div>

          {/* Colonne Droite : 3 Piliers Clés avec Icônes Illustrées */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Carte 1 : 100% Familles d'Accueil */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-pink-50/70 to-white border border-pink-100 flex items-center gap-4 hover-lift shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#d24de3] flex items-center justify-center text-xl shrink-0 shadow-xs">
                <Home className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <strong className="text-xs sm:text-sm font-black text-gray-900">100% Familles d'Accueil</strong>
                  <span className="text-[10px] uppercase font-black bg-pink-100 text-[#d24de3] px-2 py-0.5 rounded-full">
                    Zéro cage
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium block leading-snug">
                  Chaque chat vit au sein d'un vrai foyer aimant pour s'épanouir et développer sa confiance.
                </span>
              </div>
            </div>

            {/* Carte 2 : Morbihan & Bretagne */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 to-white border border-blue-100 flex items-center gap-4 hover-lift shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0 shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <strong className="text-xs sm:text-sm font-black text-gray-900">Morbihan & Bretagne (56)</strong>
                  <span className="text-[10px] uppercase font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Colpo
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium block leading-snug">
                  Réseau solidaire de bénévoles actifs sur Colpo, Vannes, Auray, Lorient et alentours.
                </span>
              </div>
            </div>

            {/* Carte 3 : Loi 1901 Reconnue */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 to-white border border-emerald-100 flex items-center gap-4 hover-lift shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <strong className="text-xs sm:text-sm font-black text-gray-900">Association Reconnue</strong>
                  <span className="text-[10px] uppercase font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Loi 1901
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium block leading-snug">
                  SIREN 930 923 800 • Engagement éthique, transparent et d'intérêt général.
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Les 4 Piliers */}
      <section className="mb-16 sm:mb-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#d24de3] mb-2 block">
            Nos Piliers d'Action
          </span>
          <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900">
            Nos 4 engagements majeurs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#d24de3] flex items-center justify-center text-lg mb-4 shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              1. Sauvetage & Prise en charge
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Mise en sécurité immédiate des chats en situation d'urgence ou d'abandon, prise de contact avec les vétérinaires partenaires et mise à l'abri.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg mb-4 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              2. Soins vétérinaires rigoureux
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Stérilisation, identification I-CAD, protocole vaccinal complet, vermifugeage et tests sanitaires systématiques.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#d24de3] flex items-center justify-center text-lg mb-4 shadow-xs">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              3. Hébergement familial
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Les chats vivent dans nos familles d'accueil pour être sociabilisés, câlinés et habitués à une vraie vie de foyer sereine.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-100 hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-4 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 mb-1.5">
              4. Adoption responsable
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Sélection rigoureuse pour garantir la compatibilité félin/adoptant, contrat officiel et accompagnement bienveillant pour la vie.
            </p>
          </div>
        </div>
      </section>

      {/* L'équipe & Présidente (Direction de l'association) */}
      <section className="max-w-5xl mx-auto mb-16 sm:mb-24">
        <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3 text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full border-4 border-[#d24de3] p-1 mb-4 shadow-lg shadow-pink-500/10">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-3xl sm:text-4xl text-[#d24de3]">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#d24de3]" />
                </div>
              </div>
              <h3 className="font-title text-xl sm:text-2xl font-black mb-1 text-white">Marina Loric</h3>
              <p className="text-pink-400 font-bold text-xs uppercase tracking-wider">Présidente Fondatrice</p>
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="font-title text-2xl sm:text-3xl font-extrabold mb-4 text-white">Une équipe de passionnés 🐾</h2>
              <p className="text-slate-300 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                &laquo; L'association ne serait rien sans le dévouement quotidien de nos bénévoles et de nos Familles d'Accueil (FA). Nous n'avons pas de refuge physique : cela signifie que chaque chat sauvé est placé dans un foyer chaleureux en attendant son adoption définitive. &raquo;
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSe2_gn8dq66LJu-AWQ90dI-DRc2FP5NdD88cNcgoAyEX7IHfA/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-gradient hover:opacity-95 text-white font-bold px-5 py-3 rounded-xl transition-all text-xs shadow-md"
                >
                  <Home className="w-4 h-4" />
                  <span>Devenir Famille d'Accueil</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Link
                  to="/soutenir"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 py-3 rounded-xl transition-all text-xs"
                >
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>Nous soutenir</span>
                </Link>
                <a
                  href="tel:0661508828"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-3 rounded-xl transition-all text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>06 61 50 88 28</span>
                </a>
              </div>
            </div>
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
