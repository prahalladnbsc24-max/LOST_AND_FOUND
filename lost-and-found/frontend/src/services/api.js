
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data
}

export const api = {
  register: (userData) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  login: (credentials) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getProfile: (token) =>
    request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getItems: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/items${query ? `?${query}` : ''}`)
  },

  getMyItems: (token) =>
    request('/api/items/mine', {
      headers: { Authorization: `Bearer ${token}` }
    }),

  createItem: (itemData, token) =>
    request('/api/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: itemData
    }),

  updateItem: (id, itemData, token) =>
    request(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: itemData
    }),

  deleteItem: (id, token) =>
    request(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
}
