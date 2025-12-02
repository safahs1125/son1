import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import CoachCalendar from '@/components/coach/CoachCalendar';
import CoachNotes from '@/components/coach/CoachNotes';
import BookRecommendations from '@/components/coach/BookRecommendations';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachPanel() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('coachToken');
    if (!token) {
      navigate('/coach/login');
    }
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/coach/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Şifre başarıyla değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

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

          <TabsContent value="settings">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-800">Şifre Değiştir</h3>
              </div>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Mevcut Şifre</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Yeni Şifre</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Yeni Şifre (Tekrar)</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
