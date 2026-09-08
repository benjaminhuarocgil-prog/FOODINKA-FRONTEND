import { useState } from 'react'
import { Search, X } from 'lucide-react'
import './SearchBar.css'

export default function SearchBar({ value, onChange }) {
  const [focused, setFocused] = useState(false)

  const handleClear = () => onChange('')

  return (
    <div className={`searchbar ${focused ? 'searchbar--focused' : ''}`}>
      <Search size={18} className="searchbar-icon" />
      <input
        type="text"
        placeholder="Busca restaurantes o platos"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="searchbar-input"
      />
      {value && (
        <button className="searchbar-clear" onClick={handleClear}>
          <X size={15} />
        </button>
      )}
    </div>
  )
}
