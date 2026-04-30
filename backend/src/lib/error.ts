export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 400
export class BadRequestError extends HttpError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, message, details);
  }
}

// 401
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized access") {
    super(401, message);
  }
}

// 403
export class ForbiddenError extends HttpError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message);
  }
}

// 404
export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

// 409
export class ConflictError extends HttpError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(409, message, details);
  }
}

// 422
export class ValidationError extends HttpError {
  constructor(message = "Validation failed", details?: unknown) {
    super(422, message, details);
  }
}

// 429
export class TooManyRequestsError extends HttpError {
  constructor(message = "Too many requests, please try again later") {
    super(429, message);
  }
}

// 500
export class InternalServerError extends HttpError {
  constructor(message = "Internal server error", details?: unknown) {
    super(500, message, details);
  }
}

// 502
export class BadGatewayError extends HttpError {
  constructor(message = "Bad gateway") {
    super(502, message);
  }
}

// 503
export class ServiceUnavailableError extends HttpError {
  constructor(message = "Service unavailable, please try again later") {
    super(503, message);
  }
}

// 504
export class GatewayTimeoutError extends HttpError {
  constructor(message = "Gateway timeout") {
    super(504, message);
  }
}
