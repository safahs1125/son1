import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function BookRecommendations() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newBook, setNewBook] = useState({ name: '', level: 'Kolay', description: '' });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/books`);
      setBooks(response.data);
    } catch (error) {
      toast.error('Kitaplar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!newBook.name.trim()) {
      toast.error('Lütfen kitap adı girin');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/books`, newBook);
      toast.success('Kitap eklendi');
      setOpenDialog(false);
      setNewBook({ name: '', level: 'Kolay', description: '' });
      fetchBooks();
    } catch (error) {
      toast.error('Kitap eklenemedi');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Bu kitabı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/books/${bookId}`);
      toast.success('Kitap silindi');
      fetchBooks();
    } catch (error) {
      toast.error('Kitap silinemedi');
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Kolay':
        return 'bg-green-100 text-green-700';
      case 'Orta':
        return 'bg-amber-100 text-amber-700';
      case 'Zor':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const groupedBooks = books.reduce((acc, book) => {
    if (!acc[book.level]) acc[book.level] = [];
    acc[book.level].push(book);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-book-button" className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Kitap Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kitap Önerisi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kitap Adı</label>
                <Input
                  value={newBook.name}
                  onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                  placeholder="Kitap adı"
                  data-testid="book-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Seviye</label>
                <Select value={newBook.level} onValueChange={(value) => setNewBook({ ...newBook, level: value })}>
                  <SelectTrigger data-testid="book-level-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kolay">Kolay</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Zor">Zor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Açıklama (Opsiyonel)</label>
                <Textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Kitap hakkında notlar..."
                  rows={4}
                  data-testid="book-description-input"
                />
              </div>
              <Button onClick={handleAddBook} className="w-full" data-testid="create-book-button">
                Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <Card className="p-12 text-center gradient-card">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz kitap önerisi yok</h3>
          <p className="text-gray-500">İlk kitap önerinizi ekleyerek başlayın</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {['Kolay', 'Orta', 'Zor'].map(level => (
            groupedBooks[level] && groupedBooks[level].length > 0 && (
              <div key={level}>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className={`px-4 py-2 rounded-lg mr-3 ${getLevelColor(level)}`}>
                    {level}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBooks[level].map((book) => (
                    <Card key={book.id} className="p-6 gradient-card card-hover" data-testid={`book-${book.id}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800">{book.name}</h4>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-2 ${getLevelColor(book.level)}`}>
                            {book.level}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBook(book.id)}
                          data-testid={`delete-book-${book.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      {book.description && (
                        <p className="text-sm text-gray-600 mt-3">{book.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
