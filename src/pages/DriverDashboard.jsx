import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Package, ChevronRight, Loader2, Navigation, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi.js'
import { api, setAuthToken } from '../config/api.js'
import Navbar from '../components/layout/Navbar.jsx'
import DeliveryTrackingMap from '../components/delivery/DeliveryTrackingMap.jsx'
import DeliveryProofCapture from '../components/delivery/DeliveryProofCapture.jsx'
import './DriverDashboard.css'

const DISTRICTS = ['Miraflores','San Isidro','Barranco','Surco','La Molina','San Borja','Cercado de Lima','Lince','Jesús María','Magdalena','San Miguel','Pueblo Libre','Breña','Rímac','Los Olivos','San Martín de Porres','Ate','La Victoria','Chorrillos']

export default function DriverDashboard() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0(); useApi()
  const qc = useQueryClient()
  const [district, setDistrict] = useState('ALL'), [busy, setBusy] = useState(null), [position, setPosition] = useState(null)
  const [deliveryCode, setDeliveryCode] = useState(''), [proofUrl, setProofUrl] = useState(''), [gpsStatus, setGpsStatus] = useState(() => navigator.geolocation ? 'Esperando ubicación GPS…' : 'Este navegador no permite usar GPS')
  const auth = async () => setAuthToken(await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } }))
  const { data: active = [] } = useQuery({ queryKey: ['driver-active-orders'], queryFn: async () => { await auth(); return (await api.get('/api/v1/drivers/orders/active')).data.data }, enabled: isAuthenticated, refetchInterval: 5000 })
  const { data: orders = [], isLoading, refetch } = useQuery({ queryKey: ['driver-orders', district], queryFn: async () => { await auth(); return (await api.get('/api/v1/drivers/orders/available', { params: district === 'ALL' ? {} : { district } })).data.data }, enabled: isAuthenticated && !active.length, refetchInterval: active.length ? false : 10000 })

  const syncLocation = useCallback(() => {
    if (!isAuthenticated || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const next = { latitude: coords.latitude, longitude: coords.longitude }
      setPosition(next); setGpsStatus('Enviando ubicación…')
      try {
        setAuthToken(await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } }))
        await api.patch('/api/v1/drivers/location', next)
        setGpsStatus(`Ubicación enviada · ${new Date().toLocaleTimeString('es-PE')}`)
      } catch (error) { setGpsStatus(error.response?.data?.message || 'No se pudo enviar la ubicación al servidor') }
    }, error => setGpsStatus(error.code === 1 ? 'Permiso de ubicación bloqueado' : `No se pudo leer el GPS (${error.message})`), { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 })
  }, [isAuthenticated, getAccessTokenSilently])

  useEffect(() => {
    syncLocation()
    const intervalId = window.setInterval(syncLocation, 4000)
    return () => window.clearInterval(intervalId)
  }, [syncLocation])

  const accept = async order => {
    const destination = order.restaurant?.latitude != null && order.restaurant?.longitude != null ? `${order.restaurant.latitude},${order.restaurant.longitude}` : encodeURIComponent(`${order.restaurant?.address || ''}, ${order.restaurant?.district || ''}, Perú`)
    const routeWindow = window.open('about:blank', '_blank'); setBusy(order.id)
    try {
      await auth(); await api.patch(`/api/v1/orders/${order.id}/assign-driver`)
      if (routeWindow) routeWindow.location.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
      toast.success('Pedido tomado. Sigue la ruta hacia el restaurante.')
      await qc.invalidateQueries({ queryKey: ['driver-active-orders'] }); refetch()
    } catch (error) { routeWindow?.close(); toast.error(error.response?.data?.message || 'No se pudo tomar el pedido') }
    finally { setBusy(null) }
  }

  const advance = async order => {
    const status = order.status === 'READY' ? 'ON_THE_WAY' : 'DELIVERED'
    if (status === 'DELIVERED' && (!/^\d{6}$/.test(deliveryCode) || !proofUrl)) return toast.error('Ingresa el código de 6 dígitos y toma la foto de entrega')
    setBusy(order.id)
    try {
      await auth(); await api.patch(`/api/v1/orders/${order.id}/status`, { status, ...(status === 'DELIVERED' && { deliveryCode, deliveryProofUrl: proofUrl }) })
      toast.success(status === 'ON_THE_WAY' ? 'Entrega en camino' : 'Entrega completada'); setDeliveryCode(''); setProofUrl(''); qc.invalidateQueries({ queryKey: ['driver-active-orders'] })
    } catch (error) { toast.error(error.response?.data?.message || 'No se pudo actualizar') }
    finally { setBusy(null) }
  }

  const current = active[0]
  return <div className="ddash"><Navbar/><div className="ddash-inner"><h1 className="ddash-title">Panel de repartidor</h1>
    <div className={`ddash-gps-status ${position ? 'is-ok' : 'is-waiting'}`}><Navigation size={15}/><div><strong>{gpsStatus}</strong>{position && <small>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}</small>}</div><button type="button" onClick={syncLocation}>Actualizar GPS ahora</button></div>
    {current ? <section className="ddash-active">
      <div className="ddash-active-head"><div><span className="ddash-live">● ENTREGA ACTIVA</span><h2>#{current.orderNumber?.slice(-8)}</h2></div><strong>S/ {current.total?.toFixed(2)}</strong></div>
      <p><Package size={15}/> Recoger en <strong>{current.restaurant?.name}</strong>: {current.restaurant?.address}</p>
      {current.restaurant?.addressReference && <p><MapPin size={15}/> Referencia del restaurante: <strong>{current.restaurant.addressReference}</strong></p>}
      <p><MapPin size={15}/> Entregar a <strong>{current.user?.name}</strong>: {current.deliveryAddress}</p>
      <DeliveryTrackingMap restaurant={current.restaurant} destination={{ latitude: current.deliveryLatitude, longitude: current.deliveryLongitude }} driver={{ ...position, name: 'Mi ubicación' }} phase={current.status === 'READY' ? 'pickup' : 'delivery'}/>
      {current.status === 'ON_THE_WAY' && <div className="ddash-proof"><h3>Validar entrega</h3><p>Pide al cliente su código de 6 dígitos y toma la foto al entregar.</p><input className="ddash-code-input" inputMode="numeric" maxLength={6} placeholder="Código de entrega" value={deliveryCode} onChange={event => setDeliveryCode(event.target.value.replace(/\D/g, '').slice(0, 6))}/><DeliveryProofCapture orderId={current.id} value={proofUrl} onUploaded={setProofUrl}/></div>}
      <div className="ddash-active-actions"><a className="ddash-route" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${current.status === 'READY' ? `${current.restaurant?.latitude},${current.restaurant?.longitude}` : `${current.deliveryLatitude},${current.deliveryLongitude}`}`}><Navigation size={16}/> Abrir ruta</a><button className="dorder-accept" disabled={busy === current.id || current.status === 'ON_THE_WAY' && (!/^\d{6}$/.test(deliveryCode) || !proofUrl)} onClick={() => advance(current)}>{busy === current.id ? <Loader2 size={15} className="ddash-spinner"/> : <CheckCircle size={15}/>} {current.status === 'READY' ? 'Ya recogí el pedido' : 'Confirmar entrega'}</button></div>
      <small className="ddash-tracking">ID de delivery: {current.id}</small>
    </section> : <><div className="ddash-zone"><h2 className="ddash-zone-title"><MapPin size={18}/> Zona de recojo (distrito del restaurante)</h2><select className="ddash-select" value={district} onChange={event => setDistrict(event.target.value)}><option value="ALL">Todos los distritos</option>{DISTRICTS.map(item => <option key={item}>{item}</option>)}</select></div>
      {isLoading && <div className="ddash-loading"><Loader2 className="ddash-spinner"/></div>}
      <div className="ddash-orders">{orders.map(order => <div className="dorder" key={order.id}><div className="dorder-header"><div><p className="dorder-number">#{order.orderNumber?.slice(-8)}</p><p className="dorder-restaurant">{order.restaurant?.name} · {order.restaurant?.address}, {order.restaurant?.district}</p>{order.restaurant?.addressReference && <p className="dorder-restaurant">Referencia: {order.restaurant.addressReference}</p>}</div></div><div className="dorder-delivery"><MapPin size={13}/> Entrega en {order.deliveryAddress}, {order.deliveryDistrict}</div><div className="dorder-footer"><b>S/ {order.total?.toFixed(2)}</b><button className="dorder-accept" onClick={() => accept(order)} disabled={busy === order.id}>{busy === order.id ? <Loader2 className="ddash-spinner" size={14}/> : <ChevronRight size={14}/>} Tomar pedido</button></div></div>)}</div>
      {!isLoading && !orders.length && <div className="ddash-empty"><p>No hay pedidos listos para recoger ahora mismo</p></div>}</>}
  </div></div>
}
