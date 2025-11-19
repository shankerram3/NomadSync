import React, { useState } from 'react';
import { ItineraryItem, User, ItineraryType } from '../types';
import { INITIAL_USERS } from '../constants';
import { MapPinIcon, PlusIcon, ThumbsUpIcon, ClockIcon, CalendarIcon, CheckCircleIcon, TrashIcon } from './Icons';

interface ItineraryBuilderProps {
  items: ItineraryItem[];
  onAddItem: (item: ItineraryItem) => void;
  onVote: (itemId: string, userId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({ items, onAddItem, onVote, onRemoveItem }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({
    type: 'activity',
    title: '',
    location: '',
    cost: 0
  });

  const users = INITIAL_USERS;
  const currentUser = users[0]; // Mock "You"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    const item: ItineraryItem = {
      id: Date.now().toString(),
      title: newItem.title!,
      location: newItem.location,
      type: newItem.type as ItineraryType || 'activity',
      cost: newItem.cost,
      startTime: newItem.startTime,
      suggestedBy: currentUser.id,
      votes: [currentUser.id],
      isSuggestion: !newItem.startTime, // If no time, it's a suggestion
    };

    onAddItem(item);
    setNewItem({ type: 'activity', title: '', location: '', cost: 0 });
    setIsAdding(false);
  };

  const suggestions = items.filter(i => i.isSuggestion);
  const scheduled = items.filter(i => !i.isSuggestion).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Trip Itinerary</h1>
                <p className="text-slate-500 text-sm">Vote on ideas and build your schedule together.</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
                <PlusIcon className="w-5 h-5" /> Add Event
            </button>
        </div>

        {/* Add Form */}
        {isAdding && (
             <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4">
                <h3 className="font-semibold text-slate-800 mb-4">Add New Event or Suggestion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                        <input 
                            type="text" 
                            required
                            value={newItem.title}
                            onChange={e => setNewItem({...newItem, title: e.target.value})}
                            className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Visit Louvre Museum"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Location (Optional)</label>
                        <input 
                            type="text" 
                            value={newItem.location}
                            onChange={e => setNewItem({...newItem, location: e.target.value})}
                            className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Rue de Rivoli"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                        <select 
                            value={newItem.type}
                            onChange={e => setNewItem({...newItem, type: e.target.value as ItineraryType})}
                            className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none"
                        >
                            <option value="activity">Activity</option>
                            <option value="food">Food & Drink</option>
                            <option value="lodging">Lodging</option>
                            <option value="travel">Travel</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Time (Leave empty for Suggestion)</label>
                        <input 
                            type="datetime-local" 
                            value={newItem.startTime || ''}
                            onChange={e => setNewItem({...newItem, startTime: e.target.value})}
                            className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none text-slate-600"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Add Item</button>
                </div>
             </form>
        )}

        {/* Timeline / Scheduled Items */}
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                Schedule
            </h2>
            {scheduled.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <p className="text-slate-400 text-sm">No confirmed events yet. Move items from suggestions or add new ones!</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pl-8 py-2">
                    {scheduled.map(item => (
                        <div key={item.id} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="absolute -left-[41px] top-4 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 mb-1">{item.type}</span>
                                    <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" />
                                            {new Date(item.startTime!).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {item.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {item.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Suggestions Area */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                <div className="w-5 h-5 flex items-center justify-center rounded bg-purple-100 text-purple-600">
                   <ThumbsUpIcon className="w-3 h-3" />
                </div>
                Community Suggestions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions.map(item => {
                    const suggester = users.find(u => u.id === item.suggestedBy);
                    return (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="mb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 leading-tight">{item.title}</h4>
                                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Map ↗</a>}
                                </div>
                                {item.location && <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><MapPinIcon className="w-3 h-3" /> {item.location}</p>}
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full ${suggester?.avatarColor} text-[10px] flex items-center justify-center text-white`}>
                                        {suggester?.name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-slate-400">suggested by {suggester?.name}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                                <button 
                                    onClick={() => onVote(item.id, currentUser.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${item.votes.includes(currentUser.id) ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <ThumbsUpIcon className="w-3 h-3" />
                                    {item.votes.length}
                                </button>
                                <button 
                                    onClick={() => {
                                        // Quick confirm: Just add a default time for now or open edit
                                        // For demo, we just flip isSuggestion
                                        const updated = { ...item, isSuggestion: false, startTime: new Date().toISOString() };
                                        onRemoveItem(item.id); // Remove old
                                        onAddItem(updated); // Add new
                                    }}
                                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    );
                })}
                {suggestions.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-100">
                        No suggestions yet. Chat with NomadSync to find places!
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};