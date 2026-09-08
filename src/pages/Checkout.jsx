import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import toast from 'react-hot-toast'
import { useCartStore } from '../store/cartStore.js'
import { useApi } from '../hooks/useApi.js'
import Navbar from '../components/layout/Navbar.jsx'
import OrderTypeSelector from '../components/checkout/OrderTypeSelector.jsx'
import DeliveryForm from '../components/checkout/DeliveryForm.jsx'
import ReservationForm from '../components/checkout/ReservationForm.jsx'
import PaymentMethod from '../components/checkout/PaymentMethod.jsx'
import OrderSummary from '../components/checkout/OrderSummary.jsx'
import './Checkout.css'

export default function Checkout() {
  const navigate  = useNavigate()
  const api       = useApi()
  const { user }  = useAuth0()
  const { items, restaurantId, restaurantName, getSubtotal, getTotalItems, clearCart } = useCartStore()

  const [orderType,    setOrderType]    = useState('DELIVERY')  // 'DELIVERY' | 'RESERVATION'
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY') // 'MERCADOPAGO' | 'YAPE' | 'CASH_ON_DELIVERY'
  const [loading,      setLoading]      = useState(false)
  const [notes,        setNotes]        = useState('')

  // Campos delivery
  const [deliveryAddress,  setDeliveryAddress]  = useState('')
  const [deliveryDistrict, setDeliveryDistrict] = useState('')
  const [deliveryPhone,    setDeliveryPhone]    = useState(user?.phone || '')
  const [deliveryNotes,    setDeliveryNotes]    = useState('')

  // Campos reserva
  const [reservationDate, setReservationDate] = useState('')
  const [reservationTime, setReservationTime] = useState('')
  const [partySize,       setPartySize]       = useState(2)

  const subtotal   = getSubtotal()
  const totalItems = getTotalItems()

  // Redirigir si el carrito está vacío
  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const processCheckout = async (selectedPaymentMethod) => {
    // ── Validaciones ────────────────────────────────────────
    if (orderType === 'DELIVERY') {
      if (!deliveryAddress.trim()) return toast.error('Ingresa la dirección de entrega')
      if (!deliveryDistrict.trim()) return toast.error('Ingresa el distrito')
      if (!deliveryPhone.trim()) return toast.error('Ingresa un teléfono de contacto')
    }

    if (orderType === 'RESERVATION') {
      if (!reservationDate) return toast.error('Selecciona la fecha de la reserva')
      if (!reservationTime) return toast.error('Selecciona la hora de la reserva')
      if (!partySize || partySize < 1) return toast.error('Ingresa el número de personas')
    }

    // Se abre inmediatamente para que el navegador no bloquee la pestaña
    // después de esperar las llamadas al backend.
    const mpWindow = selectedPaymentMethod === 'MERCADOPAGO_TEST'
      ? window.open('', '_blank')
      : null

    setLoading(true)

    try {
      // 1. Crear el pedido
      const orderPayload = {
        restaurantId,
        type:  orderType,
        notes: notes || null,
        items: items.map(i => ({
          productId: i.product.id,
          quantity:  i.quantity,
        })),
        ...(orderType === 'DELIVERY' && {
          deliveryAddress,
          deliveryDistrict,
          deliveryPhone,
          deliveryNotes: deliveryNotes || null,
        }),
        ...(orderType === 'RESERVATION' && {
          reservationDate: new Date(reservationDate).toISOString(),
          reservationTime,
          partySize: Number(partySize),
        }),
      }

      const { data: orderRes } = await api.post('/api/v1/orders', orderPayload)
      const order = orderRes.data

      // 2. Procesar el pago
      if (selectedPaymentMethod === 'MERCADOPAGO_TEST') {
        const { data: prefRes } = await api.post('/api/v1/payments/mercadopago/test-preference', {
          orderId: order.id,
        })
        clearCart()
        if (mpWindow) {
          mpWindow.location.href = prefRes.data.initPoint
        } else {
          window.location.href = prefRes.data.initPoint
        }
        toast.success('Mercado Pago se abrió en una pestaña nueva')
        navigate(`/orders/${order.id}`)
        return
      }

      if (selectedPaymentMethod === 'MERCADOPAGO') {
        // Mercado Pago: crear preferencia y redirigir al checkout de MP.
        // El pedido ya existe en BD, así que es seguro vaciar el carrito
        // y dejar que el usuario complete el pago en el sitio de MP.
        const { data: prefRes } = await api.post('/api/v1/payments/mercadopago/preference', {
          orderId: order.id,
        })
        clearCart()
        window.location.href = prefRes.data.initPoint
        return // no quitar el loading: estamos navegando fuera del sitio
      }

      // Yape / Efectivo al recibir: flujo simulado actual
      await api.post('/api/v1/payments/charge', { orderId: order.id, method: selectedPaymentMethod })

      // 3. Limpiar carrito y redirigir
      clearCart()
      toast.success('¡Pedido confirmado! 🎉', { duration: 4000 })
      navigate(`/orders/${order.id}`)

    } catch (error) {
      if (mpWindow && !mpWindow.closed) mpWindow.close()
      const msg = error.response?.data?.message || 'Error al procesar el pedido'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = () => processCheckout(paymentMethod)
  const handleMercadoPagoTest = () => processCheckout('MERCADOPAGO_TEST')

  return (
    <div className="checkout">
      <Navbar cartCount={totalItems} />

      <div className="checkout-inner">
        <h1 className="checkout-title">Confirmar pedido</h1>

        <div className="checkout-layout">

          {/* Columna izquierda — formularios */}
          <div className="checkout-forms">

            {/* 1. Tipo de pedido */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">
                <span className="checkout-step">1</span>
                ¿Cómo quieres recibir tu pedido?
              </h2>
              <OrderTypeSelector
                value={orderType}
                onChange={setOrderType}
              />
            </section>

            {/* 2. Datos según tipo */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">
                <span className="checkout-step">2</span>
                {orderType === 'DELIVERY' ? 'Datos de entrega' : 'Datos de la reserva'}
              </h2>

              {orderType === 'DELIVERY' && (
                <DeliveryForm
                  address={deliveryAddress}    onAddressChange={setDeliveryAddress}
                  district={deliveryDistrict}  onDistrictChange={setDeliveryDistrict}
                  phone={deliveryPhone}        onPhoneChange={setDeliveryPhone}
                  notes={deliveryNotes}        onNotesChange={setDeliveryNotes}
                />
              )}

              {orderType === 'RESERVATION' && (
                <ReservationForm
                  date={reservationDate}      onDateChange={setReservationDate}
                  time={reservationTime}      onTimeChange={setReservationTime}
                  partySize={partySize}       onPartySizeChange={setPartySize}
                />
              )}
            </section>

            {/* 3. Método de pago */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">
                <span className="checkout-step">3</span>
                Método de pago
              </h2>
              <PaymentMethod
                value={paymentMethod}
                onChange={setPaymentMethod}
                orderType={orderType}
              />
            </section>

            {/* Notas generales */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">
                <span className="checkout-step">4</span>
                Notas adicionales <span className="checkout-optional">(opcional)</span>
              </h2>
              <textarea
                className="checkout-notes"
                placeholder="Sin cebolla, alergia al mariscos, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </section>
          </div>

          {/* Columna derecha — resumen */}
          <div className="checkout-aside">
            <OrderSummary
              items={items}
              restaurantName={restaurantName}
              subtotal={subtotal}
              orderType={orderType}
              paymentMethod={paymentMethod}
              onConfirm={handleSubmit}
              onMercadoPagoTest={handleMercadoPagoTest}
              loading={loading}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
