import { Plane, Clock, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FlightInfo {
  airline: string;
  departure: {
    date: string;
    time: string;
  };
  arrival: {
    date: string;
    time: string;
  };
  price: string;
  returnFlight?: {
    departure: {
      date: string;
      time: string;
    };
    arrival: {
      date: string;
      time: string;
    };
  };
  isBestValue?: boolean;
}

interface FlightCardProps {
  flight: FlightInfo;
  index: number;
}

export function FlightCard({ flight, index }: FlightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-lg border-2 p-4 ${
        flight.isBestValue
          ? 'border-green-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{flight.airline}</h4>
            {flight.isBestValue && (
              <span className="text-xs text-green-600 font-medium">Best Value</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
            <DollarSign className="w-4 h-4" />
            {flight.price}
          </div>
          <span className="text-xs text-gray-500">one way</span>
        </div>
      </div>

      {/* Outbound Flight */}
      <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <Calendar className="w-3 h-3" />
          <span>Outbound</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">{flight.departure.time}</div>
            <div className="text-xs text-gray-600">{flight.departure.date}</div>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-px bg-gray-300 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{flight.arrival.time}</div>
            <div className="text-xs text-gray-600">{flight.arrival.date}</div>
          </div>
        </div>
      </div>

      {/* Return Flight */}
      {flight.returnFlight && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Calendar className="w-3 h-3" />
            <span>Return</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {flight.returnFlight.departure.time}
              </div>
              <div className="text-xs text-gray-600">{flight.returnFlight.departure.date}</div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-px bg-gray-300 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {flight.returnFlight.arrival.time}
              </div>
              <div className="text-xs text-gray-600">{flight.returnFlight.arrival.date}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
