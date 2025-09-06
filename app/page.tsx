'use client';

import { useState, useMemo } from 'react';
import { Timeline } from '@/components/timeline/Timeline';
import { EventForm } from '@/components/forms/EventForm';
import { OverlapPanel } from '@/components/overlaps/OverlapPanel';
import { useEvents } from '@/hooks/useEvents';
import { TimelineEvent } from '@/lib/types';
import { detectOverlaps } from '@/lib/utils/timeline';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, AlertTriangle, Calendar, Clock, Trash2, Edit, CalendarDays, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function TimelineTracker() {
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isOverlapPanelOpen, setIsOverlapPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentWeekStart] = useState(new Date());

  // Calculate this week's events
  const thisWeekEvents = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      
      return (
        isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
        isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
        (eventStart <= weekStart && eventEnd >= weekEnd)
      );
    });
  }, [events, currentWeekStart]);

  // Calculate upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        if (event.type !== 'deadline') return false;
        const deadline = new Date(event.start);
        return deadline >= now && deadline <= nextWeek;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3); // Show top 3 upcoming deadlines
  }, [events]);

  const overlaps = useMemo(() => detectOverlaps(events), [events]);

  const handleCreateEvent = async (eventData: Omit<TimelineEvent, '_id'>) => {
    setIsSubmitting(true);
    try {
      await createEvent(eventData);
      setIsFormOpen(false);
      toast.success('Event created successfully!');
    } catch (error) {
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (eventData: Omit<TimelineEvent, '_id'>) => {
    if (!editingEvent) return;
    
    setIsSubmitting(true);
    try {
      await updateEvent(editingEvent._id, eventData);
      setEditingEvent(null);
      setSelectedEvent(null);
      toast.success('Event updated successfully!');
    } catch (error) {
      toast.error('Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(eventId);
      setSelectedEvent(null);
      toast.success('Event deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete event. Please try again.');
    }
  };

  const handleEventSelect = (event: TimelineEvent | null) => {
    setSelectedEvent(event);
  };

  const openEditForm = (event: TimelineEvent) => {
    setEditingEvent(event);
  };

  // Calculate duration for events
  const getEventDuration = (event: TimelineEvent) => {
    if (event.type === 'deadline' || !event.end) return null;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please check your MongoDB connection and try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">Timeline Tracker</h1>
              {loading && (
                <div className="text-sm text-gray-500 animate-pulse">Loading events...</div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Overlap indicator */}
              {overlaps.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOverlapPanelOpen(true)}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                >
                  <AlertTriangle size={16} className="mr-2" />
                  {overlaps.length} Overlap{overlaps.length > 1 ? 's' : ''}
                </Button>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CalendarDays size={16} />
                  <span>{thisWeekEvents.length} this week</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={16} />
                  <span>{events.length} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          {/* Timeline */}
          <div className="flex-1">
            <Timeline
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* Event Details */}
            {selectedEvent && (
              <Card className="border-blue-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(selectedEvent)}
                        className="h-8 w-8"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(selectedEvent._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedEvent.description && (
                    <p className="text-gray-600 mb-3 text-sm">{selectedEvent.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-700">
                        {format(new Date(selectedEvent.start), 'MMM dd, yyyy')}
                        {selectedEvent.end && selectedEvent.end !== selectedEvent.start && (
                          <span> - {format(new Date(selectedEvent.end), 'MMM dd, yyyy')}</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      {selectedEvent.type === 'deadline' ? (
                        <span className="text-gray-700">
                          Deadline at {format(new Date(selectedEvent.start), 'HH:mm')}
                        </span>
                      ) : (
                        <span className="text-gray-700">
                          {format(new Date(selectedEvent.start), 'HH:mm')}
                          {selectedEvent.end && (
                            <span> - {format(new Date(selectedEvent.end), 'HH:mm')}</span>
                          )}
                        </span>
                      )}
                    </div>
                    
                    {getEventDuration(selectedEvent) && (
                      <div className="text-gray-500 text-xs mt-1">
                        Duration: {getEventDuration(selectedEvent)}
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEvent.type === 'deadline' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedEvent.type === 'deadline' ? '🎯 Deadline' : '📅 Event'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Deadlines */}
            {upcomingDeadlines.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Target size={16} className="text-red-500" />
                    Upcoming Deadlines
                  </h3>
                  <div className="space-y-2">
                    {upcomingDeadlines.map(deadline => {
                      const daysUntil = Math.ceil(
                        (new Date(deadline.start).getTime() - new Date().getTime()) / 
                        (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div 
                          key={deadline._id}
                          className="p-2 bg-red-50 rounded border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => handleEventSelect(deadline)}
                        >
                          <div className="font-medium text-sm text-red-900">
                            {deadline.title}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            {daysUntil === 0 
                              ? 'Today' 
                              : daysUntil === 1 
                                ? 'Tomorrow' 
                                : `In ${daysUntil} days`}
                            {' • '}
                            {format(new Date(deadline.start), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Overview</h3>
                <div className="space-y-3">
                  <div className="pb-2 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Events:</span>
                      <span className="font-medium">{events.filter(e => e.type === 'event').length}</span>
                    </div>
                  </div>
                  <div className="pb-2 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deadlines:</span>
                      <span className="font-medium">{events.filter(e => e.type === 'deadline').length}</span>
                    </div>
                  </div>
                  <div className="pb-2 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">This Week:</span>
                      <span className="font-medium text-blue-600">{thisWeekEvents.length}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overlaps:</span>
                      <span className={`font-medium ${overlaps.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {overlaps.length > 0 ? `⚠️ ${overlaps.length}` : '✓ None'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Weekly Summary */}
                {thisWeekEvents.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">
                      Week Activity
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                        const dayStart = new Date(currentWeekStart);
                        dayStart.setDate(dayStart.getDate() - dayStart.getDay() + dayIndex + 1);
                        dayStart.setHours(0, 0, 0, 0);
                        
                        const dayEnd = new Date(dayStart);
                        dayEnd.setHours(23, 59, 59, 999);
                        
                        const dayEvents = thisWeekEvents.filter(event => {
                          const eventStart = new Date(event.start);
                          const eventEnd = event.end ? new Date(event.end) : eventStart;
                          return (
                            isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
                            isWithinInterval(eventEnd, { start: dayStart, end: dayEnd })
                          );
                        });
                        
                        const isToday = dayStart.toDateString() === new Date().toDateString();
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`flex-1 text-center py-2 rounded text-xs ${
                              dayEvents.length > 0 
                                ? dayEvents.length > 2 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-blue-200 text-blue-800'
                                : 'bg-gray-100 text-gray-400'
                            } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                            title={`${format(dayStart, 'EEE')}: ${dayEvents.length} event(s)`}
                          >
                            {format(dayStart, 'EEE')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        size="icon"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus size={24} />
      </Button>

      {/* Create Event Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setIsFormOpen(false)}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            onSubmit={handleUpdateEvent}
            onCancel={() => setEditingEvent(null)}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Overlap Panel */}
      <OverlapPanel
        overlaps={overlaps}
        onEventSelect={(eventId) => {
          const event = events.find(e => e._id === eventId);
          if (event) {
            handleEventSelect(event);
            setIsOverlapPanelOpen(false);
          }
        }}
        isOpen={isOverlapPanelOpen}
        onClose={() => setIsOverlapPanelOpen(false)}
      />
    </div>
  );
}