import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class ProductoModel {
  static create(productoData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO productos (codigo, descripcion, unidad_medida, codigo_cpbs, codigo_cpbs_abrev, unidad_medida_cpbs, precio_unitario, tasa_itbms, codigo_gtin, codigo_gtin_inv)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      productoData.codigo,
      productoData.descripcion,
      productoData.unidad_medida || 'um',
      productoData.codigo_cpbs || '',
      productoData.codigo_cpbs_abrev || '',
      productoData.unidad_medida_cpbs || '',
      productoData.precio_unitario || 0,
      productoData.tasa_itbms || '01',
      productoData.codigo_gtin || '0',
      productoData.codigo_gtin_inv || '0'
    );

    logger.info(`Producto creado con ID: ${result.lastInsertRowid}`);
    return result.lastInsertRowid;
  }

  static findAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY descripcion').all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
  }

  static findByCodigo(codigo) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM productos WHERE codigo = ? AND activo = 1').get(codigo);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`UPDATE productos SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  static delete(id) {
    const db = getDatabase();
    const result = db.prepare('UPDATE productos SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
