import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, UserCheck, Lock, ChevronRight, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 pt-12 sm:pt-16 pb-10 mt-auto relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-10">
          
          {/* Identité Asso */}
          <div className="md:col-span-5">
            <div className="mb-4 flex items-center gap-3">
              <img src="/favicon.svg" alt="Logo" className="w-9 h-9 rounded-full" />
              <div>
                <span className="text-xs font-black text-pink-400 uppercase tracking-widest block mb-0.5">
                  Association (56)
                </span>
                <span className="font-title font-extrabold text-2xl sm:text-3xl tracking-tight text-white block">
                  Chat L'Heureux 56
                </span>
              </div>
            </div>
            <p className="text-slate-400 font-medium text-xs sm:text-sm mb-4 leading-relaxed max-w-md">
              Association déclarée à but non lucratif dédiée à la protection, au soin, à la stérilisation et à l'adoption responsable de chats abandonnés dans le Morbihan (56).
            </p>

            {/* Réseaux Sociaux : Instagram & Facebook */}
            <div className="mb-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Suivez la vie active de l'association :
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://www.instagram.com/association.chatslheureux"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold text-xs shadow-md hover:opacity-90 hover:scale-102 transition-all"
                  title="Voir les stories et photos de nos chats sur Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>

                <a
                  href="https://www.facebook.com/profile.php?id=61593487828842"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-md hover:scale-102 transition-all"
                  title="Suivre les actualités de l'association sur Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono mb-6">
              SIREN : 930 923 800 • SIRET : 930 923 800 00013
            </p>

          </div>

          {/* Navigation */}
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="font-title font-extrabold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-pink-400" />
              <span>Navigation</span>
            </h4>
            <ul className="space-y-2.5 font-semibold text-xs sm:text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Accueil
                </Link>
              </li>
              <li>
                <Link to="/adoption" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-600" /> À l'adoption
                </Link>
              </li>
              <li>
                <Link to="/temoignages" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Ils sont heureux
                </Link>
              </li>
              <li>
                <Link to="/association" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-600" /> L'Association
                </Link>
              </li>
              <li>
                <Link to="/soutenir" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Soutenir & Dons
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 text-[11px] pt-1">
                  <ChevronRight className="w-3 h-3 text-slate-700" /> Mentions légales & RGPD
                </Link>
              </li>
            </ul>
          </div>

          {/* Coordonnées */}
          <div className="md:col-span-3">
            <h4 className="font-title font-extrabold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7db1f9]" />
              <span>Contact</span>
            </h4>
            <ul className="space-y-3 font-medium text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-white">Marina Loric</strong>
                  <span className="text-slate-400 text-xs">Présidente de l'association</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#7db1f9] shrink-0" />
                <a href="tel:0661508828" className="hover:text-white transition-colors">
                  06 61 50 88 28
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#7db1f9] shrink-0" />
                <a href="mailto:asso.chatslheureux@gmail.com" className="hover:text-white transition-colors truncate">
                  asso.chatslheureux@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Colpo (56) • Morbihan</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Ligne inférieure */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
          <p className="flex items-center gap-1.5">
            Fait avec nos petites patounes pleines d'amour 
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 inline" /> 
            • &copy; 2026 Chat L'Heureux 56.
          </p>
          <Link
            to="/admin"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <Lock className="w-3 h-3 text-pink-400" />
            <span>Espace Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
