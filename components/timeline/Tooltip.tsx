'use client';

import { TimelineEvent, EventOverlap } from '@/lib/types';
import { format } from 'date-fns';
import { formatDuration } from '@/lib/utils/timeline';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface TooltipProps {
  event: TimelineEvent;
  position: { x: number; y: number };
  overlaps: EventOverlap[];
}

export function Tooltip({ event, position, overlaps }: TooltipProps) {
  return (
    <div
      className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
        transform: position.x > window.innerWidth - 300 ? 'translateX(-100%)' : undefined,
      }}
    >
      <div className="font-medium mb-2">{event.title}</div>
      
      {event.description && (
        <div className="text-sm text-gray-300 mb-2">
          {event.description}
        </div>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} />
          <span>{format(new Date(event.start), 'MMM dd, yyyy')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} />
          {event.type === 'deadline' ? (
            <span>{format(new Date(event.start), 'HH:mm')}</span>
          ) : (
            <span>
              {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end!), 'HH:mm')}
              {event.end && (
                <span className="ml-2 text-gray-400">
                  ({formatDuration(new Date(event.end).getTime() - new Date(event.start).getTime())})
                </span>
              )}
            </span>
          )}
        </div>
        
        {overlaps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <AlertTriangle size={14} />
              <span>Overlaps with {overlaps.length} event{overlaps.length > 1 ? 's' : ''}</span>
            </div>
            {overlaps.map((overlap, index) => {
              const otherEvent = overlap.event1._id === event._id ? overlap.event2 : overlap.event1;
              return (
                <div key={index} className="text-xs text-gray-400 ml-6">
                  • {otherEvent.title} ({formatDuration(overlap.overlapDuration)})
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}