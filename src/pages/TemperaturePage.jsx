import React, { useState } from 'react';
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
  Building2,
  Activity
} from 'lucide-react';

export default function TemperaturePage() {
  const { clinic } = useAuth();
  const { tempLogs, stats, sensorState } = useData();

  const [manualModalOpen, setManualModalOpen] = useState(false);

  const latestLog = tempLogs[0];
  const lastUpdatedFormatted = latestLog
    ? new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-teal-700" />
            Cold-Chain Environmental Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Continuous temperature monitoring for certified biologicals at{' '}
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
        <div className={`p-5 rounded-xl border shadow-sm ${
          stats.isBreached ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Current Reading</span>
            <div className="flex items-center gap-1">
              <Radio className={`w-3.5 h-3.5 ${stats.isBreached ? 'text-rose-600 animate-ping' : 'text-emerald-600'}`} />
              <span className="font-mono text-[11px]">{lastUpdatedFormatted}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${
              stats.isBreached ? 'text-rose-700' : 'text-teal-900'
            }`}>
              {stats.currentTemp.toFixed(1)}°C
            </span>
            <Badge variant={stats.isBreached ? 'critical' : 'safe'} size="md">
              {stats.tempStatus}
            </Badge>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Certified Range:</span>
            <span className="font-mono font-bold text-slate-800">2.0°C – 8.0°C</span>
          </div>
        </div>

        {/* Safe Range Compliance Indicator */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Cold-Chain Compliance
            </div>
            <div className="flex items-center gap-2">
              {stats.isBreached ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              <span className={`text-sm font-bold ${stats.isBreached ? 'text-rose-800' : 'text-slate-900'}`}>
                {stats.isBreached ? 'Threshold Breach Violation' : '100% Thermal Conformity'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.isBreached
                ? 'Chamber conditions violate CDC/WHO storage specifications. Compromised batches quarantined.'
                : 'Vaccine vials maintained in nominal thermodynamic homeostasis.'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Chamber Unit:</span>
            <span className="font-medium text-slate-800">Cold Room #1 Primary</span>
          </div>
        </div>

        {/* IoT Simulation Status Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Telemetry Sensor Broadcast
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${sensorState.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-sm font-bold text-slate-900">
                {sensorState.isRunning ? 'Telemetry Live (Simulated IoT)' : 'Telemetry Sensor Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Frequency: <strong>{sensorState.intervalMs / 1000}s</strong> • Node ID: <strong>IOT-CR1-NY</strong>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Backup Generator:</span>
            <span className="font-medium text-emerald-700 font-mono">STANDBY READY</span>
          </div>
        </div>
      </div>

      {/* Mock Sensor Simulator Controls Bar */}
      <MockSensorControls />

      {/* 24-Hour Graph View */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Continuous 24-Hour Temperature Telemetry
            </h3>
            <p className="text-xs text-slate-500">
              Interactive historical curve. Green shaded area indicates standard 2°C – 8°C cold range.
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
                const isBreach = log.temperature < 2.0 || log.temperature > 8.0;
                return (
                  <tr key={log.id} className={isBreach ? 'bg-rose-50/60' : 'hover:bg-slate-50'}>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold text-sm ${
                        isBreach ? 'text-rose-700' : 'text-slate-900'
                      }`}>
                        {parseFloat(Number(log.temperature).toFixed(1))}°C
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isBreach ? 'critical' : 'safe'} size="sm">
                        {isBreach ? (log.temperature > 8.0 ? 'High Excursion' : 'Freezing Drop') : 'Nominal Safe'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.unit}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {log.recordedBy}
                    </td>
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
