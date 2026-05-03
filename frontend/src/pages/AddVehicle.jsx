import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Car, ArrowLeft, Hash, Palette } from 'lucide-react';

export default function AddVehicle() {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/vehicles', {
        plate_number: plateNumber,
        vehicle_name: vehicleName || null,
        color: color || null,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={24} />
        </button>
        <h1>Add Vehicle</h1>
      </header>

      <div className="page-content">
        <div className="form-card">
          <div className="form-icon">
            <Car size={48} />
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <Hash size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Plate Number *"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <Car size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Vehicle Name (e.g., My Honda)"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <Palette size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Color (e.g., White)"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add Vehicle & Generate QR'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
