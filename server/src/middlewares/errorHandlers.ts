import type { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/responses";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  // Add Zod Validation error later

  errorResponse(res, statusCode, message);
};

export const notFoundHandler = (res: Response) => {
  return errorResponse(res, 404, "Resource not found");
};
