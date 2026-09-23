import React, { createContext, useContext, useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'chat_lheureux_favs';

const FavoritesContext = createContext({
  favorites: [],
  favoritesCount: 0,
  isFavorite: () => false,
  toggleFavorite: () => {}
});

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn("Impossible d'écrire les favoris dans localStorage :", e);
    }
  }, [favorites]);

  const isFavorite = (catId) => favorites.includes(catId);

  const toggleFavorite = (catId) => {
    let isAdding = false;
    setFavorites((prev) => {
      if (prev.includes(catId)) {
        isAdding = false;
        return prev.filter((id) => id !== catId);
      } else {
        isAdding = true;
        return [...prev, catId];
      }
    });
    return isAdding;
  };

  return (
    <FavoritesContext.Provider 
      value={{ 
        favorites, 
        favoritesCount: favorites.length, 
        isFavorite, 
        toggleFavorite 
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
