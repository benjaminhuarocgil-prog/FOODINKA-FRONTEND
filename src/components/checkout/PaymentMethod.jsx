import './PaymentMethod.css'

const METHODS = [
  {
    id:    'CASH_ON_DELIVERY',
    label: 'Efectivo al recibir',
    desc:  'Pagas cuando llegue el repartidor',
    icon:  '💵',
    onlyDelivery: true,
  },
  {
    id:    'YAPE',
    label: 'Yape',
    desc:  'Pago por Yape al confirmar',
    icon:  '📱',
    onlyDelivery: false,
  },
  {
    id:    'MERCADOPAGO',
    label: 'Tarjeta (Mercado Pago)',
    desc:  'Visa, Mastercard, American Express y más',
    icon:  '💳',
    onlyDelivery: false,
  },
]

export default function PaymentMethod({ value, onChange, orderType }) {
  // Para reservas no mostrar "Efectivo al recibir".
  const available = METHODS.filter(m => {
    if (orderType === 'RESERVATION' && m.onlyDelivery) return false
    return true
  })

  return (
    <div className="payment">
      {available.map(method => (
        <button
          key={method.id}
          className={`payment-option ${value === method.id ? 'payment-option--active' : ''}`}
          onClick={() => onChange(method.id)}
        >
          <span className="payment-icon">{method.icon}</span>
          <div className="payment-info">
            <p className="payment-label">{method.label}</p>
            <p className="payment-desc">{method.desc}</p>
          </div>
          <span className="payment-radio">
            {value === method.id && <span className="payment-radio-dot" />}
          </span>
        </button>
      ))}

      {/* Aviso para reservas */}
      {orderType === 'RESERVATION' && (
        <div className="payment-note">
          💡 Para reservas, el pago se realiza al llegar al restaurante
          o puedes pagar online con Yape o tarjeta.
        </div>
      )}
    </div>
  )
}
