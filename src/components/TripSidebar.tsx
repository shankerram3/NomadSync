import { Users, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TripSidebarProps {
  isAgentThinking: boolean;
}

export function TripSidebar({ isAgentThinking }: TripSidebarProps) {
  const navigate = useNavigate();
  const members = [
    { name: 'Sarah', avatar: '👩', online: true },
    { name: 'Mike', avatar: '👨', online: true },
    { name: 'You', avatar: '😊', online: true }
  ];

  const readiness = 68;

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
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
            Draft
          </span>
        </div>
        <h1 className="mb-4">Japan Adventure</h1>
        
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
          {members.map((member) => (
            <div key={member.name} className="flex items-center gap-3">
              <div className="relative">
                <span className="text-2xl">{member.avatar}</span>
                {member.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <span className="text-sm text-gray-700">{member.name}</span>
            </div>
          ))}
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
