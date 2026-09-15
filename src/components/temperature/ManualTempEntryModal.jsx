import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Thermometer, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ManualTempEntryModal({ isOpen, onClose }) {
  const { recordManualTemperature } = useData();
  const toast = useToast();

  const [temperature, setTemperature] = useState('4.5');
  const [unit, setUnit] = useState('Cold Room #1 (Primary Refrigerator)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numVal = parseFloat(temperature);
  const isBreach = !isNaN(numVal) && (numVal < 2.0 || numVal > 8.0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(numVal)) {
      toast.error('Please enter a valid numeric temperature value.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordManualTemperature(numVal, unit);
      if (result.isBreach) {
        toast.error(`COLD-CHAIN BREACH LOGGED: ${numVal}°C outside certified 2.0°C - 8.0°C threshold! Alert generated.`);
      } else {
        toast.success(`Temperature reading of ${numVal}°C successfully logged into cold-chain record.`);
      }
      onClose();
    } catch (err) {
      toast.error('Failed to record temperature entry: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Cold-Chain Temperature Entry"
      description="Record an official physical calibrated thermometer reading into the immutable telemetry log."
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isBreach ? 'danger' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={Thermometer}
          >
            Submit Reading
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Temperature Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Recorded Temperature (°C) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              required
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-3 py-2 text-lg font-mono font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g. 4.5"
            />
            <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">
              °C
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Certified safe storage range: <strong className="text-slate-800">2.0°C to 8.0°C</strong>
          </p>
        </div>

        {/* Live breach status preview */}
        {!isNaN(numVal) && (
          <div
            className={`p-3 rounded-md text-xs flex items-start gap-2.5 border ${
              isBreach
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {isBreach ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                {isBreach ? 'Warning: Temperature Excursion' : 'Nominal Safe Range'}
              </div>
              <div className="text-[11px] mt-0.5">
                {isBreach
                  ? numVal > 8.0
                    ? 'Exceeds 8.0°C ceiling. Submitting will trigger an immediate breach incident.'
                    : 'Below 2.0°C freezing limit. Risk of crystallizing liquid formulations.'
                  : 'Reading is within CDC/WHO compliant cold-chain storage parameters.'}
              </div>
            </div>
          </div>
        )}

        {/* Storage Unit Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Storage Chamber / Refrigerator *
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="Cold Room #1 (Primary Refrigerator)">Cold Room #1 (Primary Refrigerator)</option>
            <option value="Cold Room #2 (Secondary Walk-in)">Cold Room #2 (Secondary Walk-in)</option>
            <option value="Under-counter Pharmacy Cooler A">Under-counter Pharmacy Cooler A</option>
            <option value="Ultra-Low Freezer ULT-01">Ultra-Low Freezer ULT-01</option>
            <option value="Portable Insulated Transport Box #04">Portable Insulated Transport Box #04</option>
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Physical Verification Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. NIST calibrated digital thermometer reading"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </form>
    </Modal>
  );
}
