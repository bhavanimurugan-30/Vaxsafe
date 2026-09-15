import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TemperatureChart from '../components/temperature/TemperatureChart';
import ManualTempEntryModal from '../components/temperature/ManualTempEntryModal';
import MockSensorControls from '../components/temperature/MockSensorControls';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Activity,
  Timer,
  Hourglass,
  Boxes,
  HelpCircle
} from 'lucide-react';

export default function TemperaturePage() {
  const { clinic } = useAuth();
  const { tempLogs, vaccines, alerts, stats, sensorState } = useData();

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Live timer tick for excursion duration & remaining time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const latestLog = tempLogs[0];
  const lastUpdatedFormatted = latestLog
    ? new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  // Active inventory batches monitored at this facility
  const activeBatches = vaccines.filter(
    (v) => v.status !== 'Delivered' && v.status !== 'Compromised'
  );

  // Determine overall status theme
  const isCritical = stats.tempStatus === 'CRITICAL';
  const isWarning = stats.tempStatus === 'WARNING';
  const isQuarantine = stats.tempStatus === 'QUARANTINE_REVIEW';
  const isNormal = stats.tempStatus === 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-teal-700" />
            Cold-Chain Environmental Telemetry & Batch Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time thermal monitoring evaluated against per-batch certified tolerances at{' '}
            <strong className="text-slate-800">{clinic?.name}</strong>.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setManualModalOpen(true)}
        >
          Log Calibrated Reading
        </Button>
      </div>

      {/* Telemetry Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Real-time Temperature Gauge Card */}
        <div
          className={`p-5 rounded-xl border shadow-sm transition-colors ${
            isCritical
              ? 'bg-rose-50 border-rose-300'
              : isWarning
              ? 'bg-amber-50 border-amber-300'
              : isQuarantine
              ? 'bg-purple-50 border-purple-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Current Reading</span>
            <div className="flex items-center gap-1">
              <Radio
                className={`w-3.5 h-3.5 ${
                  stats.isBreached ? 'text-rose-600 animate-ping' : 'text-emerald-600'
                }`}
              />
              <span className="font-mono text-[11px]">{lastUpdatedFormatted}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span
              className={`text-4xl font-extrabold font-mono tracking-tight ${
                isCritical
                  ? 'text-rose-700'
                  : isWarning
                  ? 'text-amber-700'
                  : isQuarantine
                  ? 'text-purple-800'
                  : 'text-teal-900'
              }`}
            >
              {stats.currentTemp.toFixed(1)}°C
            </span>
            <Badge variant={stats.tempStatus.toLowerCase()} size="md">
              {stats.tempStatus}
            </Badge>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active Excursions:</span>
            <span className="font-mono font-bold text-slate-800">
              {stats.activeBreachesCount} Affected {stats.activeBreachesCount === 1 ? 'Batch' : 'Batches'}
            </span>
          </div>
        </div>

        {/* Cold-Chain Compliance Indicator */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Cold-Chain Compliance Status
            </div>
            <div className="flex items-center gap-2">
              {stats.isBreached ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : isQuarantine ? (
                <ShieldAlert className="w-5 h-5 text-purple-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              <span
                className={`text-sm font-bold ${
                  isCritical
                    ? 'text-rose-800'
                    : isWarning
                    ? 'text-amber-800'
                    : isQuarantine
                    ? 'text-purple-900'
                    : 'text-slate-900'
                }`}
              >
                {stats.tempStatus === 'NORMAL'
                  ? '100% Thermal Conformity'
                  : stats.tempStatus === 'QUARANTINE_REVIEW'
                  ? 'Under Quarantine Review'
                  : stats.tempStatus === 'WARNING'
                  ? 'Warning: Excursion Approaching Limit'
                  : 'Critical: Excursion Limit Exceeded'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.isBreached
                ? `${stats.breachedBatches.length} batch(es) currently experiencing temperature breach.`
                : isQuarantine
                ? 'Product recovered from thermal excursion; quarantined pending clinical clearance.'
                : 'All vaccine batches maintained within their certified temperature envelopes.'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Storage Chambers:</span>
            <span className="font-medium text-slate-800">Primary + Sub-Zero Active</span>
          </div>
        </div>

        {/* IoT Simulation Status Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Telemetry Sensor Broadcast
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  sensorState.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-sm font-bold text-slate-900">
                {sensorState.isRunning ? 'Telemetry Live (Simulated IoT)' : 'Telemetry Sensor Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Frequency: <strong>{sensorState.intervalMs / 1000}s</strong> • Node ID: <strong>IOT-CR1-NY</strong>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Telemetry Stream:</span>
            <span className="font-medium text-emerald-700 font-mono">
              {sensorState.isRunning ? 'ACTIVE BROADCAST' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Batch-Level Cold-Chain Telemetry & Excursion Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-700" />
              Batch-Level Cold-Chain & Excursion Compliance Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current temperature ({stats.currentTemp.toFixed(1)}°C) evaluated independently against each batch's own certified limits.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {activeBatches.length} Monitored Batches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Batch & Product</th>
                <th className="px-3 py-3">Certified Range</th>
                <th className="px-3 py-3">Current Temp</th>
                <th className="px-3 py-3">Thermal Status</th>
                <th className="px-3 py-3">Excursion Duration</th>
                <th className="px-3 py-3">Remaining Time</th>
                <th className="px-4 py-3">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeBatches.map((vac) => {
                const minTemp = vac.minTemperature;
                const maxTemp = vac.maxTemperature;
                const hasRange = typeof minTemp === 'number' && typeof maxTemp === 'number';
                const isOutside = hasRange && (stats.currentTemp < minTemp || stats.currentTemp > maxTemp);

                // Find active alert for this batch
                const batchAlert = alerts.find(
                  (a) => (a.batchId === vac.batchId || a.affectedBatchId === vac.batchId) && !a.isResolved
                );

                const maxDuration = Number(vac.maxExcursionDurationMinutes || batchAlert?.maxExcursionDurationMinutes || 60);
                const warningBefore = Number(vac.warningBeforeMinutes ?? batchAlert?.warningBeforeMinutes ?? 16);

                let elapsed = batchAlert?.excursionDurationMinutes ?? 0;
                if (batchAlert?.timerActive && batchAlert?.excursionStartTime) {
                  const diffMinutes = (now - new Date(batchAlert.excursionStartTime).getTime()) / 60000;
                  elapsed = Math.max(0, parseFloat(diffMinutes.toFixed(1)));
                }

                const remaining = Math.max(0, parseFloat((maxDuration - elapsed).toFixed(1)));

                // Determine batch status:
                // If quarantined in DB or alert: QUARANTINE_REVIEW
                // If in active excursion: CRITICAL, WARNING, or EXCURSION
                let batchStatus = 'NORMAL';
                if (vac.status === 'QUARANTINE_REVIEW' || batchAlert?.status === 'QUARANTINE_REVIEW') {
                  batchStatus = 'QUARANTINE_REVIEW';
                } else if (batchAlert?.timerActive) {
                  if (elapsed >= maxDuration) {
                    batchStatus = 'CRITICAL';
                  } else if (remaining <= warningBefore) {
                    batchStatus = 'WARNING';
                  } else {
                    batchStatus = 'EXCURSION';
                  }
                }

                return (
                  <tr
                    key={vac.id}
                    className={`transition-colors ${
                      batchStatus === 'CRITICAL'
                        ? 'bg-rose-50/70 hover:bg-rose-50'
                        : batchStatus === 'WARNING'
                        ? 'bg-amber-50/60 hover:bg-amber-50'
                        : batchStatus === 'QUARANTINE_REVIEW'
                        ? 'bg-purple-50/50 hover:bg-purple-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{vac.batchId}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{vac.vaccineName}</div>
                    </td>

                    <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                      {hasRange ? `${minTemp}°C – ${maxTemp}°C` : vac.targetTemp || 'N/A'}
                    </td>

                    <td className="px-3 py-3 font-mono font-bold">
                      <span className={isOutside ? 'text-rose-700 font-extrabold' : 'text-slate-900'}>
                        {stats.currentTemp.toFixed(1)}°C
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {isOutside ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 text-[11px] px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> OUTSIDE RANGE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 text-[11px] px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> IN RANGE
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 font-mono">
                      {batchAlert?.timerActive || elapsed > 0 ? (
                        <span className={elapsed >= maxDuration ? 'text-rose-700 font-bold' : 'text-slate-800 font-medium'}>
                          {elapsed} min
                          {batchAlert?.timerActive && (
                            <span className="text-[10px] text-rose-600 ml-1 font-sans animate-pulse">● active</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 min</span>
                      )}
                    </td>

                    <td className="px-3 py-3 font-mono">
                      {batchAlert?.timerActive || elapsed > 0 ? (
                        <span
                          className={`font-bold ${
                            remaining <= 0
                              ? 'text-rose-700 font-extrabold'
                              : remaining <= warningBefore
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {remaining <= 0 ? '0 min (Exceeded)' : `${remaining} min`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">{maxDuration} min allowed</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={batchStatus.toLowerCase()} size="sm">
                        {batchStatus}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mock Sensor Simulator Controls Bar */}
      <MockSensorControls />

      {/* 24-Hour Graph View */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Continuous 24-Hour Temperature Telemetry (Real-Time)
            </h3>
            <p className="text-xs text-slate-500">
              Reactive timeline updated dynamically when IoT readings or manual calibrations are logged.
            </p>
          </div>
        </div>

        <TemperatureChart data={tempLogs} height={320} />
      </div>

      {/* Detailed Temperature Telemetry History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Recorded Telemetry Log History ({tempLogs.length} entries)
          </h3>
          <span className="text-xs text-slate-500">
            Logged into immutable storage record
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Thermal Status</th>
                <th className="px-4 py-3">Storage Unit</th>
                <th className="px-5 py-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tempLogs.map((log) => {
                const isBreach = log.isBreach;
                return (
                  <tr key={log.id} className={isBreach ? 'bg-rose-50/60' : 'hover:bg-slate-50'}>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isBreach ? 'text-rose-700' : 'text-slate-900'
                        }`}
                      >
                        {parseFloat(Number(log.temperature).toFixed(1))}°C
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isBreach ? 'critical' : 'safe'} size="sm">
                        {isBreach ? 'Excursion Breach' : 'Nominal Safe'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.unit}</td>
                    <td className="px-5 py-3 text-slate-500">{log.recordedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <ManualTempEntryModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />
    </div>
  );
}
