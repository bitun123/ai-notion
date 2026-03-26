import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './features/layout/ui/components/Sidebar';
import Navbar from './features/layout/ui/components/Navbar';
import DashboardPage from './features/content/ui/pages/DashboardPage';
import GraphPage from './features/graph/ui/pages/GraphPage';
import TopicsPage from './features/topics/ui/pages/TopicsPage';
import ChatPage from './features/chat/ui/pages/ChatPage';
import { ContentProvider } from './features/content/state/ContentContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);


  return (
    <ContentProvider>
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
                <DashboardPage 
                  searchQuery={searchQuery}
                  isSemanticSearch={isSemanticSearch}
                  isSearching={isSearching}
                  setIsSearching={setIsSearching}
                />
              } />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/ask" element={<ChatPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ContentProvider>
  );
}

export default App;
