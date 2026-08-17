import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import { fetchDashboardData } from './api';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState('onion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardData(selectedCommodity);
        if (data.error) {
           setError(data.error);
        } else {
           setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCommodity]);

  return (
    <div className="flex min-h-screen bg-krishi-bg font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopBar selectedCommodity={selectedCommodity} onCommodityChange={setSelectedCommodity} />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="p-8 flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d00] mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Initializing Intelligence...</p>
             </div>
          ) : (
            <>
              {error && (
                <div className="bg-orange-50 border-b border-orange-100 text-orange-800 px-6 py-2 text-xs font-bold flex justify-between items-center">
                  <span>⚠️ Backend Connection Failed: Showing offline simulation data.</span>
                  <span className="opacity-75">{error}</span>
                </div>
              )}
              <Dashboard data={dashboardData || {}} selectedCommodity={selectedCommodity} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
