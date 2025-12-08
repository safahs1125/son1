import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// TYT Konular
const TYT_SUBJECTS = {
  'Türkçe': ['Anlatım', 'Sözcük', 'Cümle', 'Paragraf', 'Edebiyat'],
  'Matematik': ['Sayılar', 'Denklemler', 'Fonksiyonlar', 'Geometri', 'Olasılık'],
  'Fen': ['Fizik', 'Kimya', 'Biyoloji'],
  'Sosyal': ['Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'],
};

// AYT Konular (örnek)
const AYT_SUBJECTS = {
  'Matematik': ['İntegral', 'Türev', 'Limit', 'Diziler', 'Trigonometri'],
  'Fizik': ['Kuvvet', 'Elektrik', 'Manyetizma', 'Optik'],
  'Kimya': ['Asit-Baz', 'Kimyasal Denge', 'Organik Kimya'],
  'Biyoloji': ['Hücre', 'Genetik', 'Ekosistem'],
};

export default function TopicProgressManager({ studentId }) {
  const [examType, setExamType] = useState('TYT');
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [studentId]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/topic-progress/${studentId}`);
      
      // Progress verilerini objeye çevir
      const progressMap = {};
      response.data.forEach((item) => {
        const key = `${item.subject}-${item.topic_name}`;
        progressMap[key] = item;
      });
      
      setProgress(progressMap);
    } catch (error) {
      console.error('Progress fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTopicStatus = async (subject, topicName, newStatus) => {
    const key = `${subject}-${topicName}`;
    const existingProgress = progress[key];

    try {
      if (existingProgress) {
        // Güncelle
        await axios.put(`${BACKEND_URL}/api/topic-progress/${existingProgress.id}`, {
          status: newStatus,
        });
      } else {
        // Yeni oluştur
        await axios.post(
          `${BACKEND_URL}/api/topic-progress?student_id=${studentId}&topic_id=${key}&subject=${subject}&topic_name=${topicName}&status=${newStatus}`,
          {}
        );
      }

      fetchProgress();
      toast.success('Konu durumu güncellendi');
    } catch (error) {
      toast.error('Güncelleme hatası: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'tamamlandi':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'devam-ediyor':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'tamamlandi':
        return 'from-green-50 to-emerald-50 border-green-300';
      case 'devam-ediyor':
        return 'from-amber-50 to-orange-50 border-amber-300';
      default:
        return 'from-gray-50 to-slate-50 border-gray-300';
    }
  };

  const subjects = examType === 'TYT' ? TYT_SUBJECTS : AYT_SUBJECTS;

  if (loading) {
    return <div className=\"text-center text-gray-500\">Yükleniyor...</div>;
  }

  return (
    <Card className=\"p-6 gradient-card\">
      <h3 className=\"text-xl font-bold text-gray-800 mb-4\">Konu İlerleme Durumu</h3>

      <Tabs value={examType} onValueChange={setExamType} className=\"w-full\">
        <TabsList className=\"grid w-full grid-cols-2 mb-4\">
          <TabsTrigger value=\"TYT\">TYT Konular</TabsTrigger>
          <TabsTrigger value=\"AYT\">AYT Konular</TabsTrigger>
        </TabsList>

        <TabsContent value={examType}>
          <div className=\"space-y-4\">
            {Object.entries(subjects).map(([subject, topics]) => (
              <Card key={subject} className=\"p-4 bg-white\">
                <h4 className=\"font-bold text-gray-800 mb-3\">{subject}</h4>
                <div className=\"space-y-2\">
                  {topics.map((topic) => {
                    const key = `${subject}-${topic}`;
                    const currentProgress = progress[key];
                    const status = currentProgress?.status || 'cozulmedi';

                    return (
                      <Card
                        key={topic}
                        className={`p-3 bg-gradient-to-r ${getStatusColor(status)} border-2`}
                      >
                        <div className=\"flex items-center justify-between\">
                          <div className=\"flex items-center gap-3\">
                            {getStatusIcon(status)}
                            <span className=\"font-semibold text-gray-800\">{topic}</span>
                          </div>
                          <div className=\"flex gap-2\">
                            <button
                              onClick={() => updateTopicStatus(subject, topic, 'cozulmedi')}
                              className={`px-3 py-1 rounded text-xs ${ 
                                status === 'cozulmedi'
                                  ? 'bg-gray-600 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              Çözülmedi
                            </button>
                            <button
                              onClick={() => updateTopicStatus(subject, topic, 'devam-ediyor')}
                              className={`px-3 py-1 rounded text-xs ${
                                status === 'devam-ediyor'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              Devam Ediyor
                            </button>
                            <button
                              onClick={() => updateTopicStatus(subject, topic, 'tamamlandi')}
                              className={`px-3 py-1 rounded text-xs ${
                                status === 'tamamlandi'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-100 text-green-600'
                              }`}
                            >
                              Tamamlandı
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
"}