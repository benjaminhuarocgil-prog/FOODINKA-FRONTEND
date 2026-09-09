import { useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2 } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const BUCKET = 'logos'

async function uploadProof(file, orderId) {
  if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error('Falta configurar Supabase Storage')
  if (!file.type.startsWith('image/')) throw new Error('Debes tomar una fotografía')
  if (file.size > 8 * 1024 * 1024) throw new Error('La fotografía no puede superar 8 MB')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `deliveries/${orderId}_${Date.now()}.${ext}`
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'No se pudo subir la fotografía')
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export default function DeliveryProofCapture({ orderId, value, onUploaded }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const handlePhoto = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    try { onUploaded(await uploadProof(file, orderId)) }
    catch (err) { setError(err.message); onUploaded('') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }
  return <div className="ddash-proof-capture">
    <button type="button" className="ddash-camera" disabled={uploading} onClick={() => inputRef.current?.click()}>
      {uploading ? <Loader2 size={17} className="ddash-spinner"/> : value ? <CheckCircle2 size={17}/> : <Camera size={17}/>}
      {uploading ? 'Subiendo foto…' : value ? 'Foto subida · volver a tomar' : 'Tomar foto de entrega'}
    </button>
    <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handlePhoto(e.target.files?.[0])}/>
    {value && <img className="ddash-proof-preview" src={value} alt="Comprobante de entrega"/>}
    {error && <small className="ddash-proof-error">{error}</small>}
  </div>
}
