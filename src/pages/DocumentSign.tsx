import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SelfieCapture } from '../components/SelfieCapture'
import { verifyWorker } from '../services/api'
import { generateSessionKeypair, PQ_ALGORITHM, signDocumentHash } from '../services/postQuantum'
import { addCertificate } from '../services/certificatesStorage'
import { openPrintableCertificate } from '../services/certificateGenerator'
import type { SignedCertificate } from '../types/certificate'
import { sha3_256 } from 'js-sha3'
import { ulid } from 'ulid'
import { useSignGuardStore } from '../store/signguardStore'

type Mode = 'pdf' | 'description'
type Step = 'identity' | 'document' | 'selfie' | 'review' | 'certificate'

function hashBytesToHex(bytes: Uint8Array): string {
  // js-sha3 wants an ArrayBuffer-like; we'll convert ourselves for type-safety
  return sha3_256(bytes)
}

function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const buf = reader.result
      if (!(buf instanceof ArrayBuffer)) return reject(new Error('Unexpected file reader result'))
      resolve(new Uint8Array(buf))
    }
    reader.readAsArrayBuffer(file)
  })
}

async function getGeoLocation(): Promise<{ lat: number; lng: number; accuracy_m?: number } | undefined> {
  if (!('geolocation' in navigator)) return undefined

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        })
      },
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 6000 }
    )
  })
}

export function DocumentSign() {
  const nav = useNavigate()
  const { signer } = useSignGuardStore()

  const [step, setStep] = useState<Step>('identity')
  const [firstName, setFirstName] = useState(signer?.firstName ?? '')
  const [lastName, setLastName] = useState(signer?.lastName ?? '')
  const [signerId, setSignerId] = useState(signer?.idNumber ?? '')
  const [organization, setOrganization] = useState(signer?.organization ?? '')
  const [role, setRole] = useState(signer?.role ?? '')

  const [mode, setMode] = useState<Mode>('pdf')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [docDate, setDocDate] = useState('')

  const [docHash, setDocHash] = useState<string>('')
  const [hashInfo, setHashInfo] = useState<{ name: string; size: number } | null>(null)

  const [, setSelfieB64] = useState('')
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [certificate, setCertificate] = useState<SignedCertificate | null>(null)

  const docName = useMemo(() => {
    if (mode === 'pdf') return pdfFile?.name ?? ''
    const d = docTitle.trim()
    return d || 'Document description'
  }, [mode, pdfFile, docTitle])

  async function computeHashFromPDF(file: File) {
    const bytes = await readFileAsUint8Array(file)
    const hex = hashBytesToHex(bytes)
    setDocHash(hex)
    setHashInfo({ name: file.name, size: file.size })
  }

  async function computeHashFromText() {
    const payload = {
      title: docTitle.trim(),
      contract_reference: contractRef.trim(),
      date: docDate.trim(),
    }
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    const hex = hashBytesToHex(bytes)
    setDocHash(hex)
    setHashInfo({ name: payload.title || 'Description', size: bytes.length })
  }

  function nextFromIdentity(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (!firstName.trim() || !lastName.trim() || !signerId.trim() || !organization.trim() || !role.trim()) {
      setErrorMsg('Please fill all required signer fields.')
      return
    }
    setStep('document')
  }

  async function nextFromDocument(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    try {
      if (mode === 'pdf') {
        if (!pdfFile) {
          setErrorMsg('Please upload a PDF.')
          return
        }
        await computeHashFromPDF(pdfFile)
      } else {
        if (!docTitle.trim() || !contractRef.trim() || !docDate.trim()) {
          setErrorMsg('Please fill title/description, contract reference, and date.')
          return
        }
        await computeHashFromText()
      }
      setStep('selfie')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to hash document')
    }
  }

  async function handleSelfie(b64: string) {
    setSelfieB64(b64)
    setErrorMsg('')
    setSimilarity(null)

    try {
      const res = await verifyWorker({ selfie_b64: b64, first_name: firstName.trim(), last_name: lastName.trim() })
      const sim = Math.round(res.similarity)
      setSimilarity(sim)
      if (!res.verified || sim < 80) {
        setErrorMsg(`Identity verification failed (similarity: ${sim}%). Minimum: 80%`)
        return
      }
      setStep('review')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  async function signNow() {
    setErrorMsg('')
    if (!docHash) {
      setErrorMsg('Missing document hash.')
      return
    }
    if (similarity === null || similarity < 80) {
      setErrorMsg('Biometric verification required.')
      return
    }

    try {
      const location = await getGeoLocation()
      const { publicKey: pq_public_key, privateKey } = generateSessionKeypair()
      const pq_signature = signDocumentHash(docHash, privateKey)
      const cert: SignedCertificate = {
        certificate_id: ulid(),
        tenant_id: import.meta.env.VITE_TENANT_ID,

        document_hash: docHash,
        document_name: docName,

        signer_name: `${firstName.trim()} ${lastName.trim()}`,
        signer_id: signerId.trim(),
        organization: organization.trim(),
        role: role.trim(),

        signed_at: new Date().toISOString(),
        facial_similarity: similarity,
        location,

        pq_signature,
        pq_public_key,
        pq_algorithm: PQ_ALGORITHM,

        behavioral_captured: true,
      }

      addCertificate(cert)
      setCertificate(cert)
      setStep('certificate')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Signing failed')
    }
  }

  return (
    <div className="page">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => nav('/')}>← SIGNGUARD</div>

      <div className="badge badge-purple">Document</div>
      <h1 className="step-title">Sign a Document</h1>
      <p className="step-sub">Verify your identity, hash the document, then sign with a post-quantum certificate.</p>

      {errorMsg && (
        <div className="card" style={{ width: '100%', borderColor: 'rgba(239,68,68,0.35)', color: 'var(--red)', fontSize: 13, lineHeight: 1.6 }}>
          {errorMsg}
        </div>
      )}

      {step === 'identity' && (
        <form onSubmit={nextFromIdentity} style={{ width: '100%', marginTop: 12 }}>
          <div className="card">
            <div className="badge badge-purple">Step 1 — Signer Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>First Name *</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="field">
                <label>Last Name *</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>ID Number *</label>
              <input value={signerId} onChange={e => setSignerId(e.target.value)} placeholder="Passport / National ID" />
            </div>
            <div className="field">
              <label>Organization *</label>
              <input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Acme Legal" />
            </div>
            <div className="field">
              <label>Role / Title *</label>
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="General Counsel" />
            </div>
            <button className="btn btn-primary" type="submit">Continue →</button>
          </div>
        </form>
      )}

      {step === 'document' && (
        <form onSubmit={nextFromDocument} style={{ width: '100%', marginTop: 12 }}>
          <div className="card">
            <div className="badge badge-purple">Step 2 — Document</div>

            <div className="field">
              <label>Document Input</label>
              <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
                <option value="pdf">Upload PDF</option>
                <option value="description">Description (no file)</option>
              </select>
            </div>

            {mode === 'pdf' ? (
              <div className="field">
                <label>PDF File *</label>
                <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Document title / description *</label>
                  <input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Service Agreement" />
                </div>
                <div className="field">
                  <label>Contract reference number *</label>
                  <input value={contractRef} onChange={e => setContractRef(e.target.value)} placeholder="REF-2026-001" />
                </div>
                <div className="field">
                  <label>Date *</label>
                  <input value={docDate} onChange={e => setDocDate(e.target.value)} placeholder="2026-03-22" />
                </div>
              </>
            )}

            <button className="btn btn-primary" type="submit">Compute Hash →</button>
            <button className="btn btn-outline" type="button" style={{ marginTop: 10 }} onClick={() => setStep('identity')}>
              Back
            </button>
          </div>
        </form>
      )}

      {step === 'selfie' && (
        <div style={{ width: '100%', marginTop: 12 }}>
          <div className="card">
            <div className="badge badge-purple">Step 3 — Biometric verification</div>
            <p style={{ fontSize: 13, color: 'var(--grey)', lineHeight: 1.6, marginBottom: 12 }}>
              Similarity must be at least 80%.
            </p>
            <SelfieCapture onCapture={handleSelfie} />
            {similarity !== null && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--grey)' }}>
                Facial similarity: <b style={{ color: similarity >= 80 ? 'var(--green)' : 'var(--red)' }}>{similarity}%</b>
              </div>
            )}
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setStep('document')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div style={{ width: '100%', marginTop: 12 }}>
          <div className="card">
            <div className="badge badge-purple">Step 4 — Review & Sign</div>

            <div className="metric-row"><span className="metric-label">Document</span><span className="metric-value">{docName || '—'}</span></div>
            <div className="metric-row"><span className="metric-label">Hash (SHA3-256)</span><span className="metric-value" style={{ fontSize: 11 }}>{docHash.slice(0, 16)}…</span></div>
            <div className="metric-row"><span className="metric-label">Signer</span><span className="metric-value">{firstName} {lastName}</span></div>
            <div className="metric-row"><span className="metric-label">Organization</span><span className="metric-value">{organization}</span></div>
            <div className="metric-row"><span className="metric-label">Date/Time</span><span className="metric-value">{new Date().toLocaleString('en-ZA')}</span></div>

            {hashInfo && (
              <div className="metric-row"><span className="metric-label">Size</span><span className="metric-value">{hashInfo.size} bytes</span></div>
            )}

            <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 16, padding: '14px 18px' }} onClick={signNow}>
              SIGN DOCUMENT
            </button>
            <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={() => setStep('selfie')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'certificate' && certificate && (
        <div style={{ width: '100%', marginTop: 12 }}>
          <div className="badge badge-green" style={{ margin: '0 auto 14px' }}>DOCUMENT SIGNED</div>
          <h2 className="step-title" style={{ fontSize: 20 }}>Certificate Created</h2>

          <div className="card" style={{ width: '100%' }}>
            <div className="metric-row"><span className="metric-label">Certificate ID</span><span className="metric-value">{certificate.certificate_id}</span></div>
            <div className="metric-row"><span className="metric-label">Document</span><span className="metric-value">{certificate.document_name || '—'}</span></div>
            <div className="metric-row"><span className="metric-label">Hash</span><span className="metric-value" style={{ fontSize: 11 }}>{certificate.document_hash.slice(0, 16)}…</span></div>
            <div className="metric-row"><span className="metric-label">Signer</span><span className="metric-value">{certificate.signer_name}</span></div>
            <div className="metric-row"><span className="metric-label">Algorithm</span><span className="metric-value">{certificate.pq_algorithm}</span></div>
            <div className="metric-row"><span className="metric-label">Facial match</span><span className="metric-value">{Math.round(certificate.facial_similarity)}%</span></div>
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => openPrintableCertificate(certificate)}>
              Download Certificate (PDF)
            </button>
            <button className="btn btn-outline" onClick={() => nav(`/verify-cert?id=${encodeURIComponent(certificate.certificate_id)}`)}>
              Verify this Certificate
            </button>
          </div>

          <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => nav('/documents')}>
            View Signed Documents
          </button>
        </div>
      )}
    </div>
  )
}
