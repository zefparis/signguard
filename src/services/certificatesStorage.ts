import type { SignedCertificate } from '../types/certificate'

const STORAGE_KEY = 'signguard-signed-certificates'

export function loadCertificates(): SignedCertificate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as SignedCertificate[]
  } catch {
    return []
  }
}

export function saveCertificates(items: SignedCertificate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)))
}

export function addCertificate(cert: SignedCertificate): void {
  const items = loadCertificates()
  items.unshift(cert)
  saveCertificates(items)
}

export function findCertificateById(id: string): SignedCertificate | null {
  const items = loadCertificates()
  return items.find(c => c.certificate_id === id) ?? null
}
