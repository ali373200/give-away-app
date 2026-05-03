import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, Shield, Bell, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-icon">
          <QrCode size={64} />
        </div>
        <h1>Give Away</h1>
        <p className="hero-subtitle">
          Smart Vehicle Communication via QR Code
        </p>
        <p className="hero-desc">
          Register your vehicle, get a QR code, and let people notify you
          about parking issues, damage, or anything suspicious.
        </p>
      </div>

      <div className="features">
        <div className="feature-card">
          <QrCode size={32} />
          <h3>QR Code for Your Vehicle</h3>
          <p>Generate a unique QR code to stick on your vehicle</p>
        </div>
        <div className="feature-card">
          <Shield size={32} />
          <h3>Report Issues Instantly</h3>
          <p>Scan any vehicle's QR to report parking or damage issues</p>
        </div>
        <div className="feature-card">
          <Bell size={32} />
          <h3>Get Notified</h3>
          <p>Receive instant alerts when someone reports an issue</p>
        </div>
      </div>

      <div className="home-actions">
        {user ? (
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Go to Dashboard <ArrowRight size={20} />
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Login
            </Link>
          </>
        )}
        <Link to="/scan" className="btn btn-scan btn-lg">
          <QrCode size={20} /> Scan a QR Code
        </Link>
      </div>
    </div>
  );
}
