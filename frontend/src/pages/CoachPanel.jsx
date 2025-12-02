import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import CoachCalendar from '@/components/coach/CoachCalendar';
import CoachNotes from '@/components/coach/CoachNotes';
import BookRecommendations from '@/components/coach/BookRecommendations';

export default function CoachPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('coachToken');
    if (!token) {
      navigate('/coach/login');
    }
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto page-fade-in">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/coach/dashboard')}
            className="mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard'a Dön
          </Button>

          <Card className="p-6 gradient-card">
            <h1 className="text-3xl font-bold text-gray-800">Coach Paneli</h1>
            <p className="text-gray-600 mt-2">Kişisel takvim, notlar ve kaynaklarınız</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="calendar" data-testid="coach-calendar-tab">Takvim</TabsTrigger>
            <TabsTrigger value="notes" data-testid="coach-notes-tab">Notlarım</TabsTrigger>
            <TabsTrigger value="books" data-testid="coach-books-tab">Kitap Önerileri</TabsTrigger>
            <TabsTrigger value="settings" data-testid="coach-settings-tab">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CoachCalendar />
          </TabsContent>

          <TabsContent value="notes">
            <CoachNotes />
          </TabsContent>

          <TabsContent value="books">
            <BookRecommendations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
