'use client';

import { useState } from 'react';
import { TimelineEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';

interface EventFormProps {
  event?: TimelineEvent | null;
  onSubmit: (eventData: Omit<TimelineEvent, '_id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function EventForm({ event, onSubmit, onCancel, loading = false }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start: event?.start ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm") : '',
    end: event?.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : '',
    type: event?.type || 'event' as 'event' | 'deadline',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start) {
      newErrors.start = 'Start time is required';
    }

    if (formData.type === 'event' && formData.end) {
      const startTime = new Date(formData.start);
      const endTime = new Date(formData.end);
      
      if (endTime <= startTime) {
        newErrors.end = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      start: new Date(formData.start),
      end: formData.type === 'event' && formData.end ? new Date(formData.end) : undefined,
      type: formData.type,
    };

    try {
      await onSubmit(eventData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleTypeChange = (type: 'event' | 'deadline') => {
    setFormData(prev => ({
      ...prev,
      type,
      end: type === 'deadline' ? '' : prev.end, // Clear end time for deadlines
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter event title..."
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Add a description (optional)..."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Type</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => handleTypeChange(value as 'event' | 'deadline')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="event" id="event" />
            <Label htmlFor="event" className="font-normal">
              Event (has duration)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deadline" id="deadline" />
            <Label htmlFor="deadline" className="font-normal">
              Deadline (single point in time)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">
            {formData.type === 'deadline' ? 'Deadline Date & Time' : 'Start Date & Time'} *
          </Label>
          <Input
            id="start"
            type="datetime-local"
            value={formData.start}
            onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
            className={errors.start ? 'border-red-500' : ''}
          />
          {errors.start && <p className="text-sm text-red-500">{errors.start}</p>}
        </div>

        {formData.type === 'event' && (
          <div className="space-y-2">
            <Label htmlFor="end">End Date & Time</Label>
            <Input
              id="end"
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
              className={errors.end ? 'border-red-500' : ''}
            />
            {errors.end && <p className="text-sm text-red-500">{errors.end}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}