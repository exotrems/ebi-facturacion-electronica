-- ============================================
-- MIGRACIÓN BASE DE DATOS EBI PAC
-- Agregar columnas nuevas para geografía y tipo de operación
-- ============================================

-- Agregar campos de geografía (solo se usan cuando cliente_pais = 'PA')
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_provincia TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_distrito TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_corregimiento TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_direccion TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;

-- Agregar tipo de operación (EXPORTACION / LOCAL)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS tipo_operacion TEXT DEFAULT 'EXPORTACION';

-- Agregar timestamps
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT datetime('now');
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- Actualizar registros existentes
UPDATE facturas SET tipo_operacion = 'EXPORTACION' WHERE tipo_operacion IS NULL;
UPDATE facturas SET created_at = datetime('now') WHERE created_at IS NULL;
