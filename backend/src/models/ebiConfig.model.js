import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class EBIConfigModel {
  static get() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM ebi_config ORDER BY id DESC LIMIT 1').get();
  }

  static create(configData) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ebi_config (token_empresa, token_password, codigo_sucursal, punto_facturacion, ambiente, url_wsdl)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      configData.token_empresa,
      configData.token_password,
      configData.codigo_sucursal || '0000',
      configData.punto_facturacion || '001',
      configData.ambiente || 'test',
      configData.url_wsdl || 'https://test.ebi-pac.com/Service.svc?wsdl'
    );

    logger.info('Configuración EBI creada');
    return result.lastInsertRowid;
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`UPDATE ebi_config SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }
}
