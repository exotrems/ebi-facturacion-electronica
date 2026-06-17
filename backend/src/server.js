import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initializeDatabase } from './database/init.js';
import { getDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Importar rutas
import facturaRoutes from './routes/factura.routes.js';
import ebiRoutes from './routes/ebi.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import productoRoutes from './routes/producto.routes.js';
import configRoutes from './routes/config.routes.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Seguridad y middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes, intente mas tarde' }
});
app.use('/api/', limiter);

// Rutas de la API
app.use('/api/facturas', facturaRoutes);
app.use('/api/ebi', ebiRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    service: 'EBI Facturacion Electronica',
    database: !!getDatabase()
  });
});

// Endpoint de diagnóstico de base de datos
app.get('/api/diagnostico', (req, res) => {
  try {
    const db = getDatabase();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    res.json({
      success: true,
      database: 'Conectada',
      tables: tables.map(t => t.name),
      path: process.env.DB_PATH || './data/ebi_facturacion.db'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      database: 'Error de conexion'
    });
  }
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handler
app.use(errorHandler);

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Base de datos inicializada correctamente');

    app.listen(PORT, () => {
      logger.info(`Servidor EBI Facturacion ejecutandose en puerto ${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`Diagnostico DB: http://localhost:${PORT}/api/diagnostico`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
