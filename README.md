# VaxSafe — Discard + QR Scan Out / Scan In Workflow

This document describes the vaccine **Discard** and **QR-based Scan Out / Scan In**
transfer workflow added to VaxSafe. It reuses the existing QR generator,
`QRScanner` component, and `dataService` — no QR/data logic was duplicated.

---

## 1. Workflow Overview

```
REGISTER BATCH
   → GENERATE QR              (existing QRGeneratorModal — unchanged)
   → SOURCE SCANS QR          (existing QRScanner — reused)
   → VERIFY BATCH              dataService.getVaccineByBatchId()
   → CONFIRM SCAN OUT          dataService.scanOutVaccine()
   → status: IN TRANSIT
   → DESTINATION SCANS SAME QR (same QRScanner instance, same batchId)
   → VERIFY TRANSFER           dataService.scanInVaccine()
   → CONFIRM SCAN IN
   → status: RECEIVED / IN STORAGE
   → INVENTORY UPDATED         (status-derived, no separate ledger needed)
   → HISTORY UPDATED           statusHistory sub-collection / local history map
```

The QR code always encodes only the batch's `batchId` (unchanged from the
original `QRGeneratorModal`). **No new QR is ever generated for a scan** —
every Scan Out / Scan In re-resolves the same registered batch record.

---

## 2. Discard Vaccine

**Where:** `VaccinesPage.jsx` (Vaccine Inventory table)

- Select one or more batches via row checkboxes (checkbox is hidden for
  batches that are already `DISCARDED` or currently `In Transit`).
- Click **Discard Selected (n)** (or the trash icon on a single row).
- A confirmation modal requires a **discard reason** before it will submit.
- On confirm, `discardBatches()` → `dataService.discardVaccine()` runs for
  each selected batch:
  - Batch is **never deleted** — `status` is set to `DISCARDED`.
  - `discardReason`, `discardedAt`, `discardedBy`, `previousStatus`, and
    `availableQuantity: 0` are recorded on the batch.
  - A history entry is written with **batch ID, vaccine name, quantity,
    reason, clinic, and timestamp**.
  - Duplicate discard is rejected (`"already been discarded"`).
  - A batch currently `In Transit` cannot be discarded until it's received.
- Discarded batches are automatically excluded from **Smart Rerouting**
  (which only lists `In Storage` / `Compromised` batches) and from Scan Out
  eligibility (see below) — so they can never re-enter transfer.

---

## 3. QR-Based Scan Out

**Where:** `QRScannerPage.jsx` (Optical QR Scanning & Cold-Chain Transit)

1. Operator scans the batch's QR (camera or manual batch-ID fallback —
   both use the existing `QRScanner` component).
2. `getVaccineByBatchId()` verifies the QR belongs to a **registered**
   batch. Unknown QR → rejected with a clear error, no further action
   possible.
3. Batch details are shown before any confirmation: **Batch ID, vaccine
   name, quantity, source clinic, status**.
4. The **Confirm Scan Out** action only appears when the batch is
   *eligible*:
   - not `DISCARDED`
   - not already `In Transit` (blocks duplicate Scan Out)
   - held in custody at the scanning clinic
   - status is `In Storage` or `QUARANTINE_REVIEW`
5. Operator selects a destination facility and confirms. There is **no
   manual-confirmation-only path** — the action button is unreachable
   without a prior successful scan.
6. On confirm, `dataService.scanOutVaccine()`:
   - status → `In Transit`
   - `destinationClinicId` / `destinationClinicName` set
   - source inventory decreases (status-driven: the batch leaves the
     "In Storage" bucket at the source clinic)
   - history entry recorded (`action: SCAN_OUT`, timestamp, clinics, qty)

---

## 4. QR-Based Scan In

**Where:** same `QRScannerPage.jsx`, at the destination clinic.

1. Destination staff scan the **same** QR code (same `batchId`, no new QR).
2. `dataService.scanInVaccine()` verifies, in order:
   - QR belongs to a registered batch (else "Unknown QR")
   - batch is not `DISCARDED`
   - batch has an **active** `In Transit` transfer (else rejected —
     covers "no Scan Out yet" and "duplicate Scan In", since a batch that
     was already received is no longer `In Transit`)
   - the batch's `destinationClinicId` matches the **current, logged-in**
     clinic (else "Wrong destination" — rejected even with a valid QR)
3. On success:
   - status → `In Storage` (RECEIVED / IN STORAGE)
   - custody transfers: `clinicId` / `clinicName` become the destination
   - destination inventory increases (status-driven)
   - history entry recorded (`action: SCAN_IN`, timestamp, clinics, qty)

---

## 5. Safety Rules Enforced

| Rule | Enforced by |
|---|---|
| Never delete a batch on discard | `discardVaccine()` only mutates `status` |
| Never transfer a discarded batch | `scanOutVaccine()` / rerouting filter check `status !== 'DISCARDED'` |
| Never Scan In without a valid Scan Out | `scanInVaccine()` requires `status === 'In Transit'` |
| Never Scan In with the wrong QR | batch must resolve via `getVaccineByBatchId()`; unknown → rejected |
| Never Scan In at the wrong destination | `destinationClinicId` must equal the scanning clinic's ID |
| No duplicate Scan Out | rejected once status is already `In Transit` |
| No duplicate Scan In | rejected once status is no longer `In Transit` (already received) |
| No duplicate Discard | rejected once status is already `DISCARDED` |
| Batch-level temperature / excursion / quarantine logic | untouched — `evaluateBatchExcursions()` unchanged |

All local-storage mutations re-validate state **immediately before writing**
(not just at the start of the function) to close the race window between
two rapid duplicate scans.

---

## 6. Files Changed

| File | Change |
|---|---|
| `src/services/dataService.js` | Added `getVaccineById`, `discardVaccine`, `scanOutVaccine`, `scanInVaccine` |
| `src/context/DataContext.jsx` | Added `discardBatches`, `scanOutBatch`, `scanInBatch` |
| `src/pages/VaccinesPage.jsx` | Multi-select checkboxes, Discard button/modal, DISCARDED filter |
| `src/pages/QRScannerPage.jsx` | Replaced manual dispatch/accept flow with QR-gated Scan Out / Scan In |
| `src/pages/VaccineDetailPage.jsx` | Hides "Flag as Compromised" for discarded batches |
| `src/components/common/Badge.jsx` | Added `discarded` badge style |

No changes were made to QR generation (`QRGeneratorModal.jsx`), the scanner
component (`QRScanner.jsx`), authentication, temperature monitoring, or
breach-alert logic.

---

## 7. Test Cases Verified

1. Valid QR → Scan Out succeeds ✅
2. Unknown QR → rejected ✅
3. Wrong/non-transfer batch → rejected ✅
4. Same QR → Scan In at correct destination succeeds ✅
5. Same QR → Scan In at wrong destination rejected ✅
6. Scan In without Scan Out rejected ✅
7. Duplicate Scan Out rejected ✅
8. Duplicate Scan In rejected ✅
9. Discarded batch QR → transfer rejected ✅
10. Inventory and history update correctly after every operation ✅

These were run against the live `dataService` module (bundled and executed
in isolation with a mocked `localStorage`) and all passed with the exact
rejection messages shown in-app.
