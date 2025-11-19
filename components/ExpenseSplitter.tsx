import React, { useState, useMemo } from 'react';
import { User, Expense } from '../types';
import { INITIAL_USERS } from '../constants';
import { PlusIcon, TrashIcon, DollarSignIcon } from './Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const ExpenseSplitter: React.FC = () => {
  const users = INITIAL_USERS;
  
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 'e1',
      payerId: 'u1',
      amount: 120.50,
      description: 'Dinner at Mario\'s',
      date: new Date().toISOString(),
      involvedUserIds: ['u1', 'u2', 'u3', 'u4']
    },
    {
      id: 'e2',
      payerId: 'u2',
      amount: 45.00,
      description: 'Uber to Hotel',
      date: new Date().toISOString(),
      involvedUserIds: ['u1', 'u2', 'u3', 'u4']
    }
  ]);

  const [newExpense, setNewExpense] = useState<{
    description: string;
    amount: string;
    payerId: string;
    involvedUserIds: string[];
  }>({ 
    description: '', 
    amount: '', 
    payerId: 'u1',
    involvedUserIds: users.map(u => u.id) 
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || newExpense.involvedUserIds.length === 0) return;

    const expense: Expense = {
      id: Date.now().toString(),
      payerId: newExpense.payerId,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      date: new Date().toISOString(),
      involvedUserIds: newExpense.involvedUserIds
    };

    setExpenses([...expenses, expense]);
    setNewExpense({ 
      description: '', 
      amount: '', 
      payerId: 'u1', 
      involvedUserIds: users.map(u => u.id)
    });
    setIsAdding(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const toggleUserInvolvement = (userId: string) => {
    setNewExpense(prev => {
      const isIncluded = prev.involvedUserIds.includes(userId);
      if (isIncluded) {
        return { ...prev, involvedUserIds: prev.involvedUserIds.filter(id => id !== userId) };
      } else {
        return { ...prev, involvedUserIds: [...prev.involvedUserIds, userId] };
      }
    });
  };

  // Settlement Calculation
  const balances = useMemo(() => {
    const bal: Record<string, number> = {};
    users.forEach(u => bal[u.id] = 0);

    expenses.forEach(exp => {
      const paidBy = exp.payerId;
      const amount = exp.amount;
      const splitCount = exp.involvedUserIds.length;
      if (splitCount > 0) {
        const splitAmount = amount / splitCount;

        // Payer gets positive credit for the amount they paid on behalf of OTHERS
        // But it's easier to think: Payer +amount, everyone involved -share
        
        // 1. Payer paid the full amount
        bal[paidBy] += amount;

        // 2. Everyone involved (including payer if they partook) subtracts their share
        exp.involvedUserIds.forEach(uid => {
          bal[uid] -= splitAmount;
        });
      }
    });
    return bal;
  }, [expenses, users]);

  // Data for Chart
  const chartData = users.map(u => ({
    name: u.name,
    value: Math.abs(balances[u.id]),
    actualBalance: balances[u.id],
    color: u.avatarColor.replace('bg-', 'text-').replace('-500', '')
  }));

  const getColor = (className: string) => {
    if (className.includes('blue')) return '#3b82f6';
    if (className.includes('green')) return '#22c55e';
    if (className.includes('purple')) return '#a855f7';
    if (className.includes('orange')) return '#f97316';
    return '#64748b';
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSignIcon className="w-5 h-5 text-blue-500" />
              Net Balances
            </h2>
            <div className="space-y-3">
              {users.map(user => {
                const bal = balances[user.id];
                const isOwed = bal > 0.01;
                const owes = bal < -0.01;
                return (
                  <div key={user.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700">{user.name}</span>
                    </div>
                    <div className={`font-semibold ${isOwed ? 'text-green-600' : owes ? 'text-red-500' : 'text-slate-400'}`}>
                      {isOwed ? `gets back $${bal.toFixed(2)}` : owes ? `owes $${Math.abs(bal).toFixed(2)}` : 'settled'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative">
             <h3 className="absolute top-4 left-6 text-sm font-semibold text-slate-500">Debt Visualization</h3>
             <div className="w-full h-40 mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     dataKey="value"
                     innerRadius={40}
                     outerRadius={60}
                     paddingAngle={5}
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={getColor(INITIAL_USERS[index].avatarColor)} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <p className="text-xs text-slate-400 mt-2">Total Trip Cost: ${expenses.reduce((a,b) => a + b.amount, 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Expenses</h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" /> Add Expense
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddExpense} className="p-4 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <input 
                      type="text" 
                      required
                      value={newExpense.description}
                      onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                      className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                      placeholder="e.g. Car Rental"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-slate-400">$</span>
                      <input 
                        type="number" 
                        required
                        min="0.01" 
                        step="0.01"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                        className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500 pl-5 p-2"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Paid By</label>
                    <select 
                      value={newExpense.payerId}
                      onChange={e => setNewExpense({...newExpense, payerId: e.target.value})}
                      className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500 p-2 bg-white"
                    >
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Splitting Between</label>
                    <div className="flex gap-2 flex-wrap">
                      {users.map(u => {
                        const isSelected = newExpense.involvedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUserInvolvement(u.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 
                              ${isSelected 
                                ? `${u.avatarColor} text-white border-transparent ring-2 ring-offset-1 ring-blue-200` 
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            title={u.name}
                          >
                            {u.name.charAt(0)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                  Add Expense
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No expenses added yet.</div>
            ) : (
              expenses.slice().reverse().map(expense => {
                const payer = users.find(u => u.id === expense.payerId);
                return (
                  <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${payer?.avatarColor || 'bg-gray-300'} flex items-center justify-center text-white font-bold shadow-sm`}>
                        {payer?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{expense.description}</p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">{payer?.name}</span> paid ${expense.amount.toFixed(2)} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                        <div className="flex -space-x-1 mt-1">
                           {expense.involvedUserIds.map(uid => {
                             const u = users.find(user => user.id === uid);
                             if (!u) return null;
                             return (
                               <div key={uid} className={`w-4 h-4 rounded-full ${u.avatarColor} border border-white`} title={u.name} />
                             )
                           })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">${expense.amount.toFixed(2)}</span>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};