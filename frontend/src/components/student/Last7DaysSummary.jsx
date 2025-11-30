import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle, BookOpen, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Last7DaysSummary({ studentId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [studentId]);

  const fetchSummary = async () => {
    if (!studentId) {
      console.error('StudentId is missing');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching summary for student:', studentId);
      const response = await axios.get(`${BACKEND_URL}/api/student/${studentId}/last-7-days-summary`);
      console.log('Summary response:', response.data);
      setSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Summary fetch error:', error);
      toast.error('Özet yüklenemedi');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><div className="loading-spinner"></div></div>;
  }

  if (!summary) {
    return null;
  }

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">Son 7 Gün Özeti</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 gradient-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Çalışma</p>
              <p className="text-2xl font-bold text-gray-800">{formatMinutes(summary.total_minutes)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tamamlanan Görev</p>
              <p className="text-2xl font-bold text-gray-800">{summary.completed_tasks_count}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Konu</p>
              <p className="text-2xl font-bold text-gray-800">{summary.total_topics}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="p-6 gradient-card">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Günlük Aktivite
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={summary.daily_activity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
              formatter={(value, name) => {
                if (name === 'minutes') return [formatMinutes(value), 'Süre'];
                return [value, 'Görev'];
              }}
            />
            <Bar dataKey="minutes" fill="#8b5cf6" name="minutes" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
