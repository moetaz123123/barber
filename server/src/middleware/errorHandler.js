export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Ressource introuvable',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: err.message || 'Erreur interne du serveur',
    code,
    ...(process.env.NODE_ENV === 'development' && status >= 500
      ? { stack: err.stack }
      : {}),
  });
}
