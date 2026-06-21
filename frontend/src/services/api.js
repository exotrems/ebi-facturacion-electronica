/**
 * Servicio de API para comunicación con el backend
 * Ajustar la URL base según el entorno
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

export const api = {
  get: (endpoint) => 
    fetch(`${API_BASE_URL}${endpoint}`).then(handleResponse),

  post: (endpoint, data) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  put: (endpoint, data) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  delete: (endpoint) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE'
    }).then(handleResponse)
};

export default api;
