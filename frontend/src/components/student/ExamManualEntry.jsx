import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// TYT Dersleri
const TYT_SUBJECTS = [
  { name: 'Türkçe', total: 40 },
  { name: 'Matematik', total: 40 },
  { name: 'Fen Bilimleri', total: 20 },
  { name: 'Sosyal Bilimler', total: 20 },
];

// AYT Dersleri
const AYT_SUBJECTS = [
  { name: 'Matematik', total: 40 },
  { name: 'Fizik', total: 14 },
  { name: 'Kimya', total: 13 },
  { name: 'Biyoloji', total: 13 },
  { name: 'Edebiyat', total: 24 },
  { name: 'Tarih-1', total: 10 },
  { name: 'Coğrafya-1', total: 6 },
];

export default function ExamManualEntry({ studentId, onComplete }) {
  const [examType, setExamType] = useState('TYT');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjects, setSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Deneme türü değişince dersleri resetle
  React.useEffect(() => {
    const baseSubjects = examType === 'TYT' ? TYT_SUBJECTS : AYT_SUBJECTS;
    setSubjects(
      baseSubjects.map((sub) => ({
        name: sub.name,
        total: sub.total,
        correct: 0,
        wrong: 0,
        blank: 0,
        topics: [],
      }))
    );
  }, [examType]);

  const updateSubject = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = parseInt(value) || 0;
    setSubjects(newSubjects);
  };

  const addTopic = (subjectIndex) => {
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].topics.push({
      name: '',
      total: 0,
      correct: 0,
      wrong: 0,
      blank: 0,
    });
    setSubjects(newSubjects);
  };

  const removeTopic = (subjectIndex, topicIndex) => {
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].topics.splice(topicIndex, 1);
    setSubjects(newSubjects);
  };

  const updateTopic = (subjectIndex, topicIndex, field, value) => {
    const newSubjects = [...subjects];
    if (field === 'name') {
      newSubjects[subjectIndex].topics[topicIndex][field] = value;
    } else {
      newSubjects[subjectIndex].topics[topicIndex][field] = parseInt(value) || 0;
    }
    setSubjects(newSubjects);
  };

  const handleSubmit = async () => {
    if (!examName) {
      toast.error('Lütfen deneme adı giriniz');
      return;
    }

    // Validasyon: Her dersin toplamı kontrolü
    for (const subject of subjects) {
      const total = subject.correct + subject.wrong + subject.blank;
      if (total > subject.total) {
        toast.error(`${subject.name}: Toplam sayı ${subject.total}'ı geçemez!`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/exam/manual-entry`, {
        student_id: studentId,
        exam_name: examName,
        exam_date: examDate,
        exam_type: examType,
        subjects: subjects,
      });

      if (response.data.success) {
        toast.success('Deneme başarıyla kaydedildi!');
        setExamName('');
        if (onComplete) onComplete();
      }
    } catch (error) {
      toast.error('Kaydetme hatası: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 gradient-card">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Deneme Sonucu Gir</h3>

      {/* Temel Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Deneme Türü</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Deneme Adı</label>
          <Input
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="Örn: TYT Deneme 1"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Tarih</label>
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
      </div>

      {/* Ders Bazlı Giriş */}
      <div className="space-y-4">
        {subjects.map((subject, subjectIdx) => {
          const net = (subject.correct - subject.wrong / 4).toFixed(2);
          const totalEntered = subject.correct + subject.wrong + subject.blank;

          return (
            <Card key={subjectIdx} className="p-4 bg-white border-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-gray-800">{subject.name}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {totalEntered}/{subject.total} soru
                  </span>
                  <span className="text-lg font-bold text-green-600">Net: {net}</span>
                </div>
              </div>

              {/* Doğru/Yanlış/Boş */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Doğru</label>
                  <Input
                    type="number"
                    min="0"
                    max={subject.total}
                    value={subject.correct}
                    onChange={(e) => updateSubject(subjectIdx, 'correct', e.target.value)}
                    className="text-center bg-green-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Yanlış</label>
                  <Input
                    type="number"
                    min="0"
                    max={subject.total}
                    value={subject.wrong}
                    onChange={(e) => updateSubject(subjectIdx, 'wrong', e.target.value)}
                    className="text-center bg-red-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Boş</label>
                  <Input
                    type="number"
                    min="0"
                    max={subject.total}
                    value={subject.blank}
                    onChange={(e) => updateSubject(subjectIdx, 'blank', e.target.value)}
                    className="text-center bg-gray-50"
                  />
                </div>
              </div>

              {/* Konu Bazlı Giriş */}
              {subject.topics.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Konu Bazlı Performans:</p>
                  <div className="space-y-2">
                    {subject.topics.map((topic, topicIdx) => (
                      <div
                        key={topicIdx}
                        className="grid grid-cols-5 gap-2 p-2 bg-gray-50 rounded items-center"
                      >
                        <Input
                          placeholder="Konu adı"
                          value={topic.name}
                          onChange={(e) =>
                            updateTopic(subjectIdx, topicIdx, 'name', e.target.value)
                          }
                          className="col-span-2"
                        />
                        <Input
                          type="number"
                          placeholder="D"
                          min="0"
                          value={topic.correct}
                          onChange={(e) =>
                            updateTopic(subjectIdx, topicIdx, 'correct', e.target.value)
                          }
                          className="text-center text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Y"
                          min="0"
                          value={topic.wrong}
                          onChange={(e) =>
                            updateTopic(subjectIdx, topicIdx, 'wrong', e.target.value)
                          }
                          className="text-center text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(subjectIdx, topicIdx)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addTopic(subjectIdx)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Konu Ekle
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Kaydet Butonu */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Kaydet
          </>
        )}
      </Button>
    </Card>
  );
}
