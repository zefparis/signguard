export type SignedCertificate = {
  certificate_id: string
  tenant_id: string

  document_hash: string
  document_name: string

  signer_name: string
  signer_id: string
  organization: string
  role: string

  signed_at: string
  facial_similarity: number
  location?: {
    lat: number
    lng: number
    accuracy_m?: number
  }

  pq_signature: string
  pq_public_key: string
  pq_algorithm: 'ML-KEM-768'

  behavioral_captured: boolean
}
