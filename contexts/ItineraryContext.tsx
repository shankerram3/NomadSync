import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ItineraryItem } from '../types';
import { INITIAL_USERS } from '../constants';
import { storageService } from '../services/storageService';

interface ItineraryContextType {
  items: ItineraryItem[];
  addItem: (item: ItineraryItem) => void;
  removeItem: (id: string) => void;
  vote: (itemId: string, userId: string) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }
  return context;
};

interface ItineraryProviderProps {
  children: ReactNode;
}

export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({ children }) => {
  // Load initial state from localStorage
  const [items, setItems] = useState<ItineraryItem[]>(() => {
    const saved = storageService.loadItinerary();
    return saved.length > 0 ? saved : [];
  });

  // Persist itinerary items to localStorage whenever they change
  useEffect(() => {
    storageService.saveItinerary(items);
  }, [items]);

  const addItem = (item: ItineraryItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const vote = (itemId: string, userId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const hasVoted = item.votes.includes(userId);
      return {
        ...item,
        votes: hasVoted 
          ? item.votes.filter(id => id !== userId) 
          : [...item.votes, userId]
      };
    }));
  };

  const value: ItineraryContextType = {
    items,
    addItem,
    removeItem,
    vote
  };

  return <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>;
};

