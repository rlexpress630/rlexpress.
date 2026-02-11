import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveryContextType {
  deliveries: Delivery[];
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  completeDelivery: (id: string, proof: Delivery['proof']) => void;
  removeDelivery: (id: string) => void;
  cancelDelivery: (id: string) => void;
  clearPendingDeliveries: () => void;
  reorderPendingDeliveries: (orderedPending: Delivery[]) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem('rl_deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('rl_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('rl_deliveries', JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem('rl_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addDelivery = (delivery: Delivery) => {
    setDeliveries(prev => [delivery, ...prev]);
  };

  const updateDelivery = (id: string, updates: Partial<Delivery>) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const completeDelivery = (id: string, proof: Delivery['proof']) => {
    setDeliveries(prev => prev.map(d => d.id === id ? {
      ...d,
      status: DeliveryStatus.COMPLETED,
      completedAt: Date.now(),
      proof
    } : d));
  };

  const removeDelivery = (id: string) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
  };

  const cancelDelivery = (id: string) => {
    setDeliveries(prev => prev.map(d => d.id === id ? {
      ...d,
      status: DeliveryStatus.CANCELED,
      // We don't set completedAt for canceled deliveries
    } : d));
  };

  const clearPendingDeliveries = () => {
    setDeliveries(prev => prev.filter(d => d.status !== DeliveryStatus.PENDING));
  };

  const reorderPendingDeliveries = (orderedPending: Delivery[]) => {
    setDeliveries(prev => {
      const nonPending = prev.filter(d => d.status !== DeliveryStatus.PENDING);
      return [...orderedPending, ...nonPending];
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <DeliveryContext.Provider value={{
      deliveries,
      addDelivery,
      updateDelivery,
      completeDelivery,
      removeDelivery,
      cancelDelivery,
      clearPendingDeliveries,
      reorderPendingDeliveries,
      toggleTheme,
      isDarkMode
    }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};