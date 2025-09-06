'use client';

import { TimelineEvent } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';

interface DeadlineMarkerProps {
  event: TimelineEvent;
  x: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function DeadlineMarker({ 
  event, 
  x, 
  isSelected, 
  isHovered,
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: DeadlineMarkerProps) {
  return (
    <div
      className="absolute cursor-pointer transition-all duration-200 group"
      style={{
        left: `${x - 2}px`, // Center the marker
        top: '20px',
        zIndex: isHovered ? 25 : isSelected ? 20 : 15,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Vertical line */}
      <div
        className={cn(
          "w-1 bg-red-500 transition-all duration-200",
          {
            "bg-red-600 w-2": isHovered || isSelected,
          }
        )}
        style={{ height: 'calc(100vh - 120px)' }}
      />
      
      {/* Flag icon */}
      <div
        className={cn(
          "absolute -top-2 -left-3 transform transition-all duration-200",
          "text-red-500 group-hover:text-red-600",
          {
            "scale-125 text-red-600": isHovered,
            "text-red-700": isSelected,
          }
        )}
      >
        <Flag size={24} fill="currentColor" />
      </div>
      
      {/* Label */}
      <div
        className={cn(
          "absolute -top-8 left-6 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium",
          "whitespace-nowrap transition-all duration-200 opacity-0 group-hover:opacity-100",
          {
            "opacity-100 bg-red-600": isHovered || isSelected,
          }
        )}
      >
        {event.title}
        <div className="text-xs opacity-75">
          {format(new Date(event.start), 'MMM dd, HH:mm')}
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-red-500" />
      </div>
    </div>
  );
}