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

export default function DeliveryTrackingMap({ restaurant, destination, driver, height = 320 }) {
  const markers = [
    restaurant?.latitude != null && restaurant?.longitude != null && { key: 'restaurant', label: restaurant.name || 'Restaurante', point: [restaurant.latitude, restaurant.longitude], color: '#e85d24' },
    destination?.latitude != null && destination?.longitude != null && { key: 'destination', label: 'Dirección de entrega', point: [destination.latitude, destination.longitude], color: '#16a34a' },
    driver?.latitude != null && driver?.longitude != null && { key: 'driver', label: driver.name || 'Repartidor', point: [driver.latitude, driver.longitude], color: '#2563eb' },
  ].filter(Boolean)

  if (!markers.length) return <div className="tracking-map-empty">Aún no hay coordenadas disponibles para mostrar el mapa.</div>
  const points = markers.map(marker => marker.point)
  return (
    <div className="tracking-map" style={{ height }}>
      <MapContainer center={points[0]} zoom={14} scrollWheelZoom className="tracking-map-canvas">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitPoints points={points} />
        {points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#e85d24', dashArray: '7 8', weight: 3 }} />}
        {markers.map(marker => (
          <CircleMarker key={marker.key} center={marker.point} radius={9} pathOptions={{ color: '#fff', fillColor: marker.color, fillOpacity: 1, weight: 3 }}>
            <Popup>{marker.label}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
