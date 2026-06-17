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
