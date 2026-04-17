import { z } from "zod";

/**
 * Validates environment variables at import time.
 * Required vars throw immediately; optional vars are typed but allowed empty.
 */

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional().default("http://localhost:3000"),

  // Core integrations — optional but typed
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_PREMIUM: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional().default("user-uploads"),

  // Semantic search
  OPENAI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional().default("phdradar"),

  // Scrapers
  GITHUB_TOKEN: z.string().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),
  OPENALEX_MAILTO: z.string().email().optional(),
  CROSSREF_MAILTO: z.string().email().optional(),
  SERPAPI_KEY: z.string().optional(),
  PROXYCURL_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),
});

function validateEnv() {
  // Filter out empty string values so optional() works properly
  const filtered = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== "")
  );

  const result = envSchema.safeParse(filtered);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}

export const env = validateEnv();
