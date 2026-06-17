import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = join(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH || join(DB_DIR, 'ebi_facturacion.db');

// Asegurar que el directorio existe
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

export const getDatabase = () => {
  if (!db) {
    try {
      db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      logger.info(`Base de datos SQLite conectada: ${DB_PATH}`);
    } catch (error) {
      logger.error('Error al conectar base de datos:', error);
      throw new Error(`No se pudo conectar a la base de datos: ${error.message}`);
    }
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    logger.info('Base de datos SQLite cerrada');
  }
};
