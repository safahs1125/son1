import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', note: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coach/calendar`);
      setEvents(response.data);
    } catch (error) {
      toast.error('Takvim yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Lütfen başlık girin');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/coach/calendar`, {
        title: newEvent.title,
        date: format(selectedDate, 'yyyy-MM-dd'),
        note: newEvent.note
      });
      toast.success('Etkinlik eklendi');
      setOpenDialog(false);
      setNewEvent({ title: '', note: '' });
      fetchEvents();
    } catch (error) {
      toast.error('Etkinlik eklenemedi');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/coach/calendar/${eventId}`);
      toast.success('Etkinlik silindi');
      fetchEvents();
    } catch (error) {
      toast.error('Etkinlik silinemedi');
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const hasEventOnDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.some(e => e.date === dateStr);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="p-6 gradient-card">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Kişisel Takvim
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={tr}
            className="rounded-md border"
            modifiers={{
              hasEvent: (date) => hasEventOnDate(date)
            }}
            modifiersStyles={{
              hasEvent: { fontWeight: 'bold', backgroundColor: 'rgba(139, 92, 246, 0.2)' }
            }}
          />
        </Card>

        {/* Events for Selected Date */}
        <Card className="p-6 gradient-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
            </h3>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="add-coach-event" className="bg-gradient-to-r from-violet-500 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Etkinlik Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Etkinlik</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tarih: {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Etkinlik başlığı"
                      data-testid="event-title-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Not (Opsiyonel)</label>
                    <Textarea
                      value={newEvent.note}
                      onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                      placeholder="Detaylar..."
                      rows={3}
                      data-testid="event-note-input"
                    />
                  </div>
                  <Button onClick={handleAddEvent} className="w-full" data-testid="create-event-button">
                    Ekle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {selectedDateEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Bu tarih için etkinlik yok</p>
            ) : (
              selectedDateEvents.map((event) => (
                <div key={event.id} className="p-4 bg-white rounded-lg shadow-sm" data-testid={`coach-event-${event.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-semibold text-gray-800 break-words">{event.title}</h4>
                      {event.note && <p className="text-sm text-gray-600 mt-1 break-words whitespace-normal">{event.note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      data-testid={`delete-event-${event.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* All Events List */}
      <Card className="p-6 gradient-card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Tüm Etkinlikler</h3>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz etkinlik eklenmemiş</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h4 className="font-semibold text-gray-800 break-words">{event.title}</h4>
                  {event.note && <p className="text-sm text-gray-600 mt-1 break-words whitespace-normal">{event.note}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
