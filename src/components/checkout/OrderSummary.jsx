import { Loader2 } from 'lucide-react'
import './OrderSummary.css'

const PAYMENT_LABELS = {
  CASH_ON_DELIVERY: '💵 Efectivo al recibir',
  YAPE:             '📱 Yape',
  MERCADOPAGO:      '💳 Mercado Pago',
}

const TYPE_LABELS = {
  DELIVERY:    '🛵 Delivery',
  RESERVATION: '📅 Reserva en local',
}

export default function OrderSummary({
  items, restaurantName, subtotal,
  orderType, paymentMethod,
  onConfirm, onMercadoPagoTest, loading,
}) {
  return (
    <div className="osummary">
      <h2 className="osummary-title">Resumen del pedido</h2>

      {/* Restaurante */}
      <p className="osummary-restaurant">{restaurantName}</p>

      {/* Items */}
      <div className="osummary-items">
        {items.map(item => {
          const price = item.product.finalPrice ?? item.product.price
          return (
            <div key={item.product.id} className="osummary-item">
              <span className="osummary-item-qty">{item.quantity}×</span>
              <span className="osummary-item-name">{item.product.name}</span>
              <span className="osummary-item-price">
                S/ {(price * item.quantity).toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="osummary-divider" />

      {/* Tipo y pago */}
      <div className="osummary-meta">
        <div className="osummary-meta-row">
          <span>Tipo</span>
          <span>{TYPE_LABELS[orderType]}</span>
        </div>
        <div className="osummary-meta-row">
          <span>Pago</span>
          <span>{PAYMENT_LABELS[paymentMethod]}</span>
        </div>
      </div>

      <div className="osummary-divider" />

      {/* Totales */}
      <div className="osummary-totals">
        <div className="osummary-row">
          <span>Subtotal</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        {orderType === 'DELIVERY' && (
          <div className="osummary-row osummary-row--note">
            <span>Delivery</span>
            <span>Se calcula al confirmar</span>
          </div>
        )}
      </div>

      <div className="osummary-total">
        <span>Total estimado</span>
        <span>S/ {subtotal.toFixed(2)}</span>
      </div>

      {/* Botón confirmar */}
      <button
        className="osummary-btn"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading
          ? <><Loader2 size={18} className="osummary-spinner" /> Procesando...</>
          : orderType === 'DELIVERY'
            ? '🛵 Confirmar pedido'
            : '📅 Confirmar reserva'
        }
      </button>

      <button
        className="osummary-btn osummary-btn--mercadopago"
        onClick={onMercadoPagoTest}
        disabled={loading}
      >
        {loading
          ? <><Loader2 size={18} className="osummary-spinner" /> Procesando...</>
          : '💳 Pagar con Mercado Pago (prueba)'
        }
      </button>
      <p className="osummary-test-note">
        Sandbox: no se realizará ningún cobro real.
      </p>
    </div>
  )
}
