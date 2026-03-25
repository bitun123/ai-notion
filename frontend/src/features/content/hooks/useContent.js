import { useEffect, useCallback } from 'react';
import { getLinks, getResurfacedItems, getCollectionLinks, searchLinks } from '../api/contentApi';
import { useContentState } from '../state/ContentContext';

export const useContent = (collectionId, searchQuery, isSemanticSearch) => {
  const {
    items, setItems,
    setFilteredItems,
    setResurfacedItems,
    setLoading,
    setError,
    setIsSearching
  } = useContentState();

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      let linksData;
      if (collectionId) {
        linksData = await getCollectionLinks(collectionId);
      } else {
        linksData = await getLinks();
      }
      
      const resurfacedData = await getResurfacedItems();
      
      setItems(linksData);
      setResurfacedItems(resurfacedData);
      if (!searchQuery) setFilteredItems(linksData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch links:', err);
      setError('Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  }, [collectionId, searchQuery, setItems, setFilteredItems, setResurfacedItems, setLoading, setError]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    if (isSemanticSearch && searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          setIsSearching(true);
          const results = await searchLinks(searchQuery);
          setFilteredItems(results);
        } catch (err) {
          console.error('Semantic search failed:', err);
        } finally {
          setIsSearching(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      const results = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(results);
    }
  }, [searchQuery, items, isSemanticSearch, setIsSearching, setFilteredItems]);

  return { fetchLinks };
};
