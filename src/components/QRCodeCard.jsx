import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export default function QRCodeCard({ batchId, vaccineName, onClose }) {
  const canvasWrapperRef = useRef(null)

  function handleDownload() {
    const canvas = canvasWrapperRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `${batchId}.png`
    link.click()
  }

  function handlePrint() {
    const canvas = canvasWrapperRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank', 'width=400,height=500')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>${batchId}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;margin-top:40px;">
          <img src="${dataUrl}" style="width:220px;height:220px;" />
          <p style="margin-top:12px;font-size:14px;color:#333;">${batchId}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="bg-white border border-glacier-200 rounded-lg p-6 flex flex-col items-center">
      {vaccineName && (
        <p className="text-sm text-glacier-700 mb-1">{vaccineName}</p>
      )}
      <div ref={canvasWrapperRef} className="p-4 bg-white border border-glacier-100 rounded">
        <QRCodeCanvas value={batchId} size={200} level="M" includeMargin={false} />
      </div>
      <p className="mt-3 font-mono text-sm text-glacier-900 tracking-wide">{batchId}</p>

      <div className="flex gap-2 mt-5 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 bg-glacier-700 hover:bg-glacier-800 text-white text-sm font-medium py-2 rounded transition-colors"
        >
          Download PNG
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 border border-glacier-300 hover:bg-glacier-50 text-glacier-800 text-sm font-medium py-2 rounded transition-colors"
        >
          Print
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-3 text-xs text-glacier-500 hover:text-glacier-700 underline"
        >
          Close
        </button>
      )}
    </div>
  )
}
