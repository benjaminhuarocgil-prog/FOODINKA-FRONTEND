// src/pages/Callback.jsx
import { useAuth0 } from '@auth0/auth0-react'

export default function Callback() {
  const { error } = useAuth0()

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Error al iniciar sesión: {error.message}</p>
        <a href="/">Volver al inicio</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Procesando login...</p>
    </div>
  )
}
