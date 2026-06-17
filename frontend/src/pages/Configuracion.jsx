import { useState, useEffect } from 'react';
import { configService } from '../services/api.service.js';
import { Save, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Configuracion() {
  const [config, setConfig] = useState({ token_empresa: '', token_password: '', codigo_sucursal: '0000', punto_facturacion: '001', ambiente: 'test', url_wsdl: 'https://test.ebi-pac.com/Service.svc?wsdl' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const response = await configService.obtener();
      if (response.data?.data) setConfig(response.data.data);
    } catch (error) { console.log('No hay configuracion previa'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await configService.crear(config);
      toast.success('Configuracion guardada exitosamente');
    } catch (error) {
      try { await configService.actualizar(config); toast.success('Configuracion actualizada'); }
      catch (err) { toast.error('Error al guardar configuracion'); }
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">Configuracion EBI</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL WSDL *</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="url" name="url_wsdl" value={config.url_wsdl} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Token Empresa *</label>
              <input type="password" name="token_empresa" value={config.token_empresa} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Token proporcionado por EBI" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Token Password *</label>
              <input type="password" name="token_password" value={config.token_password} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Password proporcionado por EBI" />
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Codigo Sucursal</label><input name="codigo_sucursal" value={config.codigo_sucursal} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="0000" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Punto Facturacion</label><input name="punto_facturacion" value={config.punto_facturacion} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="001" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Ambiente</label><select name="ambiente" value={config.ambiente} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="test">Test</option><option value="production">Produccion</option></select></div>
          </div>
          <div className="pt-4">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<Save className="w-4 h-4" />)}
              Guardar Configuracion
            </button>
          </div>
        </form>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Informacion</h3>
        <p className="text-sm text-blue-700">Los tokens de empresa y password son proporcionados por Electronic Business Intelligence (EBI). Asegurese de configurar correctamente el ambiente antes de enviar documentos a produccion.</p>
      </div>
    </div>
  );
}
