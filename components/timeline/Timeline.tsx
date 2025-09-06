'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TimelineEvent, EventOverlap } from '@/lib/types';
import { detectOverlaps, timeToPixels, formatDuration } from '@/lib/utils/timeline';
import { format, startOfDay, endOfDay, addDays, isSameDay, isWithinInterval } from 'date-fns';
import { EventBar } from './EventBar';
import { DeadlineMarker } from './DeadlineMarker';
import { TimelineAxis } from './TimelineAxis';
import { Tooltip } from './Tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  onEventSelect: (event: TimelineEvent | null) => void;
  selectedEvent: TimelineEvent | null;
}

interface WeekViewport {
  startDate: Date;
  endDate: Date;
  width: number;
  pixelsPerHour: number;
}

export function Timeline({ events, onEventSelect, selectedEvent }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfDay(new Date()));
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calculate week viewport
  const weekViewport = useMemo((): WeekViewport => {
    const startDate = currentWeekStart;
    const endDate = endOfDay(addDays(startDate, 6));
    const totalHours = 7 * 24; // 7 days * 24 hours
    const pixelsPerHour = containerWidth / totalHours;
    
    return {
      startDate,
      endDate,
      width: containerWidth,
      pixelsPerHour
    };
  }, [currentWeekStart, containerWidth]);

  // Filter events that are visible in the current week
  const visibleEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      
      // Check if event overlaps with the week viewport
      return (
        isWithinInterval(eventStart, { start: weekViewport.startDate, end: weekViewport.endDate }) ||
        isWithinInterval(eventEnd, { start: weekViewport.startDate, end: weekViewport.endDate }) ||
        (eventStart <= weekViewport.startDate && eventEnd >= weekViewport.endDate)
      );
    });
  }, [events, weekViewport]);

  const overlaps = useMemo(() => detectOverlaps(visibleEvents), [visibleEvents]);

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

  // Convert time to pixels within week viewport
  const weekTimeToPixels = (date: Date): number => {
    const startTime = weekViewport.startDate.getTime();
    const dateTime = date.getTime();
    const hoursFromStart = (dateTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, Math.min(containerWidth, hoursFromStart * weekViewport.pixelsPerHour));
  };

  // Check if an event has overlaps
  const hasOverlap = (event: TimelineEvent) => {
    return overlaps.some(overlap => 
      overlap.event1._id === event._id || overlap.event2._id === event._id
    );
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

  // Navigate weeks
  const navigateToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const navigateToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const navigateToToday = () => {
    setCurrentWeekStart(startOfDay(new Date()));
  };

  // Generate day dividers
  const dayDividers = useMemo(() => {
    const dividers = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = addDays(weekViewport.startDate, i);
      const x = weekTimeToPixels(dayStart);
      dividers.push({
        x,
        date: dayStart,
        label: format(dayStart, 'EEE, MMM d'),
        isToday: isSameDay(dayStart, new Date())
      });
    }
    return dividers;
  }, [weekViewport]);

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg border overflow-hidden">
      {/* Week Navigation Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={navigateToPreviousWeek}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Previous Week
        </button>
        <button
          onClick={navigateToToday}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          Today
        </button>
        <button
          onClick={navigateToNextWeek}
          className="bg-white hover:bg-gray-100 border rounded px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1"
        >
          Next Week
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week Range Display */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white border rounded px-3 py-1">
          <span className="text-sm font-medium">
            {format(weekViewport.startDate, 'MMM d')} - {format(weekViewport.endDate, 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full pt-16"
        onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        {/* Day Headers and Dividers */}
        <div className="absolute top-12 left-0 right-0 h-8 border-b bg-white">
          {dayDividers.map((divider, index) => (
            <div key={index}>
              {/* Day label */}
              <div 
                className={`absolute text-xs font-medium px-2 py-1 ${
                  divider.isToday ? 'text-blue-600 font-semibold' : 'text-gray-600'
                }`}
                style={{ left: divider.x }}
              >
                {divider.label}
                {divider.isToday && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">Today</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Day Divider Lines */}
        <div className="absolute top-20 left-0 right-0 bottom-0">
          {dayDividers.map((divider, index) => (
            <div
              key={index}
              className={`absolute top-0 bottom-0 ${
                divider.isToday 
                  ? 'border-l-2 border-blue-400 opacity-50' 
                  : 'border-l border-gray-300'
              }`}
              style={{ left: divider.x }}
            />
          ))}
        </div>

        {/* Time Grid (optional - shows hours within days) */}
        <div className="absolute top-20 left-0 right-0 h-4 border-b bg-gray-50">
          {dayDividers.map((divider, dayIndex) => (
            <div key={dayIndex}>
              {[0, 6, 12, 18].map((hour) => {
                const hourDate = addDays(weekViewport.startDate, dayIndex);
                hourDate.setHours(hour);
                const x = weekTimeToPixels(hourDate);
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="absolute text-xs text-gray-400"
                    style={{ left: x, top: 2 }}
                  >
                    {hour === 0 ? '' : `${hour}:00`}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
          
        {/* Events Layer */}
        <div className="absolute top-24 left-0 right-0 bottom-0">
          {/* Event Bars */}
          {visibleEvents
            .filter(event => event.type === 'event' && event.end)
            .map((event, index) => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end!);
              
              // Clip event to week boundaries
              const clippedStart = eventStart < weekViewport.startDate ? weekViewport.startDate : eventStart;
              const clippedEnd = eventEnd > weekViewport.endDate ? weekViewport.endDate : eventEnd;
              
              const startX = weekTimeToPixels(clippedStart);
              const endX = weekTimeToPixels(clippedEnd);
              const width = Math.max(20, endX - startX); // Minimum width for visibility
              const hasConflict = hasOverlap(event);
              
              // Show indicator if event extends beyond viewport
              const extendsLeft = eventStart < weekViewport.startDate;
              const extendsRight = eventEnd > weekViewport.endDate;
              
              return (
                <div key={event._id} className="relative">
                  <EventBar
                    event={event}
                    x={startX}
                    width={width}
                    y={20 + (index % 4) * 60} // Stagger events to avoid overlap
                    hasOverlap={hasConflict}
                    isSelected={selectedEvent?._id === event._id}
                    isHovered={hoveredEvent?._id === event._id}
                    onClick={() => handleEventClick(event)}
                    onMouseEnter={(e) => handleEventHover(event, e)}
                    onMouseLeave={() => handleEventHover(null)}
                  />
                  {/* Continuation indicators */}
                  {extendsLeft && (
                    <div 
                      className="absolute text-xs text-gray-500"
                      style={{ 
                        left: startX - 15, 
                        top: 20 + (index % 4) * 60 + 15 
                      }}
                    >
                      ←
                    </div>
                  )}
                  {extendsRight && (
                    <div 
                      className="absolute text-xs text-gray-500"
                      style={{ 
                        left: endX + 5, 
                        top: 20 + (index % 4) * 60 + 15 
                      }}
                    >
                      →
                    </div>
                  )}
                </div>
              );
            })}
          
          {/* Deadline Markers */}
          {visibleEvents
            .filter(event => event.type === 'deadline')
            .map((event) => {
              const deadlineDate = new Date(event.start);
              if (deadlineDate < weekViewport.startDate || deadlineDate > weekViewport.endDate) {
                return null; // Don't show deadlines outside the current week
              }
              
              const x = weekTimeToPixels(deadlineDate);
              
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
      {visibleEvents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No events this week</p>
            <p className="text-sm">Click the + button to add events or navigate to a different week</p>
          </div>
        </div>
      )}
    </div>
  );
}