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
  Check
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

  const [formData, setFormData] = useState(() => ({
    ...INITIAL_ADOPTION_FORM,
    catName: searchParams.get('chat') || ''
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

  // Mettre à jour si le paramètre d'URL change
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam) {
      setFormData(prev => ({ ...prev, catName: chatParam }));
    }
  }, [searchParams]);

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

  // Validation par étape
  const validateCurrentStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.catName.trim()) stepErrors.catName = "Veuillez indiquer le nom de l'animal.";
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
        stepErrors.floor = "Précisez l'étage.";
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
      showToast("Champs requis", "Veuillez vérifier les informations renseignées.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitAdoptionRequest(formData);
      setSubmissionResult(res);
      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast("Candidature transmise", "Votre questionnaire d'adoption a bien été envoyé !");
    } catch (err) {
      console.error("Erreur soumission formulaire :", err);
      showToast("Erreur", "Une erreur est survenue lors de l'envoi. Veuillez réessayer.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Écran de succès
  if (submittedSuccess) {
    return (
      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-pink-100 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-black uppercase tracking-wider text-[#d24de3] mb-2 block">
            Dossier d'adoption enregistré
          </span>
          <h1 className="font-title text-2xl sm:text-4xl font-black text-gray-900 mb-4">
            Merci pour votre demande pour {formData.catName} !
          </h1>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8 font-medium">
            Votre questionnaire a bien été transmis à nos bénévoles de l'association <strong>Chat L'Heureux 56</strong>. 
            Nous accordons la plus grande attention à chaque candidature afin d'assurer le meilleur bien-être à nos protégés.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left max-w-lg mx-auto mb-8 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Prochaines étapes de votre démarche :
            </h2>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold shrink-0 flex items-center justify-center text-xs">1</span>
              <span><strong>Examen du dossier :</strong> Nos bénévoles étudient votre questionnaire sous 48 à 72 heures.</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold shrink-0 flex items-center justify-center text-xs">2</span>
              <span><strong>Premier échange :</strong> Nous vous contacterons au {formData.phone} ou par e-mail pour échanger sur le caractère du chat.</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold shrink-0 flex items-center justify-center text-xs">3</span>
              <span><strong>Rencontre en Famille d'Accueil :</strong> Rendez-vous pour faire connaissance avec {formData.catName} !</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/adoption"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all text-center"
            >
              Découvrir d'autres chats
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all text-center"
            >
              Retourner à l'accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const stepsInfo = [
    { num: 1, title: "L'Animal & Vous" },
    { num: 2, title: "Votre Logement" },
    { num: 3, title: "Vos Animaux" },
    { num: 4, title: "Mode de Vie" },
    { num: 5, title: "Validation" }
  ];

  return (
    <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      {/* En-tête de la page */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
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
          Ce formulaire nous permet de mieux vous connaître et de nous assurer que nos petits protégés rejoignent un foyer parfaitement adapté.
        </p>
      </div>

      {/* Barre de Progression */}
      <div className="mb-8 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {stepsInfo.map((s) => {
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div key={s.num} className="text-center">
                <div 
                  className={`w-7 h-7 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center text-xs font-black mb-1 transition-all ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : isCurrent 
                        ? 'bg-brand-gradient text-white shadow-md shadow-pink-500/20 ring-4 ring-pink-100' 
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`hidden sm:block text-[11px] font-bold truncate ${isCurrent ? 'text-pink-600' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-brand-gradient h-full transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Formulaire Principal */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {/* ================= ÉTAPE 1 ================= */}
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

              {/* Nom du chat */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nom du chat souhaité *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.catName}
                    onChange={(e) => handleChange('catName', e.target.value)}
                    placeholder="Ex: Caramel, Nala, Coup de cœur général..."
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.catName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {catsList.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleChange('catName', e.target.value);
                      }}
                      className="px-3 py-3 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700"
                    >
                      <option value="">Choisir un chat...</option>
                      {catsList.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {errors.catName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.catName}</p>}
              </div>

              {/* Nom & Prénom */}
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
                    placeholder="Ex: Comptable, Enseignant, Télétravailleur..."
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
                    placeholder="06 00 00 00 00"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              {/* Adresse & Ville */}
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

          {/* ================= ÉTAPE 2 ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-pink-500" />
                  <span>2. Composition du Ménage & Votre Habitation</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ces précisions aident à vérifier la compatibilité avec le caractère et les besoins de l'animal.
                </p>
              </div>

              {/* Composition du foyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nombre d'adultes au foyer *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.adultsCount}
                    onChange={(e) => handleChange('adultsCount', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Nombre d'enfants au foyer *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.childrenCount}
                    onChange={(e) => handleChange('childrenCount', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Questions conditionnelles enfants si > 0 */}
              {parseInt(formData.childrenCount, 10) > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-4 animate-in fade-in">
                  <div className="text-xs font-bold text-pink-700 uppercase tracking-wider">
                    Détails concernant les enfants
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Âge des enfants *
                    </label>
                    <input
                      type="text"
                      value={formData.childrenAges}
                      onChange={(e) => handleChange('childrenAges', e.target.value)}
                      placeholder="Ex: 5 ans et 8 ans"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                    />
                    {errors.childrenAges && <p className="text-rose-500 text-xs mt-1">{errors.childrenAges}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Ont-ils déjà eu des contacts avec des animaux ?
                    </label>
                    <div className="flex gap-4">
                      {['Oui', 'Non'].map((val) => (
                        <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="childrenAnimalContact"
                            checked={formData.childrenAnimalContact === val}
                            onChange={() => handleChange('childrenAnimalContact', val)}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <span>{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Habitation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Type d'habitation *
                  </label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => handleChange('housingType', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white font-medium"
                  >
                    <option value="Appartement">Appartement</option>
                    <option value="Maison">Maison</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Pièce isolée avec fenêtre ? *
                  </label>
                  <div className="flex gap-4 pt-2.5">
                    {['Oui', 'Non'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="hasIsolatedRoom"
                          checked={formData.hasIsolatedRoom === val}
                          onChange={() => handleChange('hasIsolatedRoom', val)}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Si Appartement -> Étage */}
              {formData.housingType === 'Appartement' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Quel étage ? *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['RDC', '1', '2', '3', '4', '5', '6+'].map((fl) => (
                      <button
                        type="button"
                        key={fl}
                        onClick={() => handleChange('floor', fl)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.floor === fl 
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {fl === 'RDC' ? 'Rez-de-chaussée' : `${fl}e étage`}
                      </button>
                    ))}
                  </div>
                  {errors.floor && <p className="text-rose-500 text-xs mt-1">{errors.floor}</p>}
                </div>
              )}

              {/* Si Autre -> Préciser le type d'habitation */}
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
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.housingTypeOther ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.housingTypeOther && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.housingTypeOther}</p>}
                </div>
              )}

              {/* Balcon & Jardin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Balcon */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Avez-vous un balcon ?
                  </label>
                  <div className="flex gap-4 mb-2">
                    {['Oui', 'Non'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="hasBalcony"
                          checked={formData.hasBalcony === val}
                          onChange={() => handleChange('hasBalcony', val)}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  {formData.hasBalcony === 'Oui' && (
                    <div className="pt-2 border-t border-gray-200 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Le balcon est-il sécurisé ? (filet, brise-vue haut...)
                      </label>
                      <div className="flex gap-4">
                        {['Oui', 'Non'].map((val) => (
                          <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="isBalconySecured"
                              checked={formData.isBalconySecured === val}
                              onChange={() => handleChange('isBalconySecured', val)}
                              className="text-pink-600 focus:ring-pink-500"
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Jardin */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Avez-vous un jardin ?
                  </label>
                  <div className="flex gap-4 mb-2">
                    {['Oui', 'Non'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="hasGarden"
                          checked={formData.hasGarden === val}
                          onChange={() => handleChange('hasGarden', val)}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                  {formData.hasGarden === 'Oui' && (
                    <div className="pt-2 border-t border-gray-200 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Superficie approximative du jardin (m²) *
                      </label>
                      <input
                        type="text"
                        value={formData.gardenSurface}
                        onChange={(e) => handleChange('gardenSurface', e.target.value)}
                        placeholder="Ex: 300 m² clôturé"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
                      />
                      {errors.gardenSurface && <p className="text-rose-500 text-xs mt-1">{errors.gardenSurface}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 3 ================= */}
          {/* Note : Conditionnel selon hasAnimals === 'Oui' ou 'Non' */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-pink-500" />
                  <span>3. Animaux Actuels au Foyer</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Permet de s'assurer de la bonne entente avec les animaux déjà présents dans votre famille.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Possédez-vous des animaux actuellement ? *
                </label>
                <div className="flex gap-4">
                  {['Non', 'Oui'].map((val) => (
                    <label 
                      key={val} 
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border cursor-pointer font-bold text-xs transition-all ${
                        formData.hasAnimals === val
                          ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasAnimals"
                        checked={formData.hasAnimals === val}
                        onChange={() => handleChange('hasAnimals', val)}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span>{val === 'Non' ? 'Non, aucun animal' : 'Oui, j\'ai des animaux'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Questions conditionnelles : UNIQUEMENT SI hasAnimals === 'Oui' */}
              {formData.hasAnimals === 'Oui' ? (
                <div className="p-5 sm:p-6 rounded-3xl bg-pink-50/50 border border-pink-100 space-y-5 animate-in fade-in">
                  <div className="text-xs font-bold text-[#d24de3] uppercase tracking-wider">
                    Informations sur vos animaux actuels
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
                      placeholder="Ex: 1 chat de 4 ans et 1 lapin nain"
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
                      placeholder="Ex: Golden retriever, 2 ans, habitué aux chats"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-pink-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Vos animaux sont-ils :
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {['Identifiés', 'Vaccinés', 'Stérilisés', 'Aucun de ces choix'].map((opt) => {
                        const checked = (formData.animalStatus || []).includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleCheckboxToggle('animalStatus', opt)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              checked 
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                                : 'bg-white text-gray-700 border-pink-200 hover:bg-pink-50'
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Vos animaux sont-ils sociables avec leurs congénères ?
                    </label>
                    <div className="flex gap-4">
                      {['Oui', 'Non', 'Non testé'].map((val) => (
                        <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="isSociable"
                            checked={formData.isSociable === val}
                            onChange={() => handleChange('isSociable', val)}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <span>{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>Aucun animal n'est actuellement présent à votre domicile. Les questions relatives aux autres animaux ont été automatiquement retirées.</span>
                </div>
              )}
            </div>
          )}

          {/* ================= ÉTAPE 4 ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pink-500" />
                  <span>4. Conditions d'Accueil & Rythme de Vie</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Un aperçu de vos journées pour nous assurer que le futur compagnon s'épanouira pleinement.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  L’animal accueilli aura-t-il accès à toutes les pièces de votre foyer ? *
                </label>
                <div className="flex gap-4">
                  {['Oui', 'Non'].map((val) => (
                    <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="fullAccess"
                        checked={formData.fullAccess === val}
                        onChange={() => handleChange('fullAccess', val)}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Où dormira-t-il ? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sleepingPlace}
                  onChange={(e) => handleChange('sleepingPlace', e.target.value)}
                  placeholder="Ex: Dans le salon sur son panier, dans la chambre avec nous..."
                  className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                    errors.sleepingPlace ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                />
                {errors.sleepingPlace && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.sleepingPlace}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Heures d'absence moyennes par jour *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hoursAbsent}
                    onChange={(e) => handleChange('hoursAbsent', e.target.value)}
                    placeholder="Ex: 6h à 8h, télétravail 3j/semaine..."
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.hoursAbsent ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.hoursAbsent && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.hoursAbsent}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Durant ces absences, où restera-t-il ? *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.absenceLocation}
                    onChange={(e) => handleChange('absenceLocation', e.target.value)}
                    placeholder="Ex: Libre dans toute la maison"
                    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border ${
                      errors.absenceLocation ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                    } text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white`}
                  />
                  {errors.absenceLocation && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.absenceLocation}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Rentrerez-vous le midi ?
                  </label>
                  <div className="flex gap-4 pt-1.5">
                    {['Oui', 'Non'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="lunchReturn"
                          checked={formData.lunchReturn === val}
                          onChange={() => handleChange('lunchReturn', val)}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Restera-t-il seul ?
                  </label>
                  <div className="flex gap-4 pt-1.5">
                    {['Oui', 'Non'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="staysAlone"
                          checked={formData.staysAlone === val}
                          onChange={() => handleChange('staysAlone', val)}
                          className="text-pink-600 focus:ring-pink-500"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉTAPE 5 ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="font-title text-lg font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>5. Récapitulatif & Confirmation</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vérifiez vos réponses avant d'envoyer votre dossier à l'équipe.
                </p>
              </div>

              {/* Récapitulatif condensé */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-gray-500">Animal demandé :</span>
                  <span className="font-black text-pink-600 text-sm">{formData.catName || 'Non spécifié'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Adoptant :</span>
                  <span className="font-semibold text-gray-800">{formData.fullName} ({formData.phone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">E-mail :</span>
                  <span className="font-semibold text-gray-800">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Localisation :</span>
                  <span className="font-semibold text-gray-800">{formData.postalCodeCity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Logement :</span>
                  <span className="font-semibold text-gray-800">
                    {formData.housingType === 'Autre' && formData.housingTypeOther ? `Autre (${formData.housingTypeOther})` : formData.housingType} 
                    {formData.housingType === 'Appartement' && formData.floor ? ` (${formData.floor === 'RDC' ? 'RDC' : `${formData.floor}e ét.`})` : ''}
                    {formData.hasGarden === 'Oui' ? ' • Jardin' : ''} 
                    {formData.hasBalcony === 'Oui' ? ' • Balcon' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Animaux au foyer :</span>
                  <span className="font-semibold text-gray-800">
                    {formData.hasAnimals === 'Oui' ? `Oui (${formData.animalDetails})` : 'Aucun'}
                  </span>
                </div>
              </div>

              {/* Champ libre Remarques */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Avez-vous quelque chose à ajouter ? (Optionnel)
                </label>
                <textarea
                  rows="3"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  placeholder="Précisions sur vos attentes, vos disponibilités pour une visite, etc."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-pink-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  En soumettant ce formulaire, vous certifiez l'exactitude des renseignements communiqués et vous acceptez d'être contacté(e) par l'équipe de l'association <strong>Chat L'Heureux 56</strong> dans le cadre de votre démarche d'adoption.
                </span>
              </div>
            </div>
          )}

          {/* Boutons de Navigation / Soumission */}
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
                <span>Suivant</span>
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
