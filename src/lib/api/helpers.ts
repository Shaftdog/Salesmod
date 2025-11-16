/**
 * API Helper Functions
 *
 * Provides reusable utilities for API routes including
 * authentication, authorization, and org access verification.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Get the current user's org ID
 *
 * In this codebase, user.id IS the org_id (single-user-per-org model)
 *
 * @returns The org ID or null if user is not authenticated
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // In this codebase, user.id IS the org_id
  return user.id;
}

/**
 * Get the current authenticated user
 *
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Verify that the current user's org has access to a resource
 *
 * This prevents IDOR (Insecure Direct Object Reference) vulnerabilities
 * by ensuring users can only access resources that belong to their org.
 *
 * @param resourceOrgId - The org_id of the resource being accessed
 * @returns true if access is allowed, false otherwise
 */
export async function verifyOrgAccess(resourceOrgId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  return resourceOrgId === orgId;
}

/**
 * Verify org access and return the resource's org_id
 * Throws an error if access is denied
 *
 * @param resourceOrgId - The org_id of the resource
 * @throws Error if unauthorized
 */
export async function requireOrgAccess(resourceOrgId: string): Promise<void> {
  const hasAccess = await verifyOrgAccess(resourceOrgId);
  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this resource');
  }
}
