import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DeliveryProvider } from './context/DeliveryContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddDelivery from './pages/AddDelivery';
import ActiveDeliveries from './pages/ActiveDeliveries';
import ProofOfDelivery from './pages/ProofOfDelivery';
import History from './pages/History';
import Settings from './pages/Settings';
import FullMapView from './pages/FullMapView';

const App = () => {
  return (
    <DeliveryProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="active" element={<ActiveDeliveries />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Full screen routes (no bottom nav) */}
          <Route path="/add" element={
            <div className="h-screen bg-gray-50 dark:bg-dark-bg max-w-md mx-auto shadow-2xl overflow-hidden">
              <AddDelivery />
            </div>
          } />
          <Route path="/proof/:id" element={
            <div className="h-screen bg-gray-50 dark:bg-dark-bg max-w-md mx-auto shadow-2xl overflow-hidden">
              <ProofOfDelivery />
            </div>
          } />
          <Route path="/map" element={
            <div className="h-screen bg-gray-50 dark:bg-dark-bg max-w-md mx-auto shadow-2xl overflow-hidden">
              <FullMapView />
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DeliveryProvider>
  );
};

export default App;