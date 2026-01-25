import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Plane, Calendar, Users, MessageCircle, Search, LogOut, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { tripsService, Trip } from '../services/trips';
import { messagesService } from '../services/messages';

interface TripWithExtras extends Trip {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  image?: string;
}

export function TripsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<TripWithExtras[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const fetchedTrips = await tripsService.getAll();
      
      // Fetch last message for each trip
      const tripsWithMessages = await Promise.all(
        fetchedTrips.map(async (trip) => {
          try {
            const messages = await messagesService.getByTrip(trip.id, 1);
            const lastMessage = messages[messages.length - 1];
            return {
              ...trip,
              lastMessage: lastMessage?.content || '',
              lastMessageTime: lastMessage ? formatTime(lastMessage.created_at) : '',
              unreadCount: 0, // TODO: Implement unread count
              image: trip.cover_image || `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop`,
            };
          } catch {
            return {
              ...trip,
              lastMessage: '',
              lastMessageTime: '',
              unreadCount: 0,
              image: trip.cover_image || `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop`,
            };
          }
        })
      );
      
      setTrips(tripsWithMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDates = (dates?: { start?: string; end?: string }) => {
    if (!dates?.start) return '';
    const start = new Date(dates.start);
    const end = dates.end ? new Date(dates.end) : null;
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (end) {
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    return startStr;
  };


  const filteredTrips = trips.filter(trip =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trip.destination && trip.destination.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTripClick = (tripId: string) => {
    navigate(`/trip/${tripId}`);
  };

  const handleNewTrip = async () => {
    try {
      const newTrip = await tripsService.create({
        title: 'New Trip',
        destination: '',
        status: 'draft',
      });
      navigate(`/trip/${newTrip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'planned': return 'bg-blue-100 text-blue-700';
      case 'booked': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-gray-900">TripPlan AI</h1>
                <p className="text-xs text-gray-500">Your collaborative trips</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Actions */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trips..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleNewTrip}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Plane className="w-5 h-5" />}
            label="Total Trips"
            value={trips.length.toString()}
            color="blue"
          />
          <StatCard
            icon={<MessageCircle className="w-5 h-5" />}
            label="Active Chats"
            value={trips.filter(t => t.status === 'draft' || t.status === 'planned').length.toString()}
            color="green"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Upcoming"
            value={trips.filter(t => {
              if (!t.dates?.start) return false;
              return new Date(t.dates.start) > new Date();
            }).length.toString()}
            color="purple"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Collaborators"
            value={trips.reduce((acc, t) => acc + (t.members?.length || 0), 0).toString()}
            color="orange"
          />
        </div>

        {/* Trips Grid */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Your Trips</h2>
          <p className="text-sm text-gray-500">Click on a trip to continue planning</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading trips...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <TripCard trip={trip} onClick={() => handleTripClick(trip.id)} />
              </motion.div>
            ))}
            {filteredTrips.length === 0 && !isLoading && (
              <div className="text-center py-12 col-span-full">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                <p className="text-sm text-gray-500 mb-6">Try adjusting your search or create a new trip</p>
                <button
                  onClick={handleNewTrip}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Your First Trip
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, onClick }: { trip: TripWithExtras; onClick: () => void }) {
  const formatDates = (dates?: { start?: string; end?: string }) => {
    if (!dates?.start) return '';
    const start = new Date(dates.start);
    const end = dates.end ? new Date(dates.end) : null;
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (end) {
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    return startStr;
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 text-left group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={trip.image || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {(trip.unreadCount || 0) > 0 && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
            {trip.unreadCount}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${trip.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : trip.status === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {getStatusText(trip.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1">{trip.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{trip.destination || 'No destination set'}</p>

        {trip.dates && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            {formatDates(trip.dates)}
          </div>
        )}

        {/* Readiness Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Trip readiness</span>
            <span className="text-xs font-medium text-gray-900">{trip.readiness}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${trip.readiness >= 80 ? 'bg-green-500' : trip.readiness >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ width: `${trip.readiness}%` }}
            />
          </div>
        </div>

        {/* Members */}
        {trip.members && trip.members.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex -space-x-2">
              {trip.members.slice(0, 4).map((member, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium text-blue-700"
                  title={`User ${member.userId}`}
                >
                  {member.userId.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {trip.members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{trip.members.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Message */}
        {trip.lastMessage && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 truncate mb-1">{trip.lastMessage}</p>
            {trip.lastMessageTime && (
              <p className="text-xs text-gray-400">{trip.lastMessageTime}</p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function getStatusText(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
