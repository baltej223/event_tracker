'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TimelineEvent, EventOverlap } from '@/lib/types';
import { detectOverlaps, getTimelineViewport, timeToPixels, formatDuration } from '@/lib/utils/timeline';
import { format } from 'date-fns';
import { EventBar } from './EventBar';
import { DeadlineMarker } from './DeadlineMarker';
import { TimelineAxis } from './TimelineAxis';
import { Tooltip } from './Tooltip';

interface TimelineProps {
  events: TimelineEvent[];
  onEventSelect: (event: TimelineEvent | null) => void;
  selectedEvent: TimelineEvent | null;
}

export function Timeline({ events, onEventSelect, selectedEvent }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const overlaps = useMemo(() => detectOverlaps(events), [events]);
  const viewport = useMemo(() => 
    getTimelineViewport(events, containerWidth, zoomLevel), 
    [events, containerWidth, zoomLevel]
  );

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if an event has overlaps
  const hasOverlap = (event: TimelineEvent) => {
    return overlaps.some(overlap => 
      overlap.event1._id === event._id || overlap.event2._id === event._id
    );
  };

  // Handle mouse events for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) { // Only pan when clicking on background
      setIsDragging(true);
      setDragStart({ x: e.clientX, offset: panOffset });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      setPanOffset(Math.max(0, Math.min(viewport.width - containerWidth, dragStart.offset - deltaX)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey) {
      // Zoom
      const newZoom = Math.max(0.1, Math.min(10, zoomLevel + (e.deltaY > 0 ? -0.1 : 0.1)));
      setZoomLevel(newZoom);
    } else {
      // Pan
      const panSpeed = 50;
      const deltaX = e.deltaX || e.deltaY;
      setPanOffset(Math.max(0, Math.min(viewport.width - containerWidth, panOffset + deltaX * panSpeed)));
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    onEventSelect(event);
  };

  const handleEventHover = (event: TimelineEvent | null, e?: React.MouseEvent) => {
    setHoveredEvent(event);
    if (e) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg border overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.2))}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          Zoom Out
        </button>
        <span className="bg-white border rounded px-3 py-1 text-sm">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel(Math.min(10, zoomLevel + 0.2))}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          Zoom In
        </button>
        <button
          onClick={() => {
            setZoomLevel(1);
            setPanOffset(0);
          }}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredEvent(null);
        }}
        onWheel={handleWheel}
      >
        {/* Timeline Content */}
        <div 
          className="relative h-full"
          style={{
            width: viewport.width,
            transform: `translateX(-${panOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Time Axis */}
          <TimelineAxis viewport={viewport} />
          
          {/* Events Layer */}
          <div className="absolute top-16 left-0 right-0 bottom-0">
            {/* Event Bars */}
            {events
              .filter(event => event.type === 'event' && event.end)
              .map((event, index) => {
                const startX = timeToPixels(new Date(event.start), viewport);
                const endX = timeToPixels(new Date(event.end!), viewport);
                const width = endX - startX;
                const hasConflict = hasOverlap(event);
                
                return (
                  <EventBar
                    key={event._id}
                    event={event}
                    x={startX}
                    width={width}
                    y={50 + (index % 4) * 60} // Stagger events to avoid overlap
                    hasOverlap={hasConflict}
                    isSelected={selectedEvent?._id === event._id}
                    isHovered={hoveredEvent?._id === event._id}
                    onClick={() => handleEventClick(event)}
                    onMouseEnter={(e) => handleEventHover(event, e)}
                    onMouseLeave={() => handleEventHover(null)}
                  />
                );
              })}
            
            {/* Deadline Markers */}
            {events
              .filter(event => event.type === 'deadline')
              .map((event) => {
                const x = timeToPixels(new Date(event.start), viewport);
                
                return (
                  <DeadlineMarker
                    key={event._id}
                    event={event}
                    x={x}
                    isSelected={selectedEvent?._id === event._id}
                    isHovered={hoveredEvent?._id === event._id}
                    onClick={() => handleEventClick(event)}
                    onMouseEnter={(e) => handleEventHover(event, e)}
                    onMouseLeave={() => handleEventHover(null)}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredEvent && (
        <Tooltip
          event={hoveredEvent}
          position={mousePosition}
          overlaps={overlaps.filter(o => 
            o.event1._id === hoveredEvent._id || o.event2._id === hoveredEvent._id
          )}
        />
      )}

      {/* Instructions */}
      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No events yet</p>
            <p className="text-sm">Click the + button to add your first event or deadline</p>
          </div>
        </div>
      )}
    </div>
  );
}