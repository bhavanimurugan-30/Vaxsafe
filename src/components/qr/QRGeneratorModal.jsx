import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import PrintableLabel from './PrintableLabel';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function QRGeneratorModal({ isOpen, onClose, vaccine }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!vaccine) return null;

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-canvas-${vaccine.batchId}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `VaxSafe-${vaccine.batchId}.png`;
    a.href = url;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBatchId = () => {
    navigator.clipboard.writeText(vaccine.batchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Vaccine Batch QR Code & Label"
        description="Encrypted cold-chain batch barcode for physical inventory custody tracking."
        maxWidth="max-w-md"
        footer={
          <div className="flex w-full justify-between items-center">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={handlePrint}
              >
                Print Label
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={handleDownload}
              >
                Download PNG
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-center">
          {/* QR Code Canvas */}
          <div className="inline-block p-4 bg-white border border-slate-200 rounded-xl shadow-inner mx-auto">
            <QRCodeCanvas
              id={`qr-canvas-${vaccine.batchId}`}
              value={vaccine.batchId}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Batch ID and Copy Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Batch Identifier
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-slate-900">
                {vaccine.batchId}
              </span>
              <button
                onClick={handleCopyBatchId}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                title="Copy Batch ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Batch Details Summary */}
          <div className="text-left text-xs space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Vaccine:</span>
              <span className="font-medium text-slate-800">{vaccine.vaccineName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Manufacturer:</span>
              <span className="font-medium text-slate-800">{vaccine.manufacturer}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Quantity:</span>
              <span className="font-medium text-slate-800">{vaccine.quantity} doses</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Expiry Date:</span>
              <span className="font-mono font-medium text-slate-800">{vaccine.expiryDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Custody Facility:</span>
              <span className="font-medium text-teal-800 truncate max-w-[200px]">
                {vaccine.clinicName}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden printable label rendered during window.print() */}
      <PrintableLabel vaccine={vaccine} />
    </>
  );
}
