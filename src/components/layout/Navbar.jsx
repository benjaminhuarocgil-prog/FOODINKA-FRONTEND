// src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import {
  ShoppingCart, Menu, X, User, LogOut,
  LayoutDashboard, Bike, ClipboardList, Store, UtensilsCrossed, ArrowRight, MapPin, Search,
} from 'lucide-react'
import { useCartStore } from '../../store/cartStore.js'
import { useCurrentUser } from '../../hooks/useCurrentUser.js'
import './Navbar.css'

export default function Navbar({ cartCount, searchValue = '', onSearchChange, district = 'Lima' }) {
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
  // Una sesión sin rol especializado también es tratada como cliente.
  // Así el menú no desaparece mientras termina de cargar el perfil de la BD.
  const isConsumer        = isAuthenticated && !isAdmin && !isDriver && !isRestaurantOwner

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

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeOnEscape = event => event.key === 'Escape' && setMenuOpen(false)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <nav className="navbar">
      <div className={`navbar-inner ${!isAuthenticated ? 'navbar-inner--guest' : ''}`}>

        {isConsumer && (
          <button
            type="button"
            className="navbar-consumer-menu"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Cerrar menú de usuario' : 'Abrir menú de usuario'}
            aria-expanded={menuOpen}
            aria-controls="consumer-menu"
          >
            <Menu size={23} />
          </button>
        )}

        {/* Logo imagen */}
        <Link to="/" className="navbar-logo">
          <img
            src="/logo.jpeg"
            alt="Antojia"
            className="navbar-logo-img"
          />
        </Link>

        <button className="navbar-location" type="button">
          <MapPin size={19}/><span><small>Entregar en</small><strong>{district}</strong></span>
        </button>

        {onSearchChange && <label className="navbar-search"><Search size={18}/><input value={searchValue} onChange={event => onSearchChange(event.target.value)} placeholder="Busca restaurantes o platos"/></label>}

        {/* Acciones desktop */}
        <div className={`navbar-actions ${!isAuthenticated ? 'navbar-actions--guest' : ''}`}>
          {isAuthenticated && <button className="navbar-orders" onClick={() => go('/orders')}>Mis pedidos</button>}
          <Link to="/cart" className="navbar-cart">
            <ShoppingCart size={20} />
            <span className="navbar-cart-label">Carrito</span>
            {count > 0 && <span className="navbar-cart-badge">{count}</span>}
          </Link>

          {!isAuthenticated && (
            <div className="navbar-auth-actions">
              <button className="navbar-btn-register" onClick={() => setRegisterOpen(true)}>Registrarse</button>
              <button className="navbar-btn-login" onClick={() => loginWithRedirect()}>Iniciar sesión</button>
            </div>
          )}

          {isAuthenticated && !isConsumer && (
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
        {!isAuthenticated && (
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(m => !m)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú de usuario'}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="navbar-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <aside id="consumer-menu" className="navbar-mobile" onClick={event => event.stopPropagation()}>
          <div className="navbar-drawer-head">
            <div>
              <small>{isAuthenticated ? 'Mi cuenta' : 'Menú'}</small>
              <strong>{isAuthenticated ? (user?.name || 'Usuario') : 'Antójia'}</strong>
              {isAuthenticated && <span>{user?.email}</span>}
            </div>
            <button onClick={() => setMenuOpen(false)} aria-label="Cerrar"><X size={19}/></button>
          </div>
          <nav className="navbar-drawer-links">
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Carrito {count > 0 && `(${count})`}</Link>
          {!isAuthenticated
            ? <>
                <button onClick={() => { setMenuOpen(false); setRegisterOpen(true) }}>Registrarse</button>
                <button onClick={() => loginWithRedirect()}>Iniciar sesión</button>
              </>
            : <>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Mi perfil</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>Mis pedidos y seguimiento</Link>
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
                <button className="navbar-drawer-logout" onClick={handleLogout}><LogOut size={16}/> Cerrar sesión</button>
              </>
          }
          </nav>
          </aside>
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
              <button onClick={() => registerAs('/')}>
                <span className="register-choice-icon"><User size={22} /></span>
                <span><strong>Consumidor</strong><small>Cliente para pedir comida y reservar mesas.</small></span>
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
