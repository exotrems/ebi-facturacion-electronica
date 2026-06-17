import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Facturas from './pages/Facturas.jsx';
import NuevaFactura from './pages/NuevaFactura.jsx';
import EditarFactura from './pages/EditarFactura.jsx';
import Clientes from './pages/Clientes.jsx';
import Productos from './pages/Productos.jsx';
import Configuracion from './pages/Configuracion.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/facturas/nueva" element={<NuevaFactura />} />
        <Route path="/facturas/editar/:id" element={<EditarFactura />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </Layout>
  );
}
