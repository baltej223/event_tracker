'use client';

import { EventOverlap } from '@/lib/types';
import { formatDuration } from '@/lib/utils/timeline';
import { format } from 'date-fns';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OverlapPanelProps {
  overlaps: EventOverlap[];
  onEventSelect: (eventId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OverlapPanel({ overlaps, onEventSelect, isOpen, onClose }: OverlapPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l z-50 transform transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={20} />
          Event Overlaps ({overlaps.length})
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      <div className="p-4 overflow-y-auto h-full pb-20">
        {overlaps.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="font-medium">No overlaps detected</p>
            <p className="text-sm">All events are properly scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overlaps.map((overlap, index) => (
              <Card key={index} className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">
                    Overlap #{index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Event 1 */}
                  <div 
                    className="p-2 bg-blue-100 border border-blue-200 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => onEventSelect(overlap.event1._id)}
                  >
                    <div className="font-medium text-sm">{overlap.event1.title}</div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(overlap.event1.start), 'MMM dd, HH:mm')} - {format(new Date(overlap.event1.end!), 'HH:mm')}
                    </div>
                  </div>

                  {/* Overlap info */}
                  <div className="flex items-center justify-center text-xs text-yellow-700 bg-yellow-100 py-1 px-2 rounded">
                    <Clock size={12} className="mr-1" />
                    Overlaps for {formatDuration(overlap.overlapDuration)}
                  </div>

                  {/* Event 2 */}
                  <div 
                    className="p-2 bg-blue-100 border border-blue-200 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => onEventSelect(overlap.event2._id)}
                  >
                    <div className="font-medium text-sm">{overlap.event2.title}</div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(overlap.event2.start), 'MMM dd, HH:mm')} - {format(new Date(overlap.event2.end!), 'HH:mm')}
                    </div>
                  </div>

                  {/* Overlap period */}
                  <div className="text-xs text-gray-500 text-center pt-1 border-t">
                    Overlap: {format(overlap.overlapStart, 'MMM dd, HH:mm')} - {format(overlap.overlapEnd, 'HH:mm')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}