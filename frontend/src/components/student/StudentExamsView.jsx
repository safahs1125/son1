import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import ExamManualEntry from './ExamManualEntry';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentExamsView({ studentId }) {
  const [exams, setExams] = useState([]);
  const [manualExams, setManualExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, [studentId]);

  const fetchExams = async () => {
    try {
      // Eski exams tablosundan
      const oldExamsResponse = await axios.get(`${BACKEND_URL}/api/exams/${studentId}`);
      setExams(oldExamsResponse.data);
      
      // Yeni manuel girişlerden
      const manualExamsResponse = await axios.get(`${BACKEND_URL}/api/exam/student-exams/${studentId}`);
      setManualExams(manualExamsResponse.data);
    } catch (error) {
      toast.error('Denemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const groupExamsByDate = () => {
    const grouped = {};
    exams.forEach(exam => {
      const key = `${exam.tarih}_${exam.sinav_tipi}`;
      if (!grouped[key]) grouped[key] = { date: exam.tarih, type: exam.sinav_tipi, subjects: [] };
      grouped[key].subjects.push(exam);
    });
    return Object.values(grouped);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Deneme Giriş Formu */}
      <ExamManualEntry studentId={studentId} onComplete={fetchExams} />
      
      {groupExamsByDate().length === 0 ? (
        <Card className="p-12 text-center gradient-card">
          <p className="text-gray-500">Henüz deneme eklenmemiş</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupExamsByDate().map((exam, idx) => {
            const totalNet = exam.subjects.reduce((sum, s) => sum + s.net, 0);
            return (
              <Card key={idx} className="p-6 gradient-card" data-testid={`student-exam-card-${idx}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{exam.type} Denemesi</h3>
                    <p className="text-sm text-gray-600">{new Date(exam.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Toplam Net</p>
                    <p className="text-3xl font-bold text-amber-600">{totalNet.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {exam.subjects.map((subject) => (
                    <div key={subject.id} className="p-3 bg-white rounded-lg shadow-sm">
                      <p className="font-medium text-gray-800 mb-2">{subject.ders}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">D: {subject.dogru}</span>
                        <span className="text-red-600">Y: {subject.yanlis}</span>
                        <span className="font-bold text-amber-600">Net: {subject.net.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
