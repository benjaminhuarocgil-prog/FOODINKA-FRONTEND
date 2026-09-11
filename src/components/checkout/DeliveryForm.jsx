import './CheckoutForm.css'

export const DELIVERY_DISTRICTS = [
  'Miraflores','San Isidro','Barranco','Surco','La Molina',
  'San Borja','Cercado de Lima','Lince','Jesús María','Magdalena',
  'San Miguel','Pueblo Libre','Breña','Rímac','Los Olivos',
  'San Martín de Porres','Ate','La Victoria','Chorrillos',
]

export default function DeliveryForm({
  address, onAddressChange,
  district, onDistrictChange,
  phone, onPhoneChange,
  notes, onNotesChange,
}) {
  return (
    <div className="chkform">

      <div className="chkform-field">
        <label className="chkform-label">Dirección de entrega *</label>
        <input
          className="chkform-input"
          type="text"
          placeholder="Av. La Mar 123, Dpto 4B"
          value={address}
          onChange={e => onAddressChange(e.target.value)}
        />
      </div>

      <div className="chkform-field">
        <label className="chkform-label">Distrito *</label>
        <select
          className="chkform-input"
          value={district}
          onChange={e => onDistrictChange(e.target.value)}
        >
          <option value="">Selecciona un distrito</option>
          {DELIVERY_DISTRICTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="chkform-field">
        <label className="chkform-label">Teléfono de contacto *</label>
        <input
          className="chkform-input"
          type="tel"
          placeholder="987 654 321"
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
        />
      </div>

      <div className="chkform-field">
        <label className="chkform-label">
          Referencia <span className="chkform-optional">(opcional)</span>
        </label>
        <input
          className="chkform-input"
          type="text"
          placeholder="Frente al parque, portón azul..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
        />
      </div>

    </div>
  )
}
