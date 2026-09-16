import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ClinicDistanceCard from './ClinicDistanceCard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { rankNearestClinics } from '../../services/haversine';
import { Route, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

export default function ReroutingModal({
  isOpen,
  onClose,
  initialVaccineIds = [],
  triggerReason = 'Thermal Breach Excursion'
}) {
  const { clinic } = useAuth();
  const { vaccines, allClinics, executeReroute } = useData();
  const toast = useToast();

  const [selectedVaccineIds, setSelectedVaccineIds] = useState(initialVaccineIds);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Eligible vaccines at current facility (excludes DISCARDED)
  const eligibleVaccines = vaccines.filter(
    (v) => (v.status === 'In Storage' || v.status === 'IN_STORAGE' || v.status === 'Compromised') && v.status !== 'DISCARDED'
  );

  // Rank candidate destination clinics by Haversine distance
  const rankedClinics = clinic ? rankNearestClinics(clinic, allClinics) : [];

  const handleToggleVaccine = (id) => {
    setSelectedVaccineIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVaccineIds.length === eligibleVaccines.length) {
      setSelectedVaccineIds([]);
    } else {
      setSelectedVaccineIds(eligibleVaccines.map((v) => v.id));
    }
  };

  const handleExecute = async () => {
    if (!selectedDestination) {
      toast.warning('Please select a destination facility from the ranked proximity list.');
      return;
    }
    if (selectedVaccineIds.length === 0) {
      toast.warning('Please select at least one vaccine batch to reroute.');
      return;
    }

    setIsTransferring(true);
    try {
      await executeReroute(selectedVaccineIds, selectedDestination);
      toast.success(
        `REROUTE INITIATED: ${selectedVaccineIds.length} batch(es) transitioned to In Transit towards ${selectedDestination.name}.`
      );
      onClose();
    } catch (err) {
      toast.error('Failed to execute emergency reroute: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cold-Chain Emergency Smart Rerouting"
      description="Calculate Haversine proximity to redirect compromised or at-risk vaccines to the nearest secure facility."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {selectedVaccineIds.length} batch(es) selected for transfer
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isTransferring}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Route}
              loading={isTransferring}
              onClick={handleExecute}
              disabled={!selectedDestination || selectedVaccineIds.length === 0}
            >
              Dispatch Emergency Transfer
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Origin Alert Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Reason for Reroute Protocol: {triggerReason}</div>
            <div className="mt-0.5 text-amber-800">
              Origin: <strong>{clinic?.name}</strong> ({clinic?.lat}, {clinic?.lng})
            </div>
          </div>
        </div>

        {/* 1. Batch Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select Batches to Evacuate ({eligibleVaccines.length} eligible in facility)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium"
            >
              {selectedVaccineIds.length === eligibleVaccines.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50">
            {eligibleVaccines.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No storage or compromised batches currently in this facility.
              </div>
            ) : (
              eligibleVaccines.map((v) => {
                const isSelected = selectedVaccineIds.includes(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => handleToggleVaccine(v.id)}
                    className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-white transition-colors ${
                      isSelected ? 'bg-teal-50/60 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <div>
                        <div className="text-slate-900">{v.vaccineName}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Batch: {v.batchId} • {v.quantity} doses • Status: {v.status}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Destination Selection Ranked by Haversine */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Proximity-Ranked Destination Facilities (Haversine Analysis)
          </label>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {rankedClinics.map((dest, idx) => (
              <div
                key={dest.id}
                onClick={() => setSelectedDestination(dest)}
                className={`cursor-pointer rounded-xl transition-all ${
                  selectedDestination?.id === dest.id
                    ? 'ring-2 ring-teal-600 bg-teal-50/30'
                    : ''
                }`}
              >
                <ClinicDistanceCard
                  clinic={dest}
                  isRecommended={idx === 0}
                  onSelect={(c) => setSelectedDestination(c)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
