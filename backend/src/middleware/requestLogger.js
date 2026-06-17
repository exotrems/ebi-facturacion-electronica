import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    logger.info(`[${req.method}] ${req.path}`, {
      body: JSON.stringify(req.body).substring(0, 2000)
    });
  }
  next();
};
