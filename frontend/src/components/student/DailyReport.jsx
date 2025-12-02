import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, CheckCircle, AlertCircle, BookOpen, Target } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DailyReport({ studentId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [selectedDate, studentId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/student/${studentId}/reports/daily?date=${selectedDate}`);
      setReport(response.data);
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return 'from-green-500 to-emerald-600';
    if (rate >= 60) return 'from-blue-500 to-cyan-600';
    if (rate >= 40) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getPerformanceText = (rate) => {
    if (rate >= 80) return 'Mükemmel!';
    if (rate >= 60) return 'İyi';
    if (rate >= 40) return 'Orta';
    return 'Geliştirilmeli';
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card className="p-4 gradient-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-800">Günlük Rapor</h3>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border-2 border-indigo-300 rounded-lg"
          />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Çözülen Soru</p>
              <p className="text-3xl font-bold text-blue-700">{report.total_questions_solved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Doğru</p>
              <p className="text-3xl font-bold text-green-700">{report.total_correct}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-3xl font-bold text-purple-700">{report.completed_tasks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm text-gray-600">Bekleyen</p>
              <p className="text-3xl font-bold text-amber-700">{report.pending_tasks}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Card */}
      <Card className={`p-6 bg-gradient-to-r ${getPerformanceColor(report.accuracy_rate)}`}>
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-sm opacity-90">Bugünkü Başarı Oranın</p>
            <p className="text-4xl font-bold mt-1">{report.accuracy_rate.toFixed(1)}%</p>
            <p className="text-lg mt-2">{getPerformanceText(report.accuracy_rate)}</p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-80" />
        </div>
      </Card>

      {/* Most Studied */}
      {report.most_studied_lesson !== 'Yok' && (
        <Card className="p-6 gradient-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              🏆
            </div>
            <div>
              <p className="text-sm text-gray-600">En Çok Çalıştığın Ders</p>
              <p className="text-2xl font-bold text-gray-800">{report.most_studied_lesson}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {report.total_questions_solved === 0 && report.completed_tasks === 0 && (
        <Card className="p-12 text-center gradient-card">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Bu Gün Henüz Çalışma Yok</h3>
          <p className="text-gray-600">Hemen başla ve ilerlemeni kaydet!</p>
        </Card>
      )}
    </div>
  );
}
