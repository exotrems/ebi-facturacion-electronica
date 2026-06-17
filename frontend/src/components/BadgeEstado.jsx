const estados = {
  'PENDIENTE': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pendiente' },
  'ENVIADA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Enviada' },
  'AUTORIZADA': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Autorizada' },
  'RECHAZADA': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
  'ERROR': { bg: 'bg-red-100', text: 'text-red-700', label: 'Error' },
  'ANULADA': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Anulada' }
};

export default function BadgeEstado({ estado }) {
  const config = estados[estado] || estados['PENDIENTE'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
