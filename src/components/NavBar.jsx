import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { clinic, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm rounded transition-colors ${
      isActive
        ? 'bg-glacier-700 text-white'
        : 'text-glacier-700 hover:bg-glacier-100'
    }`

  return (
    <header className="border-b border-glacier-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-glacier-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
              <path d="M12 8v4l2.5 2.5" />
            </svg>
          </div>
          <span className="font-semibold text-glacier-900 text-sm">VaxSafe</span>
          {clinic?.name && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-glacier-100 text-glacier-700">
              {clinic.name}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/register" className={linkClass}>
            Register
          </NavLink>
          <NavLink to="/vaccines" className={linkClass}>
            Vaccines
          </NavLink>
          <button
            onClick={logout}
            className="ml-2 px-3 py-1.5 text-sm rounded text-glacier-500 hover:text-glacier-800 hover:bg-glacier-100 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
