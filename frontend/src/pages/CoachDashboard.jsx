import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, LogOut, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    ad: '',
    soyad: '',
    bolum: 'Sayısal',
    hedef: '',
    notlar: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('coachToken');
    if (!token) {
      navigate('/coach/login');
      return;
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student => 
      `${student.ad} ${student.soyad || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.bolum?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/students`);
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      toast.error('Öğrenciler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/students`, newStudent);
      // Initialize topics
      await axios.post(`${BACKEND_URL}/api/topics/init/${response.data.id}?bolum=${newStudent.bolum}`);
      toast.success('Öğrenci başarıyla eklendi!');
      setOpenDialog(false);
      setNewStudent({ ad: '', soyad: '', bolum: 'Sayısal', hedef: '', notlar: '' });
      fetchStudents();
    } catch (error) {
      toast.error('Öğrenci eklenirken hata oluştu');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`${studentName} adlı öğrenciyi silmek istediğinize emin misiniz? Tüm verileri silinecek!`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/students/${studentId}`);
      toast.success('Öğrenci silindi');
      fetchStudents();
    } catch (error) {
      toast.error('Öğrenci silinirken hata oluştu');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coachToken');
    navigate('/coach/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto page-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Coach Paneli</h1>
            <p className="text-gray-600">Öğrencilerinizi yönetin</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button data-testid="add-student-button" className="bg-gradient-to-r from-violet-500 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Öğrenci
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ad *</label>
                    <Input
                      value={newStudent.ad}
                      onChange={(e) => setNewStudent({ ...newStudent, ad: e.target.value })}
                      placeholder="Öğrenci adı"
                      data-testid="student-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Soyad</label>
                    <Input
                      value={newStudent.soyad}
                      onChange={(e) => setNewStudent({ ...newStudent, soyad: e.target.value })}
                      placeholder="Öğrenci soyadı"
                      data-testid="student-surname-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bölüm *</label>
                    <Select value={newStudent.bolum} onValueChange={(value) => setNewStudent({ ...newStudent, bolum: value })}>
                      <SelectTrigger data-testid="student-bolum-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sayısal">Sayısal</SelectItem>
                        <SelectItem value="Eşit Ağırlık">Eşit Ağırlık</SelectItem>
                        <SelectItem value="Sözel">Sözel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hedef Sıralama</label>
                    <Input
                      value={newStudent.hedef}
                      onChange={(e) => setNewStudent({ ...newStudent, hedef: e.target.value })}
                      placeholder="Örn: 5000"
                      data-testid="student-hedef-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notlar</label>
                    <Input
                      value={newStudent.notlar}
                      onChange={(e) => setNewStudent({ ...newStudent, notlar: e.target.value })}
                      placeholder="Ek notlar"
                      data-testid="student-notes-input"
                    />
                  </div>
                  <Button onClick={handleCreateStudent} className="w-full" data-testid="create-student-button">
                    Öğrenci Ekle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Öğrenci ara..."
              className="pl-10"
              data-testid="search-student-input"
            />
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card className="p-12 text-center gradient-card">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz öğrenci yok</h3>
            <p className="text-gray-500 mb-6">İlk öğrencinizi ekleyerek başlayın</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="p-6 gradient-card card-hover relative"
                data-testid={`student-card-${student.id}`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/coach/student/${student.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {student.ad.charAt(0)}{student.soyad?.charAt(0) || ''}
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 rounded-full text-xs font-semibold">
                      {student.bolum}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {student.ad} {student.soyad || ''}
                  </h3>
                  {student.hedef && (
                    <p className="text-sm text-gray-600 mb-2">🎯 Hedef: {student.hedef}</p>
                  )}
                  {student.notlar && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">{student.notlar}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStudent(student.id, `${student.ad} ${student.soyad || ''}`);
                  }}
                  data-testid={`delete-student-${student.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
