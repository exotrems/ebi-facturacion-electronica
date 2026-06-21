import { useState, useEffect } from 'react';

const TIPOS_CLIENTE = [
  { value: '01', label: '01 - Contribuyente', requiereRUC: true, requiereDV: true, requiereUbicacion: true },
  { value: '02', label: '02 - Consumidor Final', requiereRUC: false, requiereDV: false, requiereUbicacion: false },
  { value: '03', label: '03 - Gobierno', requiereRUC: true, requiereDV: true, requiereUbicacion: true },
  { value: '04', label: '04 - Extranjero', requiereRUC: false, requiereDV: false, requiereUbicacion: false, requiereIdentificacionExtranjera: true }
];

const TIPOS_IDENTIFICACION_EXTRANJERA = [
  { value: '01', label: '01 - Pasaporte' },
  { value: '02', label: '02 - Número Tributario' },
  { value: '99', label: '99 - Otro' }
];

const PROVINCIAS = [
  'Bocas del Toro', 'Coclé', 'Colón', 'Chiriquí', 'Darién', 
  'Herrera', 'Los Santos', 'Panamá', 'Panamá Oeste', 'Veraguas', 'Ngäbe-Buglé'
];

/**
 * Formulario dinámico de cliente según tipoClienteFE
 * Se adapta automáticamente mostrando/ocultando campos según las reglas de EBI PAC
 */
export default function ClienteForm({ cliente, onChange, modo = 'edit' }) {
  const [data, setData] = useState({
    tipo_cliente_fe: '01',
    tipo_contribuyente: '2',
    numero_ruc: '',
    digito_verificador_ruc: '',
    razon_social: '',
    direccion: '',
    codigo_ubicacion: '',
    provincia: '',
    distrito: '',
    corregimiento: '',
    tipo_identificacion: '01',
    nro_identificacion_extranjero: '',
    pais_extranjero: '',
    telefono1: '',
    telefono2: '',
    telefono3: '',
    correo_electronico1: '',
    correo_electronico2: '',
    correo_electronico3: '',
    pais: 'PA',
    pais_otro: '',
    ...cliente
  });

  const tipoConfig = TIPOS_CLIENTE.find(t => t.value === data.tipo_cliente_fe) || TIPOS_CLIENTE[0];

  useEffect(() => {
    if (cliente) {
      setData(prev => ({ ...prev, ...cliente }));
    }
  }, [cliente]);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };

    // Lógica condicional al cambiar tipo de cliente
    if (field === 'tipo_cliente_fe') {
      const newConfig = TIPOS_CLIENTE.find(t => t.value === value);

      if (value === '04') {
        // Extranjero: limpiar campos panameños
        newData.tipo_contribuyente = '';
        newData.numero_ruc = '';
        newData.digito_verificador_ruc = '';
        newData.codigo_ubicacion = '';
        newData.provincia = '';
        newData.distrito = '';
        newData.corregimiento = '';
        newData.tipo_identificacion = '01';
      } else {
        // Panameño: limpiar campos extranjeros
        newData.tipo_identificacion = '';
        newData.nro_identificacion_extranjero = '';
        newData.pais_extranjero = '';

        if (value === '01' || value === '03') {
          newData.tipo_contribuyente = value === '03' ? '2' : '2';
        } else {
          newData.tipo_contribuyente = '1';
        }
      }
    }

    // Si cambia país a PA, forzar destino Panamá
    if (field === 'pais' && value === 'PA') {
      // El padre debe manejar esto via onChange
    }

    // Si cambia país a ZZ, requerir pais_otro
    if (field === 'pais' && value !== 'ZZ') {
      newData.pais_otro = '';
    }

    setData(newData);
    onChange && onChange(newData);
  };

  return (
    <div className="space-y-4">
      {/* Tipo de Cliente FE */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tipo de Cliente FE <span className="text-red-500">*</span>
        </label>
        <select
          value={data.tipo_cliente_fe}
          onChange={(e) => handleChange('tipo_cliente_fe', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={modo === 'view'}
        >
          {TIPOS_CLIENTE.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {data.tipo_cliente_fe === '04' 
            ? 'Extranjero: No requiere RUC, DV ni ubicación panameña'
            : data.tipo_cliente_fe === '02'
            ? 'Consumidor Final: RUC y DV opcionales'
            : 'Contribuyente/Gobierno: RUC, DV y ubicación obligatorios'}
        </p>
      </div>

      {/* Razón Social - Siempre visible */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Razón Social / Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.razon_social}
          onChange={(e) => handleChange('razon_social', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Nombre o Razón Social"
          required
          disabled={modo === 'view'}
        />
      </div>

      {/* === CAMPOS PARA CLIENTE PANAMEÑO (01, 02, 03) === */}
      {tipoConfig.requiereRUC && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              RUC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.numero_ruc}
              onChange={(e) => handleChange('numero_ruc', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="155596713-2-2015"
              required
              disabled={modo === 'view'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              DV <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.digito_verificador_ruc}
              onChange={(e) => handleChange('digito_verificador_ruc', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="59"
              required
              disabled={modo === 'view'}
            />
          </div>
        </div>
      )}

      {/* Consumidor Final: RUC opcional */}
      {data.tipo_cliente_fe === '02' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              RUC <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={data.numero_ruc}
              onChange={(e) => handleChange('numero_ruc', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="155596713-2-2015"
              disabled={modo === 'view'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              DV <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={data.digito_verificador_ruc}
              onChange={(e) => handleChange('digito_verificador_ruc', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="59"
              disabled={modo === 'view'}
            />
          </div>
        </div>
      )}

      {/* Tipo Contribuyente - Solo para no extranjeros */}
      {data.tipo_cliente_fe !== '04' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipo Contribuyente <span className="text-red-500">*</span>
          </label>
          <select
            value={data.tipo_contribuyente}
            onChange={(e) => handleChange('tipo_contribuyente', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            disabled={modo === 'view'}
          >
            <option value="1">1 - Natural</option>
            <option value="2">2 - Jurídico</option>
          </select>
        </div>
      )}

      {/* Dirección y Ubicación - Solo para 01 y 03 */}
      {tipoConfig.requiereUbicacion && (
        <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700">Ubicación (Obligatorio)</h4>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dirección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Urbanización, Calle, Casa/Edificio"
              required
              disabled={modo === 'view'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Código Ubicación <span className="text-red-500">*</span> 
              <span className="text-xs text-slate-400 ml-1">(Formato: 1-1-1)</span>
            </label>
            <input
              type="text"
              value={data.codigo_ubicacion}
              onChange={(e) => handleChange('codigo_ubicacion', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="1-1-1"
              required
              disabled={modo === 'view'}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Provincia <span className="text-red-500">*</span>
              </label>
              <select
                value={data.provincia}
                onChange={(e) => handleChange('provincia', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
                disabled={modo === 'view'}
              >
                <option value="">Seleccione...</option>
                {PROVINCIAS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Distrito <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.distrito}
                onChange={(e) => handleChange('distrito', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Distrito"
                required
                disabled={modo === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Corregimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.corregimiento}
                onChange={(e) => handleChange('corregimiento', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Corregimiento"
                required
                disabled={modo === 'view'}
              />
            </div>
          </div>
        </div>
      )}

      {/* === CAMPOS PARA CLIENTE EXTRANJERO (04) === */}
      {data.tipo_cliente_fe === '04' && (
        <div className="space-y-3 border border-amber-200 rounded-lg p-4 bg-amber-50">
          <h4 className="text-sm font-semibold text-amber-800">Datos de Cliente Extranjero</h4>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo Identificación <span className="text-red-500">*</span>
            </label>
            <select
              value={data.tipo_identificacion}
              onChange={(e) => handleChange('tipo_identificacion', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
              disabled={modo === 'view'}
            >
              {TIPOS_IDENTIFICACION_EXTRANJERA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              N° Identificación Extranjera <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nro_identificacion_extranjero}
              onChange={(e) => handleChange('nro_identificacion_extranjero', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Pasaporte o NIT extranjero"
              required
              disabled={modo === 'view'}
            />
          </div>

          {data.tipo_identificacion === '01' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                País Extranjero <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-1">(Obligatorio con pasaporte)</span>
              </label>
              <input
                type="text"
                value={data.pais_extranjero}
                onChange={(e) => handleChange('pais_extranjero', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Ej: Colombia, Estados Unidos, España..."
                required
                disabled={modo === 'view'}
              />
            </div>
          )}
        </div>
      )}

      {/* Contacto - Común para todos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Teléfono 1
          </label>
          <input
            type="text"
            value={data.telefono1}
            onChange={(e) => handleChange('telefono1', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="9999-9999"
            disabled={modo === 'view'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Correo Electrónico 1
          </label>
          <input
            type="email"
            value={data.correo_electronico1}
            onChange={(e) => handleChange('correo_electronico1', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="cliente@email.com"
            disabled={modo === 'view'}
          />
        </div>
      </div>

      {/* País - Común */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            País <span className="text-red-500">*</span>
          </label>
          <select
            value={data.pais}
            onChange={(e) => handleChange('pais', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            disabled={modo === 'view'}
          >
            <option value="PA">PA - Panamá</option>
            <option value="ZZ">ZZ - Otro (no en catálogo)</option>
          </select>
        </div>
        {data.pais === 'ZZ' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del País <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pais_otro}
              onChange={(e) => handleChange('pais_otro', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Nombre completo del país"
              required
              disabled={modo === 'view'}
            />
          </div>
        )}
      </div>

      {/* Alerta de validación */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-semibold">Resumen de validación EBI:</p>
        <ul className="mt-1 space-y-1">
          <li>• Tipo Cliente: {tipoConfig.label}</li>
          <li>• RUC requerido: {tipoConfig.requiereRUC ? 'Sí' : 'No'}</li>
          <li>• DV requerido: {tipoConfig.requiereDV ? 'Sí' : 'No'}</li>
          <li>• Ubicación requerida: {tipoConfig.requiereUbicacion ? 'Sí' : 'No'}</li>
          <li>• ID Extranjera requerida: {tipoConfig.requiereIdentificacionExtranjera ? 'Sí' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}
