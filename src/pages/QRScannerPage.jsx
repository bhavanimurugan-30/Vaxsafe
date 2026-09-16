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
  Download,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  XCircle
} from 'lucide-react';

export default function QRScannerPage() {
  const { clinic, currentUser } = useAuth();
  const { allClinics, scanOutBatch, scanInBatch } = useData();
  const toast = useToast();

  const [activeMode, setActiveMode] = useState('SCAN_OUT'); // 'SCAN_OUT' | 'SCAN_IN'
  const [scannedBatchId, setScannedBatchId] = useState('');
  const [scannedVaccine, setScannedVaccine] = useState(null);
  const [history, setHistory] = useState([]);
  const [destinationClinicId, setDestinationClinicId] = useState('');
  const [transitNotes, setTransitNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState('');

  // Validate scanned vaccine according to activeMode
  const validateScannedBatch = (vac, mode) => {
    if (!vac) return;

    if (mode === 'SCAN_OUT') {
      // 1. Discarded check
      if (vac.status === 'DISCARDED') {
        setValidationError(`Transfer Rejected: Batch "${vac.batchId}" is DISCARDED and cannot be transferred.`);
        return;
      }

      // 2. Duplicate Scan Out check
      if (vac.status === 'IN_TRANSIT' || vac.status === 'In Transit') {
        setValidationError(`Duplicate Scan Out Rejected: Batch "${vac.batchId}" is ALREADY In Transit to ${vac.destinationClinicName || 'destination'}.`);
        return;
      }

      // 3. Custody check
      if (clinic && vac.clinicId !== clinic.id) {
        setValidationError(`Scan Out Warning: Batch "${vac.batchId}" is currently in custody of ${vac.clinicName}, not this facility (${clinic.name}).`);
        return;
      }

      setValidationSuccess(`Valid QR verified: Batch "${vac.batchId}" is eligible for Scan Out.`);
    } else {
      // SCAN_IN mode
      // 1. Discarded check
      if (vac.status === 'DISCARDED') {
        setValidationError(`Scan In Rejected: Batch "${vac.batchId}" is DISCARDED.`);
        return;
      }

      // 2. Scan In without Scan Out / already in storage
      const isTransit = vac.status === 'IN_TRANSIT' || vac.status === 'In Transit';
      if (!isTransit) {
        if ((vac.status === 'IN_STORAGE' || vac.status === 'In Storage' || vac.status === 'Delivered') && vac.clinicId === clinic?.id) {
          setValidationError(`Duplicate Scan In Rejected: Batch "${vac.batchId}" has already been received into storage at ${clinic.name}.`);
          return;
        }
        setValidationError(`Scan In Rejected: Scan In without Scan Out is prohibited. Batch "${vac.batchId}" status is "${vac.status}", not active IN_TRANSIT.`);
        return;
      }

      // 3. Wrong destination check
      if (vac.destinationClinicId && clinic && vac.destinationClinicId !== clinic.id) {
        setValidationError(`Scan In Rejected: Wrong destination! Batch was routed to ${vac.destinationClinicName || vac.destinationClinicId}, not ${clinic.name}.`);
        return;
      }

      setValidationSuccess(`Valid Transfer Verified: Batch "${vac.batchId}" is In Transit to ${clinic?.name || 'this facility'}. Ready for Scan In.`);
    }
  };

  const handleScanSuccess = async (batchId) => {
    const cleanId = batchId.trim().toUpperCase();
    setScannedBatchId(cleanId);
    setValidationError('');
    setValidationSuccess('');

    try {
      const vac = await getVaccineByBatchId(cleanId);
      if (vac) {
        setScannedVaccine(vac);
        const hist = await getStatusHistory(vac.id);
        setHistory(hist);

        let targetMode = activeMode;
        if (vac.status === 'IN_TRANSIT' || vac.status === 'In Transit') {
          if (activeMode !== 'SCAN_IN') {
            targetMode = 'SCAN_IN';
            setActiveMode('SCAN_IN');
          }
        } else if (vac.status === 'In Storage' || vac.status === 'IN_STORAGE') {
          if (activeMode !== 'SCAN_OUT') {
            targetMode = 'SCAN_OUT';
            setActiveMode('SCAN_OUT');
          }
        }

        validateScannedBatch(vac, targetMode);

        const otherClinics = allClinics.filter((c) => c.id !== vac.clinicId);
        if (otherClinics.length > 0 && !destinationClinicId) {
          setDestinationClinicId(otherClinics[0].id);
        }
      } else {
        setScannedVaccine(null);
        setHistory([]);
        setValidationError(`Unknown QR code. No vaccine found registered with Batch ID "${cleanId}". Verification failed.`);
        toast.error(`Unknown QR: Batch "${cleanId}" not found in database.`);
      }
    } catch (err) {
      setValidationError('Database query error: ' + err.message);
    }
  };

  const handleSwitchMode = (newMode) => {
    setActiveMode(newMode);
    setValidationError('');
    setValidationSuccess('');
    if (scannedVaccine) {
      validateScannedBatch(scannedVaccine, newMode);
    }
  };

  // Execute QR-Based Scan Out
  const handleConfirmScanOut = async () => {
    if (!scannedVaccine) {
      toast.error('Scan required: You must scan the batch QR code before confirming Scan Out.');
      return;
    }
    if (!destinationClinicId) {
      toast.warning('Please select a destination facility.');
      return;
    }

    const targetClinic = allClinics.find((c) => c.id === destinationClinicId);
    if (!targetClinic) return;

    setIsProcessing(true);
    try {
      const updated = await scanOutBatch({
        batchId: scannedVaccine.batchId,
        destinationClinicId: targetClinic.id,
        destinationClinicName: targetClinic.name,
        notes: transitNotes || 'Standard cold-chain transport container.'
      });

      toast.success(`SCAN OUT SUCCESSFUL: Batch ${updated.batchId} is now IN_TRANSIT. Source inventory decreased by ${updated.quantity} doses.`);
      setScannedVaccine(updated);
      const hist = await getStatusHistory(updated.id);
      setHistory(hist);
      setTransitNotes('');
      validateScannedBatch(updated, activeMode);
    } catch (err) {
      setValidationError(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute QR-Based Scan In
  const handleConfirmScanIn = async () => {
    if (!scannedVaccine) {
      toast.error('Scan required: You must scan the batch QR code before confirming Scan In.');
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await scanInBatch({
        batchId: scannedVaccine.batchId,
        notes: transitNotes || 'Arrived cold-chain verified.'
      });

      toast.success(`SCAN IN SUCCESSFUL: Batch ${updated.batchId} accepted into IN_STORAGE. Destination inventory increased by ${updated.quantity} doses.`);
      setScannedVaccine(updated);
      const hist = await getStatusHistory(updated.id);
      setHistory(hist);
      setTransitNotes('');
      validateScannedBatch(updated, activeMode);
    } catch (err) {
      setValidationError(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isEligibleForScanOut =
    scannedVaccine &&
    scannedVaccine.status !== 'DISCARDED' &&
    scannedVaccine.status !== 'IN_TRANSIT' &&
    scannedVaccine.status !== 'In Transit' &&
    (!clinic || scannedVaccine.clinicId === clinic.id);

  const isEligibleForScanIn =
    scannedVaccine &&
    scannedVaccine.status !== 'DISCARDED' &&
    (scannedVaccine.status === 'IN_TRANSIT' || scannedVaccine.status === 'In Transit') &&
    (!scannedVaccine.destinationClinicId || !clinic || scannedVaccine.destinationClinicId === clinic.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-700" />
            QR-Based Cold-Chain Custody Transfer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical QR scanning with strict verification: <strong>Scan Out (Origin Dispatch)</strong> → <strong>IN_TRANSIT</strong> → <strong>Scan In (Destination Receive)</strong>.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 shadow-sm">
          <button
            type="button"
            onClick={() => handleSwitchMode('SCAN_OUT')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              activeMode === 'SCAN_OUT'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            1. Scan Out (Dispatch)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('SCAN_IN')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              activeMode === 'SCAN_IN'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            2. Scan In (Receive)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Scanner Viewport (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <QRScanner onScanSuccess={handleScanSuccess} />

          {/* Quick Demo Test Buttons */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Quick Test Barcode Scans
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['VS-9K42P', 'VS-7R12B', 'VS-3M87Q', 'VS-2F55X', 'VS-6S33D', 'UNKNOWN-999'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleScanSuccess(b)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors ${
                    b.includes('UNKNOWN')
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 text-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Batch Verification & Action Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-3 shadow-sm">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-rose-950">Verification / Transfer Rejected</div>
                <div className="mt-1 leading-relaxed">{validationError}</div>
              </div>
            </div>
          )}

          {/* Validation Success Alert */}
          {validationSuccess && !validationError && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-medium">{validationSuccess}</div>
            </div>
          )}

          {/* Prompt when no batch is scanned yet */}
          {!scannedVaccine && !validationError && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm space-y-2">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">Scan QR Code to Begin Verification</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Scan the batch's existing QR code with the camera feed or enter the Batch ID to verify eligibility.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-teal-800 bg-teal-50/70 py-1.5 px-3 rounded-lg inline-block border border-teal-200">
                Active Operation: {activeMode === 'SCAN_OUT' ? 'Scan Out (Origin Dispatch)' : 'Scan In (Destination Receive)'}
              </div>
            </div>
          )}

          {/* Scanned Batch Details & Confirmation Panel */}
          {scannedVaccine && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              {/* Batch Header */}
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
                    Manufacturer: {scannedVaccine.manufacturer} • Stored Quantity: <strong>{scannedVaccine.quantity} doses</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Batch ID</div>
                  <div className="font-mono text-base font-bold text-teal-800">
                    {scannedVaccine.batchId}
                  </div>
                </div>
              </div>

              {/* Custody Route Visualization */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Custody Chain Tracking
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Source Facility (Origin)</span>
                    <span className="font-semibold text-slate-900 truncate block mt-0.5">
                      {scannedVaccine.clinicName}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                  <div className="flex-1 bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Transfer Destination</span>
                    <span className="font-semibold text-sky-900 truncate block mt-0.5">
                      {scannedVaccine.destinationClinicName || 'In Local Storage (No Transfer Active)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION PANEL FOR SCAN OUT */}
              {activeMode === 'SCAN_OUT' && (
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-teal-700" />
                    Step 2: Confirm Physical Scan Out
                  </div>

                  {scannedVaccine.status === 'DISCARDED' ? (
                    <div className="p-3 bg-rose-100 border border-rose-300 rounded text-xs text-rose-900 font-medium">
                      BATCH IS DISCARDED: Discarded vaccines cannot be transferred or dispatched under any circumstances.
                    </div>
                  ) : scannedVaccine.status === 'IN_TRANSIT' || scannedVaccine.status === 'In Transit' ? (
                    <div className="p-3 bg-sky-100 border border-sky-300 rounded text-xs text-sky-950 font-medium">
                      BATCH ALREADY IN TRANSIT: Scanned out at {scannedVaccine.scannedOutAt ? new Date(scannedVaccine.scannedOutAt).toLocaleString() : 'origin'}. Duplicate Scan Out prohibited.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        Confirming Scan Out will deduct <strong>{scannedVaccine.quantity} doses</strong> from source inventory and transition status to <strong>IN_TRANSIT</strong>.
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Destination Clinic *
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
                          Transfer Manifest / Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dispatched in Validated Cold Box #4 via Courier"
                          value={transitNotes}
                          onChange={(e) => setTransitNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        icon={Send}
                        onClick={handleConfirmScanOut}
                        loading={isProcessing}
                        disabled={!isEligibleForScanOut}
                        className="w-full"
                      >
                        Confirm & Complete Scan Out (In Storage → IN_TRANSIT)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION PANEL FOR SCAN IN */}
              {activeMode === 'SCAN_IN' && (
                <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-sky-700" />
                    Step 2: Confirm Physical Scan In
                  </div>

                  {scannedVaccine.status === 'DISCARDED' ? (
                    <div className="p-3 bg-rose-100 border border-rose-300 rounded text-xs text-rose-900 font-medium">
                      BATCH IS DISCARDED: Discarded vaccines cannot be scanned in.
                    </div>
                  ) : scannedVaccine.status !== 'IN_TRANSIT' && scannedVaccine.status !== 'In Transit' ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 font-medium">
                      SCAN IN PROHIBITED: Batch is currently "{scannedVaccine.status}". Scan In requires an active IN_TRANSIT transfer.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        Confirming Scan In will accept custody into <strong>{clinic?.name}</strong>, add <strong>{scannedVaccine.quantity} doses</strong> to destination inventory, and transition status to <strong>IN_STORAGE</strong>.
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Arrival Verification Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Temperature checked on arrival (4.2°C, Nominal)"
                          value={transitNotes}
                          onChange={(e) => setTransitNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        icon={CheckCircle2}
                        onClick={handleConfirmScanIn}
                        loading={isProcessing}
                        disabled={!isEligibleForScanIn}
                        className="w-full bg-sky-700 hover:bg-sky-800"
                      >
                        Confirm & Complete Scan In (IN_TRANSIT → IN_STORAGE)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Status History & Audit Timeline */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Full Chain-of-Custody & Inventory Audit Trail
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
