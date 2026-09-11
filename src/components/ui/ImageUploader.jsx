import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Upload, X } from 'lucide-react'
import './LogoUploader.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const BUCKET = 'logos'

async function uploadImage(file, scope) {
  if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error('El almacenamiento de imágenes aún no está configurado')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `uploads/${scope}/${uniqueId}.${extension}`
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || 'No se pudo subir la imagen')
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export default function ImageUploader({ value, onUploaded, scope = 'general', label = 'Subir imagen' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(value || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async file => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Selecciona una imagen JPG, PNG o WEBP')
    if (file.size > 5 * 1024 * 1024) return setError('La imagen no puede superar 5 MB')

    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadImage(file, scope)
      setPreview(url)
      onUploaded(url)
    } catch (uploadError) {
      setPreview(value || null)
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  return <div className="lup lup--md">
    <div
      className={`lup-zone ${uploading ? 'lup-zone--loading' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={event => event.key === 'Enter' && !uploading && inputRef.current?.click()}
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }}
    >
      {uploading ? <div className="lup-uploading"><Loader2 size={22} className="lup-spin"/><span>Subiendo...</span></div> : preview ? (
        <div className="lup-preview"><img src={preview} alt={label}/><div className="lup-overlay"><Upload size={18}/><span>Cambiar</span></div></div>
      ) : <div className="lup-empty"><ImagePlus size={28} strokeWidth={1.5}/><span>{label}</span><span className="lup-hint">Arrastra una foto o haz clic · máx. 5 MB</span></div>}
    </div>
    {error && <div className="lup-error"><X size={13}/>{error}</div>}
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => handleFile(event.target.files?.[0])}/>
  </div>
}
