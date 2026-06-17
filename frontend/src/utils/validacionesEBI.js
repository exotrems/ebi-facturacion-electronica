// ============================================
// VALIDACIONES EBI PAC - Facturacion Electronica
// ============================================

// Validar formato RUC Panameno (8-123-456789 o 123-456-7890)
export const validarRUC = (ruc) => {
  if (!ruc) return { valido: false, mensaje: 'RUC es obligatorio' };

  const rucLimpio = ruc.replace(/[^0-9]/g, '');

  if (rucLimpio.length < 6 || rucLimpio.length > 10) {
    return { valido: false, mensaje: 'RUC debe tener entre 6 y 10 digitos' };
  }

  return { valido: true, mensaje: '' };
};

// Validar GTIN segun tipo
export const validarGTIN = (gtin, tipo = 'GTIN-13') => {
  if (!gtin) return { valido: true, mensaje: '' };

  const gtinLimpio = gtin.replace(/[^0-9]/g, '');
  const digitosEsperados = {
    'GTIN-8': 8,
    'GTIN-12': 12,
    'GTIN-13': 13,
    'GTIN-14': 14,
  };

  const esperado = digitosEsperados[tipo] || 13;

  if (gtinLimpio.length !== esperado) {
    return { valido: false, mensaje: `GTIN debe tener ${esperado} digitos` };
  }

  const checkDigit = calcularDigitoVerificadorGTIN(gtinLimpio.slice(0, -1));
  if (checkDigit !== parseInt(gtinLimpio.slice(-1))) {
    return { valido: false, mensaje: 'Digito verificador GTIN invalido' };
  }

  return { valido: true, mensaje: '' };
};

const calcularDigitoVerificadorGTIN = (digits) => {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.substring(i, i + 1), 10);
    if (alternate) n *= 3;
    sum += n;
    alternate = !alternate;
  }
  return (10 - (sum % 10)) % 10;
};

// Validar numero de factura
export const validarNumeroFactura = (numero) => {
  if (!numero) return { valido: false, mensaje: 'Numero de factura es obligatorio' };
  if (numero.length > 20) return { valido: false, mensaje: 'Maximo 20 caracteres' };
  return { valido: true, mensaje: '' };
};

// Validar email
export const validarEmail = (email) => {
  if (!email) return { valido: true, mensaje: '' };
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { valido: false, mensaje: 'Formato de email invalido' };
  }
  return { valido: true, mensaje: '' };
};

// Validar cantidad (debe ser > 0)
export const validarCantidad = (cantidad) => {
  const val = parseFloat(cantidad);
  if (isNaN(val) || val <= 0) {
    return { valido: false, mensaje: 'Cantidad debe ser mayor a 0' };
  }
  return { valido: true, mensaje: '' };
};

// Validar precio (debe ser >= 0)
export const validarPrecio = (precio) => {
  const val = parseFloat(precio);
  if (isNaN(val) || val < 0) {
    return { valido: false, mensaje: 'Precio debe ser mayor o igual a 0' };
  }
  return { valido: true, mensaje: '' };
};

// Validar factura completa
export const validarFactura = (factura) => {
  const errores = [];

  const numVal = validarNumeroFactura(factura.numero);
  if (!numVal.valido) errores.push(`Numero factura: ${numVal.mensaje}`);

  if (!factura.fecha) errores.push('Fecha es obligatoria');
  if (!factura.moneda) errores.push('Moneda es obligatoria');

  if (!factura.cliente?.nombre) errores.push('Nombre del cliente es obligatorio');

  const rucVal = validarRUC(factura.cliente?.ruc);
  if (!rucVal.valido) errores.push(`RUC: ${rucVal.mensaje}`);

  if (!factura.cliente?.pais) errores.push('Pais del cliente es obligatorio');

  // Si es Panama, provincia y distrito son obligatorios
  if (factura.cliente?.pais === 'PA') {
    if (!factura.cliente?.provincia) errores.push('Provincia es obligatoria para clientes de Panama');
    if (!factura.cliente?.distrito) errores.push('Distrito es obligatorio para clientes de Panama');
  }

  if (!factura.items || factura.items.length === 0) {
    errores.push('Debe incluir al menos un item');
  } else {
    factura.items.forEach((item, idx) => {
      if (!item.descripcion) errores.push(`Item ${idx + 1}: Descripcion es obligatoria`);

      const cantVal = validarCantidad(item.cantidad);
      if (!cantVal.valido) errores.push(`Item ${idx + 1}: ${cantVal.mensaje}`);

      const precVal = validarPrecio(item.precioUnitario);
      if (!precVal.valido) errores.push(`Item ${idx + 1}: ${precVal.mensaje}`);

      if (!item.unidadMedida) errores.push(`Item ${idx + 1}: Unidad de medida es obligatoria`);
    });
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};
