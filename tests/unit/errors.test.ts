import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  ExternalAPIError,
} from "@/lib/errors";

describe("AppError hierarchy", () => {
  it("NotFoundError has 404 and correct code", () => {
    const e = new NotFoundError("Professor");
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("Professor not found");
  });

  it("UnauthorizedError is 401", () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it("ForbiddenError is 403", () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });

  it("ValidationError carries the message", () => {
    const e = new ValidationError("missing x");
    expect(e.statusCode).toBe(400);
    expect(e.message).toBe("missing x");
  });

  it("RateLimitError is 429", () => {
    expect(new RateLimitError().statusCode).toBe(429);
  });

  it("ExternalAPIError wraps upstream error", () => {
    const e = new ExternalAPIError("Resend", new Error("boom"));
    expect(e.statusCode).toBe(502);
    expect(e.message).toContain("boom");
  });

  it("custom AppError preserves code and status", () => {
    const e = new AppError("x", 418, "TEAPOT");
    expect(e.statusCode).toBe(418);
    expect(e.code).toBe("TEAPOT");
  });

  it("operational flag defaults to true", () => {
    expect(new AppError("x").isOperational).toBe(true);
  });
});
