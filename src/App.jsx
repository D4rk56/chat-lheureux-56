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
import CatDetailPage from './pages/CatDetailPage';
import TestimonialsPage from './pages/TestimonialsPage';
import AssociationPage from './pages/AssociationPage';
import DonContactPage from './pages/DonContactPage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Fait défiler la page vers le haut à chaque navigation
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// Layout principal conditionnel (exclut le Header/Footer public sur /admin)
function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAdmin && <Header />}
      
      <Routes>
        {/* Routes Publiques Principales */}
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />

        <Route path="/adoption" element={<AdoptionPage />} />
        <Route path="/adoption.html" element={<AdoptionPage />} />

        <Route path="/chat/:id" element={<CatDetailPage />} />
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

        {/* Console Administration */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin.html" element={<AdminPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isAdmin && <Footer />}
      {!isAdmin && <BackToTop />}
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
