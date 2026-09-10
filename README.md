# VaxSafe — Phase 1 (Foundation)

A vaccine cold-chain tracking prototype. This phase covers **login → register
a vaccine batch → generate a QR code → view registered vaccines**. Monitoring,
breach detection, and rerouting are intentionally not implemented yet.

## Stack

- React + Vite + Tailwind CSS
- Firebase Authentication (email/password)
- Firebase Firestore
- `qrcode.react` for QR generation
- `react-router-dom` for routing

## 1. Install dependencies

```bash
npm install
```

## 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com.
2. Enable **Authentication -> Sign-in method -> Email/Password**.
3. Create a **Firestore database** (start in test mode for local dev, or use
   `firestore.rules` in this repo as a starting point for real rules).
4. In **Project settings -> General -> Your apps**, register a Web app and
   copy the config values into `src/firebase.js`, replacing the
   `YOUR_...` placeholders.

## 3. Seed demo data

The app expects two Firestore collections to exist before you can log in:

- `clinics/{clinicId}` — `{ name }`
- `users/{uid}` — `{ clinicId, clinicName, email }` (one per demo login)

**Option A — script (recommended):**

1. `npm install firebase-admin --save-dev`
2. In Firebase Console -> Project settings -> Service accounts, generate a
   private key and save it as `serviceAccountKey.json` in the project root.
3. In Firebase Console -> Authentication, manually create 4 demo users
   (e.g. `clinic-a@vaxsafe.demo` / a password of your choice), and copy their
   UIDs into `src/seed/seedClinics.js` under `DEMO_USERS`.
4. Run:

   ```bash
   npm run seed
   ```

   This writes the 4 clinics (`Clinic A`–`D`) and the matching
   `users/{uid}` assignment docs.

**Option B — manual:** add the documents by hand in the Firestore console
using the shapes above.

## 4. Run the app

```bash
npm run dev
```

Sign in with one of the demo accounts you created. After login you'll see
your clinic name in the top bar.

## What's implemented

- **Login** — Firebase email/password auth; fetches and displays the
  signed-in user's assigned clinic from `users/{uid}`.
- **Vaccine registration** — form (name, batch ID, manufacturer, mfg date,
  expiry date, quantity) that writes to `vaccines`, tagged with the current
  clinic and `status: "In Storage"`. Batch ID auto-generates (e.g. `VX-7K2M9Q`)
  if left blank.
- **QR generation** — on successful submit, a QR code encoding the batch ID
  renders immediately, with Download PNG and Print buttons.
- **Vaccine list** — table of vaccines scoped to the logged-in clinic
  (name, batch ID, expiry, status); clicking a row reopens its QR code.

## Firestore shape

```
clinics/{clinicId}          { name }
users/{uid}                 { clinicId, clinicName, email }
vaccines/{autoId}           {
  vaccineName, batchId, manufacturer,
  manufacturingDate, expiryDate, quantity,
  status: "In Storage",
  clinicId, clinicName, createdAt
}
```

## Not in this phase (coming later)

- QR code scanning
- Temperature / cold-chain monitoring
- Breach detection and automatic rerouting
