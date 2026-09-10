import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import QRCodeCard from '../components/QRCodeCard'

export default function VaccineList() {
  const { clinic } = useAuth()
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!clinic?.id) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'vaccines'),
      where('clinicId', '==', clinic.id),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setVaccines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoadError('Could not load vaccines for your clinic.')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [clinic?.id])

  return (
    <div className="min-h-screen bg-frost">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-lg font-semibold text-glacier-900 mb-1">
          Registered vaccines
        </h1>
        <p className="text-sm text-glacier-500 mb-5">
          Showing batches registered under {clinic?.name || 'your clinic'}. Click a row to view its QR code.
        </p>

        {loadError && <p className="text-sm text-red-600 mb-4">{loadError}</p>}

        <div className="bg-white border border-glacier-200 rounded-lg overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-glacier-400">Loading...</p>
          ) : vaccines.length === 0 ? (
            <p className="p-6 text-sm text-glacier-400">
              No vaccines registered yet. Add one from the Register page.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glacier-200 text-left text-xs text-glacier-500">
                  <th className="px-4 py-3 font-medium">Vaccine name</th>
                  <th className="px-4 py-3 font-medium">Batch ID</th>
                  <th className="px-4 py-3 font-medium">Expiry date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="border-b border-glacier-100 last:border-0 hover:bg-glacier-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-glacier-900">{v.vaccineName}</td>
                    <td className="px-4 py-3 font-mono text-glacier-700">{v.batchId}</td>
                    <td className="px-4 py-3 text-glacier-700">{v.expiryDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-glacier-100 text-glacier-700">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {selected && (
        <div
          className="fixed inset-0 bg-glacier-950/40 flex items-center justify-center px-4 z-10"
          onClick={() => setSelected(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <QRCodeCard
              batchId={selected.batchId}
              vaccineName={selected.vaccineName}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
