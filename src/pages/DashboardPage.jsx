import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import TemperatureChart from '../components/temperature/TemperatureChart';
import ManualTempEntryModal from '../components/temperature/ManualTempEntryModal';
import ReroutingModal from '../components/rerouting/ReroutingModal';
import MockSensorControls from '../components/temperature/MockSensorControls';
import {
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Radio,
  Plus,
  Route,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { clinic, currentUser } = useAuth();
  const { vaccines, tempLogs, alerts, stats, resolveAlertItem } = useData();
  const toast = useToast();

  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [rerouteModalOpen, setRerouteModalOpen] = useState(false);
  const [selectedBreachBatch, setSelectedBreachBatch] = useState(null);

  // Compromised vaccines requiring immediate response
  const compromisedVaccines = vaccines.filter((v) => v.status === 'Compromised');

  const handleResolveAlert = async (alertId) => {
    await resolveAlertItem(alertId, 'Verified and acknowledged by operations director');
    toast.success('Breach alert marked as resolved and archived.');
  };

  const handleRerouteFromAlert = (batchId) => {
    const found = vaccines.find(v => v.batchId === batchId);
    setSelectedBreachBatch(found ? [found.id] : []);
    setRerouteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Facility Identity & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {clinic?.name || 'Operational Workstation'}
            </h1>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {clinic?.lat?.toFixed(4)}, {clinic?.lng?.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cold-chain custody, environmental telemetry, and distribution hub.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Thermometer}
            onClick={() => setTempModalOpen(true)}
          >
            Log Manual Temp
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Boxes}
            onClick={() => onNavigate('vaccines')}
          >
            Register Batch
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Route}
            onClick={() => {
              setSelectedBreachBatch([]);
              setRerouteModalOpen(true);
            }}
          >
            Smart Reroute
          </Button>
        </div>
      </div>

      {/* Critical Active Breach Alert Banner (Displays when unresolved excursions exist) */}
      {stats.activeBreaches.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 shadow-sm animate-pulse-once">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-950">
                    Active Cold-Chain Excursion Incident Detected
                  </h3>
                  <span className="text-xs font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                    {stats.activeBreaches.length} Alert{stats.activeBreaches.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  {stats.activeBreaches[0].severity} — Chamber temperature at{' '}
                  <strong>{stats.activeBreaches[0].temperature}°C</strong>. Action required to prevent irreversibility.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolveAlert(stats.activeBreaches[0].id)}
              >
                Acknowledge Alert
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Route}
                onClick={() => handleRerouteFromAlert(stats.activeBreaches[0].affectedBatchId)}
              >
                Initiate Reroute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Vaccines */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Batches
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.totalVaccines}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Under custody</div>
        </div>

        {/* In Storage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
            In Storage
          </div>
          <div className="text-2xl font-bold text-teal-900 mt-1 font-mono">
            {stats.inStorage}
          </div>
          <div className="text-[11px] text-teal-600 mt-1">2.0°C – 8.0°C Certified</div>
        </div>

        {/* In Transit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
            In Transit
          </div>
          <div className="text-2xl font-bold text-sky-900 mt-1 font-mono">
            {stats.inTransit}
          </div>
          <div className="text-[11px] text-sky-600 mt-1">Cold box active</div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Delivered
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1 font-mono">
            {stats.delivered}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Accepted handoff</div>
        </div>

        {/* Compromised */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Compromised
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">
            {stats.compromised}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">Requires review</div>
        </div>

        {/* Current Core Temp */}
        <div className={`p-4 rounded-xl border shadow-sm ${
          stats.isBreached ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Core Temp
          </div>
          <div className={`text-2xl font-bold mt-1 font-mono ${
            stats.isBreached ? 'text-rose-700 font-black' : 'text-teal-900'
          }`}>
            {stats.currentTemp.toFixed(1)}°C
          </div>
          <div className="mt-1">
            <Badge
              variant={stats.isBreached ? 'critical' : 'safe'}
              size="sm"
            >
              {stats.tempStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Chart & Recent Custody Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 24-Hour Temperature Graph */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  24-Hour Cold-Chain Temperature Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Primary Storage Telemetry • Safe Operating Band: 2.0°C – 8.0°C
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('temperature')}
                >
                  Full Telemetry Log
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <TemperatureChart data={tempLogs} height={280} />
            </div>
          </div>

          {/* Compromised Batches Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Compromised / Quarantined Batches ({compromisedVaccines.length})
                </h3>
              </div>
              {compromisedVaccines.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Route}
                  onClick={() => {
                    setSelectedBreachBatch(compromisedVaccines.map((v) => v.id));
                    setRerouteModalOpen(true);
                  }}
                >
                  Reroute All Compromised
                </Button>
              )}
            </div>

            <div className="pt-3">
              {compromisedVaccines.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  No compromised batches currently recorded at this facility. Cold-chain intact.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {compromisedVaccines.map((vac) => (
                    <div key={vac.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{vac.vaccineName}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Batch: {vac.batchId} • Qty: {vac.quantity} • Reason: {vac.compromisedReason || 'Thermal Excursion'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="compromised" size="sm">
                          Compromised
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBreachBatch([vac.id]);
                            setRerouteModalOpen(true);
                          }}
                        >
                          Smart Reroute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Vaccine Activity & Quick Simulator */}
        <div className="space-y-6">
          {/* Quick Mock Sensor Controls */}
          <MockSensorControls />

          {/* Recent Inventory & Transit Activity */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Active Inventory Activity
              </h3>
              <button
                onClick={() => onNavigate('vaccines')}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {vaccines.slice(0, 5).map((vac) => (
                <div
                  key={vac.id}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-slate-800 truncate">
                      {vac.vaccineName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {vac.batchId} • {vac.quantity} doses
                    </div>
                  </div>
                  <Badge variant={vac.status.toLowerCase()} size="sm">
                    {vac.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ManualTempEntryModal
        isOpen={tempModalOpen}
        onClose={() => setTempModalOpen(false)}
      />

      <ReroutingModal
        isOpen={rerouteModalOpen}
        onClose={() => setRerouteModalOpen(false)}
        initialVaccineIds={selectedBreachBatch || []}
      />
    </div>
  );
}
