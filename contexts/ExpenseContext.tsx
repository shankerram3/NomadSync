import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense } from '../types';
import { INITIAL_USERS } from '../constants';
import { storageService } from '../services/storageService';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

interface ExpenseProviderProps {
  children: ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  // Load expenses from localStorage
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = storageService.loadExpenses();
    return saved.length > 0 ? saved : [];
  });

  // Persist expenses to localStorage whenever they change
  useEffect(() => {
    storageService.saveExpenses(expenses);
  }, [expenses]);

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const value: ExpenseContextType = {
    expenses,
    addExpense,
    removeExpense
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

