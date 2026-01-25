import { Users, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../services/trips';
import { TripMemory } from '../services/memory';

interface TripSidebarProps {
  isAgentThinking: boolean;
  trip?: Trip | null;
  tripMemory?: TripMemory | null;
}

function calculateReadiness(trip: Trip | null | undefined, tripMemory: TripMemory | null | undefined): number {
  if (!trip) return 0;
  
  let score = 0;
  const checks = 10; // Total number of checks
  
  // Basic trip info (20 points)
  if (trip.title) score += 5;
  if (trip.destination) score += 5;
  if (trip.dates?.start) score += 5;
  if (trip.dates?.end) score += 5;
  
  // Memory completeness (50 points)
  if (tripMemory) {
    if (tripMemory.destination?.value) score += 10;
    if (tripMemory.dates?.value) score += 10;
    if (tripMemory.budget?.value) score += 10;
    if (tripMemory.duration?.value) score += 10;
    if (tripMemory.pace?.value) score += 10;
  }
  
  // Status (20 points)
  if (trip.status === 'planned') score += 15;
  else if (trip.status === 'booked') score += 20;
  else if (trip.status === 'draft') score += 5;
  
  // Members (10 points)
  if (trip.members && trip.members.length > 1) score += 10;
  
  return Math.min(100, Math.round((score / checks) * 10));
}

export function TripSidebar({ isAgentThinking, trip, tripMemory }: TripSidebarProps) {
  const navigate = useNavigate();
  
  const readiness = calculateReadiness(trip, tripMemory);
  const tripTitle = trip?.title || 'Untitled Trip';
  const tripStatus = trip?.status || 'draft';
  const members = trip?.members || [];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Trip Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/trips')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Back to trips"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className={`px-2 py-1 text-xs rounded-full ${
            tripStatus === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            tripStatus === 'planned' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}
          </span>
        </div>
        <h1 className="mb-4">{tripTitle}</h1>
        
        {/* Readiness Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Trip readiness</span>
            <span className="text-sm font-medium text-gray-900">{readiness}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Travelers</span>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <UserPlus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-2">
          {members.length > 0 ? (
            members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                    {member.userId.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700">User {member.userId.slice(0, 8)}</span>
                  <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No members yet</p>
          )}
        </div>
      </div>

      {/* Activity Indicator */}
      {isAgentThinking && (
        <motion.div 
          className="p-4 bg-blue-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Agent updating plan…</span>
          </div>
        </motion.div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Plan updates as you chat
        </p>
      </div>
    </div>
  );
}
