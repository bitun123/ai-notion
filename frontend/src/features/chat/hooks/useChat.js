import { useState, useCallback } from 'react';
import { askQuestion } from '../api/chatApi';

export const useChat = () => {
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback(async (question) => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    setError(null);
    try {
      const result = await askQuestion(question);
      setAnswer(result.answer);
      setSources(result.sources || []);
      return result;
    } catch (err) {
      setError('Could not connect to AI. Make sure the backend is running and MISTRAL_API_KEY is set.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { answer, sources, loading, error, ask };
};
