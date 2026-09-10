import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [clinic, setClinic] = useState(null) // { id, name }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null)
      if (!firebaseUser) {
        setUser(null)
        setClinic(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setClinic({ id: data.clinicId, name: data.clinicName })
        } else {
          setClinic(null)
          setError('No clinic is assigned to this account yet. Contact an administrator.')
        }
      } catch (err) {
        console.error(err)
        setError('Could not load your clinic assignment.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  const value = { user, clinic, loading, error, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
