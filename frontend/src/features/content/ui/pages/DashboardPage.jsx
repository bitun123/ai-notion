import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SaveInput from '../components/SaveInput';
import ItemList from '../components/ItemList';
import { SkeletonList } from '../../../../shared/ui/components/Skeleton';
import ItemDetailModal from '../modals/ItemDetailModal';
import { useContent } from '../../hooks/useContent';
import { useManageContent } from '../../hooks/useManageContent';
import { useContentState } from '../../state/ContentContext';
import { getCollections } from '../../api/contentApi';

const DashboardPage = ({ searchQuery, isSemanticSearch, setIsSearching, isSearching }) => {
  const { items, resurfacedItems, loading, error, filteredItems, setFilteredItems } = useContentState();
  const { fetchLinks } = useContent(null, searchQuery, isSemanticSearch); // Base fetch logic
  const { handleDelete, handleSaveLink } = useManageContent();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentCollection, setCurrentCollection] = useState(null);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const collectionId = queryParams.get('collection');

  // Specific collection fetching logic
  useEffect(() => {
    const fetchCollectionInfo = async () => {
      if (collectionId) {
        try {
          const collections = await getCollections();
          setCurrentCollection(collections.find(c => c._id === collectionId));
        } catch (err) {
          console.error("Error fetching collection info:", err);
        }
      } else {
        setCurrentCollection(null);
      }
    };
    fetchCollectionInfo();
  }, [collectionId]);

  // Re-run fetch when collectionId changes
  useEffect(() => {
    fetchLinks();
  }, [collectionId, fetchLinks]);

  const onSave = async (url) => {
    if (url) {
      const success = await handleSaveLink(url);
      if (!success) {
        alert('Failed to save the URL.');
      }
      // UI state updates natively via the hook!
    }
  };

  const onUpload = async (file) => {
    if (file) {
      const success = await handleUploadPdf(file);
      if (!success) {
        alert('Failed to upload PDF.');
      }
      return success;
    }
    return false;
  };

  const onDelete = async (id) => {
    const success = await handleDelete(id);
    if (!success) {
      alert('Failed to delete item. Please try again.');
    } else {
      if (selectedItem?._id === id) setSelectedItem(null);
    }
  };

  return (
    <main className="flex-1 pt-24 pb-20 px-6 md:px-10 max-w-5xl mx-auto w-full">
      <header className="mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {searchQuery ? (isSemanticSearch ? 'AI Search Results' : 'Search Results') : (currentCollection ? `Collection: ${currentCollection.name}` : 'All Links')}
        </h2>
        <p className="text-slate-500 font-medium">
          {isSearching ? 'AI is thinking...' : (searchQuery ? `Found ${filteredItems.length} items` : (currentCollection ? `This collection has ${items.length} items.` : `You have ${items.length} items saved in your second brain.`))}
        </p>
      </header>

      <SaveInput onSave={onSave} onUpload={onUpload} />
      
      {!searchQuery && resurfacedItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✨</span>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">You saved this earlier</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resurfacedItems.map(item => (
              <div 
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="group p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                <h4 className="font-bold text-slate-800 mb-2 line-clamp-1 relative z-10">{item.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 relative z-10">{item.content || 'No description available'}</p>
                <div className="mt-4 flex items-center text-[10px] font-bold text-indigo-600 uppercase tracking-widest relative z-10">
                  <span>{item.resurfaceReason || 'Recall Item'}</span>
                  <svg className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : (
        <ItemList items={filteredItems} onView={setSelectedItem} onDelete={onDelete} />
      )}

      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onDelete={onDelete}
        />
      )}

      {!loading && filteredItems.length === 0 && searchQuery && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mt-8">
          <p className="text-slate-500 font-medium">No links found matching "{searchQuery}"</p>
        </div>
      )}
    </main>
  );
};

export default DashboardPage;
