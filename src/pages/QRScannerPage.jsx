import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import QRScanner from '../components/qr/QRScanner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getVaccineByBatchId, getStatusHistory } from '../services/dataService';
import {
  QrCode,
  Truck,
  CheckCircle2,
  Building2,
  ArrowRight,
  AlertTriangle,
  Boxes,
  Clock,
  Send,
  Download
} from 'lucide-react';

export default function QRScannerPage() {
  const { clinic, currentUser } = useAuth();
  const { allClinics, changeVaccineStatus } = useData();
  const toast = useToast();

  const [scannedBatchId, setScannedBatchId] = useState('');
  const [scannedVaccine, setScannedVaccine] = useState(null);
  const [history, setHistory] = useState([]);
  const [destinationClinicId, setDestinationClinicId] = useState('');
  const [transitNotes, setTransitNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleScanSuccess = async (batchId) => {
    setScannedBatchId(batchId);
    setLookupError('');
    try {
      const vac = await getVaccineByBatchId(batchId);
      if (vac) {
        setScannedVaccine(vac);
        const hist = await getStatusHistory(vac.id);
        setHistory(hist);
        // Default destination to first clinic that isn't current
        const otherClinics = allClinics.filter((c) => c.id !== vac.clinicId);
        if (otherClinics.length > 0) {
          setDestinationClinicId(otherClinics[0].id);
        }
        toast.success(`Batch ${batchId} located: ${vac.vaccineName}`);
      } else {
        setScannedVaccine(null);
        setHistory([]);
        setLookupError(`No vaccine found registered with Batch ID "${batchId}". Please verify the code.`);
        toast.error(`Batch ${batchId} not found in cold-chain database.`);
      }
    } catch (err) {
      setLookupError('Error querying vaccine database: ' + err.message);
    }
  };

  // Dispatch In Transit
  const handleDispatchTransit = async () => {
    if (!destinationClinicId) {
      toast.warning('Please select a destination facility.');
      return;
    }

    const targetClinic = allClinics.find((c) => c.id === destinationClinicId);
    if (!targetClinic) return;

    setIsProcessing(true);
    try {
      await changeVaccineStatus(scannedVaccine.id, 'In Transit', {
        destinationClinicId: targetClinic.id,
        destinationClinicName: targetClinic.name,
        note: `Dispatched from ${clinic.name} to ${targetClinic.name}. ${transitNotes || 'Standard refrigerated cold-box transport.'}`
      });

      toast.success(`Batch ${scannedVaccine.batchId} is now IN TRANSIT to ${targetClinic.name}.`);
      // Reload vaccine
      const updated = await getVaccineByBatchId(scannedVaccine.batchId);
      setScannedVaccine(updated);
      const hist = await getStatusHistory(updated.id);
      setHistory(hist);
      setTransitNotes('');
    } catch (err) {
      toast.error('Failed to update transit status: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Accept Delivery & Receive into facility inventory
  const handleAcceptDelivery = async () => {
    setIsProcessing(true);
    try {
      await changeVaccineStatus(scannedVaccine.id, 'Delivered', {
        destinationClinicId: clinic.id,
        destinationClinicName: clinic.name,
        note: `Delivery received and cold-box temperature verified at ${clinic.name}. Custody accepted.`
      });

      toast.success(`Batch ${scannedVaccine.batchId} marked as DELIVERED. Custody assigned to ${clinic.name}.`);
      const updated = await getVaccineByBatchId(scannedVaccine.batchId);
      setScannedVaccine(updated);
      const hist = await getStatusHistory(updated.id);
      setHistory(hist);
    } catch (err) {
      toast.error('Failed to confirm delivery: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Move back to In Storage
  const handleMoveToStorage = async () => {
    setIsProcessing(true);
    try {
      await changeVaccineStatus(scannedVaccine.id, 'In Storage', {
        note: `Intake into ${clinic.name} primary cold room completed.`
      });
      toast.success(`Batch ${scannedVaccine.batchId} moved to In Storage.`);
      const updated = await getVaccineByBatchId(scannedVaccine.batchId);
      setScannedVaccine(updated);
      const hist = await getStatusHistory(updated.id);
      setHistory(hist);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDestinationClinic =
    scannedVaccine?.destinationClinicId === clinic?.id ||
    scannedVaccine?.clinicId !== clinic?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-teal-700" />
          Optical QR Scanning & Cold-Chain Transit
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan vial barcodes or transfer manifests to execute strict custody handoffs (In Storage → In Transit → Delivered).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Scanner (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <QRScanner onScanSuccess={handleScanSuccess} />

          {/* Quick Demo Batch Quick-Fill Buttons */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Instant Demo Barcode Scans
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['VS-9K42P', 'VS-7R12B', 'VS-3M87Q', 'VS-2F55X', 'VS-6S33D'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleScanSuccess(b)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 transition-colors"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Batch Details & Transit Action Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {lookupError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Batch Lookup Failed</div>
                <div className="mt-0.5">{lookupError}</div>
              </div>
            </div>
          )}

          {!scannedVaccine && !lookupError && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No Vaccine Batch Scanned</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Use the camera scanner or enter a Batch ID on the left to inspect cold-chain status and execute custody transfers.
              </p>
            </div>
          )}

          {scannedVaccine && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              {/* Batch Title Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {scannedVaccine.vaccineName}
                    </h2>
                    <Badge variant={scannedVaccine.status.toLowerCase()} size="md">
                      {scannedVaccine.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Manufacturer: {scannedVaccine.manufacturer} • Qty: <strong>{scannedVaccine.quantity} doses</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Batch ID</div>
                  <div className="font-mono text-base font-bold text-teal-800">
                    {scannedVaccine.batchId}
                  </div>
                </div>
              </div>

              {/* Custody Route Visualization */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Custody & Transit Route
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Origin / Custody</span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {scannedVaccine.clinicName}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                  <div className="flex-1 bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Transit Destination</span>
                    <span className="font-semibold text-sky-900 truncate block">
                      {scannedVaccine.destinationClinicName || 'Local Storage (Not In Transit)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strict Allowed Transition Workflow Action Panel */}
              <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-xl space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-teal-700" />
                  Permitted Custody Transition
                </div>

                {/* Workflow 1: In Storage -> Dispatch In Transit */}
                {scannedVaccine.status === 'In Storage' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      This batch is currently in certified storage. Select a recipient facility to dispatch refrigerated transit:
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Recipient Facility *
                      </label>
                      <select
                        value={destinationClinicId}
                        onChange={(e) => setDestinationClinicId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        {allClinics
                          .filter((c) => c.id !== scannedVaccine.clinicId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.address})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Courier Transfer Manifest Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Carrier #3, PCM Cold Box 4°C validated"
                        value={transitNotes}
                        onChange={(e) => setTransitNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      icon={Send}
                      onClick={handleDispatchTransit}
                      loading={isProcessing}
                    >
                      Dispatch In Transit (In Storage → In Transit)
                    </Button>
                  </div>
                )}

                {/* Workflow 2: In Transit -> Confirm Delivery */}
                {scannedVaccine.status === 'In Transit' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white border border-sky-200 rounded-md text-xs text-sky-950 space-y-1">
                      <div>
                        Status: <strong>In Transit</strong> headed to{' '}
                        <strong>{scannedVaccine.destinationClinicName}</strong>.
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Scanning at recipient facility confirms receipt and transfers custody ownership.
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      icon={CheckCircle2}
                      onClick={handleAcceptDelivery}
                      loading={isProcessing}
                    >
                      Confirm Handoff & Accept Delivery (In Transit → Delivered)
                    </Button>
                  </div>
                )}

                {/* Workflow 3: Delivered -> Move to Storage */}
                {scannedVaccine.status === 'Delivered' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Batch delivery verified. Move batch into certified local cold storage:
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      icon={Boxes}
                      onClick={handleMoveToStorage}
                      loading={isProcessing}
                    >
                      Move to Storage (Delivered → In Storage)
                    </Button>
                  </div>
                )}

                {/* Workflow 4: Compromised */}
                {scannedVaccine.status === 'Compromised' && (
                  <div className="p-3 bg-rose-100 border border-rose-200 rounded text-xs text-rose-900">
                    <strong>BATCH COMPROMISED:</strong> Cold-chain violation logged. This batch cannot be administered without medical director clearance or emergency reclamation reroute.
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Chain-of-Custody Timeline
                </h4>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={h.id || i} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant={h.status.toLowerCase()} size="sm">
                          {h.status}
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-700">{h.note}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Facility: {h.clinicName} • Operator: {h.userId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
