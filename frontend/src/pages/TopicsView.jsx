import React, { useState, useEffect } from 'react';
import { getClusteredLinks, rebuildClusters } from '../api';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/modals/ItemDetailModal';
import { SkeletonList } from '../components/Skeleton';

const TopicsView = () => {
  const [clusters, setClusters] = useState({});
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const data = await getClusteredLinks();
      setClusters(data);
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRebuild = async () => {
    try {
      setRebuilding(true);
      await rebuildClusters();
      await fetchClusters();
    } catch (err) {
      console.error('Rebuild failed:', err);
      alert('Failed to rebuild topics.');
    } finally {
      setRebuilding(false);
    }
  };

  const topics = Object.keys(clusters);

  return (
    <main className="flex-1 pt-24 pb-20 px-6 md:px-10 max-w-5xl mx-auto w-full">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            AI Topic Clusters
          </h2>
          <p className="text-slate-500 font-medium">
            Items are automatically grouped by semantic similarity.
          </p>
        </div>
        
        <button 
          onClick={handleRebuild}
          disabled={rebuilding}
          className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 ${rebuilding ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {rebuilding ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Rebuilding...
            </>
          ) : (
            <>
              <span>🌈</span>
              Rebuild Topics
            </>
          )}
        </button>
      </header>

      {loading ? (
        <div className="space-y-12">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="h-8 w-48 bg-slate-100 rounded-lg mb-6 animate-pulse" />
              <SkeletonList />
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="space-y-16">
          {topics.map(topic => (
            <section key={topic} className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {topic}
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-bold">
                  {clusters[topic].length} items
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clusters[topic].map(item => (
                  <ItemCard 
                    key={item._id} 
                    item={item} 
                    onView={() => setSelectedItem(item)} 
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium mb-4">No topics generated yet.</p>
          <button onClick={handleRebuild} className="text-indigo-600 font-bold hover:underline">
            Run initial clustering now
          </button>
        </div>
      )}

      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </main>
  );
};

export default TopicsView;
