import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';

const ChatPage = () => {
  const [question, setQuestion] = useState('');
  const { answer, sources, loading, error, ask } = useChat();

  const handleAsk = async (e) => {
    e.preventDefault();
    await ask(question);
  };

  return (
    <main className="flex-1 pt-24 pb-20 px-6 md:px-10 max-w-3xl mx-auto w-full">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Ask Your Brain</h2>
        <p className="text-slate-500 font-medium">Ask anything — AI will answer using your saved knowledge.</p>
      </header>

      <form onSubmit={handleAsk} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do I know about React state management?"
            className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 text-sm flex items-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Thinking...</>
            ) : '✨ Ask'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm mb-6">{error}</div>
      )}

      {answer && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">AI Answer</p>
            <p className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap">{answer}</p>
          </div>

          {sources.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sources from your brain</p>
              <div className="space-y-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-300 transition-all group"
                  >
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 line-clamp-1">{src.title}</span>
                    <svg className="w-3 h-3 ml-auto text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!answer && !loading && (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-4xl mb-4">🧠</p>
          <p className="text-slate-500 font-medium">Your brain is ready. Ask it anything!</p>
          <p className="text-slate-400 text-sm mt-2">Answers are grounded in your saved articles and notes.</p>
        </div>
      )}
    </main>
  );
};

export default ChatPage;
