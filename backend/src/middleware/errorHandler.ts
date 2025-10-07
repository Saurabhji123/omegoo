import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details
    });
  }

  // Database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      error: 'Resource already exists'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Invalid reference'
    });
  }

  // Rate limit errors
  if (error.type === 'rate_limit') {
    return res.status(429).json({
      success: false,
      error: 'Too many requests'
    });
  }

  // Default server error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
};