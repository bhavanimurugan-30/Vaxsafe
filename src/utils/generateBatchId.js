// Generates a short, human-typeable batch ID like "VX-7K2M9Q".
// Not cryptographically unique, but collision odds are negligible
// for a prototype's scale (36^6 combinations).
export function generateBatchId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `VX-${suffix}`
}
