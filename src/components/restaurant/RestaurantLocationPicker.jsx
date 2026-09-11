import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './RestaurantLocationPicker.css'

const DEFAULT_CENTER = [-12.0464, -77.0428]
const markerIcon = L.divIcon({ className: '', html: '<div style="width:24px;height:24px;background:#ef5b20;border:4px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #0005"></div>', iconSize: [28, 28], iconAnchor: [14, 28] })

function MapInteraction({ value, onSelect }) {
  const map = useMap()
  useMapEvents({ click: ({ latlng }) => onSelect({ latitude: latlng.lat, longitude: latlng.lng }) })
  useEffect(() => {
    if (value?.latitude && value?.longitude) map.panTo([value.latitude, value.longitude])
  }, [map, value?.latitude, value?.longitude])
  return value?.latitude && value?.longitude ? <Marker position={[value.latitude, value.longitude]} icon={markerIcon}/> : null
}

export default function RestaurantLocationPicker({ value, onChange, onAddressResolved, reverseGeocode, requestLocationOnMount = false, instruction = 'Marca exactamente la entrada del restaurante.' }) {
  const [error, setError] = useState('')
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const hasRequestedLocation = useRef(false)

  const selectLocation = useCallback(async ({ latitude, longitude }) => {
    onChange({ latitude, longitude })
    if (!onAddressResolved || !reverseGeocode) return

    setResolvingAddress(true)
    try {
      const result = await reverseGeocode({ latitude, longitude })
      onAddressResolved(result)
    } catch {
      // La ubicación sigue siendo válida aunque el proveedor no devuelva texto.
      setError('Ubicación marcada. Completa manualmente dirección y distrito si no se cargaron.')
    } finally {
      setResolvingAddress(false)
    }
  }, [onAddressResolved, onChange, reverseGeocode])

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setError('Tu dispositivo no permite obtener la ubicación')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setError(''); selectLocation({ latitude: coords.latitude, longitude: coords.longitude }) },
      () => setError('No se pudo obtener tu ubicación. Permite el acceso al GPS o marca el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }, [selectLocation])

  useEffect(() => {
    if (requestLocationOnMount && !hasRequestedLocation.current) {
      hasRequestedLocation.current = true
      locate()
    }
  }, [locate, requestLocationOnMount])

  const center = value?.latitude && value?.longitude ? [value.latitude, value.longitude] : DEFAULT_CENTER
  return <div className="restaurant-location-picker">
    <div className="restaurant-location-actions"><p>{instruction}</p><button type="button" onClick={locate}><LocateFixed size={16}/> Usar mi ubicación actual</button></div>
    <MapContainer center={center} zoom={value?.latitude ? 16 : 12} style={{ height: 280, width: '100%', borderRadius: 12 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <MapInteraction value={value} onSelect={selectLocation}/>
    </MapContainer>
    {resolvingAddress && <small>Buscando dirección y distrito…</small>}
    {value?.latitude && <small>Ubicación seleccionada: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</small>}
    {error && <small className="restaurant-location-error">{error}</small>}
  </div>
}
