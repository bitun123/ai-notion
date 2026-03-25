import React, { createContext, useContext, useState, useCallback } from 'react';

const ContentContext = createContext();

export const ContentProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [resurfacedItems, setResurfacedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const value = {
    items,
    setItems,
    filteredItems,
    setFilteredItems,
    resurfacedItems,
    setResurfacedItems,
    loading,
    setLoading,
    error,
    setError,
    isSearching,
    setIsSearching,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export const useContentState = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentState must be used within a ContentProvider');
  }
  return context;
};
