import mongoose from 'mongoose';

export interface IEvent {
  _id?: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type: 'event' | 'deadline';
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 200
  },
  description: { 
    type: String,
    trim: true,
    maxLength: 1000
  },
  start: { 
    type: Date, 
    required: true 
  },
  end: { 
    type: Date,
    validate: {
      validator: function(this: IEvent, value: Date) {
        return !value || value >= this.start;
      },
      message: 'End date must be after start date'
    }
  },
  type: { 
    type: String, 
    enum: ['event', 'deadline'], 
    required: true,
    default: function(this: IEvent) {
      return this.end ? 'event' : 'deadline';
    }
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
EventSchema.index({ start: 1 });
EventSchema.index({ end: 1 });
EventSchema.index({ type: 1 });

// Virtual for duration
EventSchema.virtual('duration').get(function() {
  if (!this.end) return 0;
  return this.end.getTime() - this.start.getTime();
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);