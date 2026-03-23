import React, { useState } from 'react';

const SaveInput = ({ onSave }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    await onSave(url);
    setUrl('');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <input
          type="url"
          placeholder="Paste a URL to save..."
          className="flex-1 px-4 py-2 outline-none text-slate-700 bg-transparent"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default SaveInput;
