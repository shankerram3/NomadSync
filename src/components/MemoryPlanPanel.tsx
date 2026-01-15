import { useState } from 'react';
import { Brain, Calendar, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface TripMemoryItem {
  value: string;
  confidence: number;
  sources: number[];
}

interface TripMemory {
  destination: TripMemoryItem;
  dates: TripMemoryItem;
  budget: TripMemoryItem;
  pace: TripMemoryItem;
  duration: TripMemoryItem;
}

interface MemoryPlanPanelProps {
  activeTab: 'memory' | 'plan';
  setActiveTab: (tab: 'memory' | 'plan') => void;
  tripMemory: TripMemory;
  planVersion: number;
  messages: any[];
}

export function MemoryPlanPanel({ activeTab, setActiveTab, tripMemory, planVersion, messages }: MemoryPlanPanelProps) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'memory'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-4 h-4" />
            Trip Memory
          </div>
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'plan'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Plan
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'memory' ? (
          <MemoryView tripMemory={tripMemory} />
        ) : (
          <PlanView planVersion={planVersion} />
        )}
      </div>
    </div>
  );
}

function MemoryView({ tripMemory }: { tripMemory: TripMemory }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (confidence: number) => {
    if (confidence >= 80) return <Check className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const memoryItems = [
    { label: 'Destination', key: 'destination' as const },
    { label: 'Dates', key: 'dates' as const },
    { label: 'Duration', key: 'duration' as const },
    { label: 'Budget', key: 'budget' as const },
    { label: 'Pace', key: 'pace' as const }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-1">What I Know</h3>
        <p className="text-xs text-gray-500">Extracted from your conversation</p>
      </div>

      {memoryItems.map(({ label, key }) => {
        const item = tripMemory[key];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getConfidenceColor(item.confidence)}`}>
                    {getStatusIcon(item.confidence)}
                    {item.confidence}%
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{item.value}</p>
              </div>
            </div>
            
            {/* Confidence Bar */}
            <div className="mb-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getConfidenceBarColor(item.confidence)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.confidence}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Source */}
            <button className="text-xs text-blue-600 hover:text-blue-700">
              View source ({item.sources.length} {item.sources.length === 1 ? 'message' : 'messages'})
            </button>
          </motion.div>
        );
      })}

      <div className="pt-4 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Confidence levels:</strong> Higher confidence means the information is confirmed or mentioned multiple times.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanView({ planVersion }: { planVersion: number }) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  const toggleDay = (day: number) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const itinerary = [
    {
      day: 1,
      title: 'Arrival in Tokyo',
      activities: [
        'Arrive at Narita Airport',
        'Check into hotel in Shibuya',
        'Evening stroll through Shibuya Crossing',
        'Dinner at local izakaya'
      ],
      cost: '$180'
    },
    {
      day: 2,
      title: 'Tokyo Highlights',
      activities: [
        'Visit Senso-ji Temple in Asakusa',
        'Explore Akihabara district',
        'Tokyo Skytree observation deck',
        'Ramen dinner in Shinjuku'
      ],
      cost: '$150'
    },
    {
      day: 3,
      title: 'Tokyo Culture',
      activities: [
        'Meiji Shrine and Yoyogi Park',
        'Harajuku shopping',
        'teamLab Borderless digital art museum',
        'Dinner in Roppongi'
      ],
      cost: '$200'
    },
    {
      day: 4,
      title: 'Travel to Kyoto',
      activities: [
        'Shinkansen to Kyoto (morning)',
        'Check into ryokan',
        'Fushimi Inari Shrine sunset visit',
        'Traditional kaiseki dinner'
      ],
      cost: '$280'
    },
    {
      day: 5,
      title: 'Kyoto Temples',
      activities: [
        'Kinkaku-ji (Golden Pavilion)',
        'Arashiyama Bamboo Grove',
        'Tenryu-ji Temple',
        'Gion district evening walk'
      ],
      cost: '$170'
    },
    {
      day: 6,
      title: 'Kyoto & Departure',
      activities: [
        'Kiyomizu-dera Temple',
        'Nishiki Market food tour',
        'Return to Tokyo for flight',
        'Departure'
      ],
      cost: '$220'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Version Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">6-Day Itinerary</h3>
          <p className="text-xs text-gray-500">Version {planVersion}</p>
        </div>
        <button className="text-xs text-blue-600 hover:text-blue-700">
          Compare versions
        </button>
      </div>

      {/* Budget Summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Estimated Total</span>
          <span className="text-lg font-semibold text-blue-600">$1,200</span>
        </div>
        <p className="text-xs text-gray-600">Per person, excluding flights</p>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Accommodation</span>
            <span>$600</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Activities</span>
            <span>$400</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Food & Transport</span>
            <span>$200</span>
          </div>
        </div>
      </div>

      {/* Day-by-Day Itinerary */}
      <div className="space-y-2">
        {itinerary.map((item) => (
          <div key={item.day} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDay(item.day)}
              className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {item.day}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.cost} estimated</p>
                </div>
              </div>
              {expandedDays.includes(item.day) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {expandedDays.includes(item.day) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-50 px-4 py-3 border-t border-gray-200"
              >
                <ul className="space-y-2">
                  {item.activities.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="pt-4 space-y-2">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Lock this plan
        </button>
        <button className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          Regenerate with changes
        </button>
      </div>
    </div>
  );
}
