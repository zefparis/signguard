import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadCertificates } from '../services/certificatesStorage'
import { openPrintableCertificate } from '../services/certificateGenerator'

export function DocumentsLog() {
  const nav = useNavigate()
  const items = useMemo(() => loadCertificates(), [])

  return (
    <div className="page">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => nav('/')}>← SIGNGUARD</div>

      <div className="badge badge-purple">Local Log</div>
      <h1 className="step-title">Signed Documents</h1>
      <p className="step-sub">Stored locally in your browser (offline-first).</p>

      <div className="card" style={{ width: '100%' }}>
        <div className="metric-row">
          <span className="metric-label">Total</span>
          <span className="metric-value">{items.length}</span>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {items.length === 0 ? (
          <div className="card" style={{ width: '100%', color: 'var(--grey)', fontSize: 13, lineHeight: 1.6 }}>
            No signed documents yet.
          </div>
        ) : (
          items.map((c) => (
            <div key={c.certificate_id} className="card" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700 }}>{c.document_name || 'Untitled document'}</div>
                <div className="badge badge-green" style={{ marginBottom: 0 }}>SIGNED ✓</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
                <div><b style={{ color: 'var(--white)' }}>Certificate</b>: {c.certificate_id}</div>
                <div><b style={{ color: 'var(--white)' }}>Signer</b>: {c.signer_name}</div>
                <div><b style={{ color: 'var(--white)' }}>Date</b>: {new Date(c.signed_at).toLocaleString('en-ZA')}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn btn-outline" onClick={() => nav(`/verify-cert?id=${encodeURIComponent(c.certificate_id)}`)}>
                  View
                </button>
                <button className="btn btn-primary" onClick={() => openPrintableCertificate(c)}>
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={() => nav('/sign')}>
        Sign a Document
      </button>
    </div>
  )
}
