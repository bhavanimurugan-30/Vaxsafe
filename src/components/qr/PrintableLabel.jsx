import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintableLabel({ vaccine }) {
  if (!vaccine) return null;

  return (
    <div id="printable-label-container" className="hidden print:block p-6 max-w-sm mx-auto border-2 border-black font-sans text-black bg-white">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <div className="font-black text-lg tracking-wider">VAXSAFE LABELS</div>
        <div className="text-xs font-mono font-bold uppercase">COLD-CHAIN VERIFIED</div>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <div className="p-1 border border-black shrink-0">
          <QRCodeSVG value={vaccine.batchId} size={110} level="H" />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-600 font-bold uppercase">BATCH NUMBER</div>
          <div className="text-xl font-black font-mono tracking-tight">{vaccine.batchId}</div>
          <div className="text-xs font-bold text-gray-800">{vaccine.vaccineName}</div>
          <div className="text-[11px] text-gray-600 font-semibold">{vaccine.manufacturer}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs border-t border-black pt-2 mb-3">
        <div>
          <span className="font-bold">EXPIRY: </span>
          <span className="font-mono">{vaccine.expiryDate}</span>
        </div>
        <div>
          <span className="font-bold">QTY: </span>
          <span>{vaccine.quantity} Doses</span>
        </div>
        <div>
          <span className="font-bold">STORAGE: </span>
          <span className="font-bold">2.0°C – 8.0°C</span>
        </div>
        <div>
          <span className="font-bold">FACILITY: </span>
          <span className="truncate block">{vaccine.clinicName?.split('-')[0]?.trim()}</span>
        </div>
      </div>

      <div className="text-[10px] text-center border-t border-gray-400 pt-1 font-mono uppercase">
        Scan QR to audit cold-chain chain-of-custody • Do not freeze
      </div>
    </div>
  );
}
