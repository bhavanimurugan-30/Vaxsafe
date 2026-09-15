import React from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import { Play, Pause, Flame, Snowflake, CheckCircle, Radio } from 'lucide-react';

export default function MockSensorControls() {
  const { sensorState, mockSensor } = useData();
  const toast = useToast();

  const handleToggle = () => {
    mockSensor.toggle();
    if (!sensorState.isRunning) {
      toast.info('IoT Telemetry sensor broadcast simulation started.');
    } else {
      toast.info('IoT Telemetry sensor broadcast paused.');
    }
  };

  const handleIntervalChange = (ms) => {
    mockSensor.setIntervalMs(ms);
    toast.info(`Sensor interval updated to ${ms / 1000} seconds.`);
  };

  const handleTriggerHigh = async () => {
    await mockSensor.triggerHighBreach(9.8);
    toast.error('Simulated High Temperature Spike (+9.8°C) triggered! Check active alerts.');
  };

  const handleTriggerLow = async () => {
    await mockSensor.triggerLowBreach(1.2);
    toast.error('Simulated Freezing Violation (1.2°C) triggered! Check active alerts.');
  };

  const handleTriggerNormal = async () => {
    await mockSensor.triggerNormal(4.4);
    toast.success('Simulated normal temperature restored (4.4°C).');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${sensorState.isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Mock IoT Sensor Simulator
            </h4>
            <p className="text-xs text-slate-500">
              Generates realistic periodic temperature readings and test spikes
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={sensorState.isRunning ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggle}
            icon={sensorState.isRunning ? Pause : Play}
          >
            {sensorState.isRunning ? 'Pause Telemetry' : 'Start Telemetry'}
          </Button>
        </div>
      </div>

      {/* Interval & Simulation Speed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Broadcast Frequency
          </label>
          <div className="inline-flex rounded-md shadow-sm border border-slate-200 p-0.5 bg-slate-50">
            {[5000, 15000, 30000].map((ms) => (
              <button
                key={ms}
                onClick={() => handleIntervalChange(ms)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  sensorState.intervalMs === ms
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
        </div>

        {/* Quick Simulation Injectors */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Instant Test Injections
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Flame}
              onClick={handleTriggerHigh}
              title="Simulate compressor failure excursion above 8°C"
            >
              Spike (+9.8°C)
            </Button>
            <Button
              variant="warning"
              size="sm"
              icon={Snowflake}
              onClick={handleTriggerLow}
              title="Simulate freezing drop below 2°C"
            >
              Freeze (1.2°C)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCircle}
              onClick={handleTriggerNormal}
              title="Normalize temperature back to 4.4°C"
            >
              Normal (4.4°C)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
