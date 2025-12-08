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
      
      {/* Manuel Girişli Denemeler - Liste Görünümü */}
      {manualExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Girilen Denemeler</h3>
          {manualExams.map((item, idx) => {
            const upload = item.upload;
            const analysis = item.analysis;
            
            return (
              <Card key={idx} className="p-4 gradient-card hover:shadow-lg transition-shadow" data-testid={`manual-exam-card-${idx}`}>
                <div className="flex items-center justify-between">
                  {/* Deneme Bilgisi */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{upload.exam_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(upload.exam_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Net Skoru */}
                  {analysis && (
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-600">Net</p>
                      <p className="text-2xl font-bold text-amber-600">{analysis.total_net?.toFixed(2) || '0.00'}</p>
                    </div>
                  )}

                  {/* Durum Badge */}
                  <div className="flex flex-col items-end gap-2">
                    {upload.analysis_status === 'completed' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        ✓ Analiz Tamamlandı
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">
                        Analiz Bekleniyor
                      </span>
                    )}
                  </div>

                  {/* Detay Butonu */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailModal(item)}
                    className="ml-3"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detay
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Eski Denemeler (exams tablosundan) - Liste Görünümü */}
      {groupExamsByDate().length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Eski Denemeler</h3>
          {groupExamsByDate().map((exam, idx) => {
            const totalNet = exam.subjects.reduce((sum, s) => sum + s.net, 0);
            return (
              <Card key={idx} className="p-4 gradient-card hover:shadow-lg transition-shadow" data-testid={`student-exam-card-${idx}`}>
                <div className="flex items-center justify-between">
                  {/* Deneme Bilgisi */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{exam.type} Denemesi</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Net Skoru */}
                  <div className="text-center px-4">
                    <p className="text-xs text-gray-600">Net</p>
                    <p className="text-2xl font-bold text-amber-600">{totalNet.toFixed(2)}</p>
                  </div>

                  {/* Detay Butonu */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailModal({ oldExam: exam })}
                    className="ml-3"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detay
                  </Button>
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

      {/* Detay Modalı */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Deneme Detayları</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-6 mt-4">
              {/* Manuel Deneme Detayı */}
              {selectedExam.upload && (() => {
                const upload = selectedExam.upload;
                const analysis = selectedExam.analysis;
                let subjects = [];
                try {
                  if (analysis && analysis.subject_breakdown) {
                    subjects = JSON.parse(analysis.subject_breakdown);
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }

                return (
                  <>
                    {/* Deneme Bilgisi */}
                    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50">
                      <h3 className="text-xl font-bold text-gray-800">{upload.exam_name}</h3>
                      <p className="text-gray-600 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(upload.exam_date).toLocaleDateString('tr-TR')}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        upload.analysis_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {upload.analysis_status === 'completed' ? '✓ Analiz Tamamlandı' : 'Analiz Bekleniyor'}
                      </span>
                    </Card>

                    {/* Toplam Net */}
                    {analysis && (
                      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                        <div className="flex items-center gap-4">
                          <Award className="w-12 h-12 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">Toplam Net</p>
                            <p className="text-4xl font-bold text-green-600">{analysis.total_net?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Ders Netleri */}
                    {subjects.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Ders Bazlı Sonuçlar</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {subjects.map((subject, sidx) => (
                            <Card key={sidx} className="p-4 bg-white shadow-sm">
                              <p className="text-sm font-semibold text-gray-800 mb-1">{subject.name}</p>
                              <p className="text-2xl font-bold text-amber-600">
                                {subject.net?.toFixed(2) || (subject.correct - subject.wrong / 4).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                D:{subject.correct} Y:{subject.wrong} B:{subject.blank || 0}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Önerileri */}
                    {analysis?.recommendations && upload.analysis_status === 'completed' && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Öneriler</h4>
                        <Card className="p-4 bg-blue-50 border border-blue-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysis.recommendations}</p>
                        </Card>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Eski Deneme Detayı */}
              {selectedExam.oldExam && (() => {
                const exam = selectedExam.oldExam;
                const totalNet = exam.subjects.reduce((sum, s) => sum + s.net, 0);

                return (
                  <>
                    {/* Deneme Bilgisi */}
                    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50">
                      <h3 className="text-xl font-bold text-gray-800">{exam.type} Denemesi</h3>
                      <p className="text-gray-600 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(exam.date).toLocaleDateString('tr-TR')}
                      </p>
                    </Card>

                    {/* Toplam Net */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                      <div className="flex items-center gap-4">
                        <Award className="w-12 h-12 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Toplam Net</p>
                          <p className="text-4xl font-bold text-green-600">{totalNet.toFixed(2)}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Ders Netleri */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Ders Bazlı Sonuçlar</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {exam.subjects.map((subject) => (
                          <Card key={subject.id} className="p-4 bg-white shadow-sm">
                            <p className="text-sm font-semibold text-gray-800 mb-1">{subject.ders}</p>
                            <p className="text-2xl font-bold text-amber-600">{subject.net.toFixed(2)}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              D:{subject.dogru} Y:{subject.yanlis}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
