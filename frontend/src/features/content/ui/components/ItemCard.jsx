import React from 'react';

const TYPE_CONFIG = {
  pdf:   { icon: '📄', badge: 'bg-red-50 text-red-600 border-red-100' },
  image: { icon: '🖼️', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  video: { icon: '🎬', badge: 'bg-purple-50 text-purple-600 border-purple-100' },
  article: { icon: '📝', badge: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
};

const ItemCard = ({ item, onView, onDelete }) => {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.article;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      onDelete?.(item._id);
    }
  };

  return (
    <div className="group bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-indigo-50 transition-colors">
          {cfg.icon}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.badge}`}>
            {item.type || 'article'}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {/* View */}
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(item); }}
              title="View details"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            {/* Delete */}
            <button
              onClick={handleDelete}
              title="Delete"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {item.type === 'image' && (
        <div className="mb-4 aspect-video w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => e.target.src = 'https://via.placeholder.com/400x225?text=Image+Preview'}
          />
        </div>
      )}

      {item.type === 'video' && (
        <div className="mb-4 aspect-video w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-900 flex items-center justify-center">
          <span className="text-4xl">▶️</span>
        </div>
      )}

      <h3 className="text-base font-bold text-slate-800 mb-1 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
        {item.title}
      </h3>

      {item.content && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed font-medium">
          {item.content}
        </p>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mb-6 truncate font-mono">
        {item.url?.startsWith('upload://') ? `📎 ${decodeURIComponent(item.url.split('/').pop().split('_')[0])}` : item.url}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        {item.url?.startsWith('upload://') ? (
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">📎 Uploaded</span>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            Visit Site
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
