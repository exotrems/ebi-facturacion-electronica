import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteService } from '../services/api.service.js';
import toast from 'react-hot-toast';

export const useClientes = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteService.listar().then(res => res.data)
  });
};

export const useCrearCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => clienteService.crear(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear cliente');
    }
  });
};

export const useActualizarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => clienteService.actualizar(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar cliente');
    }
  });
};

export const useEliminarCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => clienteService.eliminar(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar cliente');
    }
  });
};

export const useConsultarRucDV = () => {
  return useMutation({
    mutationFn: ({ tipoRuc, ruc }) => clienteService.consultarRucDV(tipoRuc, ruc).then(res => res.data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`RUC consultado: ${data.data?.razonSocial || 'Encontrado'}`);
      } else {
        toast.error(data.message || 'RUC no encontrado');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al consultar RUC');
    }
  });
};
