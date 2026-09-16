import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { rankNearestClinics } from '../services/haversine';
import ClinicDistanceCard from '../components/rerouting/ClinicDistanceCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Route,
  Navigation,
  Compass,
  Building2,
  Boxes,
  Truck,
  ShieldAlert,
  CheckCircle2,
  Info,
  MapPin
} from 'lucide-react';

export default function SmartReroutingPage() {
  const { clinic, currentUser } = useAuth();
  const { vaccines, allClinics, executeReroute } = useData();
  const toast = useToast();

  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Batches eligible for rerouting (In Storage or Compromised, never DISCARDED)
  const eligibleVaccines = vaccines.filter(
    (v) => (v.status === 'In Storage' || v.status === 'IN_STORAGE' || v.status === 'Compromised') && v.status !== 'DISCARDED'
  );

  // Ranked destination facilities by Haversine spherical distance
  const rankedDestinations = clinic ? rankNearestClinics(clinic, allClinics) : [];

  const handleToggleBatch = (id) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBatchIds.length === eligibleVaccines.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(eligibleVaccines.map((v) => v.id));
    }
  };

  const handleExecuteReroute = async () => {
    if (!selectedDestination) {
      toast.warning('Please select a destination facility from the proximity list.');
      return;
    }
    if (selectedBatchIds.length === 0) {
      toast.warning('Please select at least one vaccine batch to evacuate.');
      return;
    }

    setIsExecuting(true);
    try {
      await executeReroute(selectedBatchIds, selectedDestination);
      toast.success(
        `EMERGENCY TRANSFER INITIATED: ${selectedBatchIds.length} batch(es) rerouted to ${selectedDestination.name} via ${selectedDestination.distanceKm} km transit.`
      );
      setSelectedBatchIds([]);
      setSelectedDestination(null);
    } catch (err) {
      toast.error('Rerouting execution error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Route className="w-5 h-5 text-teal-700" />
              Haversine Smart Cold-Chain Rerouting Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Geodesic proximity calculations to rapidly redirect vulnerable vaccine batches during facility failure.
            </p>
          </div>

          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
            Origin: <strong>{clinic?.shortName || 'Clinic'}</strong> ({clinic?.lat?.toFixed(4)}, {clinic?.lng?.toFixed(4)})
          </div>
        </div>
      </div>

      {/* Haversine Formula Technical Explainer Banner */}
      <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 text-xs text-teal-950 flex items-start gap-3">
        <Compass className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Algorithmic Great-Circle Routing (Haversine Implementation)</div>
          <p className="text-teal-900/90 leading-relaxed text-[11px]">
            Uses spherical trigonometry with Earth radius <strong>R = 6,371 km</strong> to calculate exact spatial distance between origin <code className="bg-white/80 px-1 py-0.5 rounded font-mono">({clinic?.lat}, {clinic?.lng})</code> and network facilities. Cold-chain transit duration estimates assume refrigerated urban courier dispatch (40 km/h) with passive PCM cooler integrity verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proximity-Ranked Destination Clinics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              Proximity-Ranked Network Facilities ({rankedDestinations.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Sorted by Distance</span>
          </div>

          <div className="space-y-3">
            {rankedDestinations.map((dest, idx) => (
              <div
                key={dest.id}
                onClick={() => setSelectedDestination(dest)}
                className={`cursor-pointer rounded-xl transition-all ${
                  selectedDestination?.id === dest.id
                    ? 'ring-2 ring-teal-600 shadow-md'
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

        {/* Right Column: Batch Selection & Dispatch Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select Batches to Evacuate
                </h3>
                <p className="text-xs text-slate-500">
                  {eligibleVaccines.length} batches available at this facility
                </p>
              </div>

              {eligibleVaccines.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  {selectedBatchIds.length === eligibleVaccines.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              )}
            </div>

            {/* Batch List */}
            <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {eligibleVaccines.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No batches eligible for evacuation at this facility.
                </div>
              ) : (
                eligibleVaccines.map((vac) => {
                  const isChecked = selectedBatchIds.includes(vac.id);
                  return (
                    <div
                      key={vac.id}
                      onClick={() => handleToggleBatch(vac.id)}
                      className={`pt-2 pb-1 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors ${
                        isChecked ? 'bg-teal-50/50 font-medium' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {vac.vaccineName}
                          </span>
                          <Badge variant={vac.status.toLowerCase()} size="sm">
                            {vac.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {vac.batchId} • {vac.quantity} doses • Exp: {vac.expiryDate}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Destination Selection Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Target Facility
              </span>
              {selectedDestination ? (
                <div>
                  <div className="font-bold text-teal-900 text-sm">
                    {selectedDestination.name}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    Distance: <strong>{selectedDestination.distanceKm} km</strong> • Transit Time: ~<strong>{selectedDestination.transitFormatted}</strong>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 italic">
                  Select a facility from the left column
                </span>
              )}
            </div>

            {/* Execution Trigger */}
            <Button
              variant="danger"
              size="lg"
              className="w-full"
              icon={Navigation}
              disabled={!selectedDestination || selectedBatchIds.length === 0}
              loading={isExecuting}
              onClick={handleExecuteReroute}
            >
              {selectedBatchIds.length > 0 && selectedDestination
                ? `Dispatch ${selectedBatchIds.length} Batch(es) to ${selectedDestination.shortName}`
                : 'Select Batches & Destination'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
