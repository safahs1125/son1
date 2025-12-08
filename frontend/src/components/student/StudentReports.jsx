import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, Award, BookOpen } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentReports({ studentId }) {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [topicDetails, setTopicDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [studentId]);

  const fetchReports = async () => {
    try {
      const [weekly, monthly, soruTakip] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/student/${studentId}/reports/weekly`),
        axios.get(`${BACKEND_URL}/api/student/${studentId}/reports/monthly`),
        axios.get(`${BACKEND_URL}/api/student/${studentId}/soru-takip`)
      ]);
      
      setWeeklyReport(weekly.data);
      setMonthlyReport(monthly.data);
      setTopicDetails(soruTakip.data);
    } catch (error) {
      console.error('Reports fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Raporlar yükleniyor...</div>;
  }

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="weekly">Haftalık Rapor</TabsTrigger>
        <TabsTrigger value="monthly">Aylık Rapor</TabsTrigger>
      </TabsList>

      {/* Haftalık Rapor */}
      <TabsContent value="weekly">
        {weeklyReport && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-600">Toplam Soru</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{weeklyReport.summary.total_solved}</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600">Başarı Oranı</p>
                </div>
                <p className="text-3xl font-bold text-green-600">%{weeklyReport.summary.accuracy_rate}</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                <div className="flex items-center gap-2 mb-2">
                  {weeklyReport.summary.trend === "Yükseliş" ? (
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                  )}
                  <p className="text-sm text-gray-600">Trend</p>
                </div>
                <p className="text-xl font-bold text-purple-600">{weeklyReport.summary.trend}</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-gray-600">En Çok</p>
                </div>
                <p className="text-lg font-bold text-amber-600">{weeklyReport.summary.most_studied_lesson}</p>
              </Card>
            </div>

            {/* Günlük Çalışma Grafiği */}
            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Günlük Çalışma Performansı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyReport.daily_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('tr-TR')}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border-2 border-indigo-300 rounded-lg shadow-lg">
                            <p className="font-semibold">{new Date(payload[0].payload.date).toLocaleDateString('tr-TR')}</p>
                            <p className="text-sm text-blue-600">Soru: {payload[0].value}</p>
                            <p className="text-sm text-green-600">Başarı: %{payload[1].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="solved" stroke="#3b82f6" name="Çözülen Soru" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" name="Başarı %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Ders Bazında Dağılım */}
            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ders Bazında Performans</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyReport.lesson_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lesson" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="solved" fill="#8b5cf6" name="Çözülen" />
                  <Bar dataKey="correct" fill="#10b981" name="Doğru" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* Aylık Rapor */}
      <TabsContent value="monthly">
        {monthlyReport && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-600">Toplam Soru</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{monthlyReport.summary.total_solved}</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600">Başarı Oranı</p>
                </div>
                <p className="text-3xl font-bold text-green-600">%{monthlyReport.summary.accuracy_rate}</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-gray-600">İlerleme</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {monthlyReport.summary.improvement_rate > 0 ? '+' : ''}
                  {monthlyReport.summary.improvement_rate}%
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-gray-600">Dönem</p>
                </div>
                <p className="text-sm font-semibold text-amber-600">Son 30 Gün</p>
              </Card>
            </div>

            {/* Haftalık İlerleme Grafiği */}
            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Haftalık İlerleme</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyReport.weekly_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border-2 border-indigo-300 rounded-lg shadow-lg">
                            <p className="font-semibold">{payload[0].payload.week}</p>
                            <p className="text-xs text-gray-600">{payload[0].payload.period}</p>
                            <p className="text-sm text-blue-600">Soru: {payload[0].value}</p>
                            <p className="text-sm text-green-600">Başarı: %{payload[1].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="solved" stroke="#3b82f6" name="Çözülen Soru" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" name="Başarı %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Ders Bazında Aylık Dağılım */}
            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ders Bazında Aylık Performans</h3>
              <div className="space-y-3">
                {monthlyReport.lesson_breakdown.map((lesson, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{lesson.lesson}</h4>
                      <span className="text-lg font-bold text-indigo-600">%{lesson.accuracy}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Çözülen</p>
                        <p className="font-semibold text-blue-600">{lesson.solved}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Doğru</p>
                        <p className="font-semibold text-green-600">{lesson.correct}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Yanlış</p>
                        <p className="font-semibold text-red-600">{lesson.wrong}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
