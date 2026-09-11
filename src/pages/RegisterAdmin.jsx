import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useApi } from '../hooks/useApi.js'
import Navbar from '../components/layout/Navbar.jsx'
import './RegisterAdmin.css'

export default function RegisterAdmin() {
  const navigate = useNavigate()
  const api = useApi()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const login = () => loginWithRedirect({
    authorizationParams: { screen_hint: 'signup' },
    appState: { returnTo: window.location.pathname },
  })

  useEffect(() => {
    if (!isAuthenticated || registering) return
    const register = async () => {
      setRegistering(true)
      try {
        await api.post('/api/v1/auth/register-admin')
        await queryClient.invalidateQueries({ queryKey: ['current-user'] })
        navigate('/admin', { replace: true })
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'No se pudo registrar el administrador')
        setRegistering(false)
      }
    }
    register()
  }, [api, isAuthenticated, navigate, queryClient, registering])

  return <div className="admin-register-page">
    <Navbar />
    <main className="admin-register-card">
      <ShieldCheck size={48} />
      <h1>Acceso de administrador</h1>
      {isLoading || registering ? <p><Loader2 size={18} className="admin-register-spin"/> Preparando tu acceso…</p>
        : !isAuthenticated ? <><p>Inicia sesión o crea tu cuenta para activar el panel de administrador.</p><button onClick={login}>Continuar</button></>
        : error ? <p className="admin-register-error">{error}</p>
        : null}
    </main>
  </div>
}
