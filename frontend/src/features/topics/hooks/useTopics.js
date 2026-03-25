import { useState, useEffect, useCallback } from 'react';
import { getClusteredLinks, rebuildClusters } from '../../content/api/contentApi';

export const useTopics = () => {
  const [clusters, setClusters] = useState({});
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState(null);

  const fetchClusters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClusteredLinks();
      setClusters(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
      setError('Failed to load topic clusters.');
    } finally {
      setLoading(false);
    }
  }, []);

  const rebuild = useCallback(async () => {
    try {
      setRebuilding(true);
      await rebuildClusters();
      await fetchClusters();
      return true;
    } catch (err) {
      console.error('Rebuild failed:', err);
      setError('Failed to rebuild topics.');
      return false;
    } finally {
      setRebuilding(false);
    }
  }, [fetchClusters]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  return { clusters, loading, rebuilding, error, fetchClusters, rebuild };
};
