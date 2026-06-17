// migrar.js - Script de migración usando better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'ebi_facturacion.db');
const db = new Database(dbPath);

console.log('🔧 Ejecutando migración EBI PAC...');

// Verificar si las columnas ya existen
const tableInfo = db.prepare("PRAGMA table_info(facturas)").all();
const columnasExistentes = tableInfo.map(c => c.name);

const nuevasColumnas = [
  { name: 'cliente_provincia', type: 'TEXT' },
  { name: 'cliente_distrito', type: 'TEXT' },
  { name: 'cliente_corregimiento', type: 'TEXT' },
  { name: 'cliente_direccion', type: 'TEXT' },
  { name: 'cliente_email', type: 'TEXT' },
  { name: 'cliente_telefono', type: 'TEXT' },
  { name: 'tipo_operacion', type: 'TEXT', default: "'EXPORTACION'" },
  { name: 'created_at', type: 'TEXT', default: "datetime('now')" },
  { name: 'updated_at', type: 'TEXT' },
];

nuevasColumnas.forEach(col => {
  if (!columnasExistentes.includes(col.name)) {
    const defaultVal = col.default ? ` DEFAULT ${col.default}` : '';
    db.prepare(`ALTER TABLE facturas ADD COLUMN ${col.name} ${col.type}${defaultVal}`).run();
    console.log(`  ✅ Columna agregada: ${col.name}`);
  } else {
    console.log(`  ⏭️  Columna ya existe: ${col.name}`);
  }
});

// Actualizar registros existentes
db.prepare("UPDATE facturas SET tipo_operacion = 'EXPORTACION' WHERE tipo_operacion IS NULL").run();
db.prepare("UPDATE facturas SET created_at = datetime('now') WHERE created_at IS NULL").run();

console.log('✅ Migración completada.');
db.close();