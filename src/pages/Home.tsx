import { useNavigate } from 'react-router-dom'

export function Home() {
  const nav = useNavigate()
  return (
    <div className="page">
      <div className="logo">⬡ SIGNGUARD</div>
      <h1 className="step-title" style={{ fontSize: 30, marginBottom: 8 }}>Biometric Document Signing</h1>
      <p className="step-sub">Post-quantum certified signatures for contracts and legal documents</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => nav('/enroll')}>
          <div className="badge badge-purple">Identity</div>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Register Identity</h2>
          <p style={{ fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
            Create a certified signer identity (face + cognitive + voice).<br />
            Takes about 3 minutes.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20 }}>
            Start Registration →
          </button>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => nav('/sign')}>
          <div className="badge badge-green">Signing</div>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Sign a Document</h2>
          <p style={{ fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
            Upload a PDF (or describe the document), verify your face, then sign.
          </p>
          <button className="btn btn-success" style={{ marginTop: 20 }}>
            Start Signing →
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Post-Quantum FIPS 203', 'Legally Certifiable', '3 French Patents'].map(t => (
          <span key={t} className="badge badge-purple">{t}</span>
        ))}
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => nav('/documents')}>
          Signed Documents
        </button>
        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => nav('/verify-cert')}>
          Verify Certificate
        </button>
      </div>
    </div>
  )
}

