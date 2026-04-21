import type { Request, Response, NextFunction } from "express";
import env from "../config/env.ts";

// Adding a custom error interface that extends the built-in Error interface
export interface customError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: customError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err.stack); // If in dev

  // Default error
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types (e.g., validation errors, authentication errors)
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
  }

  if (err.name === "UnauthorizedError") {
    status = 401;
    message = "Unauthorized";
  }

  res.status(status).json({
    error: message,
    ...(env.APP_STAGE === "dev" && {
      stack: err.stack,
      details: err.message,
    }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`) as customError;
  error.status = 404;
  next(error);
};
