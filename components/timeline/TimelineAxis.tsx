'use client';

import { TimelineViewport } from '@/lib/types';
import { format, addHours, startOfHour } from 'date-fns';

interface TimelineAxisProps {
  viewport: TimelineViewport;
}

export function TimelineAxis({ viewport }: TimelineAxisProps) {
  const generateTicks = () => {
    const ticks = [];
    const startHour = startOfHour(viewport.startTime);
    const totalHours = Math.ceil((viewport.endTime.getTime() - startHour.getTime()) / (1000 * 60 * 60));
    
    // Determine tick interval based on zoom level
    let tickInterval = 1; // hours
    if (viewport.pixelsPerHour < 20) tickInterval = 6;
    else if (viewport.pixelsPerHour < 40) tickInterval = 3;
    else if (viewport.pixelsPerHour < 60) tickInterval = 2;
    
    for (let i = 0; i <= totalHours; i += tickInterval) {
      const time = addHours(startHour, i);
      const x = ((time.getTime() - viewport.startTime.getTime()) / (1000 * 60 * 60)) * viewport.pixelsPerHour;
      
      if (x >= 0 && x <= viewport.width) {
        ticks.push({ time, x });
      }
    }
    
    return ticks;
  };

  const ticks = generateTicks();

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-200">
      {/* Time labels and ticks */}
      {ticks.map(({ time, x }, index) => (
        <div key={index} className="absolute" style={{ left: `${x}px` }}>
          {/* Tick mark */}
          <div className="w-px h-4 bg-gray-400" />
          
          {/* Time label */}
          <div className="absolute -left-8 top-4 w-16 text-center text-xs text-gray-600">
            <div className="font-medium">
              {format(time, 'HH:mm')}
            </div>
            <div className="text-xs text-gray-400">
              {format(time, 'MMM dd')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}