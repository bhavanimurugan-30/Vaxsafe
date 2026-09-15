/**
 * One-time seed script — run with: npm run seed
 *
 * Populates Firestore with 4 demo clinics and 4 demo user->clinic
 * assignments. Uses firebase-admin so it can write regardless of
 * your Firestore security rules.
 *
 * SETUP BEFORE RUNNING:
 * 1. npm install firebase-admin --save-dev
 * 2. In Firebase Console -> Project settings -> Service accounts,
 *    generate a new private key and save it as
 *    `serviceAccountKey.json` in the project root (already gitignored).
 * 3. Create 4 demo users in Firebase Console -> Authentication
 *    (e.g. clinic-a@vaxsafe.demo / clinic-b@vaxsafe.demo, etc.) and
 *    paste their UIDs into DEMO_USERS below.
 * 4. Run `npm run seed`.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync(new URL('../../serviceAccountKey.json', import.meta.url))
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const CLINICS = [
  { id: 'clinic-a', name: 'Clinic A' },
  { id: 'clinic-b', name: 'Clinic B' },
  { id: 'clinic-c', name: 'Clinic C' },
  { id: 'clinic-d', name: 'Clinic D' },
]

// Map each demo Auth user's UID to the clinic they're assigned to.
// Replace these placeholder UIDs with real ones from Firebase Auth
// after you create the demo accounts.
const DEMO_USERS = [
  { uid: 'b1fusfoAnfd9VdzsNbJ1cbSgv4x1', clinicId: 'clinic-a', clinicName: 'Clinic A', email: 'clinic-a@vaxsafe.demo' },
  { uid: 'jUlEjKQRXaW61777CMQMOWbgZHy2', clinicId: 'clinic-b', clinicName: 'Clinic B', email: 'clinic-b@vaxsafe.demo' },
  { uid: 'Iz6fEKyeRJgbkPmANtHmVoSEIIs1', clinicId: 'clinic-c', clinicName: 'Clinic C', email: 'clinic-c@vaxsafe.demo' },
  { uid: 'DOST2DPj3ORijtGX8M92RXW1mro1', clinicId: 'clinic-d', clinicName: 'Clinic D', email: 'clinic-d@vaxsafe.demo' },
]

async function seed() {
  console.log('Seeding clinics...')
  for (const clinic of CLINICS) {
    await db.collection('clinics').doc(clinic.id).set({ name: clinic.name })
    console.log(`  + ${clinic.name}`)
  }

  console.log('Seeding demo user -> clinic assignments...')
  for (const user of DEMO_USERS) {
    if (user.uid.startsWith('REPLACE_WITH_UID')) {
      console.log(`  ! Skipping ${user.email} — replace its placeholder UID first.`)
      continue
    }
    await db.collection('users').doc(user.uid).set({
      clinicId: user.clinicId,
      clinicName: user.clinicName,
      email: user.email,
    })
    console.log(`  + ${user.email} -> ${user.clinicName}`)
  }

  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
