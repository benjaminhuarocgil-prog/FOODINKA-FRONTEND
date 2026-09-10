import { useQuery } from '@tanstack/react-query'
import { api } from '../config/api.js'

// Restaurantes son públicos — no necesitan token
export function useRestaurants(filters = {}) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
  )
  return useQuery({
    queryKey: ['restaurants', cleanFilters],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/restaurants', { params: cleanFilters })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useRestaurant(id) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/restaurants/${id}`)
      return data
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })
}
