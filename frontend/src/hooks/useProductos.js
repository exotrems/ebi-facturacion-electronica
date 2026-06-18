import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productoService } from '../services/api.service.js';
import toast from 'react-hot-toast';

export const useProductos = () => {
  return useQuery({
    queryKey: ['productos'],
    queryFn: () => productoService.listar().then(res => res.data)
  });
};

export const useCrearProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => productoService.crear(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear producto');
    }
  });
};

export const useActualizarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productoService.actualizar(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar producto');
    }
  });
};

export const useEliminarProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productoService.eliminar(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar producto');
    }
  });
};
