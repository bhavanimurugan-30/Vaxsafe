import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { generateBatchId } from '../utils/generateBatchId'
import NavBar from '../components/NavBar'
import QRCodeCard from '../components/QRCodeCard'

const emptyForm = {
  vaccineName: '',
  batchId: '',
  manufacturer: '',
  manufacturingDate: '',
  expiryDate: '',
  quantity: '',
  minTemperature: '2.0',
  maxTemperature: '8.0',
  maxExcursionDurationMinutes: '60',
  warningBeforeMinutes: '16'
}

export default function Register() {
  const { clinic, error: clinicError } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [registered, setRegistered] = useState(null) // { batchId, vaccineName }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    if (!form.vaccineName.trim()) return 'Vaccine name is required.'
    if (!form.manufacturer.trim()) return 'Manufacturer is required.'
    if (!form.manufacturingDate) return 'Manufacturing date is required.'
    if (!form.expiryDate) return 'Expiry date is required.'
    if (form.expiryDate < form.manufacturingDate) return 'Expiry date must be after manufacturing date.'
    if (!form.quantity || Number(form.quantity) <= 0) return 'Quantity must be a positive number.'
    if (isNaN(parseFloat(form.minTemperature)) || isNaN(parseFloat(form.maxTemperature))) {
      return 'Valid minimum and maximum temperatures are required.'
    }
    if (parseFloat(form.minTemperature) >= parseFloat(form.maxTemperature)) {
      return 'Minimum temperature must be lower than maximum temperature.'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (!clinic?.id) {
      setFormError('No clinic assigned to your account — cannot register a vaccine.')
      return
    }

    const batchId = form.batchId.trim() || generateBatchId()

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'vaccines'), {
        vaccineName: form.vaccineName.trim(),
        batchId,
        manufacturer: form.manufacturer.trim(),
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        minTemperature: parseFloat(form.minTemperature),
        maxTemperature: parseFloat(form.maxTemperature),
        maxExcursionDurationMinutes: Number(form.maxExcursionDurationMinutes) || 60,
        warningBeforeMinutes: Number(form.warningBeforeMinutes) || 16,
        status: 'In Storage',
        clinicId: clinic.id,
        clinicName: clinic.name,
        createdAt: serverTimestamp(),
      })

      setRegistered({ batchId, vaccineName: form.vaccineName.trim() })
      setForm(emptyForm)
    } catch (err) {
      console.error(err)
      setFormError('Could not save this vaccine. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-frost">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-glacier-200 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-glacier-900 mb-1">
            Register a vaccine batch
          </h1>
          <p className="text-sm text-glacier-500 mb-5">
            New entries are recorded under {clinic?.name || 'your clinic'} with status
            "In Storage."
          </p>

          {clinicError && (
            <p className="text-sm text-red-600 mb-4">{clinicError}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Vaccine name">
              <input
                type="text"
                value={form.vaccineName}
                onChange={(e) => updateField('vaccineName', e.target.value)}
                className="input"
                placeholder="e.g. Hepatitis B"
              />
            </Field>

            <Field label="Batch ID" hint="Leave blank to auto-generate">
              <input
                type="text"
                value={form.batchId}
                onChange={(e) => updateField('batchId', e.target.value)}
                className="input font-mono"
                placeholder="Auto-generated if empty"
              />
            </Field>

            <Field label="Manufacturer">
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                className="input"
                placeholder="e.g. BioNTech"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Manufacturing date">
                <input
                  type="date"
                  value={form.manufacturingDate}
                  onChange={(e) => updateField('manufacturingDate', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Expiry date">
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Quantity">
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                className="input"
                placeholder="e.g. 500"
              />
            </Field>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-glacier-700 hover:bg-glacier-800 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded transition-colors"
            >
              {submitting ? 'Registering...' : 'Register vaccine'}
            </button>
          </form>
        </div>

        <div className="flex items-start justify-center">
          {registered ? (
            <div className="w-full max-w-xs">
              <p className="text-sm text-glacier-600 mb-3 text-center">
                Registered. Scan or save this QR code for the batch.
              </p>
              <QRCodeCard
                batchId={registered.batchId}
                vaccineName={registered.vaccineName}
              />
            </div>
          ) : (
            <div className="w-full max-w-xs border border-dashed border-glacier-300 rounded-lg p-10 text-center text-sm text-glacier-400">
              A QR code will appear here once a batch is registered.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-glacier-700 mb-1">
        {label}
        {hint && <span className="font-normal text-glacier-400"> — {hint}</span>}
      </span>
      {children}
    </label>
  )
}
