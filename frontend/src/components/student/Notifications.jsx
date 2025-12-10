import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Notifications({ studentId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [studentId]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/student/${studentId}/notifications`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-emerald-50 border-green-300';
      case 'warning':
        return 'from-amber-50 to-orange-50 border-amber-300';
      case 'alert':
        return 'from-red-50 to-pink-50 border-red-300';
      default:
        return 'from-blue-50 to-indigo-50 border-blue-300';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Yükleniyor...</div>;
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-8 text-center gradient-card">
        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">Henüz bildirim yok</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Bildirimler
        </h3>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
            {unreadCount} Yeni
          </span>
        )}
      </div>

      {notifications.map((notif) => (
        <Card
          key={notif.id}
          className={`p-4 bg-gradient-to-r ${getColor(notif.type)} border-2 cursor-pointer hover:shadow-md transition-shadow ${
            !notif.is_read ? 'shadow-lg' : 'opacity-75'
          }`}
          onClick={() => !notif.is_read && markAsRead(notif.id)}
        >
          <div className="flex items-start gap-3">
            {getIcon(notif.type)}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-gray-800">{notif.title}</h4>
                {!notif.is_read && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(notif.created_at).toLocaleString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {notif.is_read && <CheckCheck className="w-5 h-5 text-gray-400" />}
          </div>
        </Card>
      ))}
    </div>
  );
}
