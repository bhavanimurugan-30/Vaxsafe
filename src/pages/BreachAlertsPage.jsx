import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ReroutingModal from '../components/rerouting/ReroutingModal';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Route,
  Clock,
  Building2,
  Check,
  Filter,
  Thermometer,
  Timer,
  Hourglass,
  Boxes
} from 'lucide-react';

export default function BreachAlertsPage({ onNavigate }) {
  const { clinic } = useAuth();
  const { alerts, vaccines, resolveAlertItem } = useData();
  const toast = useToast();

  const [filterMode, setFilterMode] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | 'RESOLVED'
  const [rerouteModalOpen, setRerouteModalOpen] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Live timer tick for active excursions
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filterMode === 'ACTIVE') return !a.isResolved;
    if (filterMode === 'RESOLVED') return a.isResolved;
    return true;
  });

  const handleResolve = async (alertId) => {
    await resolveAlertItem(alertId, 'Verified and acknowledged by operations lead');
    toast.success('Breach alert marked as resolved.');
  };

  const handleRerouteBatch = (batchId) => {
    const found = vaccines.find((v) => v.batchId === batchId);
    setSelectedBatchIds(found ? [found.id] : []);
    setRerouteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Cold-Chain Breach Incidents & Excursion Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time batch-level excursion tracking evaluated against each product's certified thermal envelope at{' '}
            <strong className="text-slate-800">{clinic?.name}</strong>.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="inline-flex rounded-md shadow-sm border border-slate-200 p-0.5 bg-slate-50">
          {[
            { id: 'ACTIVE', label: 'Active Alerts' },
            { id: 'RESOLVED', label: 'Resolved History' },
            { id: 'ALL', label: 'All Incidents' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
            <h3 className="text-sm font-semibold text-slate-800">
              {filterMode === 'ACTIVE'
                ? 'Zero Active Cold-Chain Excursions'
                : 'No alerts match this filter.'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All biological products at this facility are currently within certified thermal parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const batchId = alert.batchId || alert.affectedBatchId || 'General Chamber';
            const vaccineName = alert.vaccineName || alert.affectedVaccineName || 'Biological Formulation';
            const minTemp = alert.minTemperature;
            const maxTemp = alert.maxTemperature;
            const allowedRange = alert.allowedRange || (minTemp !== undefined && maxTemp !== undefined ? `${minTemp}°C – ${maxTemp}°C` : '2.0°C – 8.0°C');
            const maxDuration = Number(alert.maxExcursionDurationMinutes || 60);
            const warningBefore = Number(alert.warningBeforeMinutes ?? 16);

            // Compute live duration and remaining time
            let elapsed = alert.excursionDurationMinutes ?? 0;
            if (alert.timerActive && alert.excursionStartTime) {
              const diffMinutes = (now - new Date(alert.excursionStartTime).getTime()) / 60000;
              elapsed = Math.max(0, parseFloat(diffMinutes.toFixed(1)));
            }

            const remaining = Math.max(0, parseFloat((maxDuration - elapsed).toFixed(1)));

            // Live status
            let displayStatus = alert.status || 'EXCURSION';
            if (alert.isResolved) {
              displayStatus = 'RESOLVED';
            } else if (!alert.timerActive && alert.status === 'QUARANTINE_REVIEW') {
              displayStatus = 'QUARANTINE_REVIEW';
            } else if (alert.timerActive) {
              if (elapsed >= maxDuration) {
                displayStatus = 'CRITICAL';
              } else if (remaining <= warningBefore) {
                displayStatus = 'WARNING';
              } else {
                displayStatus = 'EXCURSION';
              }
            }

            const isTempOutside = (minTemp !== undefined && maxTemp !== undefined)
              ? (alert.temperature < minTemp || alert.temperature > maxTemp)
              : (alert.temperature < 2.0 || alert.temperature > 8.0);

            const isQuarantined = displayStatus === 'QUARANTINE_REVIEW';
            const isCritical = displayStatus === 'CRITICAL';
            const isWarning = displayStatus === 'WARNING';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all ${
                  !alert.isResolved
                    ? isCritical
                      ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                      : isWarning
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                      : isQuarantined
                      ? 'bg-purple-50/60 border-purple-300 shadow-sm'
                      : 'bg-orange-50/50 border-orange-200 shadow-sm'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                        !alert.isResolved
                          ? isCritical
                            ? 'bg-rose-600 text-white'
                            : isWarning
                            ? 'bg-amber-600 text-white'
                            : isQuarantined
                            ? 'bg-purple-700 text-white'
                            : 'bg-orange-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      {/* Top Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {vaccineName}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {batchId}
                        </span>
                        <Badge variant={displayStatus.toLowerCase()} size="sm">
                          {displayStatus}
                        </Badge>
                        {alert.timerActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                            <Timer className="w-3 h-3" /> Timer Active
                          </span>
                        )}
                        {isQuarantined && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                            Timer Stopped • Quarantined
                          </span>
                        )}
                      </div>

                      {/* Severity Description */}
                      <p className="text-xs text-slate-600">
                        {alert.severity} • Storage Chamber: <strong>{alert.unit}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {!alert.isResolved && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Check}
                          onClick={() => handleResolve(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Route}
                          onClick={() => handleRerouteBatch(batchId)}
                        >
                          Smart Reroute
                        </Button>
                      </>
                    )}
                    {alert.isResolved && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Archived / Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* 5-Column Metrics Grid (Batch-Level Details as required) */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-white/80 p-3 rounded-lg border border-slate-200/80 text-xs">
                  {/* 1. Temperature */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-slate-400" /> Temperature
                    </span>
                    <span className={`text-base font-mono font-bold block ${
                      isTempOutside ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {alert.temperature}°C
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isTempOutside ? 'Out of Range' : 'In Normal Range'}
                    </span>
                  </div>

                  {/* 2. Allowed Range */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-400" /> Allowed Range
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-800 block">
                      {allowedRange}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Per-batch certified
                    </span>
                  </div>

                  {/* 3. Excursion Duration */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block flex items-center gap-1">
                      <Timer className="w-3 h-3 text-slate-400" /> Excursion Duration
                    </span>
                    <span className={`text-base font-mono font-bold block ${
                      elapsed >= maxDuration ? 'text-rose-700' : 'text-slate-800'
                    }`}>
                      {elapsed} min
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Limit: {maxDuration} min
                    </span>
                  </div>

                  {/* 4. Remaining Time */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block flex items-center gap-1">
                      <Hourglass className="w-3 h-3 text-slate-400" /> Remaining Time
                    </span>
                    <span className={`text-base font-mono font-bold block ${
                      remaining <= 0
                        ? 'text-rose-700 font-extrabold'
                        : remaining <= warningBefore
                        ? 'text-amber-600 font-bold'
                        : 'text-emerald-700'
                    }`}>
                      {remaining <= 0 ? '0 min (Exceeded)' : `${remaining} min`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Warning at $\le${warningBefore}m
                    </span>
                  </div>

                  {/* 5. Status */}
                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Current Status
                    </span>
                    <div className="pt-0.5">
                      <Badge variant={displayStatus.toLowerCase()} size="sm">
                        {displayStatus}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {alert.timerActive ? 'Timer running' : 'Timer stopped'}
                    </span>
                  </div>
                </div>

                {/* Protocol Guidance Banner & Timestamp */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-slate-800 shrink-0">
                      Action Protocol:
                    </span>
                    <span>{alert.recommendedAction || 'Monitor cold-chain temperature and prepare smart reroute.'}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rerouting Modal */}
      <ReroutingModal
        isOpen={rerouteModalOpen}
        onClose={() => setRerouteModalOpen(false)}
        initialVaccineIds={selectedBatchIds}
        triggerReason="Cold-Chain Temperature Breach Excursion"
      />
    </div>
  );
}
