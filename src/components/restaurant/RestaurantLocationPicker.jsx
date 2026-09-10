import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './RestaurantLocationPicker.css'

const DEFAULT_CENTER = [-12.0464, -77.0428]
const markerIcon = L.divIcon({ className: '', html: '<div style="width:24px;height:24px;background:#ef5b20;border:4px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #0005"></div>', iconSize: [28, 28], iconAnchor: [14, 28] })

function MapInteraction({ value, onChange }) {
  const map = useMap()
  useMapEvents({ click: ({ latlng }) => onChange({ latitude: latlng.lat, longitude: latlng.lng }) })
  useEffect(() => {
    if (value?.latitude && value?.longitude) map.panTo([value.latitude, value.longitude])
  }, [map, value?.latitude, value?.longitude])
  return value?.latitude && value?.longitude ? <Marker position={[value.latitude, value.longitude]} icon={markerIcon}/> : null
}

export default function RestaurantLocationPicker({ value, onChange, instruction = 'Marca exactamente la entrada del restaurante.' }) {
  const [error, setError] = useState('')
  const locate = () => {
    if (!navigator.geolocation) return setError('Tu dispositivo no permite obtener la ubicación')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setError(''); onChange({ latitude: coords.latitude, longitude: coords.longitude }) },
      () => setError('No se pudo obtener tu ubicación. Permite el acceso al GPS o marca el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }
  const center = value?.latitude && value?.longitude ? [value.latitude, value.longitude] : DEFAULT_CENTER
  return <div className="restaurant-location-picker">
    <div className="restaurant-location-actions"><p>{instruction}</p><button type="button" onClick={locate}><LocateFixed size={16}/> Usar mi ubicación</button></div>
    <MapContainer center={center} zoom={value?.latitude ? 16 : 12} style={{ height: 280, width: '100%', borderRadius: 12 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <MapInteraction value={value} onChange={onChange}/>
    </MapContainer>
    {value?.latitude && <small>Ubicación seleccionada: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</small>}
    {error && <small className="restaurant-location-error">{error}</small>}
  </div>
}
