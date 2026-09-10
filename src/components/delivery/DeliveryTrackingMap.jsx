import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import './DeliveryTrackingMap.css'

function FitPoints({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15)
    if (points.length > 1) map.fitBounds(points, { padding: [35, 35], maxZoom: 16 })
  }, [map, points])
  return null
}

export default function DeliveryTrackingMap({ restaurant, destination, driver, phase = 'delivery', height = 320 }) {
  const markers = [
    restaurant?.latitude != null && restaurant?.longitude != null && { key: 'restaurant', label: restaurant.name || 'Restaurante', point: [restaurant.latitude, restaurant.longitude], color: '#e85d24' },
    destination?.latitude != null && destination?.longitude != null && { key: 'destination', label: 'Dirección de entrega', point: [destination.latitude, destination.longitude], color: '#16a34a' },
    driver?.latitude != null && driver?.longitude != null && { key: 'driver', label: driver.name || 'Repartidor', point: [driver.latitude, driver.longitude], color: '#2563eb' },
  ].filter(Boolean)

  if (!markers.length) return <div className="tracking-map-empty">Aún no hay coordenadas disponibles para mostrar el mapa.</div>
  const points = markers.map(marker => marker.point)
  const driverMarker = markers.find(marker => marker.key === 'driver')
  const targetMarker = markers.find(marker => marker.key === (phase === 'pickup' ? 'restaurant' : 'destination'))
  const routePoints = driverMarker && targetMarker ? [driverMarker.point, targetMarker.point] : []
  return (
    <div className="tracking-map-wrap">
      <div className="tracking-map" style={{ height }}>
        <MapContainer center={points[0]} zoom={14} scrollWheelZoom className="tracking-map-canvas">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitPoints points={points} />
          {routePoints.length === 2 && <Polyline positions={routePoints} pathOptions={{ color: '#2563eb', weight: 5, opacity: .8 }} />}
          {markers.map(marker => (
            <CircleMarker key={marker.key} center={marker.point} radius={marker.key === 'driver' ? 12 : 9} pathOptions={{ color: '#fff', fillColor: marker.color, fillOpacity: 1, weight: 4 }}>
              <Popup>{marker.label}{marker.key === 'driver' ? ' · ubicación actual' : ''}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="tracking-map-legend">
        <span><i className="restaurant"/>Restaurante</span><span><i className="driver"/>Repartidor</span><span><i className="destination"/>Cliente</span>
      </div>
      {routePoints.length === 2 && <p className="tracking-map-route">Ruta actual: repartidor → {phase === 'pickup' ? 'restaurante' : 'cliente'}</p>}
    </div>
  )
}
