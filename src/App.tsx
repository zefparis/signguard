import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Enroll } from './pages/Enroll'
import { DocumentSign } from './pages/DocumentSign'
import { VerifyCertificate } from './pages/VerifyCertificate'
import { DocumentsLog } from './pages/DocumentsLog'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/enroll"  element={<Enroll />} />
        <Route path="/sign" element={<DocumentSign />} />
        <Route path="/verify-cert" element={<VerifyCertificate />} />
        <Route path="/documents" element={<DocumentsLog />} />
      </Routes>
    </BrowserRouter>
  )
}
