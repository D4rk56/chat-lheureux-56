import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  KeyRound, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Phone,
  AtSign,
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateInviteCode } from '../firebase/memberService';
import { getAuthErrorMessage } from '../firebase/authService';
import { normalizeInviteCode } from '../utils/inviteCodes';
import { ROLE_LABELS } from '../utils/roles';
import GoogleIcon from '../components/icons/GoogleIcon';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout, registerWithInvite, registerGoogleWithInvite, loginGoogle } = useAuth();
  const { showToast } = useToast();

  const [codeParam, setCodeParam] = useState(searchParams.get('code') || '');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [validCodeDoc, setValidCodeDoc] = useState(null);
  const [codeError, setCodeError] = useState('');

  // Formulaire d'inscription
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Si un code est présent dans l'URL, le vérifier automatiquement au chargement
  useEffect(() => {
    const rawCode = searchParams.get('code');
    if (rawCode) {
      handleVerifyCode(rawCode);
    }
  }, [searchParams]);

  const handleVerifyCode = async (codeToVerify) => {
    const cleaned = normalizeInviteCode(codeToVerify);
    if (!cleaned) {
      setCodeError("Veuillez saisir votre code d'invitation.");
      return;
    }

    setCodeVerifying(true);
    setCodeError('');
    try {
      const res = await validateInviteCode(cleaned);
      if (res.valid) {
        setValidCodeDoc(res.codeDoc);
      } else {
        setValidCodeDoc(null);
        setCodeError(res.error || "Ce code d'invitation est invalide ou a expiré.");
      }
    } catch (err) {
      console.error(err);
      setCodeError("Erreur lors de la vérification du code. Veuillez réessayer.");
    } finally {
      setCodeVerifying(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!validCodeDoc) {
      setRegisterError("Veuillez d'abord valider un code d'invitation.");
      return;
    }

    if (!fullName.trim()) {
      setRegisterError("Veuillez renseigner votre nom et prénom (obligatoire).");
      return;
    }

    if (!phone.trim() || phone.trim().length < 6) {
      setRegisterError("Veuillez renseigner un numéro de téléphone valide pour être contacté (obligatoire).");
      return;
    }

    if (password.length < 6) {
      setRegisterError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await registerWithInvite({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        pseudo: pseudo.trim(),
        displayName: (pseudo.trim() || fullName.trim()),
        codeDoc: validCodeDoc
      });

      showToast("Compte créé !", "Bienvenue dans l'équipe de l'association Chat L'Heureux 56.");
      navigate('/admin');
    } catch (err) {
      console.error("Erreur inscription :", err);
      setRegisterError(getAuthErrorMessage(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterGoogle = async () => {
    if (!validCodeDoc) {
      setRegisterError("Veuillez d'abord valider un code d'invitation.");
      return;
    }

    setRegisterError('');
    setGoogleSubmitting(true);
    try {
      const res = await loginGoogle();
      if (!res.success) {
        if (res.error) setRegisterError(res.error);
        return;
      }

      if (!res.isNewUser) {
        showToast("Déjà membre !", `Votre compte Google (${res.user.email}) est déjà actif au sein de l'association.`);
        navigate('/admin');
        return;
      }

      // Finalisation inscription avec le code d'invitation
      await registerGoogleWithInvite({
        googleUser: res.user,
        codeDoc: validCodeDoc,
        fullName: fullName.trim() || res.user.displayName || '',
        phone: phone.trim(),
        pseudo: pseudo.trim()
      });

      showToast("Bienvenue !", "Votre inscription avec Google a été validée avec succès.");
      navigate('/admin');
    } catch (err) {
      console.error("Erreur inscription Google :", err);
      setRegisterError(getAuthErrorMessage(err.code));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center p-4">
      {/* Background glow effects */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-[#d24de3]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed top-1/3 -right-20 w-[28rem] h-[28rem] bg-[#7db1f9]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="admin-glass-panel w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Header de la carte */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="font-title text-2xl font-black text-white mb-1">
            Espace Bénévoles & Membres
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Inscription sécurisée par code d'invitation
          </p>
        </div>

        {/* Alerte si utilisateur déjà connecté */}
        {user && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 text-pink-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Session active ({user.email})</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Vous êtes actuellement connecté. Pour créer un compte pour un nouveau bénévole, veuillez d'abord vous déconnecter.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Espace Admin
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 : Si le code n'est pas encore validé */}
        {!validCodeDoc ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-3">
              <KeyRound className="w-5 h-5 shrink-0 text-pink-400 mt-0.5" />
              <span>
                L'accès à cette page requiert un <strong>code d'invitation à usage unique</strong> généré par un responsable de l'association.
              </span>
            </div>

            {codeError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{codeError}</span>
              </div>
            )}

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleVerifyCode(codeParam); 
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Code d'invitation reçu
                </label>
                <input
                  type="text"
                  required
                  value={codeParam}
                  onChange={(e) => setCodeParam(e.target.value.toUpperCase())}
                  placeholder="CLH-XXXX-XXXX"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={codeVerifying}
                className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {codeVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Vérification du code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Valider mon invitation</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ÉTAPE 2 : Formulaire de création de compte une fois le code validé */
          <div className="space-y-5 animate-in fade-in">
            {/* Badge de validation du code */}
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <div>
                  <div className="font-bold">Code vérifié avec succès</div>
                  <div className="text-[11px] text-emerald-400/80">
                    Rôle attribué : <strong>{ROLE_LABELS[validCodeDoc.role] || validCodeDoc.role}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidCodeDoc(null)}
                className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
              >
                Changer
              </button>
            </div>

            {/* Option Rapide : Inscription en 1 clic avec Google */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Option rapide : Inscription en 1 clic</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Associez directement votre compte Google à votre code pour activer votre accès Bénévole sans mot de passe à mémoriser.
              </p>
              <button
                type="button"
                onClick={handleRegisterGoogle}
                disabled={googleSubmitting || submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {googleSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion Google en cours...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <span>S'inscrire avec Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative"><span className="bg-[#090d16] px-3 text-[11px] text-slate-500 font-bold uppercase tracking-wider">ou par mot de passe classique</span></div>
            </div>

            {registerError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Vrai nom & prénom - Obligatoire */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Nom & Prénom (Vrai nom)</span>
                  <span className="text-[10px] text-pink-400 font-bold lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Camille Martin"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Téléphone - Obligatoire */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Numéro de téléphone</span>
                  <span className="text-[10px] text-pink-400 font-bold lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Permet à l'équipe et au bureau de l'association de vous contacter facilement.
                </p>
              </div>

              {/* Pseudo - Optionnel */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Pseudo affiché</span>
                  <span className="text-[10px] text-slate-500 font-normal lowercase">Optionnel</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ex: CamilleM (laisser vide pour afficher votre vrai nom)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Adresse e-mail */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Adresse E-mail</span>
                  <span className="text-[10px] text-pink-400 font-bold lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="camille@chatlheureux56.fr"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mot de passe (min 6 caractères)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Création de votre accès en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Finaliser mon inscription</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Liens de bas de carte */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
          <Link to="/admin" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Déjà un compte ? Se connecter</span>
          </Link>
          <Link to="/" className="text-slate-400 hover:text-white transition-colors font-semibold">
            Site public &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
