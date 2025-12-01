import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TaskPool from './TaskPool';
import TaskHistory from './TaskHistory';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function TasksTab({ studentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Pazartesi');
  const [newTasks, setNewTasks] = useState([
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
    { aciklama: '', sure: 0 },
  ]);

  useEffect(() => {
    fetchTasks();
  }, [studentId]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/tasks/${studentId}`);
      setTasks(response.data);
    } catch (error) {
      toast.error('Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTasks = async () => {
    // Filter out empty tasks
    const validTasks = newTasks.filter(t => t.aciklama.trim() && t.sure > 0);
    
    if (validTasks.length === 0) {
      toast.error('Lütfen en az bir görev girin');
      return;
    }
    
    try {
      const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const dayIndex = DAYS.indexOf(selectedDay);
      const taskDate = addDays(currentWeek, dayIndex);
      const existingTaskCount = tasks.filter(t => t.gun === selectedDay).length;
      
      // Add all tasks
      const promises = validTasks.map((task, index) => 
        axios.post(`${BACKEND_URL}/api/tasks`, {
          student_id: studentId,
          aciklama: task.aciklama,
          sure: parseInt(task.sure),
          tarih: format(taskDate, 'yyyy-MM-dd'),
          gun: selectedDay,
          order_index: existingTaskCount + index,
          completed: false
        })
      );
      
      await Promise.all(promises);
      toast.success(`${validTasks.length} görev eklendi`);
      setOpenDialog(false);
      setNewTasks([
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
        { aciklama: '', sure: 0 },
      ]);
      fetchTasks();
    } catch (error) {
      toast.error('Görevler eklenirken hata oluştu');
    }
  };

  const updateTaskField = (index, field, value) => {
    const updated = [...newTasks];
    updated[index][field] = value;
    setNewTasks(updated);
  };

  const handleToggleComplete = async (task) => {
    try {
      await axios.put(`${BACKEND_URL}/api/tasks/${task.id}`, {
        completed: !task.completed
      });
      fetchTasks();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/tasks/${taskId}`);
      toast.success('Görev silindi');
      fetchTasks();
    } catch (error) {
      toast.error('Görev silinemedi');
    }
  };

  const getTasksByDay = (day) => {
    return tasks.filter(t => t.gun === day);
  };

  const getDayTotalMinutes = (day) => {
    return getTasksByDay(day).reduce((sum, task) => sum + task.sure, 0);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Görev havuzundan günlere sürükleme
    if (source.droppableId === 'task-pool') {
      try {
        const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        const dayIndex = DAYS.indexOf(destination.droppableId);
        const taskDate = addDays(currentWeek, dayIndex);

        await axios.post(`${BACKEND_URL}/api/task-pool/${draggableId}/assign`, null, {
          params: {
            tarih: format(taskDate, 'yyyy-MM-dd'),
            gun: destination.droppableId
          }
        });

        toast.success('Görev atandı');
        fetchTasks();
      } catch (error) {
        console.error('Task assign error:', error);
        toast.error('Görev atanamadı');
      }
      return;
    }

    // Günler arası taşıma
    if (source.droppableId !== destination.droppableId) {
      try {
        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        const dayIndex = DAYS.indexOf(destination.droppableId);
        const newDate = addDays(currentWeek, dayIndex);

        await axios.put(`${BACKEND_URL}/api/tasks/${draggableId}`, {
          gun: destination.droppableId,
          tarih: format(newDate, 'yyyy-MM-dd')
        });

        toast.success('Görev taşındı');
        fetchTasks();
      } catch (error) {
        toast.error('Görev taşınamadı');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 gradient-card">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Haftalık Özet</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Toplam Görev</p>
            <p className="text-2xl font-bold text-violet-600">{tasks.length}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Tamamlanan</p>
            <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.completed).length}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Bekleyen</p>
            <p className="text-2xl font-bold text-orange-600">{tasks.filter(t => !t.completed).length}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Toplam Süre</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(tasks.reduce((sum, t) => sum + t.sure, 0) / 60)}s
            </p>
          </div>
        </div>
      </Card>

      {/* Add Task Button */}
      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-task-button" className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Toplu Görev Ekle (10&apos;a kadar)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gün Seçin</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  data-testid="task-day-select"
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Görevleri girin (boş bırakılanlar eklenmeyecek):</p>
                {newTasks.map((task, index) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-500 min-w-[30px]">{index + 1}.</span>
                      <Input
                        value={task.aciklama}
                        onChange={(e) => updateTaskField(index, 'aciklama', e.target.value)}
                        placeholder={`Görev ${index + 1} açıklaması`}
                        className="flex-1"
                        data-testid={`task-description-${index}`}
                      />
                      <Input
                        type="number"
                        value={task.sure || ''}
                        onChange={(e) => updateTaskField(index, 'sure', e.target.value)}
                        placeholder="dk"
                        className="w-20"
                        data-testid={`task-duration-${index}`}
                      />
                    </div>
                  </Card>
                ))}
              </div>
              
              <Button onClick={handleAddTasks} className="w-full" data-testid="create-tasks-button">
                Görevleri Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Pool and Weekly View with Drag & Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <TaskPool studentId={studentId} onTaskAssigned={fetchTasks} />

        {/* Weekly View with Dates */}
        <h3 className="text-xl font-bold text-gray-800 mt-6 mb-4">Bu Hafta</h3>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS.map((day, idx) => {
            const dayTasks = getTasksByDay(day);
            const totalMinutes = getDayTotalMinutes(day);
            const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
            const dayDate = addDays(currentWeek, idx);
            
            return (
              <Droppable key={day} droppableId={day}>
                {(provided, snapshot) => (
                  <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 gradient-card ${snapshot.isDraggingOver ? 'ring-2 ring-purple-400' : ''}`}
                    data-testid={`day-card-${day}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-bold text-gray-800 text-center">{day}</h4>
                <p className="text-xs text-gray-600 text-center">
                  {format(dayDate, 'd MMM yyyy', { locale: tr })}
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  {totalMinutes}dk ({Math.round(totalMinutes / 60)}s)
                </p>
              </div>
              
                    <div className="space-y-2">
                      {dayTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 rounded-lg bg-white shadow-sm border-l-4 ${
                                task.completed ? 'border-green-500' : 'border-orange-500'
                              } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              data-testid={`task-item-${task.id}`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-1">
                                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                </div>
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => handleToggleComplete(task)}
                                  className="mt-1"
                                  data-testid={`task-checkbox-${task.id}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm break-words ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {task.aciklama}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">{task.sure}dk</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 h-auto"
                                  data-testid={`delete-task-${task.id}`}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {dayTasks.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Görev yok</p>
                      )}
                    </div>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task History */}
      <div className="mt-8">
        <TaskHistory tasks={tasks} />
      </div>
    </div>
  );
}
