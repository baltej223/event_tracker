import { TimelineEvent, EventOverlap, TimelineViewport } from '@/lib/types';

export function detectOverlaps(events: TimelineEvent[]): EventOverlap[] {
  const overlaps: EventOverlap[] = [];
  
  // Only check events (not deadlines) for overlaps
  const eventsOnly = events.filter(e => e.type === 'event' && e.end);
  
  for (let i = 0; i < eventsOnly.length; i++) {
    for (let j = i + 1; j < eventsOnly.length; j++) {
      const event1 = eventsOnly[i];
      const event2 = eventsOnly[j];
      
      if (!event1.end || !event2.end) continue;
      
      const start1 = new Date(event1.start).getTime();
      const end1 = new Date(event1.end).getTime();
      const start2 = new Date(event2.start).getTime();
      const end2 = new Date(event2.end).getTime();
      
      // Check for overlap: (start1 < end2) && (start2 < end1)
      if (start1 < end2 && start2 < end1) {
        const overlapStart = new Date(Math.max(start1, start2));
        const overlapEnd = new Date(Math.min(end1, end2));
        const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
        
        overlaps.push({
          event1,
          event2,
          overlapStart,
          overlapEnd,
          overlapDuration
        });
      }
    }
  }
  
  return overlaps;
}

export function getTimelineViewport(
  events: TimelineEvent[],
  containerWidth: number,
  zoomLevel: number = 1
): TimelineViewport {
  if (events.length === 0) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day ahead
    
    return {
      startTime,
      endTime,
      pixelsPerHour: containerWidth / 48, // 48 hours total
      width: containerWidth
    };
  }
  
  // Find the earliest start and latest end
  let earliest = new Date(events[0].start);
  let latest = new Date(events[0].start);
  
  events.forEach(event => {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : start;
    
    if (start < earliest) earliest = start;
    if (end > latest) latest = end;
  });
  
  // Add padding (10% on each side)
  const totalDuration = latest.getTime() - earliest.getTime();
  const padding = totalDuration * 0.1;
  
  const startTime = new Date(earliest.getTime() - padding);
  const endTime = new Date(latest.getTime() + padding);
  
  const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const pixelsPerHour = (containerWidth * zoomLevel) / totalHours;
  
  return {
    startTime,
    endTime,
    pixelsPerHour,
    width: containerWidth * zoomLevel
  };
}

export function timeToPixels(time: Date, viewport: TimelineViewport): number {
  const timeMs = time.getTime();
  const startMs = viewport.startTime.getTime();
  const hoursFromStart = (timeMs - startMs) / (1000 * 60 * 60);
  return hoursFromStart * viewport.pixelsPerHour;
}

export function pixelsToTime(pixels: number, viewport: TimelineViewport): Date {
  const hoursFromStart = pixels / viewport.pixelsPerHour;
  const timeMs = viewport.startTime.getTime() + (hoursFromStart * 1000 * 60 * 60);
  return new Date(timeMs);
}

export function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}