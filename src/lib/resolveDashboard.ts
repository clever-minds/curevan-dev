




/**
 * Resolves the primary dashboard link for a user based on their roles.
 * Follows a priority order: Super Admin > E-com Admin > Therapy Admin > Therapist > Patient.
 * @param roles - An array of role strings for the user.
 * @returns The href for the user's primary dashboard.
 */
export function resolveMyDashboardHref(roles?: string[] | null): string {
  const r = roles ?? [];
  const has = (role: string) => r.includes(role);

  if (has('admin.super')) return '/dashboard/admin/my-dashboard';
  if (has('admin.ecom')) return '/dashboard/ecom-admin/my-dashboard';
  if (has('admin.therapy')) return '/dashboard/therapy-admin/my-dashboard';
  if (has('therapist')) return '/dashboard/therapist/my-dashboard';

  // Patient dashboard is the default account page
  return '/dashboard/account';
}
