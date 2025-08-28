import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  tournament_id?: string;
  tournament_name?: string;
  location?: string;
  duration?: number;
  type: 'match' | 'ceremony' | 'training' | 'meeting' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

interface EventSchedulingSystemProps {
  organizerId: string;
  tournaments: any[];
  onEventUpdate?: () => void;
}

export const EventSchedulingSystem: React.FC<EventSchedulingSystemProps> = ({
  organizerId,
  tournaments,
  onEventUpdate
}) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    tournament_id: '',
    location: '',
    duration: 60,
    type: 'match' as ScheduledEvent['type']
  });

  useEffect(() => {
    loadEvents();
  }, [organizerId]);

  const loadEvents = async () => {
    try {
      // Try to load from Supabase first, fallback to localStorage
      const { isSupabaseConfigured } = await import('../../lib/supabase');
      
      if (isSupabaseConfigured) {
        // TODO: Implement Supabase event loading
        // const events = await eventService.getOrganizerEvents(organizerId);
        // setEvents(events);
        console.log('Supabase integration pending for events');
      }
      
      // Fallback to localStorage
      const storedEvents = localStorage.getItem(`organizer_events_${organizerId}`);
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvents = (updatedEvents: ScheduledEvent[]) => {
    try {
      localStorage.setItem(`organizer_events_${organizerId}`, JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error('Error saving events:', error);
      toast.error('Failed to save events');
    }
  };

  const handleCreateEvent = () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newEvent: ScheduledEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      tournament_id: formData.tournament_id || undefined,
      tournament_name: tournaments.find(t => t.id === formData.tournament_id)?.name,
      location: formData.location,
      duration: formData.duration,
      type: formData.type,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    const updatedEvents = [newEvent, ...events];
    saveEvents(updatedEvents);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      tournament_id: '',
      location: '',
      duration: 60,
      type: 'match'
    });
    setShowCreateForm(false);
    
    toast.success('Event scheduled successfully!');
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !formData.title || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedEvent: ScheduledEvent = {
      ...editingEvent,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      tournament_id: formData.tournament_id || undefined,
      tournament_name: tournaments.find(t => t.id === formData.tournament_id)?.name,
      location: formData.location,
      duration: formData.duration,
      type: formData.type
    };

    const updatedEvents = events.map(event => 
      event.id === editingEvent.id ? updatedEvent : event
    );
    saveEvents(updatedEvents);
    
    setEditingEvent(null);
    setShowCreateForm(false);
    toast.success('Event updated successfully!');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = events.filter(event => event.id !== eventId);
      saveEvents(updatedEvents);
      toast.success('Event deleted successfully!');
    }
  };

  const startEditing = (event: ScheduledEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      tournament_id: event.tournament_id || '',
      location: event.location || '',
      duration: event.duration || 60,
      type: event.type
    });
    setShowCreateForm(true);
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      tournament_id: '',
      location: '',
      duration: 60,
      type: 'match'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-blue-100 text-blue-800';
      case 'ceremony': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-green-100 text-green-800';
      case 'meeting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Event Scheduling</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Event
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 bg-gray-50 rounded-lg border"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Schedule New Event'}
            </h3>
            <Button variant="ghost" onClick={cancelEditing}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="match">Match/Game</option>
                <option value="ceremony">Opening/Closing Ceremony</option>
                <option value="training">Training Session</option>
                <option value="meeting">Team Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tournament (Optional)
              </label>
              <select
                value={formData.tournament_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tournament_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tournament</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                min="15"
                max="480"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Event description"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}>
              <Save className="h-4 w-4 mr-2" />
              {editingEvent ? 'Update Event' : 'Schedule Event'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled events</h3>
          <p className="text-gray-600 mb-6">Create and manage your tournament schedule</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Event
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {events
            .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
            .map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {event.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {event.time} ({event.duration}min)
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    
                    {event.tournament_name && (
                      <div className="mt-2 text-sm text-blue-600">
                        Related to: {event.tournament_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}
    </Card>
  );
};