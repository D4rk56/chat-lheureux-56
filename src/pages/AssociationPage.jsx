import React, { useState, useMemo } from 'react';
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
  HeartHandshake,
  Search,
  X,
  HelpCircle,
  FileText,
  AlertTriangle,
  MessageCircle,
  Share2
} from 'lucide-react';

export default function AssociationPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqCategories = [
    { id: 'all', label: 'Toutes les questions' },
    { id: 'adoption', label: '🐱 Adoption & Démarches' },
    { id: 'fa', label: "🏡 Familles d'Accueil (FA)" },
    { id: 'soins', label: '🩺 Soins & Stérilisation' },
    { id: 'urgences', label: '🚨 Chats trouvés & Urgences' },
    { id: 'dons', label: '💖 Dons & Soutien' }
  ];

  const allFaqItems = [
    {
      id: 1,
      category: 'adoption',
      q: "Que couvrent exactement les frais d'adoption ?",
      summary: "Identification I-CAD, vaccins complets, stérilisation, déparasitage et tests sanitaires.",
      details: (
        <div className="space-y-3">
          <p>
            Les frais d'adoption demandés ne sont pas le « prix » d'un chat, mais une <strong>participation solidaire et partielle</strong> aux frais vétérinaires réels engagés pour sa mise en règle et sa protection :
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Identification obligatoire par puce électronique (I-CAD)</strong> enregistrée au nom de l'adoptant.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Protocole vaccinal complet</strong> : primo-vaccination + rappel (Typhus, Coryza, Leucose féline).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Stérilisation ou castration obligatoire</strong> (ou bon d'engagement inclus pour les chatons de moins de 6 mois).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Traitements antiparasitaires</strong> réguliers (vermifuges internes et pipettes anti-puces/tiques).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Tests de dépistage sérologique FIV / FeLV</strong> (selon l'âge de l'animal).</span>
            </li>
          </ul>
          <div className="p-3 bg-pink-50/80 rounded-xl border border-pink-100 text-xs text-pink-950 font-medium">
            💡 <em>L'association ne fait aucun bénéfice : faire réaliser l'ensemble de ces soins à titre privé auprès d'une clinique vétérinaire reviendrait à plus du double de ce montant ! Ces frais permettent aussi d'assurer les urgences et de pérenniser les sauvetages futurs.</em>
          </div>
        </div>
      )
    },
    {
      id: 2,
      category: 'adoption',
      q: "Quelles sont les démarches pour adopter un chat chez Chat L'Heureux 56 ?",
      summary: "Choix sur catalogue, formulaire préalable en ligne, échange téléphonique et rencontre en FA.",
      details: (
        <div className="space-y-3">
          <p>Notre parcours d'adoption privilégie le bien-être du chat et l'harmonie de votre foyer en 4 étapes simples :</p>
          <ol className="space-y-2 list-decimal list-inside font-medium text-gray-700">
            <li>
              <strong>Repérez votre coup de cœur :</strong> Consultez nos fiches détaillées dans la rubrique <Link to="/adoption" className="text-pink-600 font-bold hover:underline">« À l'adoption »</Link>.
            </li>
            <li>
              <strong>Remplissez le formulaire en ligne :</strong> Répondez à notre questionnaire préalable directement sur notre site : <Link to="/formulaire-adoption" className="text-pink-600 font-bold hover:underline">Accéder au Formulaire d'Adoption</Link>.
            </li>
            <li>
              <strong>Échange téléphonique bienveillant :</strong> Un bénévole de l'association prend contact avec vous pour faire connaissance, échanger sur vos attentes et vérifier la compatibilité.
            </li>
            <li>
              <strong>Rencontre dans sa Famille d'Accueil (Morbihan) :</strong> Vous rencontrez le chat dans son environnement familial pour confirmer que le coup de cœur est réciproque.
            </li>
            <li>
              <strong>Contrat & Départ pour une nouvelle vie :</strong> Signature du contrat d'adoption responsable et remise du carnet de santé.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 3,
      category: 'adoption',
      q: "Peut-on adopter si l'on vit en appartement sans extérieur ?",
      summary: "Oui tout à fait ! De nombreux chats s'épanouissent parfaitement en intérieur.",
      details: (
        <div className="space-y-3">
          <p>
            <strong>Oui, absolument !</strong> De nombreux chats préfèrent le confort douillet, la sécurité et la tranquillité d'un appartement plutôt que les dangers de la rue.
          </p>
          <p>
            Ce qui compte avant tout, c'est l'enrichissement de leur espace : un bel arbre à chat près d'une fenêtre pour observer l'extérieur, des griffoirs, des cachettes en hauteur et du temps de jeu quotidien avec vous.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
            ⚠️ <strong>Point de sécurité important :</strong> Si votre appartement dispose d'un balcon ou de fenêtres donnant sur le vide, nous demandons une sécurisation efficace (filet de protection adapté) pour prévenir tout risque de chute mortelle (syndrome du chat parachutiste).
          </div>
          <p>
            Chaque profil sur notre catalogue précise clairement si le chat a impérativement besoin d'un jardin ou s'il convient idéalement à la vie en appartement.
          </p>
        </div>
      )
    },
    {
      id: 4,
      category: 'fa',
      q: "Comment fonctionne l'accueil en Famille d'Accueil (FA) et quels en sont les atouts ?",
      summary: "100% de nos chats vivent chez des bénévoles dans le Morbihan : zéro cage, zéro box.",
      details: (
        <div className="space-y-3">
          <p>
            L'association ne dispose pas de refuge physique avec des cages : <strong>100% de nos protégés sont hébergés chez des particuliers bénévoles</strong> dans le Morbihan (Colpo, Vannes, Lorient, Auray et alentours).
          </p>
          <p className="font-semibold text-gray-800">Ce fonctionnement offre des avantages incomparables :</p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <span><strong>Connaissance précise du caractère :</strong> sa FA sait exactement s'il est joueur, calme, bavard, s'il s'entend avec les chiens, les autres chats ou les jeunes enfants.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <span><strong>Sociabilisation et douceur :</strong> les chatons et les chats craintifs apprennent la confiance dans le calme d'un vrai foyer.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <span><strong>Zéro traumatisme d'enfermement :</strong> le chat vit comme un membre de la famille en attendant ses adoptants définitifs.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      category: 'fa',
      q: "Comment devenir Famille d'Accueil pour Chat L'Heureux 56 ?",
      summary: "Hébergement temporaire avec frais vétérinaires 100% pris en charge par l'association.",
      details: (
        <div className="space-y-3">
          <p>
            Être Famille d'Accueil consiste à ouvrir son cœur et son foyer à un chat ou une portée de chatons jusqu'à leur adoption. C'est un engagement solidaire indispensable : <strong>sans famille d'accueil disponible, nous ne pouvons pas réaliser de nouveaux sauvetages !</strong>
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Frais vétérinaires :</strong> 100% pris en charge par l'association chez nos cliniques partenaires.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Alimentation & matériel :</strong> l'association fournit ou complète litière, croquettes, paniers et soins antiparasitaires.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Votre mission :</strong> lui offrir de l'amour, de l'attention, et nous donner régulièrement des nouvelles et des photos.</span>
            </li>
          </ul>
          <div className="pt-2">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe2_gn8dq66LJu-AWQ90dI-DRc2FP5NdD88cNcgoAyEX7IHfA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs hover:opacity-95 transition-all"
            >
              <span>👉 Remplir le formulaire pour devenir Famille d'Accueil</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 6,
      category: 'soins',
      q: "Pourquoi la stérilisation est-elle systématique et obligatoire ?",
      summary: "Protection contre la surpopulation, les fugues et les maladies félines incurables.",
      details: (
        <div className="space-y-3">
          <p>
            En seulement 4 ans, un couple de chats non stérilisés et ses descendants peuvent engendrer jusqu'à <strong>20 000 naissances</strong>. La prolifération incontrôlée conduit inévitablement à la misère, à la faim, aux maladies et aux abandons massifs chaque printemps.
          </p>
          <p>
            Au-delà de la limitation des naissances, la stérilisation protège directement la santé de votre animal : elle évite les marquages urinaires, diminue drastiquement les risques de fugues ou d'accidents de la route, et supprime les risques de tumeurs mammaires et d'infections utérines.
          </p>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 font-medium">
            🐱 <em>Tous nos chats adultes sont stérilisés avant adoption. Pour les chatons trop jeunes, un engagement de stérilisation obligatoire à l'âge de 6 mois est formellement intégré au contrat d'adoption.</em>
          </div>
        </div>
      )
    },
    {
      id: 7,
      category: 'urgences',
      q: "Que faire si j'ai trouvé un chat errant ou blessé dans le Morbihan ?",
      summary: "Vérifier la puce gratuitement en clinique vétérinaire, contacter la mairie et publier sur Pet Alert 56.",
      details: (
        <div className="space-y-3">
          <p>Voici les bons réflexes à adopter face à un animal errant ou en détresse :</p>
          <ol className="space-y-2 list-decimal list-inside font-medium text-gray-700">
            <li>
              <strong>Contrôle d'identification gratuit :</strong> Emmenez l'animal chez n'importe quel vétérinaire. Le contrôle de la puce électronique I-CAD est <em>gratuit, immédiat et sans rendez-vous</em>.
            </li>
            <li>
              <strong>Prévenir la mairie du lieu de découverte :</strong> La loi confie la gestion des animaux errants à la commune (service fourrière ou conventionnement association).
            </li>
            <li>
              <strong>Publier sur les réseaux sociaux :</strong> Postez une annonce avec photo et ville sur les groupes locaux <em>Pet Alert Morbihan 56</em> et <em>Chats Perdus/Trouvés 56</em>.
            </li>
            <li>
              <strong>En cas d'urgence vitale :</strong> Contactez sans délai un cabinet vétérinaire de garde ou envoyez-nous un message avec photos et localisation exacte via notre page Facebook ou par e-mail.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 8,
      category: 'dons',
      q: "Comment soutenir financièrement ou matériellement l'association ?",
      summary: "Dons déductibles d'impôts, nourriture, litière, paniers ou partage de nos publications.",
      details: (
        <div className="space-y-3">
          <p>
            En tant qu'association déclarée d'intérêt général (Loi 1901), nos actions reposent intégralement sur la générosité du public. Plusieurs moyens vous permettent d'agir à nos côtés :
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Dons financiers déductibles :</strong> Par carte bancaire sécurisée ou virement sur notre page dédiée : <Link to="/soutenir" className="text-pink-600 font-bold hover:underline">Soutenir l'Association</Link>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Dons matériels :</strong> Croquettes de qualité, pâtées, litière agglomérante, paniers douillets, arbres à chat, serviettes propres et antiparasitaires (dépôt sur Colpo ou Vannes).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Partage de nos publications :</strong> Suivez et relayez nos publications sur Instagram et Facebook pour donner une visibilité maximale à nos chats en quête d'un foyer.</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  // Filtrage FAQ par catégorie et recherche
  const filteredFaq = useMemo(() => {
    return allFaqItems.filter((item) => {
      const matchCat = faqCategory === 'all' || item.category === faqCategory;
      if (!faqSearch.trim()) return matchCat;
      const q = faqSearch.toLowerCase().trim();
      const matchSearch = item.q.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allFaqItems, faqCategory, faqSearch]);

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

      {/* Les 4 Piliers d'Action */}
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
      <section className="max-w-5xl mx-auto mb-16 sm:mb-20">
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

      {/* SECTION RÉSEAUX SOCIAUX : Vie active de l'association (Instagram & Facebook) */}
      <section className="max-w-5xl mx-auto mb-16 sm:mb-24">
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 bg-gradient-to-br from-pink-50/60 via-purple-50/40 to-blue-50/40 border border-pink-100 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-200 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
              <Share2 className="w-3.5 h-3.5" />
              <span>Vie de l'Association en Direct</span>
            </div>
            <h2 className="font-title text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
              Suivez nos aventures sur les réseaux 📸
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Découvrez le quotidien de nos chats en Familles d'Accueil, les sauvetages du jour, les vidéos rigolotes et les belles histoires d'adoption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Carte Instagram */}
            <div className="glass-card rounded-3xl p-6 bg-white border border-pink-100 shadow-sm flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                    Stories & Photos
                  </span>
                </div>
                <h3 className="font-title text-lg font-bold text-gray-900 mb-1">
                  Instagram Officiel
                </h3>
                <p className="text-xs text-gray-500 font-mono font-semibold mb-3">
                  @association.chatslheureux
                </p>
                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
                  Photos quotidiennes de nos petits protégés en direct de leurs familles d'accueil, portraits vidéos et annonces urgentes.
                </p>
              </div>
              <a
                href="https://www.instagram.com/association.chatslheureux"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold text-xs shadow-md hover:opacity-95 transition-all"
              >
                <span>Rejoindre notre communauté Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Carte Facebook */}
            <div className="glass-card rounded-3xl p-6 bg-white border border-blue-100 shadow-sm flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Actualités & Échanges
                  </span>
                </div>
                <h3 className="font-title text-lg font-bold text-gray-900 mb-1">
                  Page Facebook Officielle
                </h3>
                <p className="text-xs text-gray-500 font-semibold mb-3">
                  Association Chat L'Heureux 56
                </p>
                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
                  Événements solidaires, collectes, nouvelles de nos chats adoptés, signalements d'animaux perdus et échanges directs sur Messenger.
                </p>
              </div>
              <a
                href="https://www.facebook.com/profile.php?id=61593487828842"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Visiter la page Facebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION FOIRE AUX QUESTIONS COMPLÈTE & INTERACTIVE */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tout ce que vous devez savoir</span>
          </div>
          <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
            Foire Aux Questions 💬
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl mx-auto">
            Retrouvez les réponses transparentes et détaillées aux interrogations les plus fréquentes sur nos adoptions, nos familles d'accueil et notre fonctionnement.
          </p>
        </div>

        {/* Barre de recherche FAQ */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Rechercher une réponse (ex: frais, stérilisation, appartement, don...)"
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3] shadow-xs"
          />
          {faqSearch && (
            <button
              type="button"
              onClick={() => setFaqSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres par Catégories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {faqCategories.map((cat) => {
            const isSelected = faqCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFaqCategory(cat.id)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-brand-gradient text-white shadow-md shadow-pink-500/20 scale-102'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Liste Accordéon des Questions */}
        <div className="space-y-3.5">
          {filteredFaq.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center bg-white border border-gray-200 text-gray-500 text-xs sm:text-sm">
              <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-bold text-gray-700">Aucune question ne correspond à votre recherche.</p>
              <button
                type="button"
                onClick={() => { setFaqSearch(''); setFaqCategory('all'); }}
                className="mt-3 text-xs font-bold text-pink-600 hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            filteredFaq.map((item, idx) => {
              const isOpen = openFaq === item.id;
              return (
                <div 
                  key={item.id}
                  className={`glass-card rounded-2xl bg-white border transition-all overflow-hidden shadow-xs ${
                    isOpen ? 'border-[#d24de3]/40 shadow-sm' : 'border-gray-200/90 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(item.id)}
                    className="w-full px-5 py-4 text-left flex items-start sm:items-center justify-between gap-4 font-title font-bold text-sm sm:text-base text-gray-900 hover:text-[#d24de3] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                        isOpen ? 'bg-[#d24de3] text-white' : 'bg-pink-50 text-[#d24de3]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="block leading-snug">{item.q}</span>
                        {!isOpen && item.summary && (
                          <span className="text-[11px] font-normal text-gray-400 block mt-0.5 line-clamp-1">
                            {item.summary}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 mt-1 sm:mt-0 ${
                        isOpen ? 'rotate-180 text-[#d24de3]' : ''
                      }`} 
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 animate-in fade-in">
                      {item.details}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Encart Contact d'aide en bas de FAQ */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl">
          <div className="text-center sm:text-left">
            <h3 className="font-title text-lg sm:text-xl font-black mb-1">
              Vous avez une autre question ?
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Notre équipe de bénévoles se fera un plaisir d'échanger avec vous pour vous guider.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:0661508828"
              className="inline-flex items-center gap-2 bg-[#7db1f9] hover:bg-blue-600 text-slate-950 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>06 61 50 88 28</span>
            </a>
            <a
              href="mailto:asso.chatslheureux@gmail.com"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Nous écrire</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
