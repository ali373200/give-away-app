import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Bell, CheckCheck, AlertTriangle, Clock } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-icon">
          <ArrowLeft size={24} />
        </button>
        <h1>Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="btn btn-sm btn-outline">
            <CheckCheck size={16} /> Read All
          </button>
        )}
      </header>

      <div className="page-content">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notification-list full">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-card ${!n.is_read ? 'unread' : ''}`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className="notif-icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="notif-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <div className="notif-meta">
                    <span className="notif-time">
                      <Clock size={14} /> {timeAgo(n.created_at)}
                    </span>
                    {!n.is_read && <span className="unread-dot" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
