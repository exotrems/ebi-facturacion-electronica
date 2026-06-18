import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Interceptores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error desconocido';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Servicio de Facturas
export const facturaService = {
  crear: (data) => api.post('/facturas', data),
  listar: (params) => api.get('/facturas', { params }),
  obtener: (id) => api.get(`/facturas/${id}`),
  actualizar: (id, data) => api.put(`/facturas/${id}`, data),
  eliminar: (id) => api.delete(`/facturas/${id}`),
  enviarEBI: (id) => api.post(`/facturas/${id}/enviar`),
  consultarEstado: (id) => api.get(`/facturas/${id}/estado`),
  anular: (id, motivo) => api.post(`/facturas/${id}/anular`, { motivo }),
  descargarXML: (id) => api.get(`/facturas/${id}/xml`, { responseType: 'blob' }),
  descargarPDF: (id) => api.get(`/facturas/${id}/pdf`, { responseType: 'blob' }),
  enviarCorreo: (id, correo) => api.post(`/facturas/${id}/correo`, { correo })
};

// Servicio de Clientes
export const clienteService = {
  crear: (data) => api.post('/clientes', data),
  listar: () => api.get('/clientes'),
  obtener: (id) => api.get(`/clientes/${id}`),
  actualizar: (id, data) => api.put(`/clientes/${id}`, data),
  eliminar: (id) => api.delete(`/clientes/${id}`),
  consultarRucDV: (tipoRuc, ruc) => api.post('/clientes/consultar-ruc', { tipoRuc, ruc })
};

// Servicio de Productos
export const productoService = {
  crear: (data) => api.post('/productos', data),
  listar: () => api.get('/productos'),
  obtener: (id) => api.get(`/productos/${id}`),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  eliminar: (id) => api.delete(`/productos/${id}`)
};

// Servicio de Configuración EBI
export const configService = {
  obtener: () => api.get('/config'),
  crear: (data) => api.post('/config', data),
  actualizar: (data) => api.put('/config', data)
};

// Servicio EBI Directo
export const ebiService = {
  enviar: (documento) => api.post('/ebi/enviar', { documento }),
  estadoDocumento: (datosDocumento) => api.post('/ebi/estado-documento', { datosDocumento }),
  anulacion: (motivoAnulacion, datosDocumento) => api.post('/ebi/anulacion', { motivoAnulacion, datosDocumento }),
  descargaXML: (datosDocumento) => api.post('/ebi/descarga-xml', { datosDocumento }, { responseType: 'blob' }),
  envioCorreo: (datosDocumento, correo) => api.post('/ebi/envio-correo', { datosDocumento, correo }),
  descargaPDF: (datosDocumento) => api.post('/ebi/descarga-pdf', { datosDocumento }, { responseType: 'blob' }),
  consultarRucDV: (tipoRuc, ruc) => api.post('/ebi/consultar-ruc-dv', { tipoRuc, ruc })
};
