import React from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Navigation, Clock, ShieldCheck, MapPin, Building2 } from 'lucide-react';

export default function ClinicDistanceCard({
  clinic,
  isRecommended = false,
  onSelect,
  disabled = false
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isRecommended
          ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">{clinic.name}</h4>
            {isRecommended && (
              <span className="text-[10px] font-bold uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full">
                Closest Safe Node
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {clinic.address}
          </p>
        </div>

        {/* Distance Display */}
        <div className="text-right shrink-0">
          <div className="text-base font-extrabold font-mono text-teal-800">
            {clinic.distanceKm} km
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            {clinic.transitFormatted}
          </div>
        </div>
      </div>

      {/* Logistics & Facility Capability Specs */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cold Storage Capacity</span>
          <span className="font-medium text-slate-800">{clinic.coldStorageCapacity}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Backup Power</span>
          <span className="font-medium text-slate-800">{clinic.backupGenerator}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transit Safety</span>
          <Badge
            variant={
              clinic.viability?.level === 'Optimal' ? 'safe' :
              clinic.viability?.level === 'Viable' ? 'transit' : 'warning'
            }
            size="sm"
          >
            {clinic.viability?.level || 'Viable'}
          </Badge>
        </div>
      </div>

      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
        <p className="text-[11px] text-slate-500 italic max-w-xs">
          {clinic.viability?.description}
        </p>
        {onSelect && (
          <Button
            variant={isRecommended ? 'primary' : 'outline'}
            size="sm"
            disabled={disabled}
            icon={Navigation}
            onClick={() => onSelect(clinic)}
          >
            Route Transfer
          </Button>
        )}
      </div>
    </div>
  );
}
