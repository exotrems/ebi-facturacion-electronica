// ============================================
// BACKEND EBI PAC - Node.js + SQLite
// Endpoints actualizados con PUT, PDF, y validaciones
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDatabase } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Helpers
const safeValue = (val) => val === undefined || val === null ? '' : String(val);
const safeNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

// ============================================
// GET /api/facturas - Listar facturas
// ============================================
app.get('/api/facturas', async (req, res) => {
  try {
    const db = getDatabase();
    const facturas = db.prepare(`
      SELECT id, numero, fecha, moneda, pais, incoterm, tipo_operacion as tipoOperacion,
             cliente_nombre, cliente_ruc, cliente_pais, cliente_provincia, cliente_distrito,
             subtotal, itbms, total, observaciones, estado, created_at, updated_at
      FROM facturas
      ORDER BY fecha DESC, id DESC
    `).all();
    res.json(facturas);
  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// ============================================
// GET /api/facturas/:id/items - Items de factura
// ============================================
app.get('/api/facturas/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const items = db.prepare(`
      SELECT id, descripcion, cantidad, precio_unitario, unidad_medida,
             cpbs_segmento, gtin, descuento
      FROM factura_items
      WHERE factura_id = ?
      ORDER BY id
    `).all(id);
    res.json(items);
  } catch (error) {
    console.error('Error cargando items:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// ============================================
// POST /api/facturas - Crear factura
// ============================================
app.post('/api/facturas', async (req, res) => {
  try {
    const db = getDatabase();
    const {
      numero, fecha, moneda, pais, incoterm, tipoOperacion,
      cliente, items, observaciones, estado
    } = req.body;

    const insertFactura = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO facturas (
          numero, fecha, moneda, pais, incoterm, tipo_operacion,
          cliente_nombre, cliente_ruc, cliente_pais, cliente_provincia,
          cliente_distrito, cliente_corregimiento, cliente_direccion,
          cliente_email, cliente_telefono, observaciones, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        safeValue(numero), fecha, moneda, safeValue(pais),
        safeValue(incoterm), safeValue(tipoOperacion),
        safeValue(cliente?.nombre), safeValue(cliente?.ruc),
        safeValue(cliente?.pais), safeValue(cliente?.provincia),
        safeValue(cliente?.distrito), safeValue(cliente?.corregimiento),
        safeValue(cliente?.direccion), safeValue(cliente?.email),
        safeValue(cliente?.telefono), safeValue(observaciones),
        safeValue(estado) || 'BORRADOR'
      );

      const facturaId = result.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO factura_items (
          factura_id, descripcion, cantidad, precio_unitario,
          unidad_medida, cpbs_segmento, gtin, descuento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(
          facturaId,
          safeValue(item.descripcion),
          safeNumber(item.cantidad),
          safeNumber(item.precioUnitario),
          safeValue(item.unidadMedida),
          safeValue(item.cpbsSegmento),
          safeValue(item.gtin),
          safeNumber(item.descuento)
        );
      }

      // Calcular totales
      const totales = db.prepare(`
        SELECT SUM(cantidad * precio_unitario - COALESCE(descuento, 0)) as subtotal
        FROM factura_items WHERE factura_id = ?
      `).get(facturaId);

      const subtotal = safeNumber(totales?.subtotal);
      const itbms = subtotal * 0.07;
      const total = subtotal + itbms;

      db.prepare(`
        UPDATE facturas SET subtotal = ?, itbms = ?, total = ? WHERE id = ?
      `).run(subtotal, itbms, total, facturaId);

      return { id: facturaId, subtotal, itbms, total };
    });

    const resultado = insertFactura();
    res.status(201).json({
      success: true,
      message: 'Factura creada',
      data: resultado
    });

  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// ============================================
// PUT /api/facturas/:id - ACTUALIZAR factura
// ============================================
app.put('/api/facturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const {
      numero, fecha, moneda, pais, incoterm, tipoOperacion,
      cliente, items, observaciones, estado
    } = req.body;

    // Verificar que existe y está editable
    const existente = db.prepare('SELECT estado FROM facturas WHERE id = ?').get(id);
    if (!existente) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    if (!['BORRADOR', 'PENDIENTE'].includes(existente.estado)) {
      return res.status(400).json({
        error: 'No se puede modificar una factura ya enviada o aceptada'
      });
    }

    const updateFactura = db.transaction(() => {
      // 1. Actualizar cabecera
      db.prepare(`
        UPDATE facturas SET
          numero = ?, fecha = ?, moneda = ?, pais = ?, incoterm = ?,
          tipo_operacion = ?, cliente_nombre = ?, cliente_ruc = ?,
          cliente_pais = ?, cliente_provincia = ?, cliente_distrito = ?,
          cliente_corregimiento = ?, cliente_direccion = ?, cliente_email = ?,
          cliente_telefono = ?, observaciones = ?, estado = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        safeValue(numero), fecha, moneda, safeValue(pais),
        safeValue(incoterm), safeValue(tipoOperacion),
        safeValue(cliente?.nombre), safeValue(cliente?.ruc),
        safeValue(cliente?.pais), safeValue(cliente?.provincia),
        safeValue(cliente?.distrito), safeValue(cliente?.corregimiento),
        safeValue(cliente?.direccion), safeValue(cliente?.email),
        safeValue(cliente?.telefono), safeValue(observaciones),
        safeValue(estado) || 'BORRADOR', id
      );

      // 2. Eliminar items anteriores
      db.prepare('DELETE FROM factura_items WHERE factura_id = ?').run(id);

      // 3. Insertar nuevos items
      const insertItem = db.prepare(`
        INSERT INTO factura_items (
          factura_id, descripcion, cantidad, precio_unitario,
          unidad_medida, cpbs_segmento, gtin, descuento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(
          id, safeValue(item.descripcion), safeNumber(item.cantidad),
          safeNumber(item.precioUnitario), safeValue(item.unidadMedida),
          safeValue(item.cpbsSegmento), safeValue(item.gtin),
          safeNumber(item.descuento)
        );
      }

      // 4. Recalcular totales
      const totales = db.prepare(`
        SELECT SUM(cantidad * precio_unitario - COALESCE(descuento, 0)) as subtotal
        FROM factura_items WHERE factura_id = ?
      `).get(id);

      const subtotal = safeNumber(totales?.subtotal);
      const itbms = subtotal * 0.07;
      const total = subtotal + itbms;

      db.prepare(`
        UPDATE facturas SET subtotal = ?, itbms = ?, total = ? WHERE id = ?
      `).run(subtotal, itbms, total, id);

      return { id, subtotal, itbms, total };
    });

    const resultado = updateFactura();
    res.json({
      success: true,
      message: 'Factura actualizada correctamente',
      data: resultado
    });

  } catch (error) {
    console.error('Error actualizando factura:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// ============================================
// DELETE /api/facturas/:id - Eliminar
// ============================================
app.delete('/api/facturas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const existente = db.prepare('SELECT estado FROM facturas WHERE id = ?').get(id);
    if (!existente) return res.status(404).json({ error: 'Factura no encontrada' });
    if (existente.estado !== 'BORRADOR') {
      return res.status(400).json({ error: 'Solo se pueden eliminar facturas en borrador' });
    }

    db.prepare('DELETE FROM factura_items WHERE factura_id = ?').run(id);
    db.prepare('DELETE FROM facturas WHERE id = ?').run(id);

    res.json({ success: true, message: 'Factura eliminada' });
  } catch (error) {
    console.error('Error eliminando:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// ============================================
// POST /api/facturas/:id/pdf - Generar PDF
// ============================================
app.post('/api/facturas/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const factura = db.prepare(`
      SELECT * FROM facturas WHERE id = ?
    `).get(id);

    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    const items = db.prepare(`
      SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id
    `).all(id);

    // Generar HTML para PDF
    const html = generarHTMLPDF(factura, items);

    // Por ahora devolvemos un HTML que el frontend puede convertir a PDF
    // En producción usarías puppeteer o similar
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

function generarHTMLPDF(factura, items) {
  const fecha = new Date(factura.fecha).toLocaleDateString('es-PA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  let itemsHtml = items.map((item, idx) => {
    const total = item.cantidad * item.precio_unitario - (item.descuento || 0);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.descripcion}</td>
        <td>${item.unidad_medida}</td>
        <td>${item.cantidad}</td>
        <td>${item.precio_unitario.toFixed(2)}</td>
        <td>${(item.descuento || 0).toFixed(2)}</td>
        <td style="font-weight:600">${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura ${factura.numero}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e40af; font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-block { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .info-block h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .totales { display: flex; justify-content: flex-end; }
    .totales-inner { min-width: 280px; }
    .total-line { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-line.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1e40af; padding-top: 12px; margin-top: 8px; color: #1e40af; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #666; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>FACTURA ELECTRÓNICA</h1>
  <p class="subtitle">EBI PAC - DGI Panamá | ${factura.numero}</p>

  <div class="info-grid">
    <div class="info-block">
      <h3>Información de la Factura</h3>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Moneda:</strong> ${factura.moneda}</p>
      <p><strong>Tipo:</strong> ${factura.tipo_operacion}</p>
      ${factura.incoterm ? `<p><strong>Incoterm:</strong> ${factura.incoterm}</p>` : ''}
    </div>
    <div class="info-block">
      <h3>Cliente</h3>
      <p><strong>${factura.cliente_nombre}</strong></p>
      <p>RUC/ID: ${factura.cliente_ruc}</p>
      <p>País: ${factura.cliente_pais}</p>
      ${factura.cliente_provincia ? `<p>Provincia: ${factura.cliente_provincia}</p>` : ''}
      ${factura.cliente_distrito ? `<p>Distrito: ${factura.cliente_distrito}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Descripción</th><th>UM</th><th>Cant.</th><th>P.Unit</th><th>Desc.</th><th>Total</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totales">
    <div class="totales-inner">
      <div class="total-line"><span>Subtotal:</span><span>${factura.subtotal.toFixed(2)} ${factura.moneda}</span></div>
      <div class="total-line"><span>ITBMS (7%):</span><span>${factura.itbms.toFixed(2)} ${factura.moneda}</span></div>
      <div class="total-line grand"><span>TOTAL:</span><span>${factura.total.toFixed(2)} ${factura.moneda}</span></div>
    </div>
  </div>

  ${factura.observaciones ? `<div style="background:#fefce8;padding:12px;border-radius:8px;margin-bottom:20px;"><strong>Observaciones:</strong> ${factura.observaciones}</div>` : ''}

  <div class="footer">
    <p>Documento generado electrónicamente conforme a la normativa EBI PAC</p>
    <p>ID: ${factura.id} | Fecha emisión: ${new Date(factura.created_at).toLocaleString('es-PA')}</p>
  </div>
</body>
</html>`;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor EBI PAC corriendo en puerto ${PORT}`);
});
