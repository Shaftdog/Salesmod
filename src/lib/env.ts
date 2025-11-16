/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at startup
 */

import { z } from 'zod';

const envSchema = z.object({
  // Google OAuth (Gmail Integration)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Anthropic API (for email classification & responses)
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-'),

  // App URL (for OAuth callback)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NEXT_PHASE === 'phase-development-build';

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  // During build time, return placeholders to allow build to succeed
  // Runtime will still validate when APIs are actually called
  if (isBuildTime) {
    console.warn('⚠️  Build time: Skipping strict environment validation');
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'build-placeholder',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'build-placeholder',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'sk-ant-build-placeholder',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder',
    } as Env;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`);
      console.error('❌ Environment variable validation failed:\n' + missingVars.join('\n'));
      throw new Error('Missing or invalid environment variables. Check server logs for details.');
    }
    throw error;
  }
}

// Validate on module load (server-side only, skip during build)
if (typeof window === 'undefined' && !isBuildTime) {
  try {
    // Only validate if critical env vars might be expected
    const hasSupabaseVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (hasSupabaseVars) {
      validateEnv();
      console.log('✅ Environment variables validated successfully');
    }
  } catch (error) {
    console.warn('⚠️  Some environment variables not set. Some features may not work.');
    // Don't throw here - let the app start but APIs will fail gracefully
  }
}
