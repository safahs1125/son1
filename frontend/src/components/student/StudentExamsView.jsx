import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ExamManualEntry from './ExamManualEntry';
import { Calendar, Award, Eye, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentExamsView({ studentId }) {
  const [exams, setExams] = useState([]);
  const [manualExams, setManualExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  const openDetailModal = (exam) => {
    setSelectedExam(exam);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Deneme Giriş Formu */}
      <ExamManualEntry studentId={studentId} onComplete={fetchExams} />
      
      {/* Manuel Girişli Denemeler */}
      {manualExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Girilen Denemeler</h3>
          {manualExams.map((item, idx) => {
            const upload = item.upload;
            const analysis = item.analysis;
            
            return (
              <Card key={idx} className="p-6 gradient-card" data-testid={`manual-exam-card-${idx}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{upload.exam_name}</h3>
                    <p className="text-sm text-gray-600">{new Date(upload.exam_date).toLocaleDateString('tr-TR')}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                      upload.analysis_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {upload.analysis_status === 'completed' ? 'Analiz Tamamlandı' : 'Analiz Bekleniyor'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Toplam Net</p>
                    <p className="text-3xl font-bold text-amber-600">{analysis?.total_net?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {analysis && analysis.subject_breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {JSON.parse(analysis.subject_breakdown).map((subject, subIdx) => (
                      <div key={subIdx} className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="font-medium text-gray-800 mb-2">{subject.name}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">D: {subject.correct}</span>
                          <span className="text-red-600">Y: {subject.wrong}</span>
                          <span className="font-bold text-amber-600">Net: {subject.net.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {upload.analysis_status === 'completed' && analysis?.recommendations && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Öneriler:</p>
                    <p className="text-sm text-blue-800">{analysis.recommendations}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Eski Denemeler (exams tablosundan) */}
      {groupExamsByDate().length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Eski Denemeler</h3>
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

      {manualExams.length === 0 && groupExamsByDate().length === 0 && (
        <Card className="p-12 text-center gradient-card">
          <p className="text-gray-500">Henüz deneme eklenmemiş</p>
        </Card>
      )}
    </div>
  );
}
