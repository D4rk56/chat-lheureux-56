import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Send, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Home, 
  User, 
  ShieldCheck, 
  Clock, 
  PhoneCall, 
  Mail, 
  PawPrint,
  Check,
  Building,
  TreePine,
  Sun,
  Layers,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { fetchCats } from '../firebase/catsService';
import { submitAdoptionRequest } from '../firebase/adoptionsService';
import { INITIAL_ADOPTION_FORM, validateAdoptionForm } from '../utils/adoptionFormLogic';
import { useToast } from '../context/ToastContext';

export default function AdoptionFormPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [catsList, setCatsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCustomCatName, setIsCustomCatName] = useState(false);

  const initialCatName = searchParams.get('chat') || searchParams.get('cat') || '';
  const initialCatId = searchParams.get('catId') || '';

  const [formData, setFormData] = useState(() => ({
    ...INITIAL_ADOPTION_FORM,
    catName: initialCatName,
    catId: initialCatId
  }));

  // Charger les chats disponibles pour faciliter le choix
  useEffect(() => {
    fetchCats(true)
      .then((cats) => {
        const available = cats.filter(c => (c.status || 'Disponible') === 'Disponible' || c.status === 'Urgence');
        setCatsList(available);
      })
      .catch((err) => console.warn("Erreur chargement chats :", err));
  }, []);

  // Mettre à jour si les paramètres d'URL changent
  useEffect(() => {
    const chatParam = searchParams.get('chat') || searchParams.get('cat');
    const catIdParam = searchParams.get('catId');
    if (chatParam || catIdParam) {
      setFormData(prev => ({
        ...prev,
        catName: chatParam || prev.catName,
        catId: catIdParam || prev.catId
      }));
    }
  }, [searchParams]);

  // Recherche du chat sélectionné dans la liste pour afficher sa photo et ses infos
  const selectedCat = catsList.find(c => 
    (formData.catId && c.id === formData.catId) || 
    (formData.catName && c.name?.toLowerCase().trim() === formData.catName.toLowerCase().trim())
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (field, option) => {
    setFormData(prev => {
      const current = prev[field] || [];
      let updated;
      if (option === 'Aucun de ces choix') {
        updated = current.includes(option) ? [] : ['Aucun de ces choix'];
      } else {
        const withoutNone = current.filter(item => item !== 'Aucun de ces choix');
        updated = withoutNone.includes(option)
          ? withoutNone.filter(item => item !== option)
          : [...withoutNone, option];
      }
      return { ...prev, [field]: updated };
    });
  };

  // Validation par étape du carousel
  const validateCurrentStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.catName.trim()) stepErrors.catName = "Veuillez sélectionner un chat ou indiquer un souhait d'adoption.";
      if (!formData.fullName.trim()) stepErrors.fullName = "Votre nom et prénom sont obligatoires.";
      if (!formData.email.trim()) {
        stepErrors.email = "Votre e-mail est obligatoire.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        stepErrors.email = "Adresse e-mail invalide.";
      }
      if (!formData.phone.trim()) stepErrors.phone = "Votre numéro de téléphone est obligatoire.";
      if (!formData.address.trim()) stepErrors.address = "Votre adresse est obligatoire.";
      if (!formData.postalCodeCity.trim()) stepErrors.postalCodeCity = "Code postal & ville requis.";
      if (!formData.profession.trim()) stepErrors.profession = "Votre profession est requise.";
    } else if (stepNumber === 2) {
      if (!formData.adultsCount || parseInt(formData.adultsCount, 10) < 1) {
        stepErrors.adultsCount = "Précisez le nombre d'adultes.";
      }
      if (parseInt(formData.childrenCount, 10) > 0 && !formData.childrenAges.trim()) {
        stepErrors.childrenAges = "Précisez l'âge des enfants.";
      }
      if (formData.hasGarden === 'Oui' && !formData.gardenSurface.trim()) {
        stepErrors.gardenSurface = "Précisez la superficie approximative du jardin.";
      }
      if (formData.housingType === 'Appartement' && !formData.floor.trim()) {
        stepErrors.floor = "Précisez l'étage pour l'appartement.";
      }
      if (formData.housingType === 'Autre' && !formData.housingTypeOther.trim()) {
        stepErrors.housingTypeOther = "Précisez votre type d'habitation.";
      }
    } else if (stepNumber === 3) {
      if (formData.hasAnimals === 'Oui') {
        if (!formData.animalDetails.trim()) {
          stepErrors.animalDetails = "Veuillez préciser quels animaux vous possédez.";
        }
      }
    } else if (stepNumber === 4) {
      if (!formData.sleepingPlace.trim()) stepErrors.sleepingPlace = "Précisez où dormira l'animal.";
      if (!formData.hoursAbsent.trim()) stepErrors.hoursAbsent = "Indiquez vos heures d'absence journalières moyennes.";
      if (!formData.absenceLocation.trim()) stepErrors.absenceLocation = "Précisez où restera l'animal durant vos absences.";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: fullErrors } = validateAdoptionForm(formData);
    if (!isValid) {
      setErrors(fullErrors);
      showToast("Champs manquants", "Veuillez compléter tous les champs obligatoires signalés.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitAdoptionRequest(formData);
      setSubmissionResult(res);
      setSubmittedSuccess(true);
      showToast("Candidature envoyée !", "Votre questionnaire a bien été transmis à l'association Chat L'Heureux 56.");
      window.scrollTo({ top: 80, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showToast("Erreur d'envoi", "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Écran de succès après soumission
  if (submittedSuccess) {
    return (
      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-xl border border-pink-100 text-center relative overflow-hidden animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="font-title text-2xl sm:text-3xl font-black text-gray-900 mb-3">
            Dossier d'Adoption Reçu !
          </h1>
          
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
            Merci <strong>{formData.fullName}</strong> pour votre démarche bienveillante envers <strong>{formData.catName}</strong>. 
            Nos bénévoles étudient votre dossier avec soin et vous recontacteront par téléphone ou e-mail sous 48 à 72 heures.
          </p>

          <div className="bg-pink-50/60 rounded-2xl p-5 max-w-md mx-auto mb-8 border border-pink-100 text-left text-xs text-gray-700 space-y-2">
            <div className="font-bold text-pink-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prochaines étapes</span>
            </div>
            <p>1. Vérification de l'adéquation du profil avec le chat souhaité.</p>
            <p>2. Échange téléphonique avec un bénévole de l'association.</p>
            <p>3. Organisation d'une première rencontre dans sa famille d'accueil dans le Morbihan (56).</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/adoption"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl shadow-md hover:opacity-95 transition-all"
            >
              <span>Retourner aux chats à l'adoption</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl transition-all"
            >
              <span>Accueil du site</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const stepsInfo = [
    { num: 1, title: "L'Animal & Vous", icon: Heart },
    { num: 2, title: "Votre Logement", icon: Home },
    { num: 3, title: "Vos Animaux", icon: PawPrint },
    { num: 4, title: "Mode de Vie", icon: Clock },
    { num: 5, title: "Validation", icon: CheckCircle2 }
  ];

  return (
    <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      
      {/* En-tête de la page */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <Link 
          to="/adoption" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-600 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la liste des chats</span>
        </Link>
        <h1 className="font-title text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
          Questionnaire d'Adoption
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Ce questionnaire permet à l'équipe de l'association de préparer au mieux l'accueil de votre futur compagnon.
        </p>
      </div>

      {/* Stepper / Carousel d'Étapes Moderne */}
      <div className="mb-8 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-pink-600">
              Étape {step} sur 5
            </span>
            <span className="text-xs text-gray-400 font-bold">•</span>
            <span className="text-xs font-bold text-gray-800">
              {stepsInfo[step - 1].title}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-pink-500">
            {Math.round(((step) / 5) * 100)}%
          </span>
        </div>

        {/* Barre de progression continue */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4">
          <div 
            className="bg-brand-gradient h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Boutons d'étapes interactifs */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {stepsInfo.map((s) => {
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            const StepIcon = s.icon;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isDone) {
                    setStep(s.num);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }
                }}
                disabled={!isDone && !isCurrent}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-pink-50/80 border border-pink-200 shadow-xs'
                    : isDone
                      ? 'hover:bg-gray-50 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black mb-1 transition-all ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : isCurrent 
                        ? 'bg-brand-gradient text-white shadow-md shadow-pink-500/20 ring-2 ring-pink-200' 
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold truncate max-w-full text-center ${
                  isCurrent ? 'text-pink-600' : isDone ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulaire Principal / Cartes de Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {/* ================= ÉTAPE 1 : ANIMAL & COORDONNÉES ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>1. L'Animal souhaité & Vos coordonnées</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Les informations recueillies restent strictement confidentielles dans le cadre de l'association.
                </p>
              </div>

              {/* Sélection unifiée du chat (évite tout doublon de champ) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                  <span>Chat concerné par votre démarche d'adoption *</span>
                  <span className="text-[10px] text-pink-600 font-bold">Obligatoire</span>
                </label>

                {/* Si un chat est déjà sélectionné (pré-rempli depuis la fiche ou choisi dans la liste) */}
                {formData.catName && !isCustomCatName ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-blue-50/40 border-2 border-pink-400/40 flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {selectedCat?.photos?.[0] ? (
                        <img 
                          src={selectedCat.photos[0]} 
                          alt={selectedCat.name} 
                          className="w-14 h-14 rounded-2xl object-cover border border-pink-200 shadow-sm shrink-0" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-2xl shrink-0">
                          🐾
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-title text-base sm:text-lg font-black text-gray-900 truncate">
                            {formData.catName}
                          </span>
                          {formData.catId && (
                            <span className="text-[10px] font-mono bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                              Réf. #{formData.catId.slice(-6)}
                            </span>
                          )}
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Sélectionné
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {selectedCat ? `${selectedCat.sex || 'Chat'} • ${selectedCat.location || 'Morbihan (56)'}` : "Fiche de l'association"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleChange('catName', '');
                        handleChange('catId', '');
                        setIsCustomCatName(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                      <span>Changer</span>
                    </button>
                  </div>
                ) : (
                  /* Sélecteur unique quand aucun chat n'est encore choisi */
                  <div className="space-y-2">
                    <select
                      value={isCustomCatName ? '__AUTRE__' : (formData.catName || '')}
                      onChange={(e) => {
                        const chosen = e.target.value;
                        if (chosen === '__AUTRE__') {
                          setIsCustomCatName(true);
                          handleChange('catName', '');
                          handleChange('catId', '');
                        } else {
                          setIsCustomCatName(false);
                          const matched = catsList.find(c => c.name === chosen);
                          handleChange('catName', chosen);
                          handleChange('catId', matched ? matched.id : '');
                        }
                      }}
                      className={`w-full px-4 py-3.5 rounded-2xl bg-gray-50 border ${
                        errors.catName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                      } text-gray-900 text-sm font-semibold focus:outline-none focus:border-pink-500 focus:bg-white shadow-xs`}
                    >
                      <option value="">Sélectionnez le chat que vous souhaitez adopter...</option>
                      
                      {catsList.length > 0 && (
                        <optgroup label="🌟 Chats actuellement à l'adoption">
                          {catsList.map((c) => (
                            <option key={c.id} value={c.name}>
                              🐾 {c.name} ({c.sex || 'Chat'} • {c.location || '56'})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="💫 Autre démarche">
                        <option value="Coup de cœur général (Candidature libre)">
                          ❤️ Coup de cœur général (Candidature libre sans chat précis)
                        </option>
                        <option value="__AUTRE__">
                          ✏️ Saisir manuellement le nom d'un autre chat...
                        </option>
                      </optgroup>
                    </select>

                    {isCustomCatName && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          autoFocus
                          value={formData.catName}
                          onChange={(e) => handleChange('catName', e.target.value)}
                          placeholder="Indiquez le nom du chat ou vos souhaits d'adoption..."
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-pink-400 text-gray-900 text-sm focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
                {errors.catName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.catName}</p>}
              </div>

              {/* Nom & Prénom et Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Ex: Marie Dupont"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Profession *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="Ex: Comptable, Enseignant, Télétravail..."
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.profession ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.profession && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.profession}</p>}
                </div>
              </div>

              {/* E-mail & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Adresse E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="marie.dupont@email.com"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              {/* Adresse & Code postal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Adresse postale *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="12 rue de la Paix"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.address ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.address && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Code Postal & Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postalCodeCity}
                    onChange={(e) => handleChange('postalCodeCity', e.target.value)}
                    placeholder="56000 Vannes"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.postalCodeCity ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.postalCodeCity && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.postalCodeCity}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 2 : LOGEMENT ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-pink-500" />
                  <span>2. Composition du Foyer & Habitation</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ces informations permettent d'adapter l'environnement aux besoins du chat.
                </p>
              </div>

              {/* Composition du foyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nombre d'adultes au foyer *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.adultsCount}
                    onChange={(e) => handleChange('adultsCount', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nombre d'enfants au foyer *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.childrenCount}
                    onChange={(e) => handleChange('childrenCount', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Questions conditionnelles enfants si > 0 */}
              {parseInt(formData.childrenCount, 10) > 0 && (
                <div className="p-5 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-4 animate-in fade-in">
                  <div className="text-xs font-black text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Détails concernant les enfants</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Âge des enfants *
                    </label>
                    <input
                      type="text"
                      value={formData.childrenAges}
                      onChange={(e) => handleChange('childrenAges', e.target.value)}
                      placeholder="Ex: 4 ans et 8 ans"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                    />
                    {errors.childrenAges && <p className="text-rose-500 text-xs mt-1">{errors.childrenAges}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Ont-ils déjà eu des contacts avec des animaux ?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Oui', 'Non'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleChange('childrenAnimalContact', val)}
                          className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                            formData.childrenAnimalContact === val
                              ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                              : 'bg-white text-gray-700 border-pink-200 hover:bg-pink-100/50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                            formData.childrenAnimalContact === val ? 'border-white bg-white text-pink-600' : 'border-gray-400'
                          }`}>
                            {formData.childrenAnimalContact === val && '✓'}
                          </span>
                          <span>{val}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type d'habitation : Cartes Interactives */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Type d'habitation *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Appartement', label: 'Appartement', icon: Building },
                    { id: 'Maison', label: 'Maison', icon: Home },
                    { id: 'Autre', label: 'Autre', icon: Layers }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = formData.housingType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleChange('housingType', item.id)}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm ring-2 ring-pink-200'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-pink-600' : 'text-gray-500'}`} />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pièce isolée avec fenêtre */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Avez-vous une pièce isolée avec fenêtre ? (Idéal pour l'adaptation les premiers jours) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Oui', 'Non'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange('hasIsolatedRoom', val)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        formData.hasIsolatedRoom === val
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                        formData.hasIsolatedRoom === val ? 'border-white bg-white text-pink-600' : 'border-gray-400'
                      }`}>
                        {formData.hasIsolatedRoom === val && '✓'}
                      </span>
                      <span>{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Si Appartement -> Étage */}
              {formData.housingType === 'Appartement' && (
                <div className="animate-in fade-in p-4 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Quel étage ? *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['RDC', '1', '2', '3', '4', '5', '6+'].map((fl) => (
                      <button
                        type="button"
                        key={fl}
                        onClick={() => handleChange('floor', fl)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          formData.floor === fl 
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {fl === 'RDC' ? 'Rez-de-chaussée' : `${fl}e étage`}
                      </button>
                    ))}
                  </div>
                  {errors.floor && <p className="text-rose-500 text-xs mt-1">{errors.floor}</p>}
                </div>
              )}

              {/* Si Autre -> Préciser */}
              {formData.housingType === 'Autre' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Précisez votre type d'habitation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.housingTypeOther}
                    onChange={(e) => handleChange('housingTypeOther', e.target.value)}
                    placeholder="Ex: Péniche, Yourte, Ferme..."
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-pink-400 text-gray-900 text-sm focus:outline-none"
                  />
                  {errors.housingTypeOther && <p className="text-rose-500 text-xs mt-1">{errors.housingTypeOther}</p>}
                </div>
              )}

              {/* Balcon & Jardin : Cartes interactives */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Balcon */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Avez-vous un balcon ?</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Oui', 'Non'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange('hasBalcony', val)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.hasBalcony === val
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {formData.hasBalcony === 'Oui' && (
                    <div className="pt-2 border-t border-gray-200 space-y-2 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-gray-600">
                        Le balcon est-il sécurisé ? (filet, brise-vue...)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Oui', 'Non'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange('isBalconySecured', val)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                              formData.isBalconySecured === val
                                ? 'bg-pink-600 text-white border-pink-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Jardin */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <TreePine className="w-4 h-4 text-emerald-500" />
                      <span>Avez-vous un jardin ?</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Oui', 'Non'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange('hasGarden', val)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.hasGarden === val
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {formData.hasGarden === 'Oui' && (
                    <div className="pt-2 border-t border-gray-200 space-y-1 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-gray-600">
                        Superficie approximative (m²) *
                      </label>
                      <input
                        type="text"
                        value={formData.gardenSurface}
                        onChange={(e) => handleChange('gardenSurface', e.target.value)}
                        placeholder="Ex: 300 m² clôturé"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
                      />
                      {errors.gardenSurface && <p className="text-rose-500 text-xs mt-0.5">{errors.gardenSurface}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 3 : ANIMAUX ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-pink-500" />
                  <span>3. Animaux Actuels au Foyer</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Les questions secondaires s'adaptent automatiquement selon que vous possédez ou non d'autres animaux.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Possédez-vous des animaux actuellement ? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'Non', title: 'Non, aucun animal', desc: 'Le foyer n\'accueille aucun autre animal' },
                    { id: 'Oui', title: 'Oui, j\'ai d\'autres animaux', desc: 'Chat(s), chien(s), rongeurs, etc.' }
                  ].map((opt) => {
                    const isSelected = formData.hasAnimals === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChange('hasAnimals', opt.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-pink-50 border-pink-500 text-pink-900 shadow-sm ring-2 ring-pink-200'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm">{opt.title}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-400'
                          }`}>
                            {isSelected && '✓'}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Questions conditionnelles : UNIQUEMENT SI hasAnimals === 'Oui' */}
              {formData.hasAnimals === 'Oui' ? (
                <div className="p-5 sm:p-6 rounded-3xl bg-pink-50/50 border border-pink-200 space-y-5 animate-in fade-in">
                  <div className="text-xs font-black text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Détails sur vos animaux</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Lesquels ? (Nombre, espèces) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.animalDetails}
                      onChange={(e) => handleChange('animalDetails', e.target.value)}
                      placeholder="Ex: 1 chat de 3 ans stérilisé, 1 lapin"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-pink-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                    />
                    {errors.animalDetails && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.animalDetails}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Si chien : quelle race et quel âge ?
                    </label>
                    <input
                      type="text"
                      value={formData.dogDetails}
                      onChange={(e) => handleChange('dogDetails', e.target.value)}
                      placeholder="Ex: Berger australien, 2 ans, habitué aux chats"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-pink-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Vos animaux sont-ils : Boutons interactifs */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Vos animaux sont-ils :
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Identifiés', 'Vaccinés', 'Stérilisés', 'Aucun de ces choix'].map((opt) => {
                        const checked = (formData.animalStatus || []).includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleCheckboxToggle('animalStatus', opt)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                              checked 
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                                : 'bg-white text-gray-700 border-pink-200 hover:bg-pink-100/50'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                              checked ? 'border-white bg-white text-pink-600' : 'border-gray-400'
                            }`}>
                              {checked && '✓'}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sociabilité congénères */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Vos animaux sont-ils sociables avec leurs congénères ?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Oui', 'Non', 'Non testé'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleChange('isSociable', val)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            formData.isSociable === val
                              ? 'bg-pink-600 text-white border-pink-600'
                              : 'bg-white text-gray-700 border-pink-200 hover:bg-pink-100/50'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>
                    Aucun animal n'étant actuellement présent dans votre foyer, les questions vétérinaires associées ont été automatiquement masquées.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================= ÉTAPE 4 : MODE DE VIE ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pink-500" />
                  <span>4. Conditions d'Accueil & Rythme de Vie</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Quelques précisions pour assurer le bien-être et la sécurité de l'animal au quotidien.
                </p>
              </div>

              {/* Accès à toutes les pièces */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  L’animal accueilli aura-t-il accès à toutes les pièces de votre foyer ? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Oui', 'Non'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange('fullAccess', val)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        formData.fullAccess === val
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                        formData.fullAccess === val ? 'border-white bg-white text-pink-600' : 'border-gray-400'
                      }`}>
                        {formData.fullAccess === val && '✓'}
                      </span>
                      <span>{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Où dormira-t-il */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Où dormira-t-il ? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sleepingPlace}
                  onChange={(e) => handleChange('sleepingPlace', e.target.value)}
                  placeholder="Ex: Dans le salon sur son arbre à chat, dans la chambre avec nous..."
                  className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                    errors.sleepingPlace ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                />
                {errors.sleepingPlace && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.sleepingPlace}</p>}
              </div>

              {/* Heures d'absence et localisation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Heures d'absence journalières moyennes *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hoursAbsent}
                    onChange={(e) => handleChange('hoursAbsent', e.target.value)}
                    placeholder="Ex: 5 à 7 heures, télétravail 3j/semaine"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.hoursAbsent ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.hoursAbsent && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.hoursAbsent}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Où restera l'animal durant vos absences ? *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.absenceLocation}
                    onChange={(e) => handleChange('absenceLocation', e.target.value)}
                    placeholder="Ex: En intérieur libre dans la maison"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.absenceLocation ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.absenceLocation && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.absenceLocation}</p>}
                </div>
              </div>

              {/* Rentrée midi & Restera seul */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Rentrerez-vous le midi ?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Oui', 'Non'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange('lunchReturn', val)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.lunchReturn === val
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Restera-t-il seul sans compagnie ?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Oui', 'Non'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange('staysAlone', val)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.staysAlone === val
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 5 : RÉCAPITULATIF & VALIDATION ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>5. Récapitulatif de votre Candidature</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vérifiez vos renseignements avant l'envoi définitif de votre dossier.
                </p>
              </div>

              {/* Récapitulatif élégant */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="font-bold text-gray-500">Animal souhaité :</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-pink-600 text-sm">{formData.catName || 'Non spécifié'}</span>
                    {formData.catId && (
                      <span className="text-[10px] font-mono bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                        #{formData.catId.slice(-6)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Candidat :</span>
                  <span className="font-bold text-gray-900">{formData.fullName} • {formData.profession}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Coordonnées :</span>
                  <span className="font-semibold text-gray-800">{formData.phone} • {formData.email}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Adresse :</span>
                  <span className="font-semibold text-gray-800">{formData.address}, {formData.postalCodeCity}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Foyer & Logement :</span>
                  <span className="font-semibold text-gray-800">
                    {formData.adultsCount} adulte(s) • {formData.childrenCount} enfant(s) • {formData.housingType}
                    {formData.housingType === 'Appartement' && formData.floor ? ` (${formData.floor === 'RDC' ? 'RDC' : `${formData.floor}e ét.`})` : ''}
                    {formData.hasGarden === 'Oui' ? ' • Jardin' : ''}
                    {formData.hasBalcony === 'Oui' ? ' • Balcon' : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Animaux actuels :</span>
                  <span className="font-semibold text-gray-800">
                    {formData.hasAnimals === 'Oui' ? `Oui (${formData.animalDetails})` : 'Aucun'}
                  </span>
                </div>
              </div>

              {/* Champ libre Remarques */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Avez-vous des précisions à ajouter ? (Optionnel)
                </label>
                <textarea
                  rows="3"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  placeholder="Précisions sur vos disponibilités, vos questions pour la famille d'accueil, etc."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  En soumettant ce formulaire, vous certifiez l'exactitude de ces renseignements et vous autorisez l'association <strong>Chat L'Heureux 56</strong> à vous contacter dans le cadre de cette adoption.
                </span>
              </div>
            </div>
          )}

          {/* Boutons de Navigation Carousel */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3.5 rounded-2xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <span>Étape suivante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-3.5 rounded-2xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon dossier d'adoption</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      </div>

    </main>
  );
}
