import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class ClienteModel {
  static create(clienteData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO clientes (
        tipo_cliente_fe, tipo_contribuyente, numero_ruc, digito_verificador_ruc,
        razon_social, direccion, codigo_ubicacion, provincia, distrito, corregimiento,
        tipo_identificacion, nro_identificacion_extranjero, pais_extranjero,
        telefono1, telefono2, telefono3, correo_electronico1, correo_electronico2,
        correo_electronico3, pais, pais_otro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      clienteData.tipo_cliente_fe || '02',
      clienteData.tipo_contribuyente,
      clienteData.numero_ruc,
      clienteData.digito_verificador_ruc,
      clienteData.razon_social,
      clienteData.direccion,
      clienteData.codigo_ubicacion,
      clienteData.provincia,
      clienteData.distrito,
      clienteData.corregimiento,
      clienteData.tipo_identificacion || '',
      clienteData.nro_identificacion_extranjero || '',
      clienteData.pais_extranjero || '',
      clienteData.telefono1 || '',
      clienteData.telefono2 || '',
      clienteData.telefono3 || '',
      clienteData.correo_electronico1 || '',
      clienteData.correo_electronico2 || '',
      clienteData.correo_electronico3 || '',
      clienteData.pais || 'PA',
      clienteData.pais_otro || ''
    );

    logger.info(`Cliente creado con ID: ${result.lastInsertRowid}`);
    return result.lastInsertRowid;
  }

  static findAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM clientes ORDER BY razon_social').all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  }

  static findByRuc(numeroRuc) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM clientes WHERE numero_ruc = ?').get(numeroRuc);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`UPDATE clientes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  static delete(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
