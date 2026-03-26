import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getCollections, createCollection } from '../../../content/api/contentApi';

const Sidebar = ({ isOpen, onClose }) => {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const location = useLocation();

  const fetchCollections = async () => {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection(newCollectionName);
      setNewCollectionName('');
      setIsCreating(false);
      fetchCollections();
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };
  const sections = [
    { name: 'Dashboard', icon: '🏠', path: '/' },
    { name: 'Ask Your Brain', icon: '✨', path: '/ask' },
    { name: 'Knowledge Graph', icon: '🕸️', path: '/graph' },
    { name: 'Topics', icon: '🌈', path: '/topics' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-4 z-50 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-200/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          B
        </div>
        <span className="font-bold text-slate-800 tracking-tight text-lg">SecondBrain</span>
      </div>

      <nav className="flex-1">
        <div className="space-y-1">
          {sections.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-slate-200/50 text-indigo-600 shadow-sm border border-slate-200/30' 
                  : 'text-slate-500 hover:bg-slate-200/30 hover:text-slate-800'}
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Collections
            </h3>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="text-slate-400 hover:text-indigo-600 transition-colors"
              title="Create Collection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateCollection} className="px-3 mb-3">
              <input
                autoFocus
                type="text"
                placeholder="Name..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </form>
          )}

          <div className="space-y-1">
            {collections.map(coll => (
              <NavLink
                key={coll._id}
                to={`/?collection=${coll._id}`}
                onClick={onClose}
                className={({ isActive }) => `
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                  ${location.search === `?collection=${coll._id}`
                    ? 'bg-slate-200/50 text-indigo-600 font-bold border border-slate-200/30' 
                    : 'text-slate-500 hover:bg-slate-200/30 hover:text-slate-800 font-medium'}
                `}
              >
                <span>📁</span>
                <span className="truncate">{coll.name}</span>
              </NavLink>
            ))}
            
            {collections.length === 0 && !isCreating && (
              <p className="px-3 text-[10px] text-slate-400 italic">No collections yet</p>
            )}
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-200/30 transition-all">
          <span>⚙️</span>
          Settings
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
