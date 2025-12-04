import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachWeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coach/reports/weekly-summary`);
      setReport(response.data);
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Rapor yükleniyor...</div>;
  }

  if (!report) {
    return <Card className="p-8 text-center gradient-card">
      <p className="text-gray-500">Rapor yüklenemedi</p>
    </Card>;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'improved':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declined':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'improved':
        return 'from-green-50 to-emerald-50 border-green-300';
      case 'declined':
        return 'from-red-50 to-pink-50 border-red-300';
      default:
        return 'from-gray-50 to-slate-50 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dönem Bilgisi */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <h2 className="text-xl font-bold text-gray-800">Haftalık Özet Rapor</h2>
        <p className="text-sm text-gray-600">{report.period}</p>
      </Card>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <p className="text-sm text-gray-600">Toplam Öğrenci</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{report.summary.total_students}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <p className="text-sm text-gray-600">Gelişen</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{report.summary.students_improved}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
          <div className="flex items-center gap-2 mb-2">
            <Minus className="w-6 h-6 text-amber-600" />
            <p className="text-sm text-gray-600">Sabit</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{report.summary.students_stable}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <p className="text-sm text-gray-600">Gerileyen</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{report.summary.students_declined}</p>
        </Card>
      </div>

      {/* En Çok Gelişenler */}
      {report.most_improved.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">🏆 En Çok Gelişen Öğrenciler</h3>
          </div>
          <div className="space-y-3">
            {report.most_improved.map((student, idx) => (
              <div key={student.student_id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{student.student_name}</p>
                    <p className="text-sm text-gray-600">{student.questions_solved} soru çözüldü</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    +{student.change.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">%{student.accuracy_rate} başarı</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gerileme Gösterenler */}
      {report.most_declined.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-gray-800">⚠️ Dikkat Edilmesi Gerekenler</h3>
          </div>
          <div className="space-y-3">
            {report.most_declined.map((student, idx) => (
              <div key={student.student_id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold">
                    !
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{student.student_name}</p>
                    <p className="text-sm text-gray-600">{student.questions_solved} soru çözüldü</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">
                    {student.change.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">%{student.accuracy_rate} başarı</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tüm Öğrenciler */}
      <Card className="p-6 gradient-card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Tüm Öğrencilerin Durumu</h3>
        <div className="space-y-2">
          {report.all_students.map((student) => (
            <Card
              key={student.student_id}
              className={`p-4 bg-gradient-to-r ${getStatusColor(student.status)} border-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(student.status)}
                  <div>
                    <p className="font-semibold text-gray-800">{student.student_name}</p>
                    <p className="text-sm text-gray-600">{student.questions_solved} soru</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">%{student.accuracy_rate}</p>
                  <p className="text-sm text-gray-600">
                    {student.change > 0 ? '+' : ''}{student.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
