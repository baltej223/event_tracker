export interface TimelineEvent {
  _id: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type: 'event' | 'deadline';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventOverlap {
  event1: TimelineEvent;
  event2: TimelineEvent;
  overlapStart: Date;
  overlapEnd: Date;
  overlapDuration: number;
}

export interface TimelineViewport {
  startTime: Date;
  endTime: Date;
  pixelsPerHour: number;
  width: number;
}