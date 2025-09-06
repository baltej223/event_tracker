'use client';

import { useState, useEffect, useCallback } from 'react';
import { TimelineEvent } from '@/lib/types';

export function useEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      const result = await response.json();
      
      if (result.success) {
        // Convert date strings back to Date objects
        const processedEvents = result.data.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: event.end ? new Date(event.end) : undefined,
        }));
        setEvents(processedEvents);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = async (eventData: Omit<TimelineEvent, '_id'>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchEvents(); // Refresh the list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<TimelineEvent>) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchEvents(); // Refresh the list
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchEvents(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}