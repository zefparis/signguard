import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { findCertificateById } from '../services/certificatesStorage'
import { openPrintableCertificate } from '../services/certificateGenerator'
import type { SignedCertificate } from '../types/certificate'

function useQueryParam(name: string): string | null {
  const loc = useLocation()
  return useMemo(() => {
    const q = new URLSearchParams(loc.search)
    return q.get(name)
  }, [loc.search, name])
}

export function VerifyCertificate() {
  const nav = useNavigate()
  const prefill = useQueryParam('id')

  const [certificateId, setCertificateId] = useState(prefill ?? '')
  const [uploaded, setUploaded] = useState<SignedCertificate | null>(null)

  const found = useMemo(() => {
    const id = certificateId.trim()
    if (!id) return null
    return findCertificateById(id)
  }, [certificateId])

  const cert = uploaded ?? found

  async function handleUpload(file: File | null) {
    if (!file) return
    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw) as SignedCertificate
      setUploaded(parsed)
      setCertificateId(parsed.certificate_id || '')
    } catch {
      setUploaded(null)
      alert('Invalid certificate JSON file')
    }
  }

  return (
    <div className="page">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => nav('/')}>← SIGNGUARD</div>

      <div className="badge badge-purple">Verification</div>
      <h1 className="step-title">Verify Certificate</h1>
      <p className="step-sub">Validate a certificate stored locally, or upload a JSON certificate.</p>

      <div className="card" style={{ width: '100%' }}>
        <div className="field">
          <label>Certificate ID</label>
          <input value={certificateId} onChange={e => setCertificateId(e.target.value)} placeholder="01J..." />
        </div>

        <div className="field">
          <label>Or upload certificate JSON</label>
          <input type="file" accept="application/json" onChange={e => handleUpload(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 16 }}>
        {!certificateId.trim() && !uploaded ? (
          <div className="card" style={{ color: 'var(--grey)', fontSize: 13, lineHeight: 1.6 }}>
            Enter a Certificate ID or upload a certificate JSON file.
          </div>
        ) : cert ? (
          <>
            <div className="badge badge-green" style={{ margin: '0 auto 16px' }}>VALID ✓</div>
            <div className="card" style={{ width: '100%' }}>
              <div className="metric-row"><span className="metric-label">Certificate ID</span><span className="metric-value">{cert.certificate_id}</span></div>
              <div className="metric-row"><span className="metric-label">Document</span><span className="metric-value">{cert.document_name || '—'}</span></div>
              <div className="metric-row"><span className="metric-label">Hash</span><span className="metric-value" style={{ fontSize: 11 }}>{cert.document_hash.slice(0, 16)}…</span></div>
              <div className="metric-row"><span className="metric-label">Signer</span><span className="metric-value">{cert.signer_name}</span></div>
              <div className="metric-row"><span className="metric-label">Organization</span><span className="metric-value">{cert.organization || '—'}</span></div>
              <div className="metric-row"><span className="metric-label">Role</span><span className="metric-value">{cert.role || '—'}</span></div>
              <div className="metric-row"><span className="metric-label">Signed</span><span className="metric-value">{new Date(cert.signed_at).toLocaleString('en-ZA')}</span></div>
              <div className="metric-row"><span className="metric-label">Algorithm</span><span className="metric-value">{cert.pq_algorithm}</span></div>
              <div className="metric-row"><span className="metric-label">Facial match</span><span className="metric-value">{Math.round(cert.facial_similarity)}%</span></div>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 14 }}>
              <button className="btn btn-outline" onClick={() => nav('/documents')}>Back to Log</button>
              <button className="btn btn-primary" onClick={() => openPrintableCertificate(cert)}>Download</button>
            </div>
          </>
        ) : (
          <>
            <div className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)', margin: '0 auto 16px' }}>
              INVALID ✗
            </div>
            <div className="card" style={{ width: '100%', color: 'var(--grey)', fontSize: 13, lineHeight: 1.6 }}>
              Certificate not found in localStorage.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
