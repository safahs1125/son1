import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentAnalysis({ studentId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [studentId]);

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/student/${studentId}/analysis`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Analiz yükleniyor...</div>;
  }

  if (!analysis) {
    return (
      <Card className="p-8 text-center gradient-card">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">Henüz yeterli veri yok. Soru çözdükçe analizin burada görünecek.</p>
      </Card>
    );
  }

  const { overall_stats, lesson_stats, weak_lessons, strong_lessons } = analysis;

  // Chart data
  const chartData = lesson_stats.map(lesson => ({
    name: lesson.lesson,
    rate: lesson.accuracy_rate,
    solved: lesson.total_solved
  }));

  const getColorByRate = (rate) => {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="space-y-6">
      {/* Genel Başarı Kartı */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Genel Performansın</h3>
            <p className="text-sm text-gray-600">{analysis.period}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Toplam Soru</p>
            <p className="text-3xl font-bold text-indigo-600">{overall_stats.total_solved}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Doğru</p>
            <p className="text-3xl font-bold text-green-600">{overall_stats.total_correct}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Başarı Oranı</p>
            <p className="text-3xl font-bold text-purple-600">%{overall_stats.accuracy_rate}</p>
          </div>
        </div>
      </Card>

      {/* Ders Bazında Başarı Grafiği */}
      <Card className="p-6 gradient-card">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Ders Bazında Başarı Oranları
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border-2 border-indigo-300 rounded-lg shadow-lg">
                      <p className="font-semibold">{payload[0].payload.name}</p>
                      <p className="text-sm text-gray-600">Başarı: %{payload[0].value}</p>
                      <p className="text-xs text-gray-500">{payload[0].payload.solved} soru çözüldü</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByRate(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Zayıf Konular */}
      {weak_lessons.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Dikkat Edilmesi Gereken Konular
          </h3>
          <div className="space-y-3">
            {weak_lessons.map((lesson, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-800">{lesson.lesson}</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">%{lesson.accuracy_rate}</span>
                </div>
                <Progress value={lesson.accuracy_rate} className="h-2 bg-red-100" />
                <p className="text-sm text-gray-600 mt-2">
                  {lesson.total_solved} soru çözüldü • {lesson.total_correct} doğru • {lesson.total_wrong} yanlış
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Güçlü Konular */}
      {strong_lessons.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Güçlü Olduğun Konular
          </h3>
          <div className="space-y-3">
            {strong_lessons.map((lesson, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-800">{lesson.lesson}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">%{lesson.accuracy_rate}</span>
                </div>
                <Progress value={lesson.accuracy_rate} className="h-2 bg-green-100" />
                <p className="text-sm text-gray-600 mt-2">
                  {lesson.total_solved} soru çözüldü • {lesson.total_correct} doğru • {lesson.total_wrong} yanlış
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
