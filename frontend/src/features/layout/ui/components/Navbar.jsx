import React from 'react';

const Navbar = ({ onSearch, onToggleSidebar, onSemanticToggle, isSemantic }) => {
  return (
    <nav className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 z-30 transition-all">
      <div className="max-w-5xl mx-auto h-full px-4 md:px-6 flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 md:hidden text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search your links... (Ctrl+K)"
            className="w-full bg-slate-100/50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Semantic Search Toggle */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-xl border border-slate-200/30">
          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isSemantic ? 'text-indigo-600' : 'text-slate-400'}`}>
            AI Search
          </span>
          <button 
            onClick={() => onSemanticToggle(!isSemantic)}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${isSemantic ? 'bg-indigo-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${isSemantic ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            JD
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
