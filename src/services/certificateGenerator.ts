import type { SignedCertificate } from '../types/certificate'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function openPrintableCertificate(cert: SignedCertificate): void {
  const signaturePreview = cert.pq_signature.slice(0, 20) + '…'
  const hashPreview = cert.document_hash

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>SIGNGUARD Certificate ${escapeHtml(cert.certificate_id)}</title>
    <style>
      :root { --bg:#0a0f1e; --paper:#ffffff; --ink:#0b1220; --muted:#475569; --accent:#8b5cf6; }
      body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: var(--bg); }
      .wrap { padding: 24px; display:flex; justify-content:center; }
      .page { width: 800px; max-width: 100%; background: var(--paper); color: var(--ink); border-radius: 12px; padding: 28px; }
      .brand { font-weight: 800; letter-spacing: .12em; color: var(--accent); font-size: 12px; text-transform: uppercase; }
      h1 { margin: 10px 0 14px; font-size: 22px; }
      .grid { display:grid; grid-template-columns: 1fr; gap: 14px; }
      .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
      .box h2 { margin:0 0 10px; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #334155; }
      .row { display:flex; justify-content:space-between; gap: 16px; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
      .row:last-child { border-bottom:none; }
      .k { color: var(--muted); }
      .v { font-weight: 600; text-align:right; word-break: break-word; }
      .footer { margin-top: 14px; color: #64748b; font-size: 12px; line-height:1.5; }
      @media print {
        body { background: #fff; }
        .wrap { padding: 0; }
        .page { border-radius: 0; width: auto; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="page">
        <div class="brand">⬡ SIGNGUARD</div>
        <h1>Biometric Signature Certificate</h1>

        <div class="grid">
          <div class="box">
            <h2>Certificate</h2>
            <div class="row"><span class="k">Certificate ID</span><span class="v">${escapeHtml(cert.certificate_id)}</span></div>
            <div class="row"><span class="k">Issued</span><span class="v">${escapeHtml(new Date(cert.signed_at).toLocaleString('en-ZA'))}</span></div>
          </div>

          <div class="box">
            <h2>Document</h2>
            <div class="row"><span class="k">Name</span><span class="v">${escapeHtml(cert.document_name || '—')}</span></div>
            <div class="row"><span class="k">Hash (SHA3-256)</span><span class="v">${escapeHtml(hashPreview)}</span></div>
          </div>

          <div class="box">
            <h2>Signer</h2>
            <div class="row"><span class="k">Name</span><span class="v">${escapeHtml(cert.signer_name)}</span></div>
            <div class="row"><span class="k">Organization</span><span class="v">${escapeHtml(cert.organization || '—')}</span></div>
            <div class="row"><span class="k">Role</span><span class="v">${escapeHtml(cert.role || '—')}</span></div>
            <div class="row"><span class="k">Signer ID</span><span class="v">${escapeHtml(cert.signer_id || '—')}</span></div>
          </div>

          <div class="box">
            <h2>Biometric verification</h2>
            <div class="row"><span class="k">Facial match</span><span class="v">${Math.round(cert.facial_similarity)}%</span></div>
            <div class="row"><span class="k">Behavioral</span><span class="v">${cert.behavioral_captured ? 'captured ✓' : 'not captured'}</span></div>
            <div class="row"><span class="k">Algorithm</span><span class="v">${escapeHtml(cert.pq_algorithm)}</span></div>
            <div class="row"><span class="k">Signature</span><span class="v">${escapeHtml(signaturePreview)}</span></div>
          </div>
        </div>

        <div class="footer">
          This document was biometrically certified by SIGNGUARD.\n<br />
          Powered by Hybrid Vector — IA-SOLUTION — 3 French Patents.
        </div>
      </div>
    </div>
    <script>window.print()</script>
  </body>
</html>`

  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) throw new Error('Popup blocked')
  w.document.open()
  w.document.write(html)
  w.document.close()
}
