import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

export function RealtimeIndicator({ isConnected, lastUpdate }: RealtimeIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2"
        >
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-700">Live updates active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Updates paused</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
