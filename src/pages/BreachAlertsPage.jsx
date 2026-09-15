import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';

export default function BreachAlertsPage({ onNavigate }) {
  const { clinic } = useAuth();
  const { alerts, vaccines, resolveAlertItem } = useData();
  const toast = useToast();

  const [filterMode, setFilterMode] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | 'RESOLVED'
  const [rerouteModalOpen, setRerouteModalOpen] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

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
            Audit log of temperature anomalies outside the certified 2.0°C – 8.0°C threshold at{' '}
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
              All biological products at this facility are currently within certified CDC/WHO thermal parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExcursionHigh = alert.temperature > 8.0;
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all ${
                  !alert.isResolved
                    ? 'bg-rose-50/50 border-rose-200 shadow-sm'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        !alert.isResolved
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.severity}
                        </h3>
                        <Badge
                          variant={!alert.isResolved ? 'critical' : 'default'}
                          size="sm"
                        >
                          {!alert.isResolved ? 'ACTIVE BREACH' : 'RESOLVED'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Chamber: <strong>{alert.unit}</strong> • Recorded Peak Temp:{' '}
                        <strong className="font-mono text-rose-700 font-bold">
                          {alert.temperature}°C
                        </strong>
                      </p>

                      <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Timestamp: {new Date(alert.timestamp).toLocaleString()}
                      </div>
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
                          onClick={() => handleRerouteBatch(alert.affectedBatchId)}
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

                {/* Protocol Guidance Banner */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                  <span className="font-semibold text-slate-800 shrink-0">
                    Recommended Response:
                  </span>
                  <span>{alert.recommendedAction || 'Evaluate cold storage compressor and initiate emergency reroute to nearest facility.'}</span>
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
