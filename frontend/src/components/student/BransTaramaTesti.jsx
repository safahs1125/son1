import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BRANS_DERSLER = [
  'TYT Türkçe',
  'TYT Matematik',
  'TYT Fen Bilimleri',
  'TYT Sosyal Bilimler',
  'AYT Matematik',
  'AYT Fizik',
  'AYT Kimya',
  'AYT Biyoloji',
  'AYT Edebiyat',
  'AYT Tarih',
  'AYT Coğrafya',
];

export default function BransTaramaTesti({ studentId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lesson: '',
    correct: '',
    wrong: '',
    blank: '',
  });

  const handleSubmit = async () => {
    if (!formData.lesson) {
      toast.error('Ders seçimi zorunlu');
      return;
    }

    const correct = parseInt(formData.correct) || 0;
    const wrong = parseInt(formData.wrong) || 0;
    const blank = parseInt(formData.blank) || 0;
    const total = correct + wrong + blank;

    if (total === 0) {
      toast.error('En az bir değer girilmeli');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/student/brans-tarama`, {
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        lesson: formData.lesson,
        correct: correct,
        wrong: wrong,
        blank: blank,
        total: total,
      });

      toast.success('Branş tarama testi kaydedildi!');
      setOpen(false);
      setFormData({
        lesson: '',
        correct: '',
        wrong: '',
        blank: '',
      });
    } catch (error) {
      toast.error('Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const total = (parseInt(formData.correct) || 0) + (parseInt(formData.wrong) || 0) + (parseInt(formData.blank) || 0);
  const net = (parseInt(formData.correct) || 0) - (parseInt(formData.wrong) || 0) / 4;
  const accuracy = total > 0 ? ((parseInt(formData.correct) || 0) / total * 100).toFixed(1) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600">
          <Target className="w-4 h-4 mr-2" />
          Branş Tarama Testi Ekle
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Branş Tarama Testi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Ders Seçin</label>
            <select
              value={formData.lesson}
              onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Ders seçiniz...</option>
              {BRANS_DERSLER.map((ders) => (
                <option key={ders} value={ders}>
                  {ders}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Doğru</label>
              <Input
                type="number"
                min="0"
                value={formData.correct}
                onChange={(e) => setFormData({ ...formData, correct: e.target.value })}
                placeholder="0"
                className="bg-green-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Yanlış</label>
              <Input
                type="number"
                min="0"
                value={formData.wrong}
                onChange={(e) => setFormData({ ...formData, wrong: e.target.value })}
                placeholder="0"
                className="bg-red-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Boş</label>
              <Input
                type="number"
                min="0"
                value={formData.blank}
                onChange={(e) => setFormData({ ...formData, blank: e.target.value })}
                placeholder="0"
                className="bg-gray-50"
              />
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">Toplam Soru</p>
                <p className="text-xl font-bold text-indigo-600">{total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Net</p>
                <p className="text-xl font-bold text-green-600">{net.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Başarı</p>
                <p className="text-xl font-bold text-purple-600">%{accuracy}</p>
              </div>
            </div>
          </Card>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
