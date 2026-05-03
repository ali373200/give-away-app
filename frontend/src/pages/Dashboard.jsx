import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Car, Bell, Plus, QrCode, AlertTriangle, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesRes, notifsRes, unreadRes] = await Promise.all([
        api.get('/api/vehicles'),
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count'),
      ]);
      setVehicles(vehiclesRes.data);
      setNotifications(notifsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const [notifsRes, unreadRes] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count'),
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Give Away</h1>
          <span className="greeting">Hi, {user?.name}</span>
        </div>
        <div className="header-right">
          <Link to="/notifications" className="notif-badge">
            <Bell size={24} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </Link>
          <button onClick={logout} className="btn-icon" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section">
          <div className="section-header">
            <h2><Car size={20} /> My Vehicles</h2>
            <Link to="/add-vehicle" className="btn btn-primary btn-sm">
              <Plus size={16} /> Add
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="empty-state">
              <Car size={48} />
              <p>No vehicles added yet</p>
              <Link to="/add-vehicle" className="btn btn-primary">
                Add Your First Vehicle
              </Link>
            </div>
          ) : (
            <div className="vehicle-list">
              {vehicles.map((v) => (
                <Link to={`/vehicle/${v.id}`} key={v.id} className="vehicle-card">
                  <div className="vehicle-info">
                    <h3>{v.vehicle_name || v.plate_number}</h3>
                    <p className="plate">{v.plate_number}</p>
                    {v.color && <span className="color-tag">{v.color}</span>}
                  </div>
                  <QrCode size={32} className="qr-icon" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>
              <Bell size={20} /> Recent Alerts
              {unreadCount > 0 && <span className="alert-count">{unreadCount} new</span>}
            </h2>
            <Link to="/notifications" className="btn btn-outline btn-sm">View All</Link>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state small">
              <AlertTriangle size={32} />
              <p>No alerts yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className={`notification-card ${!n.is_read ? 'unread' : ''}`}>
                  <div className="notif-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="notif-content">
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <span className="notif-time">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="quick-actions">
            <Link to="/scan" className="action-card scan">
              <QrCode size={32} />
              <span>Scan QR Code</span>
              <p>Report an issue with a vehicle</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
