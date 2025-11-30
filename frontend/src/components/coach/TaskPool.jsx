import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TaskPool({ studentId, onTaskAssigned }) {
  const [poolTasks, setPoolTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [newTask, setNewTask] = useState({ aciklama: '', sure: 0 });
  const [bulkTasks, setBulkTasks] = useState(
    Array(15).fill().map(() => ({ aciklama: '', ders: '', konu: '', zorluk: '', sure: 0 }))
  );

  useEffect(() => {
    fetchPoolTasks();
  }, [studentId]);

  const fetchPoolTasks = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/task-pool/${studentId}`);
      setPoolTasks(response.data);
    } catch (error) {
      toast.error('Görev havuzu yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.aciklama || newTask.sure <= 0) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/task-pool`, {
        student_id: studentId,
        aciklama: newTask.aciklama,
        sure: parseInt(newTask.sure)
      });
      toast.success('Görev havuza eklendi');
      setOpenDialog(false);
      setNewTask({ aciklama: '', sure: 0 });
      fetchPoolTasks();
    } catch (error) {
      toast.error('Görev eklenemedi');
    }
  };

  const handleBulkAdd = async () => {
    const validTasks = bulkTasks.filter(t => t.aciklama.trim() && t.sure > 0);
    
    if (validTasks.length === 0) {
      toast.error('Lütfen en az bir görev girin');
      return;
    }

    try {
      const promises = validTasks.map(task => {
        const taskDescription = task.ders && task.konu 
          ? `${task.ders} - ${task.konu}${task.zorluk ? ' (' + task.zorluk + ')' : ''} - ${task.aciklama}`
          : task.aciklama;

        return axios.post(`${BACKEND_URL}/api/task-pool`, {
          student_id: studentId,
          aciklama: taskDescription,
          sure: parseInt(task.sure)
        });
      });

      await Promise.all(promises);
      toast.success(`${validTasks.length} görev havuza eklendi`);
      setOpenBulkDialog(false);
      setBulkTasks(Array(15).fill().map(() => ({ aciklama: '', ders: '', konu: '', zorluk: '', sure: 0 })));
      fetchPoolTasks();
    } catch (error) {
      toast.error('Görevler eklenemedi');
    }
  };

  const updateBulkTask = (index, field, value) => {
    const updated = [...bulkTasks];
    updated[index][field] = value;
    setBulkTasks(updated);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi havuzdan silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/task-pool/${taskId}`);
      toast.success('Görev silindi');
      fetchPoolTasks();
    } catch (error) {
      toast.error('Görev silinemedi');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><div className="loading-spinner"></div></div>;
  }

  return (
    <Card className="p-4 gradient-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Görev Havuzu</h3>
        <div className="flex gap-2">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="bg-white">
                <Plus className="w-4 h-4 mr-2" />
                Tek Görev
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Havuza Görev Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Görev Açıklaması</label>
                <Input
                  value={newTask.aciklama}
                  onChange={(e) => setNewTask({ ...newTask, aciklama: e.target.value })}
                  placeholder="Ör: Matematik türev çalış"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Süre (dakika)</label>
                <Input
                  type="number"
                  value={newTask.sure}
                  onChange={(e) => setNewTask({ ...newTask, sure: e.target.value })}
                  placeholder="60"
                />
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Havuza Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {poolTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Havuzda görev yok</p>
        ) : (
          poolTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-amber-500 flex items-center justify-between"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('taskPoolId', task.id);
                e.dataTransfer.setData('taskType', 'pool');
              }}
            >
              <div className="flex items-center gap-2 flex-1">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{task.aciklama}</p>
                  <p className="text-xs text-gray-500">{task.sure}dk</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTask(task.id)}
                className="p-1"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Görevleri sürükleyip günlere atayın
      </p>
    </Card>
  );
}
