import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DERSLER = [
  'Türkçe', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
  'Tarih', 'Coğrafya', 'Edebiyat', 'Geometri', 'Felsefe'
];

export default function SoruTakip({ studentId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lesson: '',
    topic: '',
    source: '',
    solved: '',
    correct: '',
    wrong: '',
    blank: ''
  });

  const handleSubmit = async () => {
    if (!formData.lesson || !formData.solved) {
      toast.error('Ders ve toplam soru sayısı zorunlu');
      return;
    }

    const total = parseInt(formData.solved);
    const correct = parseInt(formData.correct) || 0;
    const wrong = parseInt(formData.wrong) || 0;
    const blank = parseInt(formData.blank) || 0;

    if (correct + wrong + blank !== total) {
      toast.error('Doğru + Yanlış + Boş = Toplam Soru olmalı');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/student/soru-takip`, {
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        lesson: formData.lesson,
        topic: formData.topic || null,
        source: formData.source || null,
        solved: total,
        correct: correct,
        wrong: wrong,
        blank: blank
      });

      toast.success('Soru çalışman kaydedildi!');
      setOpen(false);
      setFormData({
        lesson: '',
        topic: '',
        source: '',
        solved: '',
        correct: '',
        wrong: '',
        blank: ''
      });
    } catch (error) {
      toast.error('Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const accuracy = formData.solved && formData.correct
    ? ((parseInt(formData.correct) / parseInt(formData.solved)) * 100).toFixed(1)
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Soru Çalışması Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bugünkü Soru Çalışman</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Ders *</label>
              <select
                value={formData.lesson}
                onChange={(e) => setFormData({...formData, lesson: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Seç</option>
                {DERSLER.map(ders => (
                  <option key={ders} value={ders}>{ders}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Konu</label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                placeholder="Örn: Türev"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Kaynak</label>
            <Input
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              placeholder="Örn: Palme Matematik"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Toplam *</label>
              <Input
                type="number"
                value={formData.solved}
                onChange={(e) => setFormData({...formData, solved: e.target.value})}
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Doğru
              </label>
              <Input
                type="number"
                value={formData.correct}
                onChange={(e) => setFormData({...formData, correct: e.target.value})}
                placeholder="40"
                className="border-green-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Yanlış
              </label>
              <Input
                type="number"
                value={formData.wrong}
                onChange={(e) => setFormData({...formData, wrong: e.target.value})}
                placeholder="8"
                className="border-red-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600 flex items-center gap-1">
                <MinusCircle className="w-4 h-4" /> Boş
              </label>
              <Input
                type="number"
                value={formData.blank}
                onChange={(e) => setFormData({...formData, blank: e.target.value})}
                placeholder="2"
                className="border-gray-300"
              />
            </div>
          </div>

          {formData.solved && formData.correct && (
            <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Başarı Oranın:</span>
                <span className="text-2xl font-bold text-indigo-600">{accuracy}%</span>
              </div>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
