import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
import TopicsView from './pages/TopicsView';
import AskView from './pages/AskView';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
          <Navbar 
            onSearch={setSearchQuery} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSemantic={isSemanticSearch}
            onSemanticToggle={setIsSemanticSearch}
          />
          
          <Routes>
            <Route path="/" element={
              <Dashboard 
                searchQuery={searchQuery}
                isSemanticSearch={isSemanticSearch}
                isSearching={isSearching}
                setIsSearching={setIsSearching}
                filteredItems={filteredItems}
                setFilteredItems={setFilteredItems}
              />
            } />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/topics" element={<TopicsView />} />
            <Route path="/ask" element={<AskView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
