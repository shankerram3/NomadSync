import { useState, useEffect } from 'react';
import { Clock, GitBranch, RotateCcw, Eye, ChevronRight } from 'lucide-react';
import { planService, PlanVersion } from '../services/plan';
import { motion } from 'framer-motion';

interface PlanVersionHistoryProps {
  tripId: string;
  currentVersion: PlanVersion | null;
  onVersionSelect: (version: PlanVersion) => void;
  onRollback: (version: PlanVersion) => void;
}

export function PlanVersionHistory({
  tripId,
  currentVersion,
  onVersionSelect,
  onRollback,
}: PlanVersionHistoryProps) {
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PlanVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<PlanVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [tripId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const allVersions = await planService.listVersions(tripId);
      setVersions(allVersions);
      if (allVersions.length > 0 && !selectedVersion) {
        setSelectedVersion(allVersions[0]);
      }
    } catch (error) {
      console.error('Failed to load plan versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVersionLabel = (version: PlanVersion) => {
    if (version.created_by === 'agent') {
      return 'AI Generated';
    }
    return `Version ${version.version}`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">Loading version history...</div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500 text-center py-4">
          No plan versions yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Version History</h3>
        <button
          onClick={() => setCompareVersion(compareVersion ? null : selectedVersion)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {compareVersion ? 'Stop Comparing' : 'Compare'}
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {versions.map((version, index) => {
          const isCurrent = currentVersion?.version === version.version;
          const isSelected = selectedVersion?.version === version.version;
          const isCompare = compareVersion?.version === version.version;

          return (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isCurrent
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedVersion(version);
                onVersionSelect(version);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {getVersionLabel(version)}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Current
                      </span>
                    )}
                    {isCompare && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Comparing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(version.created_at)}</span>
                    {version.created_by === 'agent' && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        AI
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareVersion(version);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Compare with current"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRollback(version);
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Rollback to this version"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Diff View */}
      {compareVersion && selectedVersion && compareVersion.version !== selectedVersion.version && (
        <PlanDiffView
          version1={selectedVersion}
          version2={compareVersion}
        />
      )}
    </div>
  );
}

interface PlanDiffViewProps {
  version1: PlanVersion;
  version2: PlanVersion;
}

function PlanDiffView({ version1, version2 }: PlanDiffViewProps) {
  const parseItinerary = (itinerary: Record<string, unknown>) => {
    const days: Array<{ day: number; title: string; activities: string[]; cost: string }> = [];
    
    Object.keys(itinerary).forEach((key) => {
      if (key.startsWith('day_')) {
        const dayNum = parseInt(key.replace('day_', ''), 10);
        const dayData = itinerary[key] as any;
        if (dayData && dayNum) {
          days.push({
            day: dayNum,
            title: dayData.title || `Day ${dayNum}`,
            activities: Array.isArray(dayData.activities) ? dayData.activities : [],
            cost: dayData.cost || '$0',
          });
        }
      }
    });
    
    return days.sort((a, b) => a.day - b.day);
  };

  const days1 = parseItinerary(version1.itinerary);
  const days2 = parseItinerary(version2.itinerary);

  const getDayDiff = (day1: typeof days1[0] | undefined, day2: typeof days2[0] | undefined) => {
    if (!day1 && day2) return { type: 'added', day: day2 };
    if (day1 && !day2) return { type: 'removed', day: day1 };
    if (!day1 || !day2) return null;

    const activitiesAdded = day2.activities.filter(a => !day1.activities.includes(a));
    const activitiesRemoved = day1.activities.filter(a => !day2.activities.includes(a));
    const titleChanged = day1.title !== day2.title;
    const costChanged = day1.cost !== day2.cost;

    if (activitiesAdded.length > 0 || activitiesRemoved.length > 0 || titleChanged || costChanged) {
      return {
        type: 'modified' as const,
        day1,
        day2,
        activitiesAdded,
        activitiesRemoved,
        titleChanged,
        costChanged,
      };
    }

    return null;
  };

  const allDays = new Set([...days1.map(d => d.day), ...days2.map(d => d.day)]);
  const diffs = Array.from(allDays)
    .map(dayNum => getDayDiff(
      days1.find(d => d.day === dayNum),
      days2.find(d => d.day === dayNum)
    ))
    .filter(Boolean);

  if (diffs.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">No differences found between versions</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Changes</h4>
      <div className="space-y-3">
        {diffs.map((diff, idx) => {
          if (!diff) return null;

          if (diff.type === 'added') {
            return (
              <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Day {diff.day.day} added
                  </span>
                </div>
                <p className="text-xs text-green-700">{diff.day.title}</p>
              </div>
            );
          }

          if (diff.type === 'removed') {
            return (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    Day {diff.day.day} removed
                  </span>
                </div>
                <p className="text-xs text-red-700">{diff.day.title}</p>
              </div>
            );
          }

          if (diff.type === 'modified') {
            const day1 = diff.day1;
            const day2 = diff.day2;
            const activitiesRemoved = diff.activitiesRemoved ?? [];
            const activitiesAdded = diff.activitiesAdded ?? [];
            if (!day1 || !day2) return null;
            return (
              <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">
                    Day {day1.day} modified
                  </span>
                </div>
                {diff.titleChanged && (
                  <div className="text-xs mb-1">
                    <span className="text-red-600 line-through">{day1.title}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{day2.title}</span>
                  </div>
                )}
                {activitiesRemoved.length > 0 && (
                  <div className="text-xs mb-1">
                    <span className="text-red-600">Removed:</span>
                    <ul className="ml-4 list-disc">
                      {activitiesRemoved.map((act, i) => (
                        <li key={i} className="line-through">{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activitiesAdded.length > 0 && (
                  <div className="text-xs">
                    <span className="text-green-600">Added:</span>
                    <ul className="ml-4 list-disc">
                      {activitiesAdded.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
