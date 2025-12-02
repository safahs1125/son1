import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StudentTasksTab from '@/components/student/StudentTasksTab';
import StudentTopicsView from '@/components/student/StudentTopicsView';
import StudentExamsView from '@/components/student/StudentExamsView';
import StudentCalendarTab from '@/components/student/StudentCalendarTab';
import Last7DaysSummary from '@/components/student/Last7DaysSummary';
import Onboarding from '@/components/student/Onboarding';
import SoruTakip from '@/components/student/SoruTakip';
import Notifications from '@/components/student/Notifications';
import StudentAnalysis from '@/components/student/StudentAnalysis';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentPanel() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const studentId = localStorage.getItem('studentId');
    if (!token || !studentId) {
      navigate('/student');
      return;
    }
    fetchStudent(studentId);
  }, [refreshKey]);

  const fetchStudent = async (studentId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/students/${studentId}`);
      setStudent(response.data);
      
      // Check onboarding status (safe fallback)
      try {
        const onboardingResponse = await axios.get(`${BACKEND_URL}/api/student/${studentId}/onboarding`);
        setOnboardingData(onboardingResponse.data);
        
        // Show onboarding if not completed
        if (!onboardingResponse.data.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch (onboardingError) {
        console.log('Onboarding data not available:', onboardingError);
        // Set default onboarding data if endpoint fails
        setOnboardingData({ onboarding_completed: false });
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Student fetch error:', error);
      toast.error('Bilgiler yüklenemedi');
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentId');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentId');
    navigate('/student');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Veriler güncellendi');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Öğrenci bulunamadı</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding
          studentId={student.id}
          onComplete={() => {
            setShowOnboarding(false);
            setRefreshKey(prev => prev + 1);
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      <div className="max-w-7xl mx-auto page-fade-in">
        {/* Onboarding Warning Banner */}
        {onboardingData && !onboardingData.onboarding_completed && !showOnboarding && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Profilin Eksik!</p>
                  <p className="text-sm text-amber-700">Kişiselleştirilmiş çalışma planı oluşturabilmemiz için profilini tamamla.</p>
                </div>
              </div>
              <Button
                onClick={() => setShowOnboarding(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                Tamamla
              </Button>
            </div>
          </Card>
        )}

        {/* Header */}
        <Card className="p-6 mb-6 gradient-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                {student.ad.charAt(0)}{student.soyad?.charAt(0) || ''}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Hoş geldin, {student.ad}!
                </h1>
                <div className="flex gap-3 mt-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-semibold">
                    {student.bolum}
                  </span>
                  {student.hedef && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-semibold">
                      🎯 Hedef: {student.hedef}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <SoruTakip studentId={student.id} />
              <Button
                variant="outline"
                onClick={handleRefresh}
                data-testid="refresh-button"
                className="bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                data-testid="student-logout-button"
                className="bg-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </Card>

        {/* Last 7 Days Summary */}
        <Last7DaysSummary studentId={student.id} />

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="tasks" data-testid="student-tasks-tab">Görevlerim</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="student-analysis-tab">Analizim</TabsTrigger>
            <TabsTrigger value="topics" data-testid="student-topics-tab">Konular</TabsTrigger>
            <TabsTrigger value="exams" data-testid="student-exams-tab">Denemeler</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="student-notifications-tab">Bildirimler</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="student-calendar-tab">Takvim</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <StudentTasksTab studentId={student.id} onRefresh={handleRefresh} />
          </TabsContent>

          <TabsContent value="analysis">
            <StudentAnalysis studentId={student.id} />
          </TabsContent>

          <TabsContent value="topics">
            <StudentTopicsView studentId={student.id} />
          </TabsContent>

          <TabsContent value="exams">
            <StudentExamsView studentId={student.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <Notifications studentId={student.id} />
          </TabsContent>

          <TabsContent value="calendar">
            <StudentCalendarTab studentId={student.id} onRefresh={handleRefresh} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
