import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { api, setAuthToken } from '../config/api.js'
import toast from 'react-hot-toast'

async function getToken(getAccessTokenSilently) {
  const token = await getAccessTokenSilently({
    authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
  })
  setAuthToken(token)
  return token
}

// ── Pedidos del restaurante ─────────────────────────────────────
export function useRestaurantOrders(restaurantId, params = {}) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  return useQuery({
    queryKey: ['restaurant-orders', restaurantId, params],
    queryFn: async () => {
      await getToken(getAccessTokenSilently)
      const { data } = await api.get(`/api/v1/orders/restaurant/${restaurantId}`, { params })
      return data
    },
    enabled: isAuthenticated && !!restaurantId,
    refetchInterval: 5000,
    placeholderData: (prev) => prev,
  })
}

// ── Actualizar estado de pedido ────────────────────────────────
export function useUpdateOrderStatus() {
  const { getAccessTokenSilently } = useAuth0()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      await getToken(getAccessTokenSilently)
      const { data } = await api.patch(`/api/v1/orders/${orderId}/status`, { status })
      return data
    },
    onSuccess: (_, { status }) => {
      const labels = {
        CONFIRMED: 'Pedido confirmado ✅',
        PREPARING: 'En preparación 👨‍🍳',
        READY:     'Listo para entrega 🎉',
        CANCELLED: 'Pedido cancelado',
      }
      toast.success(labels[status] || `Estado: ${status}`)
      // Invalida todas las queries de pedidos del restaurante
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] })
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Error al actualizar el estado'
      toast.error(msg)
    },
  })
}
