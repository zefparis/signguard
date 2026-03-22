## Supabase schema notes (SIGNGUARD)

```sql
-- ALTER TABLE edguard_enrollments
-- ADD COLUMN IF NOT EXISTS behavioral_profile JSONB;
-- ADD COLUMN IF NOT EXISTS pq_public_key TEXT;
-- ADD COLUMN IF NOT EXISTS pq_signature TEXT;
```

# SIGNGUARD — Biometric Document Signing

Biometrically certified document signing. A person verifies identity (face + cognitive + vocal biometrics) and signs a document hash with a post-quantum signature.

## Features

- **Identity Enrollment** (`/enroll`): 6-step biometric registration process
  - Identity information capture
  - Facial certification via selfie
  - Cognitive + vocal baseline tests (Stroop, Neural Reflex, Vocal Imprint, Reaction Time)

- **Document Signing** (`/sign`): upload PDF (or describe) → SHA3-256 hash → selfie verification → PQ signature → certificate

- **Signed Documents Log** (`/documents`): localStorage log (offline-first)

- **Certificate Verification** (`/verify-cert`): verify by Certificate ID or upload certificate JSON

- **Security**: AWS Rekognition facial matching with ML-KEM FIPS 203 encryption

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Styling**: Custom CSS with dark theme
- **API**: Hybrid Vector API (https://hybrid-vector-api.onrender.com)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://hybrid-vector-api.onrender.com
VITE_TENANT_ID=signguard-demo
VITE_HV_API_KEY=signguard-key-2026
```

Notes:
- The EDGUARD API validates `VITE_HV_API_KEY` against the `edguard_tenants` table.
- Example rows:
  - tenant_id: `signguard-demo`, api_key: `signguard-key-2026`
  - tenant_id: `payguard-demo`, api_key: `payguard-key-2026`

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
signguard/
├── src/
│   ├── components/       # React components
│   │   ├── SelfieCapture.tsx
│   │   ├── StroopTest.tsx
│   │   ├── NeuralReflex.tsx
│   │   ├── VocalImprint.tsx
│   │   └── ReactionTime.tsx
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Enroll.tsx
│   │   ├── DocumentSign.tsx
│   │   ├── VerifyCertificate.tsx
│   │   └── DocumentsLog.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useCamera.ts
│   ├── services/        # API services
│   │   └── api.ts
│   ├── store/           # Zustand store
│   │   └── signguardStore.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Routes

- `/` - Home
- `/enroll` - Identity enrollment (6 steps)
- `/sign` - Document signing
- `/verify-cert` - Certificate verification
- `/documents` - Signed documents log

## Design

- **Theme**: Dark mode (#0a0f1e background)
- **Accent**: Purple (#8b5cf6)
- **Layout**: Mobile-first, centered (max-width 480px)
- **Typography**: Inter font family

## API Integration

The app integrates with the Hybrid Vector API for:
- Enrollment (`POST /edguard/enroll`)
- Facial verification (`POST /edguard/verify`)

## Supabase (future table)

```sql
-- CREATE TABLE IF NOT EXISTS signed_certificates (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT,
--   student_id TEXT,
--   document_hash TEXT,
--   document_name TEXT,
--   signer_name TEXT,
--   organization TEXT,
--   pq_signature TEXT,
--   pq_public_key TEXT,
--   facial_similarity FLOAT,
--   signed_at TIMESTAMPTZ DEFAULT now()
-- );
```

## Voice Biometrics (browser-only)

This project includes a client-side voice imprint using:
- `MediaRecorder` + Web Audio decoding
- MFCC extraction (40 coefficients)
- A lightweight 192-dim embedding + cosine similarity

The code is structured to later plug an ECAPA-TDNN ONNX model via `onnxruntime-web`.

## License

MIT

## Author

Hybrid Vector / CoreHuman
