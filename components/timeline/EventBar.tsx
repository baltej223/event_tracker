'use client';

import { TimelineEvent } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventBarProps {
  event: TimelineEvent;
  x: number;
  width: number;
  y: number;
  hasOverlap: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function EventBar({ 
  event, 
  x, 
  width, 
  y, 
  hasOverlap, 
  isSelected, 
  isHovered,
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: EventBarProps) {
  const minWidth = 2; // Minimum width for very short events
  const displayWidth = Math.max(width, minWidth);
  
  return (
    <div
      className={cn(
        "absolute rounded-md cursor-pointer transition-all duration-200 group",
        "bg-blue-500 hover:bg-blue-600",
        "border-2 border-transparent",
        {
          "border-red-400 bg-red-400 hover:bg-red-500": hasOverlap,
          "border-blue-700 ring-2 ring-blue-200": isSelected,
          "transform scale-105 shadow-lg": isHovered,
        }
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${displayWidth}px`,
        height: '40px',
        zIndex: isHovered ? 20 : isSelected ? 15 : 10,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Event content */}
      <div className="h-full flex items-center px-2 text-white text-xs font-medium overflow-hidden">
        <span className="truncate">
          {event.title}
        </span>
        {displayWidth > 100 && (
          <span className="ml-2 opacity-75 text-xs">
            {format(new Date(event.start), 'HH:mm')}
          </span>
        )}
      </div>
      
      {/* Overlap indicator */}
      {hasOverlap && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border border-yellow-600 rounded-full animate-pulse" />
      )}
      
      {/* Resize handles (for future drag functionality) */}
      <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50" />
      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50" />
    </div>
  );
}