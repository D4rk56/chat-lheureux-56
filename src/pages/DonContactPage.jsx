import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Gift, 
  Home, 
  HandHeart, 
  ExternalLink,
  Phone, 
  Mail, 
  MapPin,
  FileSignature,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function DonContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: "Question sur un chat à l'adoption",
    message: ''
  });
  const [copiedText, setCopiedText] = useState(false);
  const { showToast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast("Champs incomplets", "Veuillez remplir votre nom, e-mail et message.", "error");
      return;
    }

    const fullSubject = encodeURIComponent(`[Contact Web] ${formData.subject} - ${formData.name}`);
    const fullBody = encodeURIComponent(
      `Bonjour l'association Chat L'Heureux 56,\n\nNom : ${formData.name}\nE-mail : ${formData.email}\nObjet : ${formData.subject}\n\nMessage :\n${formData.message}\n\nEnvoyé depuis le site officiel de l'association.`
    );

    window.location.href = `mailto:asso.chatslheureux@gmail.com?subject=${fullSubject}&body=${fullBody}`;
    showToast("Application e-mail ouverte", "Votre message est prêt à être envoyé.", "info");
  };

  const handleCopyMessage = async () => {
    if (!formData.name || !formData.message) {
      showToast("Message vide", "Remplissez le formulaire avant de copier.", "info");
      return;
    }
    const text = `De : ${formData.name} (${formData.email})\nObjet : ${formData.subject}\n\n${formData.message}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      showToast("Texte copié !", "Vous pouvez le coller dans vos messages ou e-mails.");
      setTimeout(() => setCopiedText(false), 3000);
    } catch (e) {
      showToast("Erreur", "Impossible de copier automatiquement.", "error");
    }
  };

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      
      {/* En-tête */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solidarité • Dons • Contact</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Soutenir l'association ou <br className="hidden sm:inline" />
          <span className="text-brand-gradient">nous contacter</span> 💌
        </h1>
        <p className="text-xs sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
          Sans subventions fixes, notre association vit uniquement grâce à vos dons et à la générosité de nos bénévoles. Chaque euro et chaque kilo de croquettes sauve des vies dans le Morbihan (56).
        </p>
      </div>

      {/* Cartes de Soutien & Dons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
        
        {/* Micro-mécénat Teaming */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover-lift border border-teal-100 bg-white">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl mb-5 font-bold shadow-inner">
              💶
            </div>
            <h2 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-2">1 € / mois avec Teaming</h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
              Aidez-nous sur le long terme avec seulement 1 € par mois sans aucun frais ni commission. Un micro-mécénat simple, régulier, qui fait toute la différence pour financer notre quotidien !
            </p>
          </div>
          <div>
            <a 
              href="https://www.teaming.net/chatl-heureux?lang=fr_FR" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Rejoindre notre groupe Teaming (1 €/mois)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Don ponctuel / mensuel HelloAsso */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between hover-lift border border-pink-100 bg-white">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#d24de3] flex items-center justify-center text-xl mb-5 shadow-inner">
              <Heart className="w-6 h-6 fill-[#d24de3]" />
            </div>
            <h2 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-2">Don libre sur HelloAsso</h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
              Effectuez un don ponctuel ou mensuel en toute sécurité par carte bancaire. Les fonds financent directement nos chirurgies, bilans sanguins, stérilisations et soins d'urgence.
            </p>
          </div>
          <div>
            <a 
              href="https://www.helloasso.com/associations/chats-l-heureux/formulaires/1" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-brand-gradient text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 text-xs sm:text-sm hover:opacity-95"
            >
              <span>Faire un don sur HelloAsso</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Dons Matériels */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 border border-blue-100 bg-gradient-to-br from-blue-50/50 via-white to-pink-50/30 mb-12 sm:mb-16 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
              <Gift className="w-3.5 h-3.5" /> Collecte & Équipement
            </div>
            <h2 className="font-title text-xl sm:text-3xl font-black text-gray-900 mb-3">
              Faire un don matériel 🥫
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium leading-relaxed mb-4">
              Nous recherchons régulièrement des produits essentiels pour nos chats placés en Familles d'Accueil dans le Morbihan :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
              <div className="bg-white/80 p-2.5 sm:p-3 rounded-2xl border border-gray-100 text-center shadow-xs">
                <span className="text-lg sm:text-xl block mb-1">🥣</span>
                <strong className="text-[11px] sm:text-xs font-bold text-gray-800 block">Croquettes & Pâtées</strong>
              </div>
              <div className="bg-white/80 p-2.5 sm:p-3 rounded-2xl border border-gray-100 text-center shadow-xs">
                <span className="text-lg sm:text-xl block mb-1">🧼</span>
                <strong className="text-[11px] sm:text-xs font-bold text-gray-800 block">Litières & Bacs</strong>
              </div>
              <div className="bg-white/80 p-2.5 sm:p-3 rounded-2xl border border-gray-100 text-center shadow-xs">
                <span className="text-lg sm:text-xl block mb-1">🪵</span>
                <strong className="text-[11px] sm:text-xs font-bold text-gray-800 block">Arbres & Griffoirs</strong>
              </div>
              <div className="bg-white/80 p-2.5 sm:p-3 rounded-2xl border border-gray-100 text-center shadow-xs">
                <span className="text-lg sm:text-xl block mb-1">🧶</span>
                <strong className="text-[11px] sm:text-xs font-bold text-gray-800 block">Jouets & Paniers</strong>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 font-semibold italic">
              💡 Pour convenir du lieu de dépôt (secteur Colpo / Vannes) ou fixer un rendez-vous avec un bénévole, contactez-nous par e-mail ou sur Facebook Messenger !
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-2.5 justify-center">
            <a 
              href="https://www.instagram.com/association.chatslheureux" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-extrabold py-3 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 text-center hover:opacity-95"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider opacity-90 font-bold">Vie active de l'asso</span>
                <span className="block text-xs font-black">Instagram @chatslheureux</span>
              </div>
            </a>

            <a 
              href="https://www.facebook.com/profile.php?id=61593487828842" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-[#1877F2] hover:bg-blue-700 text-white font-extrabold py-3 px-5 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-3 text-center"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider opacity-90 font-bold">Échanges & Messenger</span>
                <span className="block text-xs font-black">Facebook Officiel</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Formulaire de Contact & Coordonnées */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-16">
        
        {/* Formulaire */}
        <div className="md:col-span-7 glass-card rounded-3xl p-6 sm:p-8 bg-white border border-gray-200 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#d24de3] text-xs font-bold mb-3">
            <Send className="w-3.5 h-3.5" /> Message Direct
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-2">
            Envoyez-nous un message
          </h2>
          <p className="text-xs text-gray-500 font-medium mb-6">
            Remplissez les informations ci-dessous pour préparer votre message à destination de l'équipe de l'association.
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Votre Nom & Prénom *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex. Jeanne Dupont"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Votre Adresse E-mail *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="exemple@domaine.fr"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Objet de votre demande
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3]"
              >
                <option value="Question sur un chat à l'adoption">🐾 Question sur un chat à l'adoption</option>
                <option value="Proposition de don matériel (nourriture, litière...)">🥫 Proposition de don matériel (nourriture, litière...)</option>
                <option value="Devenir Famille d'Accueil ou bénévole">🏠 Devenir Famille d'Accueil ou bénévole</option>
                <option value="Question générale ou autre démarche">💬 Autre demande</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Votre Message *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Précisez votre demande, vos disponibilités ou les coordonnées de votre foyer..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3]"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-xl shadow-md hover:opacity-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir mon e-mail avec ce message</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 px-4 rounded-xl transition-colors"
                title="Copier le texte rédigé"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Coordonnées directes */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-3xl p-6 sm:p-7 bg-slate-900 text-white shadow-xl border border-slate-800">
            <h3 className="font-title text-lg font-bold mb-5 flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Contact direct</span>
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] font-medium">Téléphone / Urgences</span>
                  <a href="tel:0661508828" className="font-bold text-white hover:text-pink-400 transition-colors text-sm sm:text-base">
                    06 61 50 88 28
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] font-medium">Adresse e-mail officielle</span>
                  <a href="mailto:asso.chatslheureux@gmail.com" className="font-bold text-white hover:text-pink-400 transition-colors break-all">
                    asso.chatslheureux@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px] font-medium">Siège social</span>
                  <span className="font-semibold text-slate-200">
                    Colpo (56390) • Morbihan, Bretagne
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-white border border-gray-200">
            <h4 className="font-title text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Informations administratives</span>
            </h4>
            <div className="text-[11px] text-gray-600 space-y-1 font-mono">
              <p>Association loi 1901 à but non lucratif</p>
              <p>SIREN : 930 923 800</p>
              <p>SIRET : 930 923 800 00013</p>
              <p>Parution JORF : Déclaration Préfecture Morbihan</p>
            </div>
          </div>
        </div>

      </div>

      {/* Section Formulaires Officiels en Ligne */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="max-w-xl relative z-10 mb-6">
          <h2 className="font-title text-xl sm:text-3xl font-black mb-2">Formulaires Officiels en Ligne</h2>
          <p className="text-gray-300 font-medium text-xs sm:text-sm leading-relaxed">
            Accédez directement à nos questionnaires pour formaliser votre candidature d'adoption ou pour proposer votre aide comme Famille d'Accueil (FA).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
          <Link 
            to="/formulaire-adoption" 
            className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Questionnaire d'adoption</h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400">Formulaire en ligne officiel (Chat L'Heureux 56)</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-pink-400 group-hover:text-white transition-colors" />
          </Link>

          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSe2_gn8dq66LJu-AWQ90dI-DRc2FP5NdD88cNcgoAyEX7IHfA/viewform" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Devenir Famille d'Accueil</h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400">Remplir sur Google Forms</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </a>
        </div>
      </div>

    </main>
  );
}
