import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';

import Header from './components/Header';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';

import HomePage from './pages/HomePage';
import AdoptionPage from './pages/AdoptionPage';
import AdoptionFormPage from './pages/AdoptionFormPage';
import CatDetailPage from './pages/CatDetailPage';
import TestimonialsPage from './pages/TestimonialsPage';
import AssociationPage from './pages/AssociationPage';
import DonContactPage from './pages/DonContactPage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Fait défiler la page vers le haut à chaque navigation
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// Suivi automatique des pages vues dans Google Analytics (SPA React Router)
function AnalyticsTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pathname + search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, search]);
  return null;
}

// Layout principal conditionnel (exclut le Header/Footer public sur /admin et /inscription)
function AppLayout() {
  const location = useLocation();
  const isBackoffice = location.pathname.startsWith('/admin') || location.pathname.startsWith('/inscription');

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Lueur d'ambiance d'arrière-plan moderne et légère */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-[#d24de3]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed top-1/3 -right-20 w-[28rem] h-[28rem] bg-[#7db1f9]/6 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <ScrollToTop />
      <AnalyticsTracker />
      {!isBackoffice && <Header />}
      
      <Routes>
        {/* Routes Publiques Principales */}
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />

        <Route path="/adoption" element={<AdoptionPage />} />
        <Route path="/adoption.html" element={<AdoptionPage />} />

        {/* Questionnaire d'adoption intégré */}
        <Route path="/formulaire-adoption" element={<AdoptionFormPage />} />
        <Route path="/formulaire-adoption.html" element={<AdoptionFormPage />} />
        <Route path="/adopter" element={<AdoptionFormPage />} />

        <Route path="/chat/:id" element={<CatDetailPage />} />
        <Route path="/chats/:id" element={<CatDetailPage />} />
        <Route path="/chat-detail.html" element={<CatDetailPage />} />

        <Route path="/temoignages" element={<TestimonialsPage />} />
        <Route path="/temoignages.html" element={<TestimonialsPage />} />

        <Route path="/association" element={<AssociationPage />} />
        <Route path="/association.html" element={<AssociationPage />} />

        <Route path="/soutenir" element={<DonContactPage />} />
        <Route path="/contact" element={<DonContactPage />} />
        <Route path="/don-contact.html" element={<DonContactPage />} />

        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/mentions-legales.html" element={<MentionsLegalesPage />} />

        {/* Inscription Bénévoles par Code Aléatoire */}
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/inscription.html" element={<RegisterPage />} />

        {/* Console Administration & Bénévoles */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin.html" element={<AdminPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isBackoffice && <Footer />}
      {!isBackoffice && <BackToTop />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ToastProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
