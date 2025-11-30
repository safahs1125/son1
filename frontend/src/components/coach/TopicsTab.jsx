import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import CollapsibleCourseSection from './CollapsibleCourseSection';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TopicsTab({ studentId }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTopic, setNewTopic] = useState({ ders: '', konu: '', sinav_turu: 'TYT', ayt_type: 'Sayısal AYT' });

  useEffect(() => {
    fetchTopics();
  }, [studentId]);

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/topics/${studentId}`);
      setTopics(response.data);
    } catch (error) {
      toast.error('Konular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.ders || !newTopic.konu) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/topics`, {
        student_id: studentId,
        ...newTopic,
        durum: 'baslanmadi',
        order_index: topics.length
      });
      toast.success('Konu eklendi');
      setOpenDialog(false);
      setNewTopic({ ders: '', konu: '' });
      fetchTopics();
    } catch (error) {
      toast.error('Konu eklenemedi');
    }
  };

  const handleUpdateStatus = async (topicId, newStatus) => {
    try {
      await axios.put(`${BACKEND_URL}/api/topics/${topicId}`, { durum: newStatus });
      toast.success('Durum güncellendi');
      fetchTopics();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Bu konuyu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/topics/${topicId}`);
      toast.success('Konu silindi');
      fetchTopics();
    } catch (error) {
      toast.error('Konu silinemedi');
    }
  };

  const groupedTopics = topics.reduce((acc, topic) => {
    const sinavKey = topic.sinav_turu || 'TYT';
    if (!acc[sinavKey]) acc[sinavKey] = {};
    if (!acc[sinavKey][topic.ders]) acc[sinavKey][topic.ders] = [];
    acc[sinavKey][topic.ders].push(topic);
    return acc;
  }, {});

  const getProgress = () => {
    if (topics.length === 0) return 0;
    const completed = topics.filter(t => t.durum === 'tamamlandi').length;
    return Math.round((completed / topics.length) * 100);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="p-6 gradient-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Konu İlerlemesi</h3>
            <p className="text-gray-600 mt-1">{topics.filter(t => t.durum === 'tamamlandi').length} / {topics.length} konu tamamlandı</p>
          </div>
          <div className="text-4xl font-bold text-violet-600">{getProgress()}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
      </Card>

      {/* Add Topic Button */}
      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-topic-button" className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Konu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Konu Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ders</label>
                <Input
                  value={newTopic.ders}
                  onChange={(e) => setNewTopic({ ...newTopic, ders: e.target.value })}
                  placeholder="Ör: Matematik"
                  data-testid="topic-ders-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Konu</label>
                <Input
                  value={newTopic.konu}
                  onChange={(e) => setNewTopic({ ...newTopic, konu: e.target.value })}
                  placeholder="Ör: Limit"
                  data-testid="topic-konu-input"
                />
              </div>
              <Button onClick={handleAddTopic} className="w-full" data-testid="create-topic-button">
                Konu Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topics by Exam Type and Subject */}
      <div className="space-y-8">
        {Object.entries(groupedTopics).map(([sinavType, dersGroups]) => (
          <div key={sinavType} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <span className={`px-4 py-2 rounded-lg mr-3 ${sinavType === 'TYT' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : 'bg-gradient-to-r from-violet-500 to-purple-600'} text-white`}>
                {sinavType}
              </span>
            </h2>
            <div className="space-y-4">
              {Object.entries(dersGroups).map(([ders, dersTopics]) => (
                <Card key={ders} className="p-6 gradient-card">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full mr-3"></span>
                    {ders}
                  </h3>
                  <div className="space-y-3">
                    {dersTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                        data-testid={`topic-item-${topic.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{topic.konu}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select value={topic.durum} onValueChange={(value) => handleUpdateStatus(topic.id, value)}>
                            <SelectTrigger className="w-[180px]" data-testid={`topic-status-${topic.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baslanmadi">
                                <span className="status-badge status-baslanmadi">Başlanmadı</span>
                              </SelectItem>
                              <SelectItem value="devam">
                                <span className="status-badge status-devam">Devam Ediyor</span>
                              </SelectItem>
                              <SelectItem value="tamamlandi">
                                <span className="status-badge status-tamamlandi">Tamamlandı</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTopic(topic.id)}
                            data-testid={`delete-topic-${topic.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <Card className="p-12 text-center gradient-card">
          <p className="text-gray-500">Henüz konu eklenmemiş</p>
        </Card>
      )}
    </div>
  );
}
