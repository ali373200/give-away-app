import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  ArrowLeft,
  AlertTriangle,
  ParkingCircle,
  ShieldAlert,
  CheckCircle,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';

const ISSUE_OPTIONS = [
  {
    type: 'wrong_parking',
    label: 'Your vehicle is on the wrong way, please',
    icon: ParkingCircle,
    color: '#f59e0b',
  },
  {
    type: 'damage',
    label: 'Your vehicle is damaged, please',
    icon: AlertTriangle,
    color: '#ef4444',
  },
  {
    type: 'suspicious',
    label: 'Please check your vehicle, there is something wrong',
    icon: ShieldAlert,
    color: '#8b5cf6',
  },
];

export default function ReportIssue() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [message, setMessage] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicle();
  }, [qrCodeId]);

  const loadVehicle = async () => {
    try {
      const res = await api.get(`/api/lookup/${qrCodeId}`);
      setVehicle(res.data);
    } catch (err) {
      setError('Vehicle not found. Invalid QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIssue) {
      setError('Please select an issue type');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/report/${qrCodeId}`, {
        issue_type: selectedIssue,
        message: message || null,
        reporter_name: reporterName || null,
        reporter_contact: reporterContact || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading vehicle info...</div>;
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="page-content success-page">
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Report Submitted!</h2>
          <p>The vehicle owner has been notified about the issue.</p>
          <p>They will take action shortly.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={24} />
        </button>
        <h1>Report Issue</h1>
      </header>

      <div className="page-content">
        {error && <div className="error-message">{error}</div>}

        {vehicle && (
          <div className="vehicle-info-card">
            <h3>Vehicle Found</h3>
            <p className="plate-display">{vehicle.plate_number}</p>
            {vehicle.vehicle_name && <p>{vehicle.vehicle_name}</p>}
            {vehicle.color && <p className="color-tag">{vehicle.color}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 className="section-title">Select Issue</h3>
          <div className="issue-options">
            {ISSUE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  type="button"
                  className={`issue-card ${selectedIssue === option.type ? 'selected' : ''}`}
                  onClick={() => setSelectedIssue(option.type)}
                  style={{
                    '--issue-color': option.color,
                  }}
                >
                  <Icon size={28} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          <h3 className="section-title">Additional Details (Optional)</h3>

          <div className="input-group">
            <MessageSquare size={20} className="input-icon" />
            <textarea
              placeholder="Additional message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <Phone size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Your Contact (optional)"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting || !selectedIssue}
          >
            {submitting ? 'Sending...' : 'Send Alert to Owner'}
          </button>
        </form>
      </div>
    </div>
  );
}
