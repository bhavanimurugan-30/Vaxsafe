import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Keyboard, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

export default function QRScanner({ onScanSuccess, active = true }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualBatchId, setManualBatchId] = useState('');
  const scannerRef = useRef(null);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader-element');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.info('QR Decoded:', decodedText);
          onScanSuccess(decodedText.trim());
          stopScanner();
        },
        (errorMessage) => {
          // Continuous frame parse errors are normal before barcode is aligned
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera scanner initialization error:', err);
      setCameraError('Camera access unavailable or permission denied. Please use the Manual Batch ID field below.');
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch (e) {}
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBatchId.trim()) {
      onScanSuccess(manualBatchId.trim().toUpperCase());
      setManualBatchId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Scanning Viewport */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              Optical QR Camera Feed
            </h3>
          </div>
          <div>
            {!cameraActive ? (
              <Button
                variant="primary"
                size="sm"
                icon={Camera}
                onClick={startScanner}
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={CameraOff}
                onClick={stopScanner}
              >
                Stop Camera
              </Button>
            )}
          </div>
        </div>

        {/* Scanner Feed Window */}
        <div className="relative bg-slate-900 rounded-lg overflow-hidden min-h-[260px] flex items-center justify-center">
          <div id="reader-element" className="w-full h-full max-w-md"></div>
          
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Camera className="w-12 h-12 mb-3 stroke-1 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">Camera feed is currently standby</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click "Start Camera" to scan vaccine vials or courier transfer manifests.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-slate-300">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-xs text-amber-200 max-w-xs">{cameraError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Fallback Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Manual Batch ID Entry (Demo & Testing Fallback)
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Type or paste any registered Batch ID (e.g. <span className="font-mono font-semibold text-slate-700">VS-9K42P</span>, <span className="font-mono font-semibold text-slate-700">VS-7R12B</span>) to inspect or execute transfer.
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualBatchId}
            onChange={(e) => setManualBatchId(e.target.value.toUpperCase())}
            placeholder="e.g. VS-9K42P"
            className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
          <Button type="submit" variant="primary" size="md">
            Lookup Batch
          </Button>
        </form>
      </div>
    </div>
  );
}
