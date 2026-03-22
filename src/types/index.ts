export interface SignerProfile {
  signerId: string
  firstName: string
  lastName: string
  idNumber: string
  organization: string
  role: string
  email: string
  tenantId: string
  rekognitionFaceId?: string
  cognitiveBaseline?: CognitiveBaseline
  enrolledAt?: string
}

export interface CognitiveBaseline {
  stroopScore: number
  reflexVelocityMs: number
  // Legacy numeric score kept for UI compatibility (0-100)
  vocalAccuracy: number
  // New: lightweight speaker embedding (192-dim)
  vocalEmbedding?: number[]
  // New: enrollment quality (0-1)
  vocalQuality?: number
  // New: similarity threshold used for verification
  vocalSimilarityThreshold?: number
  reactionTimeMs: number
}

export interface VerifyResult {
  verified: boolean
  similarity: number
  signerId: string
  firstName: string
  verifiedAt: string
}

export interface EnrollResult {
  success: boolean
  signerId: string
  confidence: number
}

export type AppStep =
  | 'home'
  | 'enroll-identity'
  | 'enroll-selfie'
  | 'enroll-cognitive'
  | 'enroll-success'
  | 'sign-identity'
  | 'sign-document'
  | 'sign-selfie'
  | 'sign-review'
  | 'sign-certificate'

