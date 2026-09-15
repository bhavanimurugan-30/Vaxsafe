import React, { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import QRGeneratorModal from '../components/qr/QRGeneratorModal';
import { getStatusHistory } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  QrCode,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Truck,
  ArrowRight,
  Clock,
  UserCheck
} from 'lucide-react';

export default function VaccineDetailPage({ vaccine, isOpen, onClose }) {
  const { changeVaccineStatus } = useData();
  const toast = useToast();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (vaccine) {
      setLoadingHistory(true);
      getStatusHistory(vaccine.id)
        .then((items) => {
          setHistory(items);
          setLoadingHistory(false);
        })
        .catch(() => setLoadingHistory(false));
    }
  }, [vaccine]);

  if (!vaccine) return null;

  const handleMarkCompromised = async () => {
    setActionInProgress(true);
    await changeVaccineStatus(vaccine.id, 'Compromised', {
      note: 'Manually flagged as compromised due to cold-chain inspection review.'
    });
    setActionInProgress(false);
    toast.error(`Batch ${vaccine.batchId} marked as Compromised.`);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={vaccine.vaccineName}
        description={`Batch ID: ${vaccine.batchId} • Chain of Custody Audit`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              icon={QrCode}
              onClick={() => setQrModalOpen(true)}
            >
              View / Print QR Code
            </Button>

            <div className="flex gap-2">
              {vaccine.status !== 'Compromised' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleMarkCompromised}
                  loading={actionInProgress}
                  icon={AlertTriangle}
                >
                  Flag as Compromised
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Top Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">
                Current Status
              </span>
              <div className="mt-1">
                <Badge variant={vaccine.status.toLowerCase()} size="sm">
                  {vaccine.status}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">
                Batch ID
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                {vaccine.batchId}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">
                Quantity
              </span>
              <span className="font-bold text-slate-900 mt-1 block">
                {vaccine.quantity} Doses
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase text-[10px] font-semibold block">
                Expiry Date
              </span>
              <span className="font-mono font-medium text-slate-800 mt-1 block">
                {vaccine.expiryDate}
              </span>
            </div>
          </div>

          {/* Custody Locations & Specifications */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current Facility Custody:</span>
              <span className="font-semibold text-teal-800">{vaccine.clinicName}</span>
            </div>
            {vaccine.destinationClinicName && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Transit Destination:</span>
                <span className="font-semibold text-sky-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  {vaccine.destinationClinicName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Manufacturer:</span>
              <span className="text-slate-800 font-medium">{vaccine.manufacturer}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Manufacturing Date:</span>
              <span className="font-mono text-slate-700">{vaccine.manufacturingDate || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Certified Storage Range:</span>
              <span className="font-mono font-bold text-teal-800">
                {typeof vaccine.minTemperature === 'number' && typeof vaccine.maxTemperature === 'number'
                  ? `${vaccine.minTemperature}°C – ${vaccine.maxTemperature}°C`
                  : vaccine.targetTemp || vaccine.storageTemp || '2.0°C – 8.0°C'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Max Excursion Tolerance:</span>
              <span className="font-mono font-bold text-slate-800">
                {vaccine.maxExcursionDurationMinutes || 60} mins (Warning at $\le${vaccine.warningBeforeMinutes ?? 16}m remaining)
              </span>
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" />
              Immutable Status History & Cold-Chain Audit Trail
            </h4>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Loading custody timeline...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No prior custody records logged.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((step, idx) => (
                  <div key={step.id || idx} className="relative group">
                    {/* Circle marker */}
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-teal-600 shadow-sm" />

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={step.status.toLowerCase()} size="sm">
                          {step.status}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-1 text-slate-700">{step.note}</div>

                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="truncate">Facility: {step.clinicName || step.clinicId}</span>
                        <span className="font-mono text-[10px]">Auth: {step.userId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* QR Code Modal for viewing/downloading/printing */}
      <QRGeneratorModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        vaccine={vaccine}
      />
    </>
  );
}
