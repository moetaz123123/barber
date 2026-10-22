import { AppError } from './errorHandler.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(' ; ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(' ; ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    req.query = result.data;
    next();
  };
}
