import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/coach/login`, { email, password });
      if (response.data.success) {
        localStorage.setItem('coachToken', response.data.token);
        localStorage.setItem('coachEmail', response.data.email);
        toast.success('Giriş başarılı!');
        navigate('/coach/dashboard');
      }
    } catch (error) {
      toast.error('Email veya şifre hatalı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 gradient-card page-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Coach Girişi</h1>
          <p className="text-gray-600">TYT-AYT Koçluk Sistemi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Coach şifrenizi girin"
              required
              data-testid="coach-password-input"
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            data-testid="coach-login-button"
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Öğrenci misiniz?{' '}
            <a href="/student" className="text-violet-600 hover:text-violet-700 font-semibold">
              Öğrenci Girişi
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
