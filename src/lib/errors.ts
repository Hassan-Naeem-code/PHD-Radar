export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests. Please try again later.", 429, "RATE_LIMITED");
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Forbidden", 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, originalError: Error) {
    super(
      `${service} API error: ${originalError.message}`,
      502,
      "EXTERNAL_API_ERROR"
    );
  }
}

export function apiResponse<T>(data: T) {
  return Response.json({ success: true, data });
}

export function apiError(error: AppError | Error) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof AppError ? error.code : "INTERNAL_ERROR";
  return Response.json(
    { success: false, error: { code, message: error.message } },
    { status: statusCode }
  );
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return Response.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    },
  });
}
