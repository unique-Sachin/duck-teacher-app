import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Check if the current user is an admin
 * Use this in server components and API routes
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'ADMIN';
}

/**
 * Require admin access - throws error if not admin
 * Use this in API routes to protect admin-only endpoints
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Client-side check for admin role
 * Use this in client components with session from useSession()
 */
export function isAdminClient(userRole?: string): boolean {
  return userRole === 'ADMIN';
}

/**
 * List of admin email addresses
 * These users will be automatically granted admin access
 */
export const ADMIN_EMAILS = [
  'sachin.mern@gmail.com',
];

/**
 * Check if an email should have admin access
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
