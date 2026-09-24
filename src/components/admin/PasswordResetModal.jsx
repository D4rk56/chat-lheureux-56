import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle2, X, Lock, Send } from 'lucide-react';
import { getAuthErrorMessage } from '../../firebase/authService';

export default function PasswordResetModal({ isOpen, onClose, initialEmail = '', onSendReset }) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      await onSendReset(email.trim());
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(getAuthErrorMessage(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700/80 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-title text-xl font-black text-white mb-1">
            Mot de passe oublié
          </h2>
          <p className="text-xs text-slate-400">
            Recevez un lien sécurisé par e-mail pour réinitialiser votre accès.
          </p>
        </div>

        {success ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">E-mail envoyé avec succès !</strong>
                <span>
                  Un lien de réinitialisation vous a été envoyé à <strong>{email}</strong>. 
                  Veuillez vérifier votre boîte de réception et vos courriers indésirables (spams).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Fermer et retourner à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Votre adresse E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@chatlheureux56.fr"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer le lien</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
