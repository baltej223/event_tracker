import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Event from '@/lib/models/Event';

export async function GET() {
  try {
    await connectToDatabase();
    
    const events = await Event.find({})
      .sort({ start: 1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: events.map(event => ({
        ...event,
        _id: event._id.toString(),
      }))
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { title, description, start, end, type } = body;

    // Validation
    if (!title || !start || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const eventData = {
      title: title.trim(),
      description: description?.trim() || '',
      start: new Date(start),
      end: end ? new Date(end) : undefined,
      type: type as 'event' | 'deadline'
    };

    // Additional validation
    if (eventData.end && eventData.end <= eventData.start) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const event = new Event(eventData);
    await event.save();
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...event.toObject(),
        _id: event._id.toString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}