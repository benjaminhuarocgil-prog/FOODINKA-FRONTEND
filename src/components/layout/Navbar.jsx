// src/components/layout/Navbar.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import {
  ShoppingCart, Menu, X, User, LogOut,
  LayoutDashboard, Bike, ClipboardList, Store, UtensilsCrossed, ArrowRight,
} from 'lucide-react'
import { useCartStore } from '../../store/cartStore.js'
import { useCurrentUser } from '../../hooks/useCurrentUser.js'
import './Navbar.css'

export default function Navbar({ cartCount }) {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0()
  const { data: dbUser } = useCurrentUser()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const navigate   = useNavigate()
  const totalItems = useCartStore(s => s.getTotalItems())
  const count      = cartCount ?? totalItems

  const role              = dbUser?.role || null
  const isAdmin           = role === 'ADMIN'
  const isDriver          = role === 'DELIVERY'
  const isRestaurantOwner = role === 'RESTAURANT_OWNER'

  const handleLogout = () => {
    setProfileOpen(false)
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  const go = (path) => {
    setProfileOpen(false)
    setMenuOpen(false)
    navigate(path)
  }

  const registerAs = (returnTo) => {
    setRegisterOpen(false)
    setMenuOpen(false)
    sessionStorage.setItem('foodinka_registration_target', returnTo)
    loginWithRedirect({
      authorizationParams: { screen_hint: 'signup' },
      appState: { returnTo },
    })
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo imagen */}
        <Link to="/" className="navbar-logo">
          <img
            src="/logo.jpeg"
            alt="Antojia"
            className="navbar-logo-img"
          />
        </Link>

        {/* Acciones desktop */}
        <div className="navbar-actions">
          <Link to="/cart" className="navbar-cart">
            <ShoppingCart size={20} />
            {count > 0 && <span className="navbar-cart-badge">{count}</span>}
          </Link>

          {!isAuthenticated && (
            <div className="navbar-auth-actions">
              <button className="navbar-btn-register" onClick={() => setRegisterOpen(true)}>Registrarse</button>
              <button className="navbar-btn-login" onClick={() => loginWithRedirect()}>Iniciar sesión</button>
            </div>
          )}

          {isAuthenticated && (
            <div className="navbar-profile">
              <button className="navbar-avatar" onClick={() => setProfileOpen(p => !p)}>
                {user?.picture
                  ? <img src={user.picture} alt={user.name} />
                  : <User size={18} />
                }
              </button>

              {profileOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-name">{user?.name}</p>
                    <p className="navbar-dropdown-email">{user?.email}</p>
                  </div>
                  <div className="navbar-dropdown-divider" />

                  <button onClick={() => go('/profile')}>
                    <User size={15} /> Mi perfil
                  </button>
                  <button onClick={() => go('/orders')}>
                    <ShoppingCart size={15} /> Mis pedidos
                  </button>

                  {isRestaurantOwner && (
                    <button onClick={() => go('/restaurant-dashboard')}>
                      <ClipboardList size={15} /> Panel del restaurante
                    </button>
                  )}

                  <div className="navbar-dropdown-divider" />

                  {isDriver && (
                    <button onClick={() => go('/driver')}>
                      <Bike size={15} /> Panel repartidor
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => go('/admin')}>
                      <LayoutDashboard size={15} /> Dashboard admin
                    </button>
                  )}

                  <div className="navbar-dropdown-divider" />
                  <button className="navbar-dropdown-logout" onClick={handleLogout}>
                    <LogOut size={15} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburguesa mobile */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(m => !m)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="navbar-mobile">
          <Link to="/"     onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>
            Carrito {count > 0 && `(${count})`}
          </Link>
          {!isAuthenticated
            ? <>
                <button onClick={() => { setMenuOpen(false); setRegisterOpen(true) }}>Registrarse</button>
                <button onClick={() => loginWithRedirect()}>Iniciar sesión</button>
              </>
            : <>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Mi perfil</Link>
                <Link to="/orders"  onClick={() => setMenuOpen(false)}>Mis pedidos</Link>
                {isRestaurantOwner && (
                  <Link to="/restaurant-dashboard" onClick={() => setMenuOpen(false)}>
                    Panel del restaurante
                  </Link>
                )}
                {isDriver && (
                  <Link to="/driver" onClick={() => setMenuOpen(false)}>Panel repartidor</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>Dashboard admin</Link>
                )}
                <button onClick={handleLogout}>Cerrar sesión</button>
              </>
          }
        </div>
      )}

      {registerOpen && (
        <div className="register-choice-overlay" onClick={event => event.target === event.currentTarget && setRegisterOpen(false)}>
          <div className="register-choice-modal" role="dialog" aria-modal="true" aria-labelledby="register-choice-title">
            <button className="register-choice-close" onClick={() => setRegisterOpen(false)} aria-label="Cerrar"><X size={19} /></button>
            <span className="register-choice-kicker">Únete a Foodinka</span>
            <h2 id="register-choice-title">¿Cómo quieres registrarte?</h2>
            <p>Escoge el perfil que mejor describe lo que quieres hacer.</p>
            <div className="register-choice-grid">
              <button onClick={() => registerAs('/onboarding')}>
                <span className="register-choice-icon"><User size={22} /></span>
                <span><strong>Usuario</strong><small>Pide comida y reserva mesas.</small></span>
                <ArrowRight size={17} />
              </button>
              <button onClick={() => registerAs('/register-restaurant')}>
                <span className="register-choice-icon"><UtensilsCrossed size={22} /></span>
                <span><strong>Restaurante</strong><small>Publica tu menú y gestiona ventas.</small></span>
                <ArrowRight size={17} />
              </button>
              <button onClick={() => registerAs('/become-driver')}>
                <span className="register-choice-icon"><Bike size={22} /></span>
                <span><strong>Repartidor</strong><small>Regístrate para realizar entregas.</small></span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
