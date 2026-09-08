import { useMemo, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BarChart3, BookOpen, ChevronRight, ClipboardList, FileText,
  House, LogOut, Menu as MenuIcon, Percent, ReceiptText, Search, Settings,
  ShoppingBag, Star, Store, TrendingUp, Users, X,
} from 'lucide-react'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { useRestaurantOrders } from '../hooks/useRestaurantOrders.js'
import { useApplyProductDiscount, useRestaurantProducts } from '../hooks/useProfile.js'
import { SectionMenu, SectionRestaurant } from './Profile.jsx'
import './Profile.css'
import './RestaurantPortal.css'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'menu', label: 'Menú', icon: BookOpen },
  { id: 'ventas', label: 'Datos de venta', icon: ClipboardList },
  { id: 'promociones', label: 'Promociones', icon: Percent },
  { id: 'facturacion', label: 'Facturación', icon: ReceiptText },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
]

const money = value => `S/ ${Number(value || 0).toFixed(2)}`
const peruDate = value => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

function itemName(item) {
  return item.product?.name || item.productName || 'Producto'
}

function getRanking(orders) {
  const totals = new Map()
  orders.forEach(order => order.items?.forEach(item => {
    const name = itemName(item)
    totals.set(name, (totals.get(name) || 0) + Number(item.quantity || 0))
  }))
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

function Empty({ children }) {
  return <div className="rp-empty"><ShoppingBag size={34}/><p>{children}</p></div>
}

function Overview({ orders, restaurant }) {
  const paid = orders.filter(order => ['PAID', 'APPROVED'].includes(order.payment?.status))
  const commissionRate = Number(restaurant.commissionRate || 0)
  const commission = commissionRate <= 1 ? commissionRate * 100 : commissionRate
  const gross = paid.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const net = gross * (1 - commission / 100)
  const clients = new Set(orders.map(order => order.user?.id || order.user?.email).filter(Boolean)).size
  const ranking = getRanking(orders)
  const buyers = orders.filter(order => order.user).slice(0, 5)

  const cards = [
    { label: 'Clientes totales', value: clients, detail: 'Personas que hicieron pedidos', icon: Users, tone: 'orange' },
    { label: 'Ingresos netos', value: money(net), detail: `Comisión descontada: ${commission}%`, icon: TrendingUp, tone: 'green' },
    { label: 'Pedidos registrados', value: orders.length, detail: 'Reservas y delivery', icon: ClipboardList, tone: 'violet' },
    { label: 'Plato más pedido', value: ranking[0]?.[0] || 'Sin ventas', detail: ranking[0] ? `${ranking[0][1]} unidades` : 'Aún sin datos', icon: Star, tone: 'gold' },
  ]

  return <div className="rp-stack">
    <section className="rp-welcome">
      <div><span>Resumen del negocio</span><h1>Hola, {restaurant.name}</h1><p>Revisa el rendimiento de tu restaurante desde un solo lugar.</p></div>
      <div className="rp-commission">Tu comisión actual <strong>{commission}%</strong></div>
    </section>
    <div className="rp-metrics">{cards.map(card => {
      const Icon = card.icon
      return <article className="rp-metric" key={card.label}>
        <span className={`rp-metric-icon ${card.tone}`}><Icon size={20}/></span>
        <p>{card.label}</p><strong>{card.value}</strong><small>{card.detail}</small>
      </article>
    })}</div>
    <section className="rp-panel">
      <div className="rp-panel-head"><div><h2>Clientes recientes</h2><p>Últimos usuarios que realizaron pedidos</p></div><Users size={20}/></div>
      {buyers.length === 0 ? <Empty>Aún no hay clientes registrados.</Empty> :
        <div className="rp-simple-list">{buyers.map(order => <div key={order.id}>
          <span className="rp-user-avatar">{(order.user.name || 'U')[0]}</span>
          <div><strong>{order.user.name || 'Usuario'}</strong><small>{order.user.email || peruDate(order.createdAt)}</small></div>
          <b>{money(order.total)}</b>
        </div>)}</div>}
    </section>
  </div>
}

function Sales({ orders }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const ranking = useMemo(() => getRanking(orders), [orders])
  const rankIndex = useMemo(() => new Map(ranking.map(([name], index) => [name, index])), [ranking])
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = orders.filter(order => {
      const products = order.items?.map(itemName).join(' ') || ''
      return `${order.user?.name || ''} ${products}`.toLowerCase().includes(query)
    })
    if (sort !== 'recent') result.sort((a, b) => {
      const aRank = Math.min(...(a.items || []).map(item => rankIndex.get(itemName(item)) ?? 9999))
      const bRank = Math.min(...(b.items || []).map(item => rankIndex.get(itemName(item)) ?? 9999))
      return sort === 'best' ? aRank - bRank : bRank - aRank
    })
    return result
  }, [orders, rankIndex, search, sort])

  return <section className="rp-panel">
    <div className="rp-panel-head"><div><h1>Datos de venta</h1><p>Conoce quién pidió, qué productos compró y cuánto pagó.</p></div></div>
    <div className="rp-toolbar">
      <label><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o plato"/></label>
      <select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Más recientes</option><option value="best">Platos más vendidos</option><option value="worst">Platos menos vendidos</option></select>
    </div>
    {rows.length === 0 ? <Empty>No encontramos ventas con ese filtro.</Empty> : <div className="rp-sales-list">{rows.map(order => <article key={order.id}>
      <div className="rp-order-main"><span className="rp-user-avatar">{(order.user?.name || 'U')[0]}</span><div><strong>{order.user?.name || 'Usuario'}</strong><small>{peruDate(order.createdAt)}</small></div></div>
      <div className="rp-order-items">{order.items?.map(item => <span key={item.id}>{item.quantity}× {itemName(item)}</span>)}</div>
      <strong>{money(order.total)}</strong>
    </article>)}</div>}
  </section>
}

function Promotions({ restaurantId, orders }) {
  const { data: products = [], isLoading } = useRestaurantProducts(restaurantId)
  const discount = useApplyProductDiscount(restaurantId)
  const [selected, setSelected] = useState([])
  const [all, setAll] = useState(false)
  const [percent, setPercent] = useState(10)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')
  const quantities = useMemo(() => new Map(getRanking(orders)), [orders])
  const shown = useMemo(() => {
    const result = products.filter(product => product.name.toLowerCase().includes(search.toLowerCase()))
    result.sort((a, b) => sort === 'best'
      ? (quantities.get(b.name) || 0) - (quantities.get(a.name) || 0)
      : sort === 'worst' ? (quantities.get(a.name) || 0) - (quantities.get(b.name) || 0) : a.name.localeCompare(b.name))
    return result
  }, [products, quantities, search, sort])

  const apply = async () => {
    const ids = all ? products.map(product => product.id) : selected
    if (!ids.length) return toast.error('Selecciona al menos un plato')
    try {
      await Promise.all(ids.map(productId => discount.mutateAsync({ productId, discountPct: Number(percent) })))
      toast.success(`Promoción aplicada a ${ids.length} producto${ids.length === 1 ? '' : 's'}`)
      setSelected([])
    } catch { /* el hook muestra el error */ }
  }

  return <section className="rp-panel">
    <div className="rp-panel-head"><div><h1>Promociones</h1><p>Aplica descuentos a platos específicos o a todo tu menú.</p></div><Percent size={21}/></div>
    <div className="rp-promo-config">
      <label>Descuento <span><input type="number" min="0" max="100" value={percent} onChange={e => setPercent(e.target.value)}/>%</span></label>
      <label className="rp-all-toggle"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)}/><span>Aplicar la promoción a todos los platos</span></label>
      <button className="rp-primary" disabled={discount.isPending} onClick={apply}>{discount.isPending ? 'Aplicando…' : 'Aplicar promoción'}</button>
    </div>
    <div className="rp-toolbar"><label><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plato"/></label><select value={sort} onChange={e => setSort(e.target.value)}><option value="name">Nombre</option><option value="best">Más vendidos</option><option value="worst">Menos vendidos</option></select></div>
    {isLoading ? <p>Cargando productos…</p> : <div className={`rp-product-select ${all ? 'disabled' : ''}`}>{shown.map(product => <label key={product.id}>
      <input type="checkbox" disabled={all} checked={all || selected.includes(product.id)} onChange={() => setSelected(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])}/>
      {product.imageUrl ? <img src={product.imageUrl} alt=""/> : <span className="rp-product-placeholder"><MenuIcon size={18}/></span>}
      <div><strong>{product.name}</strong><small>{money(product.price)} · {quantities.get(product.name) || 0} vendidos</small></div>
      <b>{product.discountPct ? `${product.discountPct}% OFF` : 'Sin descuento'}</b>
    </label>)}</div>}
  </section>
}

function Billing({ orders, restaurant }) {
  const [ticket, setTicket] = useState(null)
  const paid = orders.filter(order => ['PAID', 'APPROVED'].includes(order.payment?.status))
  return <section className="rp-panel">
    <div className="rp-panel-head"><div><h1>Facturación</h1><p>Historial de cobros y tickets de venta en horario del Perú.</p></div><FileText size={21}/></div>
    {paid.length === 0 ? <Empty>Aún no hay pagos confirmados.</Empty> : <div className="rp-table-wrap"><table className="rp-table"><thead><tr><th>Venta</th><th>Fecha y hora</th><th>Cliente</th><th>Total</th><th></th></tr></thead><tbody>{paid.map(order => <tr key={order.id}><td>#{order.orderNumber?.slice(-8) || order.id.slice(-8)}</td><td>{peruDate(order.createdAt)}</td><td>{order.user?.name || 'Usuario'}</td><td><strong>{money(order.total)}</strong></td><td><button onClick={() => setTicket(order)}>Ver ticket <ChevronRight size={14}/></button></td></tr>)}</tbody></table></div>}
    {ticket && <div className="rp-ticket-overlay" onClick={() => setTicket(null)}><article className="rp-ticket" onClick={e => e.stopPropagation()}><button className="rp-ticket-close" onClick={() => setTicket(null)}><X/></button><Store size={32}/><h2>{restaurant.name}</h2><p>Ticket de venta</p><hr/><div><span>Pedido</span><b>#{ticket.orderNumber?.slice(-8)}</b></div><div><span>Fecha</span><b>{peruDate(ticket.createdAt)}</b></div><div><span>Cliente</span><b>{ticket.user?.name || 'Usuario'}</b></div><hr/>{ticket.items?.map(item => <div key={item.id}><span>{item.quantity}× {itemName(item)}</span><b>{money(item.subtotal)}</b></div>)}<hr/><div className="rp-ticket-total"><span>Total</span><b>{money(ticket.total)}</b></div><small>Pago confirmado por Mercado Pago</small></article></div>}
  </section>
}

export default function RestaurantPortal() {
  const navigate = useNavigate()
  const { logout } = useAuth0()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const restaurant = user?.restaurant
  const [section, setSection] = useState('dashboard')
  const { data, isLoading: ordersLoading } = useRestaurantOrders(restaurant?.id, { page: 1, limit: 500 })
  const orders = data?.data || []

  if (userLoading) return <div className="rp-loading">Cargando panel del restaurante…</div>
  if (!user || user.role !== 'RESTAURANT_OWNER' || !restaurant) return <div className="rp-access"><Store size={45}/><h1>Panel no disponible</h1><p>Necesitas registrar y tener asociado un restaurante.</p><button onClick={() => navigate('/register-restaurant')}>Registrar restaurante</button></div>

  return <div className="rp">
    <aside className="rp-sidebar">
      <button className="rp-brand" onClick={() => navigate('/')}><span><Store size={22}/></span><div><b>Antojia</b><small>Panel restaurante</small></div></button>
      <div className="rp-restaurant"><strong>{restaurant.name}</strong><small>{restaurant.isApproved ? 'Restaurante aprobado' : 'Pendiente de aprobación'}</small></div>
      <nav>{SECTIONS.map(item => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}><Icon size={18}/><span>{item.label}</span><ChevronRight size={15}/></button> })}</nav>
      <button className="rp-orders-link" onClick={() => navigate('/restaurant-orders')}><ShoppingBag size={18}/> Gestionar pedidos</button>
      <button className="rp-logout" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}><LogOut size={17}/> Cerrar sesión</button>
      <button className="rp-home" onClick={() => navigate('/')}><House size={17}/> Volver a la tienda</button>
    </aside>
    <main className="rp-main"><header className="rp-topbar"><div><small>Panel del restaurante</small><strong>{SECTIONS.find(item => item.id === section)?.label}</strong></div></header>
      <div className="rp-content">{ordersLoading && section !== 'menu' && section !== 'promociones' ? <div className="rp-loading">Preparando tus datos…</div> : <>
        {section === 'dashboard' && <Overview orders={orders} restaurant={restaurant}/>} {section === 'menu' && <SectionMenu restaurant={restaurant}/>} {section === 'ventas' && <Sales orders={orders}/>} {section === 'promociones' && <Promotions restaurantId={restaurant.id} orders={orders}/>} {section === 'facturacion' && <Billing orders={orders} restaurant={restaurant}/>} {section === 'configuracion' && <SectionRestaurant restaurant={restaurant}/>} </>}
      </div>
    </main>
  </div>
}
