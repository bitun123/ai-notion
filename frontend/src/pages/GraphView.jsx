import React, { useState, useEffect } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { getGraphData, getLinks } from '../api';
import ItemDetailModal from '../components/modals/ItemDetailModal';

const GraphView = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getGraphData();
        setGraphData(data);
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNodeClick = async (node) => {
    try {
      // We need the full item for the modal
      const allLinks = await getLinks();
      const fullItem = allLinks.find(i => i._id === node.id);
      setSelectedItem(fullItem);
    } catch (err) {
      console.error('Failed to open details:', err);
    }
  };

  return (
    <div className="flex-1 pt-24 pb-20 px-6 md:px-10 max-w-6xl mx-auto w-full h-[calc(100vh-100px)]">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Knowledge Graph
        </h2>
        <p className="text-slate-500 font-medium">
          Visualize the semantic relationships between your saved items.
        </p>
      </header>

      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Mapping your second brain...</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-[600px]">
          <KnowledgeGraph data={graphData} onNodeClick={handleNodeClick} />
        </div>
      )}

      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
};

export default GraphView;
