import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, Keyboard } from 'lucide-react';

export default function ScanQR() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScanning = async () => {
    setError('');
    setScanning(true);
    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5Qr.stop().catch(() => {});
          handleScanResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setError('Camera access denied or not available. Use manual entry instead.');
      setScanning(false);
      setShowManual(true);
    }
  };

  const handleScanResult = (result) => {
    setScanning(false);
    const match = result.match(/\/report\/([a-f0-9-]+)/);
    if (match) {
      navigate(`/report/${match[1]}`);
    } else {
      navigate(`/report/${result}`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      const match = manualCode.match(/\/report\/([a-f0-9-]+)/);
      if (match) {
        navigate(`/report/${match[1]}`);
      } else {
        navigate(`/report/${manualCode.trim()}`);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={24} />
        </button>
        <h1>Scan QR Code</h1>
      </header>

      <div className="page-content scan-page">
        <div className="scan-instructions">
          <QrCode size={48} />
          <h2>Scan Vehicle QR Code</h2>
          <p>Point your camera at the QR code on the vehicle to report an issue</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div id="qr-reader" ref={scannerRef} className="qr-scanner" />

        {!scanning && !showManual && (
          <div className="scan-actions">
            <button onClick={startScanning} className="btn btn-primary btn-full">
              <Camera size={20} /> Start Camera
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="btn btn-outline btn-full"
            >
              <Keyboard size={20} /> Enter Code Manually
            </button>
          </div>
        )}

        {showManual && (
          <form onSubmit={handleManualSubmit} className="manual-entry">
            <div className="input-group">
              <QrCode size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Enter QR Code ID"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
