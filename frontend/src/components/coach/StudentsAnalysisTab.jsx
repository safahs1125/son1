import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Calendar, Users, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentsAnalysisTab() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'info',
    title: '',
    message: ''
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [studentDetailData, setStudentDetailData] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coach/students-analysis`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const selectAttentionNeeded = () => {
    const needsAttention = analysis.students
      .filter(s => s.needs_attention)
      .map(s => s.student_id);
    setSelectedStudents(needsAttention);
    toast.success(`${needsAttention.length} öğrenci seçildi`);
  };

  const sendBulkNotification = async () => {
    if (selectedStudents.length === 0) {
      toast.error('En az bir öğrenci seçmelisiniz');
      return;
    }

    if (!notificationData.title || !notificationData.message) {
      toast.error('Başlık ve mesaj zorunlu');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/coach/send-bulk-notification`, {
        student_ids: selectedStudents,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        user_id: selectedStudents[0]
      });

      toast.success(`${selectedStudents.length} öğrenciye bildirim gönderildi`);
      setNotificationOpen(false);
      setSelectedStudents([]);
      setNotificationData({ type: 'info', title: '', message: '' });
    } catch (error) {
      toast.error('Bildirim gönderilemedi');
    }
  };

  const openStudentDetail = async (student) => {
    setSelectedStudentDetail(student);
    setDetailModalOpen(true);
    
    try {
      // Soru takip ve branş tarama verilerini getir
      const [soruTakip, bransTarama] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/student/${student.student_id}/soru-takip`),
        axios.get(`${BACKEND_URL}/api/student/${student.student_id}/brans-tarama`)
      ]);
      
      setStudentDetailData({
        soruTakip: soruTakip.data,
        bransTarama: bransTarama.data
      });
    } catch (error) {
      toast.error('Detay verisi yüklenemedi');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Analiz yükleniyor...</div>;
  }

  if (!analysis) {
    return <Card className="p-8 text-center gradient-card">
      <p className="text-gray-500">Analiz verisi yüklenemedi</p>
    </Card>;
  }

  return (
    <div className="space-y-6">
      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Toplam Öğrenci</p>
              <p className="text-3xl font-bold text-blue-600">{analysis.total_students}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm text-gray-600">Dikkat Gerekli</p>
              <p className="text-3xl font-bold text-amber-600">{analysis.attention_needed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">İyi Giden</p>
              <p className="text-3xl font-bold text-green-600">
                {analysis.total_students - analysis.attention_needed}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toplu Bildirim Gönderme */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">
              {selectedStudents.length > 0 
                ? `${selectedStudents.length} öğrenci seçildi` 
                : 'Öğrenci seçimi yapılmadı'}
            </p>
            <p className="text-sm text-gray-600">Aşağıdaki listeden öğrenci seçerek toplu bildirim gönderebilirsiniz</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={selectAttentionNeeded}
              className="bg-white"
            >
              Dikkat Gerekenleri Seç
            </Button>
            <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={selectedStudents.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Bildirim Gönder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Toplu Bildirim Gönder ({selectedStudents.length} öğrenci)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bildirim Tipi</label>
                    <select
                      value={notificationData.type}
                      onChange={(e) => setNotificationData({...notificationData, type: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="info">Bilgi</option>
                      <option value="success">Başarı</option>
                      <option value="warning">Uyarı</option>
                      <option value="alert">Dikkat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Başlık</label>
                    <Input
                      value={notificationData.title}
                      onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                      placeholder="Örn: Haftalık Çalışma Hatırlatması"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mesaj</label>
                    <Textarea
                      value={notificationData.message}
                      onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                      placeholder="Öğrencilere gönderilecek mesaj..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={sendBulkNotification}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    Gönder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Öğrenci Listesi */}
      <Card className="p-6 gradient-card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Öğrenci Detayları</h3>
        <div className="space-y-3">
          {analysis.students.map((student) => (
            <Card
              key={student.student_id}
              className={`p-4 cursor-pointer transition-all ${
                selectedStudents.includes(student.student_id)
                  ? 'bg-purple-50 border-2 border-purple-400'
                  : student.needs_attention
                  ? 'bg-red-50 border-2 border-red-300'
                  : 'bg-green-50 border-2 border-green-300'
              }`}
              onClick={() => toggleStudentSelection(student.student_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.student_id)}
                    onChange={() => {}}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{student.student_name}</p>
                      {student.needs_attention && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          Dikkat!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{student.bolum}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Çözülen Soru</p>
                    <p className="text-xl font-bold text-indigo-600">{student.total_questions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Başarı Oranı</p>
                    <p className={`text-xl font-bold ${
                      student.accuracy_rate >= 80 ? 'text-green-600' :
                      student.accuracy_rate >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      %{student.accuracy_rate}
                    </p>
                  </div>
                  {student.last_activity && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Son Aktivite</p>
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(student.last_activity).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
