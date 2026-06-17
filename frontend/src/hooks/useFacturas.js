import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturaService } from '../services/api.service.js';
import toast from 'react-hot-toast';

export const useFacturas = (params = {}) => {
  return useQuery({
    queryKey: ['facturas', params],
    queryFn: () => facturaService.listar(params).then(res => res.data)
  });
};

export const useFactura = (id) => {
  return useQuery({
    queryKey: ['factura', id],
    queryFn: () => facturaService.obtener(id).then(res => res.data),
    enabled: !!id
  });
};

export const useCrearFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => facturaService.crear(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear factura');
    }
  });
};

export const useActualizarFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => facturaService.actualizar(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura actualizada');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar factura');
    }
  });
};

export const useEliminarFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => facturaService.eliminar(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura eliminada');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar factura');
    }
  });
};

// Hooks para operaciones EBI
export const useEnviarEBI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => facturaService.enviarEBI(id).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['factura'] });
      toast.success(data.message || 'Documento enviado a EBI');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar a EBI');
    }
  });
};

export const useConsultarEstado = () => {
  return useMutation({
    mutationFn: (id) => facturaService.consultarEstado(id).then(res => res.data),
    onSuccess: (data) => {
      toast.success(`Estado: ${data.data?.estatusDocumento || 'Consultado'}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al consultar estado');
    }
  });
};

export const useAnularFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }) => facturaService.anular(id, motivo).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura anulada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al anular factura');
    }
  });
};

export const useEnviarCorreo = () => {
  return useMutation({
    mutationFn: ({ id, correo }) => facturaService.enviarCorreo(id, correo).then(res => res.data),
    onSuccess: (data) => {
      toast.success(data.message || 'Correo enviado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar correo');
    }
  });
};
