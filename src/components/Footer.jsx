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
