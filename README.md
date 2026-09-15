# VaxSafe — Vaccine Cold-Chain Tracking & Logistics

**VaxSafe** is a professional, production-style healthcare and cold-chain logistics operations platform designed to monitor vaccine storage, track vaccine batches, detect temperature breaches, and rapidly reroute compromised vaccines to the nearest facility using geodesic (Haversine) proximity calculations.

---

## Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS
- **Authentication**: Firebase Authentication (Email/Password) with Resilient Operations Engine fallback
- **Database**: Firebase Cloud Firestore with local operational state caching
- **Barcodes & QR**: `qrcode.react` (generation, label printing, PNG download) & `html5-qrcode` (camera scanner + manual Batch ID fallback)
- **Telemetry & Visualization**: Recharts 24-hour thermal profile with safe band (2°C – 8°C)
- **Smart Rerouting**: Pure JavaScript implementation of the spherical Haversine distance formula
- **Deployment**: Vercel ready (`vercel.json` SPA routing rewrites)

---

## Directory Layout

```
vaxsafe/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── qr/
│   │   │   ├── QRGeneratorModal.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   └── PrintableLabel.jsx
│   │   ├── temperature/
│   │   │   ├── TemperatureChart.jsx
│   │   │   ├── ManualTempEntryModal.jsx
│   │   │   └── MockSensorControls.jsx
│   │   └── rerouting/
│   │       ├── ClinicDistanceCard.jsx
│   │       └── ReroutingModal.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── DataContext.jsx
│   │   └── ToastContext.jsx
│   ├── services/
│   │   ├── firebase.js          # Firebase SDK initialization & fallback check
│   │   ├── dataService.js       # Abstracted Firestore & Local Operations engine
│   │   ├── haversine.js         # Spherical geodesic distance & transit calculations
│   │   ├── mockSensors.js       # Simulated IoT telemetry & spike injection
│   │   └── seedData.js          # Predefined clinics (A, B, C, D) & inventory
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── VaccinesPage.jsx
│   │   ├── VaccineDetailPage.jsx
│   │   ├── QRScannerPage.jsx
│   │   ├── TemperaturePage.jsx
│   │   ├── BreachAlertsPage.jsx
│   │   ├── SmartReroutingPage.jsx
│   │   └── ProfilePage.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .env.example
├── vercel.json
├── package.json
└── vite.config.js
```

---

## Pre-Seeded Network Facilities

| Facility | Latitude | Longitude | Capacity | Director Account |
| :--- | :--- | :--- | :--- | :--- |
| **Clinic A - Metro Central General Hospital** | 40.7128 | -74.0060 | 12,000 doses | `admin@clinic-a.vaxsafe.org` |
| **Clinic B - Riverside Community Clinic** | 40.7831 | -73.9712 | 4,500 doses | `ops@clinic-b.vaxsafe.org` |
| **Clinic C - Harbor Regional Medical Center** | 40.6782 | -73.9442 | 8,000 doses | `pharm@clinic-c.vaxsafe.org` |
| **Clinic D - Valley Memorial Hospital** | 40.8448 | -73.8648 | 6,000 doses | `supply@clinic-d.vaxsafe.org` |

*Password for all demo accounts*: `Password123!` (or use the one-click quick login buttons on the login screen).

---

## Running Locally

1. Install dependencies (already completed):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. Build for production:
   ```bash
   npm run build
   ```

---

## Firebase Configuration

To connect live Firebase Cloud Firestore and Authentication, populate `.env` with your project keys:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

If these keys remain empty or placeholders, VaxSafe automatically operates with its integrated high-fidelity local operations engine so all features (registration, scanning, transit, telemetry, alerts, and rerouting) can be fully evaluated immediately.

---

## Vercel Deployment

Deploy directly via Vercel CLI or by linking your Git repository:

```bash
npx vercel
```
The included `vercel.json` ensures that all single-page application routes redirect to `index.html`.
