import { useState, useEffect, useCallback } from 'react';
import { getGraphData } from '../api/graphApi';

export const useGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGraphData();
      setGraphData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
      setError('Failed to load graph data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  return { graphData, loading, error, fetchGraphData };
};
