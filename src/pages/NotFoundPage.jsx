import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
      <div className="glass-card rounded-[2.5rem] p-8 sm:p-12 text-center max-w-md w-full bg-white border border-pink-100 shadow-md">
        <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#d24de3] flex items-center justify-center mx-auto mb-4 text-2xl">
          <PawPrint className="w-8 h-8" />
        </div>
        <h1 className="font-title text-4xl sm:text-5xl font-black text-gray-900 mb-2">404</h1>
        <h2 className="font-title text-lg font-bold text-gray-800 mb-2">Page introuvable</h2>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mb-6">
          Oups ! Ce petit chaton s'est égaré. La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    </main>
  );
}
