import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi.js'
import RoleSelector from '../components/onboarding/RoleSelector.jsx'
import RestaurantRegisterForm from '../components/onboarding/RestaurantRegisterForm.jsx'
import './Onboarding.css'

export default function Onboarding() {
  const navigate    = useNavigate()
  const api         = useApi()
  const { user }    = useAuth0()
  const [step, setStep]     = useState('role')    // 'role' | 'restaurant' | 'done'
  const [role, setRole]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = async (selectedRole) => {
    setRole(selectedRole)
    if (selectedRole === 'CONSUMER') {
      setLoading(true)
      try {
        await api.patch('/api/v1/auth/me', { name: user?.name })
        toast.success('¡Bienvenido/a!')
        navigate('/')
      } catch {
        toast.error('Error al configurar tu cuenta')
      } finally {
        setLoading(false)
      }
    } else {
      setStep('restaurant')
    }
  }

  const handleRestaurantSubmit = async (formData) => {
    setLoading(true)
    try {
      await api.patch('/api/v1/auth/me', { name: user?.name })
      await api.post('/api/v1/auth/register-restaurant', formData)

      setStep('done')
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrar el restaurante'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="onboarding-done">
            <span className="onboarding-done-icon">📧</span>
            <h2>¡Registro enviado!</h2>
            <p>
              Tu restaurante está <strong>pendiente de verificación</strong>.
              Recibirás un correo cuando el administrador apruebe tu cuenta.
            </p>
            <p className="onboarding-done-sub">
              Mientras tanto puedes explorar la plataforma como consumidor.
            </p>
            <button className="onboarding-btn" onClick={() => navigate('/')}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {/* Logo */}
        <div className="onboarding-logo">🍽️ Antojia</div>

        {/* Progreso */}
        <div className="onboarding-steps">
          <div className={`onboarding-step ${step === 'role' ? 'active' : 'done'}`}>
            1. Tipo de cuenta
          </div>
          {role === 'RESTAURANT_OWNER' && (
            <div className={`onboarding-step ${step === 'restaurant' ? 'active' : ''}`}>
              2. Datos del restaurante
            </div>
          )}
        </div>

        {step === 'role' && (
          <RoleSelector onSelect={handleRoleSelect} loading={loading} />
        )}

        {step === 'restaurant' && (
          <RestaurantRegisterForm
            onSubmit={handleRestaurantSubmit}
            onBack={() => setStep('role')}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
