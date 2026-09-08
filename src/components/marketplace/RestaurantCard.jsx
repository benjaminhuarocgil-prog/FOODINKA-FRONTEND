import { useNavigate } from 'react-router-dom'
import { Clock, Bike, ChevronRight, CalendarCheck, MapPin } from 'lucide-react'
import './RestaurantCard.css'

const BANNER_PLACEHOLDER = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'

const CATEGORY_COLORS = {
  cevicheria: '#0ea5e9', chifa: '#f59e0b', fast_food: '#ef4444',
  pizzeria: '#8b5cf6', parrilla: '#e85d24', heladeria: '#ec4899',
  cafe: '#78716c', buffet: '#16a34a', otro: '#6b7280',
}
const CATEGORY_LABELS = {
  cevicheria: 'Cevichería', chifa: 'Chifa', fast_food: 'Fast Food',
  pizzeria: 'Pizzería', parrilla: 'Parrilla', heladeria: 'Heladería',
  cafe: 'Café', buffet: 'Buffet', otro: 'Otro',
}

// Genera iniciales del nombre para usar como avatar por defecto
function LogoFallback({ name, color }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'
  return (
    <div className="rcard-logo-fallback" style={{ background: color + '22', color }}>
      {initials}
    </div>
  )
}

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate()
  const {
    id, name, category, description, bannerUrl, logoUrl,
    district, deliveryFee, estimatedTime,
    isDeliveryEnabled, isReservationEnabled, minOrderAmount, _count,
  } = restaurant

  const categoryColor = CATEGORY_COLORS[category] || '#6b7280'
  const categoryLabel = CATEGORY_LABELS[category]  || category

  return (
    <article
      className="rcard"
      onClick={() => navigate(`/restaurant/${id}`)}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/restaurant/${id}`)}
    >
      {/* Banner */}
      <div className="rcard-image">
        <img
          src={bannerUrl || BANNER_PLACEHOLDER}
          alt={name} loading="lazy"
          onError={e => { e.target.src = BANNER_PLACEHOLDER }}
        />
        <span className="rcard-badge" style={{ background: categoryColor }}>
          {categoryLabel}
        </span>
        <div className="rcard-services">
          {isDeliveryEnabled    && <span className="rcard-service" title="Delivery"><Bike size={14}/></span>}
          {isReservationEnabled && <span className="rcard-service" title="Reservas"><CalendarCheck size={14}/></span>}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="rcard-body">
        <div className="rcard-header">

          {/* Logo: muestra imagen si existe, si no genera iniciales */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${name}`}
              className="rcard-logo"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <LogoFallback name={name} color={categoryColor} />
          )}

          <div className="rcard-title-wrap">
            <h3 className="rcard-name">{name}</h3>
            <p className="rcard-district"><MapPin size={12}/> {district}</p>
          </div>
        </div>

        {description && <p className="rcard-desc">{description}</p>}

        <div className="rcard-meta">
          {estimatedTime && (
            <span className="rcard-meta-item">
              <Clock size={13}/> {estimatedTime} min
            </span>
          )}
          {isDeliveryEnabled && (
            <span className="rcard-meta-item">
              <Bike size={13}/>
              {deliveryFee === 0 ? 'Delivery gratis' : `S/ ${deliveryFee?.toFixed(2)} delivery`}
            </span>
          )}
          {minOrderAmount > 0 && (
            <span className="rcard-meta-item rcard-meta-min">
              Mín. S/ {minOrderAmount?.toFixed(2)}
            </span>
          )}
        </div>

        <div className="rcard-footer">
          <span className="rcard-orders">{_count?.orders ?? 0} pedidos</span>
          <span className="rcard-cta">Ver menú <ChevronRight size={14}/></span>
        </div>
      </div>
    </article>
  )
}
