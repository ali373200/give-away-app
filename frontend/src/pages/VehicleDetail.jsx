import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Download, Printer, Trash2 } from 'lucide-react';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const [vehiclesRes, qrRes] = await Promise.all([
        api.get('/api/vehicles'),
        api.get(`/api/vehicles/${id}/qr-data`),
      ]);
      const v = vehiclesRes.data.find((v) => v.id === id);
      setVehicle(v);
      setQrData(qrRes.data);
    } catch (err) {
      console.error('Failed to load vehicle', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.download = `qr-${vehicle.plate_number}.png`;
    link.href = qrData.qr_image;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${vehicle.plate_number}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <h2>Give Away - Vehicle QR Code</h2>
          <img src="${qrData.qr_image}" style="width:300px;height:300px;" />
          <h3>${vehicle.plate_number}</h3>
          <p>${vehicle.vehicle_name || ''} ${vehicle.color ? `(${vehicle.color})` : ''}</p>
          <p style="color:#666;font-size:14px;">Scan this QR code to report issues</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete vehicle', err);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="loading-screen">Vehicle not found</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-icon">
          <ArrowLeft size={24} />
        </button>
        <h1>{vehicle.vehicle_name || vehicle.plate_number}</h1>
      </header>

      <div className="page-content">
        <div className="vehicle-detail-card">
          <div className="vehicle-detail-info">
            <div className="detail-row">
              <span className="label">Plate Number</span>
              <span className="value">{vehicle.plate_number}</span>
            </div>
            {vehicle.vehicle_name && (
              <div className="detail-row">
                <span className="label">Name</span>
                <span className="value">{vehicle.vehicle_name}</span>
              </div>
            )}
            {vehicle.color && (
              <div className="detail-row">
                <span className="label">Color</span>
                <span className="value">{vehicle.color}</span>
              </div>
            )}
          </div>
        </div>

        <div className="qr-section">
          <h2>Your QR Code</h2>
          <p className="qr-instruction">
            Print this QR code and stick it on your vehicle's front and back.
            Anyone can scan it to notify you about issues.
          </p>

          {qrData && (
            <div className="qr-display" ref={qrRef}>
              <img src={qrData.qr_image} alt="Vehicle QR Code" className="qr-image" />
            </div>
          )}

          <div className="qr-actions">
            <button onClick={handleDownload} className="btn btn-primary">
              <Download size={18} /> Download
            </button>
            <button onClick={handlePrint} className="btn btn-outline">
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <button onClick={handleDelete} className="btn btn-danger btn-full">
          <Trash2 size={18} /> Delete Vehicle
        </button>
      </div>
    </div>
  );
}
