import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, Shield, Sparkles } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-4 pt-3 sm:pt-6 pointer-events-none flex justify-center">
      <nav className="glass-nav rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center w-full max-w-[calc(100vw-1.5rem)] sm:max-w-5xl pointer-events-auto shadow-lg shadow-gray-200/50">
        
        {/* Logo & Titre */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/favicon.svg" 
            alt="Logo Chat L'Heureux 56" 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full transform group-hover:scale-105 transition-transform" 
          />
          <span className="font-title font-black text-lg sm:text-2xl tracking-tight text-brand-gradient">
            Chat L'Heureux 56
          </span>
        </Link>

        {/* Liens Desktop */}
        <div className="hidden lg:flex items-center gap-6 font-semibold text-xs sm:text-sm text-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors flex items-center gap-1.5 relative py-1 ${
                isActive(link.path) 
                  ? 'text-[#d24de3] font-bold' 
                  : 'hover:text-[#d24de3]'
              }`}
            >
              <span>{link.name}</span>
              {link.badge && (
                <span className="inline-flex items-center justify-center bg-pink-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full shadow-xs">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Bouton Action + Menu Mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/adoption"
            className="hidden sm:inline-flex items-center gap-1.5 bg-brand-gradient text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full shadow-md shadow-pink-500/20 hover:opacity-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adopter</span>
          </Link>

          {/* Bouton Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-8 h-8 rounded-full bg-pink-50 text-[#d24de3] flex items-center justify-center text-sm"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile déroulant plein écran */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col p-6 pointer-events-auto lg:hidden animate-in fade-in">
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Logo" className="w-7 h-7 rounded-full" />
              <span className="font-title font-black text-xl text-white">Chat L'Heureux 56</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 text-base font-bold text-slate-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-3 px-4 rounded-xl flex items-center justify-between ${
                  isActive(link.path)
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'hover:bg-slate-900'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {link.badge} favori{link.badge > 1 ? 's' : ''}
                  </span>
                )}
              </Link>
            ))}

            <Link
              to="/admin"
              className="py-3 px-4 rounded-xl flex items-center gap-2 text-slate-400 hover:text-white mt-4 border border-slate-800"
            >
              <Shield className="w-4 h-4 text-pink-400" />
              <span>Espace Admin</span>
            </Link>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-400 text-center">
            Association Chat L'Heureux 56 • Colpo (Morbihan)
          </div>
        </div>
      )}
    </header>
  );
}
