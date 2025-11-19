import React from 'react';
import { GroundingChunk } from '../types';
import { MapPinIcon, PlusIcon } from './Icons';

interface PlaceCardProps {
  chunk: GroundingChunk;
  onAddToItinerary?: (title: string, uri: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ chunk, onAddToItinerary }) => {
  if (!chunk.maps) return null;

  const { title, uri, placeAnswerSources } = chunk.maps;
  const snippet = placeAnswerSources?.[0]?.reviewSnippets?.[0]?.content;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToItinerary) {
        onAddToItinerary(title, uri);
    }
  };

  return (
    <div className="block w-full sm:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden group relative flex flex-col">
      <a href={uri} target="_blank" rel="noopener noreferrer" className="block flex-1">
        <div className="h-2 bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
        <div className="p-4">
            <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-slate-900 leading-tight line-clamp-2 pr-6">{title}</h4>
            <MapPinIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            </div>
            {snippet && (
            <p className="text-xs text-slate-500 italic line-clamp-3 mb-3">
                "{snippet}"
            </p>
            )}
            <div className="flex items-center text-xs font-medium text-blue-600 mt-auto">
            View on Google Maps &rarr;
            </div>
        </div>
      </a>
      
      {/* Add Action */}
      {onAddToItinerary && (
          <button 
            onClick={handleAddClick}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all z-10"
            title="Add to Itinerary Suggestions"
          >
              <PlusIcon className="w-4 h-4" />
          </button>
      )}
    </div>
  );
};