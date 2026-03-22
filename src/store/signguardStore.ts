import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CognitiveBaseline, SignerProfile } from '../types'

interface SignGuardStore {
  signer: SignerProfile | null
  selfieB64: string | null
  cognitiveBaseline: CognitiveBaseline | null
  setSigner: (w: SignerProfile) => void
  setSelfie: (b64: string) => void
  setCognitive: (c: CognitiveBaseline) => void
  reset: () => void
}

export const useSignGuardStore = create<SignGuardStore>()(
  persist(
    (set) => ({
      signer: null,
      selfieB64: null,
      cognitiveBaseline: null,
      setSigner: (w) => set({ signer: w }),
      setSelfie: (b64) => set({ selfieB64: b64 }),
      setCognitive: (c) => set({ cognitiveBaseline: c }),
      reset: () => set({ signer: null, selfieB64: null, cognitiveBaseline: null }),
    }),
    { name: 'signguard-store' }
  )
)
