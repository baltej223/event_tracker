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
import { Plus, AlertTriangle, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function TimelineTracker() {
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isOverlapPanelOpen, setIsOverlapPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                <div className="text-sm text-gray-500">Loading events...</div>
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
              <div className="text-sm text-gray-500">
                {events.length} events
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
          <div className="w-80 space-y-4">
            {/* Event Details */}
            {selectedEvent && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(selectedEvent)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(selectedEvent._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedEvent.description && (
                    <p className="text-gray-600 mb-3">{selectedEvent.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{format(new Date(selectedEvent.start), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      {selectedEvent.type === 'deadline' ? (
                        <span>{format(new Date(selectedEvent.start), 'HH:mm')}</span>
                      ) : (
                        <span>
                          {format(new Date(selectedEvent.start), 'HH:mm')} - 
                          {selectedEvent.end && format(new Date(selectedEvent.end), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.type === 'deadline' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedEvent.type === 'deadline' ? 'Deadline' : 'Event'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Events:</span>
                    <span className="font-medium">{events.filter(e => e.type === 'event').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadlines:</span>
                    <span className="font-medium">{events.filter(e => e.type === 'deadline').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overlaps:</span>
                    <span className={`font-medium ${overlaps.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {overlaps.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
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