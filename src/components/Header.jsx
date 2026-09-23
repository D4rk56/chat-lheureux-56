import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, Shield } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { favoritesCount } = useFavorites();

  // Fermer le menu mobile lors du changement d'URL
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { 
      name: "À l'adoption", 
      path: '/adoption',
      badge: favoritesCount > 0 ? favoritesCount : null
    },
    { name: 'Témoignages', path: '/temoignages' },
    { name: "L'Association", path: '/association' },
    { name: 'Soutenir & Contact', path: '/soutenir' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 pt-3 sm:pt-5 pointer-events-none flex justify-center">
      <nav className="glass-nav rounded-full px-5 sm:px-8 py-2.5 sm:py-3 flex justify-between items-center w-full max-w-[calc(100vw-1.5rem)] sm:max-w-5xl pointer-events-auto shadow-lg shadow-gray-200/40 border border-white/80 transition-all">
        
        {/* Titre & Identité (sans favicon, pure typographie moderne) */}
        <Link to="/" className="group shrink-0 py-0.5 flex items-center">
          <span className="font-title font-black text-xl sm:text-2xl tracking-tight text-brand-gradient">
            Chat L'Heureux 56
          </span>
        </Link>

        {/* Liens Desktop centrés et épurés */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 font-semibold text-xs sm:text-sm text-gray-700">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  active 
                    ? 'bg-pink-50 text-[#d24de3] font-bold shadow-xs' 
                    : 'text-gray-600 hover:text-[#d24de3] hover:bg-pink-50/60'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="inline-flex items-center justify-center bg-pink-500 text-white text-[10px] font-black w-4 h-4 rounded-full shadow-xs">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Côté Droit : Coup de cœur (si présent) + Déclencheur Mobile */}
        <div className="flex items-center gap-2">
          {favoritesCount > 0 && (
            <Link
              to="/adoption"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold transition-all shadow-xs"
              title={`${favoritesCount} coup(s) de cœur enregistrés`}
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              <span className="hidden sm:inline font-bold">Coups de cœur</span>
              <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {favoritesCount}
              </span>
            </Link>
          )}

          {/* Bouton Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-pink-50 text-gray-700 hover:text-[#d24de3] flex items-center justify-center transition-colors"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile plein écran */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex flex-col p-6 pointer-events-auto lg:hidden animate-in fade-in">
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center">
              <span className="font-title font-black text-2xl text-brand-gradient">
                Chat L'Heureux 56
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 text-base font-bold text-slate-200">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'hover:bg-slate-900 text-slate-200'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="bg-pink-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {link.badge} coup{link.badge > 1 ? 's' : ''} de cœur
                    </span>
                  )}
                </Link>
              );
            })}

            <Link
              to="/admin"
              className="py-3 px-4 rounded-2xl flex items-center gap-2 text-slate-400 hover:text-white mt-6 border border-slate-800 bg-slate-900/60"
            >
              <Shield className="w-4 h-4 text-pink-400" />
              <span>Espace Bénévoles & Administration</span>
            </Link>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800/80 text-xs text-slate-400 text-center font-medium">
            Association Chat L'Heureux 56 • Colpo (Morbihan)
          </div>
        </div>
      )}
    </header>
  );
}
