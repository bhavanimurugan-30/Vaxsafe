import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user, clinic, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  if (!loading && user) {
    return <Navigate to="/register" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/register')
    } catch (err) {
      console.error(err)
      setFormError('Invalid email or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-frost flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-glacier-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
              <path d="M12 8v4l2.5 2.5" />
            </svg>
          </div>
          <span className="font-semibold text-xl text-glacier-900">VaxSafe</span>
        </div>

        <div className="bg-white border border-glacier-200 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-glacier-900 mb-1">Sign in</h1>
          <p className="text-sm text-glacier-500 mb-5">
            Use your clinic-assigned account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-glacier-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-glacier-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glacier-400"
                placeholder="clinic-a@vaxsafe.demo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-glacier-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-glacier-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glacier-400"
                placeholder="••••••••"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-glacier-700 hover:bg-glacier-800 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-xs text-glacier-400 text-center mt-4">
          Prototype build — cold-chain tracking foundation.
        </p>
      </div>
    </div>
  )
}
