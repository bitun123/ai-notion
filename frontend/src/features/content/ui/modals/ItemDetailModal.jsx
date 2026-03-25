import React, { useState, useEffect, useRef } from 'react';
import { getCollections, addToCollection, getHighlights, createHighlight, deleteHighlight, getRelatedItems } from '../../api/contentApi';
import ItemCard from '../components/ItemCard';

const ItemDetailModal = ({ item, onClose, onDelete }) => {
  const [relatedItems, setRelatedItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selection, setSelection] = useState(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const data = await getRelatedItems(item._id);
        setRelatedItems(data);
      } catch (err) {
        console.error("Error fetching related items:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCollections = async () => {
      try {
        const data = await getCollections();
        setCollections(data);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    };

    const fetchHighlights = async () => {
      try {
        const data = await getHighlights(item._id);
        setHighlights(data);
      } catch (err) {
        console.error("Error fetching highlights:", err);
      }
    };

    if (item._id) {
      fetchRelated();
      fetchCollections();
      fetchHighlights();
    }
  }, [item._id]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel.toString().trim().length > 0) {
      setSelection(sel.toString().trim());
    } else {
      if (!showNoteInput) setSelection(null);
    }
  };

  const handleSaveHighlight = async () => {
    if (!selection) return;
    try {
      await createHighlight(item._id, selection, newNote);
      const updated = await getHighlights(item._id);
      setHighlights(updated);
      setSelection(null);
      setNewNote('');
      setShowNoteInput(false);
    } catch (err) {
      console.error('Failed to save highlight:', err);
    }
  };

  const handleDeleteHighlight = async (id) => {
    try {
      await deleteHighlight(id);
      setHighlights(highlights.filter(h => h._id !== id));
    } catch (err) {
      console.error('Failed to delete highlight:', err);
    }
  };

  const handleAddToCollection = async (collId) => {
    try {
      setIsAdding(true);
      await addToCollection(collId, item._id);
      setIsAdding(false);
      alert('Added to collection!');
    } catch (err) {
      console.error('Failed to add to collection:', err);
      alert('Failed to add to collection');
      setIsAdding(false);
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row">
        {/* Left Side: Main Content */}
        <div className="flex-1 p-8 md:p-10 border-r border-slate-100">
          <button 
            onClick={onClose}
            className="mb-8 p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all md:hidden"
          >
            ← Back to list
          </button>
          
          <div className="mb-6">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">
              Reference Note
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight mb-4">
              {item.title}
            </h2>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-indigo-600 transition-colors break-all font-mono"
            >
              {item.url}
            </a>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {item.tags?.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-lg border border-slate-200/50">
                {tag}
              </span>
            ))}
          </div>

          <div 
            className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 mb-8 relative group/content"
            onMouseUp={handleMouseUp}
            ref={contentRef}
          >
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              {item.type === 'image' ? 'Image Analysis' : item.type === 'pdf' ? 'Extracted PDF Text' : 'Extracted Content'}
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                {item.type || 'article'}
              </span>
            </h3>

            {item.type === 'image' && (
              <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full max-h-[400px] object-contain bg-white" 
                />
              </div>
            )}

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.content || "No content extracted for this item."}
              </p>
            </div>

            {selection && !showNoteInput && (
              <button
                onClick={() => setShowNoteInput(true)}
                className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-700 transition-all animate-in fade-in slide-in-from-top-2"
              >
                ✨ Highlight Segment
              </button>
            )}

            {showNoteInput && (
              <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm animate-in zoom-in-95">
                <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Adding note to: "{selection.substring(0, 40)}{selection.length > 40 ? '...' : ''}"</p>
                <textarea
                  autoFocus
                  className="w-full text-sm p-3 bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none min-h-[80px]"
                  placeholder="Tell me why this is important..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => { setShowNoteInput(false); setSelection(null); }} className="px-3 py-1.5 text-xs font-bold text-slate-400">Cancel</button>
                  <button onClick={handleSaveHighlight} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg">Save Note</button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-8 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              Highlights & Notes
              <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                {highlights.length}
              </span>
            </h3>
            
            <div className="space-y-4">
              {highlights.map(h => (
                <div key={h._id} className="group/h p-4 bg-slate-50/30 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-slate-800 italic border-l-2 border-indigo-400 pl-3 leading-relaxed">
                      "{h.highlightedText}"
                    </p>
                    <button 
                      onClick={() => handleDeleteHighlight(h._id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/h:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {h.note && (
                    <p className="text-xs text-slate-500 mt-3 font-medium bg-white p-2.5 rounded-xl border border-slate-100/50 shadow-sm">
                      {h.note}
                    </p>
                  )}
                </div>
              ))}
              {highlights.length === 0 && (
                <p className="text-xs text-slate-400 italic">Select text above to create your first highlight.</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Collections
            </h3>
            <div className="flex flex-wrap gap-2">
              {collections.map(coll => (
                <button
                  key={coll._id}
                  disabled={isAdding}
                  onClick={() => handleAddToCollection(coll._id)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
                >
                  <span>📁</span>
                  {coll.name}
                </button>
              ))}
              {collections.length === 0 && (
                <p className="text-xs text-slate-400 italic">No collections created yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Related Items */}
        <div className="w-full md:w-80 bg-slate-50/30 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              Related Items
            </h3>
            <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
              {relatedItems.length}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200/50" />
                ))}
              </div>
            ) : relatedItems.length > 0 ? (
              relatedItems.map(related => (
                <div 
                  key={related._id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600">
                    {related.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {new URL(related.url).hostname}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">✨</span>
                </div>
                <p className="text-xs text-slate-400">
                  No related items found yet.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-auto flex flex-col gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${item.title}"?`)) {
                    onDelete(item._id);
                    onClose();
                  }
                }}
                className="hidden md:flex w-full py-3 items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 text-sm font-bold rounded-2xl hover:bg-red-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Item
              </button>
            )}
            <button
              onClick={onClose}
              className="hidden md:block w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
